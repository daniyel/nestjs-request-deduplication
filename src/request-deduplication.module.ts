import type { DynamicModule } from '@nestjs/common';
import { Module, Global } from '@nestjs/common';
import { RequestDeduplicationService } from './services';
import { RequestDeduplicationInterceptor } from './interceptors';
import { REQUEST_DEDUPLICATION_MODULE_OPTIONS } from './constants';
import { Reflector } from '@nestjs/core';
import type {
  RequestDeduplicationModuleOptions,
  RequestDeduplicationModuleOptionsWithRequired,
} from './interfaces';
import { StorageType } from './interfaces';

@Global()
@Module({})
export class RequestDeduplicationModule {
  static forRoot(options: RequestDeduplicationModuleOptions): DynamicModule {
    const optionsWithDefaults: RequestDeduplicationModuleOptionsWithRequired = {
      storage: StorageType.MEMORY,
      ttl: 1000,
      ...options,
    };

    const optionsProvider = {
      provide: REQUEST_DEDUPLICATION_MODULE_OPTIONS,
      useValue: optionsWithDefaults,
    };

    return {
      module: RequestDeduplicationModule,
      providers: [
        optionsProvider,
        RequestDeduplicationService,
        {
          provide: RequestDeduplicationInterceptor,
          useFactory: (
            service: RequestDeduplicationService,
            moduleOptions: RequestDeduplicationModuleOptionsWithRequired,
            reflector: Reflector,
          ) => {
            return new RequestDeduplicationInterceptor(service, moduleOptions, reflector);
          },
          inject: [RequestDeduplicationService, REQUEST_DEDUPLICATION_MODULE_OPTIONS, Reflector],
        },
      ],
      exports: [RequestDeduplicationService, RequestDeduplicationInterceptor, optionsProvider],
    };
  }
}
