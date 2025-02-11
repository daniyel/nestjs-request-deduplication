import { Module } from '@nestjs/common';
import { RequestDeduplicationModule } from './request-deduplication.module';
import { ItemsModule } from './items/items.module';

@Module({
  imports: [
    RequestDeduplicationModule,
    ItemsModule,
  ],
})
export class AppModule {}
