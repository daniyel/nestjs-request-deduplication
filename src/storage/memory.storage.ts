import { Injectable, Logger } from '@nestjs/common';
import { RequestDeduplicationStorage } from './request-deduplication.storage'; // Import DeduplicationStorage
import { RequestDeduplicationModuleOptions } from '../request-deduplication.interface'; // Import DeduplicationModuleOptions

@Injectable()
export class MemoryStorage extends RequestDeduplicationStorage {
  private static instance: MemoryStorage;
  private memoryCache: Map<string, any> = new Map();
  private readonly logger = new Logger(MemoryStorage.name);
  private initialized = false;

  constructor(options: RequestDeduplicationModuleOptions) {
    super(options);
    if (MemoryStorage.instance) {
      return MemoryStorage.instance;
    }
    MemoryStorage.instance = this;
  }

  public async initStorage() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    this.logger.log('In-memory storage initialized.');
  }

  public async set(key: string, value: any, ttl = 1000) {
    if (!key) {
      return;
    }

    this.logger.log(`Storing key ${key} with value ${value}`);
    this.memoryCache.set(key, value);

    if (ttl) {
      setTimeout(() => {
        this.memoryCache.delete(key);
        this.logger.log(`Key ${key} expired and deleted from memory.`);
      }, ttl);
    }
  }

  public async get(key: string): Promise<any> {
    if (!key) {
      return;
    }

    return this.memoryCache.get(key);
  }

  public async delete(key: string) {
    if (!key) {
      return;
    }

    this.memoryCache.delete(key);
    this.logger.log(`Key ${key} deleted from memory.`);
  }
}
