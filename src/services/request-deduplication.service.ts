import type { OnModuleInit } from '@nestjs/common';
import { Injectable, Logger, Inject } from '@nestjs/common';
import type { RequestDeduplicationModuleOptions } from '../interfaces';
import { REQUEST_DEDUPLICATION_MODULE_OPTIONS } from '../constants';
import type { StorageAdapter } from '../storages';
import { MemcachedAdapter, MemoryAdapter, RedisAdapter } from '../storages';

@Injectable()
export class RequestDeduplicationService implements OnModuleInit {
  private static storageAdapter: StorageAdapter;
  private readonly logger = new Logger(RequestDeduplicationService.name);

  constructor(
    @Inject(REQUEST_DEDUPLICATION_MODULE_OPTIONS)
    private readonly options: RequestDeduplicationModuleOptions,
  ) {}

  async onModuleInit() {
    await this.initStorage();
  }

  private get storage(): StorageAdapter {
    return RequestDeduplicationService.storageAdapter;
  }

  private async initStorage() {
    if (RequestDeduplicationService.storageAdapter) {
      return;
    }

    if (this.options.redisConfig) {
      RequestDeduplicationService.storageAdapter = new RedisAdapter(this.options);
    } else if (this.options.memcachedConfig) {
      RequestDeduplicationService.storageAdapter = new MemcachedAdapter(this.options);
    } else {
      RequestDeduplicationService.storageAdapter = new MemoryAdapter(this.options);
    }

    await RequestDeduplicationService.storageAdapter.init();
  }

  async processRequest(key: string, value: string, ttl: number): Promise<boolean> {
    try {
      const existingValue = await this.storage.get(key);
      if (existingValue) {
        this.logger.log(`Request for ${key} already processed.`);
        return false;
      }
      this.logger.log(`Request for ${key} not yet processed.`);
      this.logger.log(`Request for ${key} processing.`);
      await this.storage.set(key, value, ttl);
      this.logger.log(`Request for ${key} processed.`);
      return true;
    } catch (error) {
      this.logger.error(`Error processing request for ${key}: ${(error as Error).message}`);
      throw error;
    }
  }

  async deleteRequest(key: string) {
    try {
      await this.storage.delete(key);
      this.logger.log(`Request for ${key} deleted.`);
    } catch (error) {
      this.logger.error(`Error deleting request for ${key}: ${(error as Error).message}`);
    }
  }
}
