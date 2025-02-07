import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { RequestDeduplicationStorage } from './storage/request-deduplication.storage';
import { RequestDeduplicationModuleOptions } from './request-deduplication.interface';
import { RedisStorage } from './storage/redis.storage';
import { MemcachedStorage } from './storage/memcached.storage';
import { MemoryStorage } from './storage/memory.storage';
import { REQUEST_DEDUPLICATION_MODULE_OPTIONS } from './request-deduplication.constants';

@Injectable()
export class RequestDeduplicationService implements OnModuleInit {
  private static storageInstance: RequestDeduplicationStorage;
  private readonly logger = new Logger(RequestDeduplicationService.name);

  constructor(
    @Inject(REQUEST_DEDUPLICATION_MODULE_OPTIONS)
    private readonly options: RequestDeduplicationModuleOptions,
  ) {}

  async onModuleInit() {
    await this.initStorage();
  }

  private get storage(): RequestDeduplicationStorage {
    return RequestDeduplicationService.storageInstance;
  }

  private async initStorage() {
    if (RequestDeduplicationService.storageInstance) {
      return;
    }

    if (this.options.redisConfig) {
      RequestDeduplicationService.storageInstance = new RedisStorage(this.options);
    } else if (this.options.memcachedServer) {
      RequestDeduplicationService.storageInstance = new MemcachedStorage(this.options);
    } else {
      RequestDeduplicationService.storageInstance = new MemoryStorage(this.options);
    }
    
    await RequestDeduplicationService.storageInstance.initStorage();
  }

  async processRequest(key: string, value: any, ttl: number): Promise<boolean> {
    try {
      const existingValue = await this.storage.get(key);
      console.log('Stored key', existingValue);
      if (existingValue) {
        this.logger.log(`Request for ${key} already processed.`);
        return false;
      }
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
