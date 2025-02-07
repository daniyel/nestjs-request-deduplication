import { Module, DynamicModule, Global } from '@nestjs/common';
import { RequestDeduplicationService } from './request-deduplication.service';
import { RequestDeduplicationInterceptor } from './request-deduplication.interceptor';
import { REQUEST_DEDUPLICATION_MODULE_OPTIONS } from './request-deduplication.constants';

@Global()
@Module({})
export class RequestDeduplicationModule {
  static forRoot(options: any): DynamicModule {
    const optionsProvider = {
      provide: REQUEST_DEDUPLICATION_MODULE_OPTIONS,
      useValue: options,
    };

    return {
      module: RequestDeduplicationModule,
      providers: [
        optionsProvider,
        RequestDeduplicationService,
        {
          provide: RequestDeduplicationInterceptor,
          useFactory: (service: RequestDeduplicationService, moduleOptions: any) => {
            return new RequestDeduplicationInterceptor(service, moduleOptions);
          },
          inject: [RequestDeduplicationService, REQUEST_DEDUPLICATION_MODULE_OPTIONS],
        },
      ],
      exports: [
        RequestDeduplicationService,
        RequestDeduplicationInterceptor,
        optionsProvider,
      ],
    };
  }
}
