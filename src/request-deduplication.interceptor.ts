import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject, Logger } from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { RequestDeduplicationService } from './request-deduplication.service';
import { RequestDeduplicationModuleOptions } from './request-deduplication.interface';
import { REQUEST_DEDUPLICATION_MODULE_OPTIONS } from './request-deduplication.constants';
import * as crypto from 'crypto';

@Injectable()
export class RequestDeduplicationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestDeduplicationInterceptor.name);

  constructor(
    @Inject(RequestDeduplicationService)
    private readonly requestDeduplicationService: RequestDeduplicationService,
    @Inject(REQUEST_DEDUPLICATION_MODULE_OPTIONS)
    private readonly options: RequestDeduplicationModuleOptions,
  ) {
    this.logger.log('RequestDeduplicationInterceptor initialized');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const key = this.generateKey(request);
    const value = 'request_exists';

    // Convert the Promise to an Observable and use switchMap for proper error handling
    return from(this.requestDeduplicationService.processRequest(key, value, this.options.ttl))
      .pipe(
        switchMap(isProcessed => {
          if (isProcessed) {
            return next.handle();
          } else {
            this.logger.log(`Duplicate request detected for key: ${key}`);
            // Return an observable that emits a value for duplicate requests
            return from([{ message: 'Duplicate request' }]);
          }
        })
      );
  }

  private generateKey(request: any): string {
    return crypto.createHash('sha256')
      .update(request.method)
      .update(request.originalUrl)
      .update(JSON.stringify(request.headers ?? {}))
      .update(JSON.stringify(request.params ?? {}))
      .update(JSON.stringify(request.body ?? {}))
      .digest('hex');
  }
}
