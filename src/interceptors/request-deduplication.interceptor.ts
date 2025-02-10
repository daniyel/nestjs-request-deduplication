import type { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Injectable, Inject, Logger, HttpException, HttpStatus } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { RequestDeduplicationService } from '../services';
import type { Request, RequestDeduplicationModuleOptionsWithRequired } from '../interfaces';
import * as crypto from 'crypto';
import { Reflector } from '@nestjs/core';
import { REQUEST_DEDUPLICATION_MODULE_OPTIONS, SKIP_DEDUPLICATE_REQUEST_KEY } from '../constants';

@Injectable()
export class RequestDeduplicationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestDeduplicationInterceptor.name);

  constructor(
    @Inject(RequestDeduplicationService)
    private readonly requestDeduplicationService: RequestDeduplicationService,
    @Inject(REQUEST_DEDUPLICATION_MODULE_OPTIONS)
    private readonly options: RequestDeduplicationModuleOptionsWithRequired,
    @Inject(Reflector)
    private readonly reflector: Reflector,
  ) {
    this.logger.log('RequestDeduplicationInterceptor initialized');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const skipDeduplicateRequest = this.reflector.get<boolean>(
      SKIP_DEDUPLICATE_REQUEST_KEY,
      context.getHandler(),
    );

    if (skipDeduplicateRequest) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const key = this.generateKey(request);
    const value = 'request_exists';

    if (request.skipRequestDeduplication) {
      this.logger.log('Skipping request deduplication');
      return next.handle();
    }

    return from(this.requestDeduplicationService.processRequest(key, value, this.options.ttl)).pipe(
      switchMap((isProcessed) => {
        if (!isProcessed) {
          this.logger.log(`Duplicate request detected for key: ${key}`);
          throw new HttpException(
            {
              status: HttpStatus.CONFLICT,
              error: 'Duplicate request',
            },
            HttpStatus.CONFLICT,
          );
        }

        return next.handle().pipe(
          switchMap(async (data) => {
            return data;
          }),
        );
      }),
    );
  }

  private generateKey(request: Request): string {
    return (
      crypto
        .createHash('sha256')
        .update(request.method)
        .update(request.originalUrl)
        .update(JSON.stringify(request.headers ?? {}))
        // .update(JSON.stringify(request.query ?? {}))
        .update(JSON.stringify(request.body ?? {}))
        .digest('hex')
    );
  }
}
