import { Module } from '@nestjs/common';
import { RequestDeduplicationModule as ReqDeduplicationModule } from 'nestjs-request-deduplication';
import { ItemsModule } from './items/items.module';

@Module({
  imports: [
    ReqDeduplicationModule.forRoot({
      storage: 'memory', // Use in-memory storage
      ttl: 10, // Deduplication window in seconds
    }),
    ItemsModule,
  ],
})
export class RequestDeduplicationModule {}
