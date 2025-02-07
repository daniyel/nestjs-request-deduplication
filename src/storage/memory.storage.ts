import { Injectable, Logger } from '@nestjs/common';
import { RequestDeduplicationStorage } from './request-deduplication.storage'; // Import DeduplicationStorage
import { RequestDeduplicationModuleOptions } from '../request-deduplication.interface'; // Import DeduplicationModuleOptions

@Injectable()
export class MemoryStorage extends RequestDeduplicationStorage {
  private static instance: MemoryStorage;
  private memoryCache: Map<string, any> = new Map();
  private timeouts: Map<string, NodeJS.Timeout> = new Map();
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

    // Clear existing timeout if any
    const existingTimeout = this.timeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    this.logger.log(`Storing key ${key} with value ${value}`);
    this.memoryCache.set(key, value);

    if (ttl) {
      const timeout = setTimeout(() => {
        this.memoryCache.delete(key);
        this.timeouts.delete(key);
        this.logger.log(`Key ${key} expired and deleted from memory.`);
      }, ttl);
      this.timeouts.set(key, timeout);
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

    const timeout = this.timeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(key);
    }

    this.memoryCache.delete(key);
    this.logger.log(`Key ${key} deleted from memory.`);
  }

  // Add method for test cleanup
  public clearAllTimeouts() {
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();
  }
}
