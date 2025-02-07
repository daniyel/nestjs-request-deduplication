import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RequestDeduplicationModule, RequestDeduplicationInterceptor } from 'nestjs-request-deduplication';
import { ItemsModule } from './items/items.module';

@Module({
  imports: [
    RequestDeduplicationModule.forRoot({
      storage: 'memory',
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
})
export class AppModule {}
