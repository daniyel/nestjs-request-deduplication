import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RequestDeduplicationModule as BaseModule, RequestDeduplicationInterceptor, StorageType } from 'nestjs-request-deduplication';
import { ItemsModule } from './items/items.module';

@Module({
  imports: [
    BaseModule.forRoot({
      storage: StorageType.MEMORY,
      ttl: 10000,
    }),
    ItemsModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestDeduplicationInterceptor,
    },
  ],
  exports: [BaseModule],
})
export class RequestDeduplicationModule {}
