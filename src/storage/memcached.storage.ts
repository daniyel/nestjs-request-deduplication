import { Injectable, Logger } from '@nestjs/common';
import { RequestDeduplicationStorage } from './request-deduplication.storage';
import { RequestDeduplicationModuleOptions } from '../request-deduplication.interface';

@Injectable()
export class MemcachedStorage extends RequestDeduplicationStorage {
  private readonly logger = new Logger(MemcachedStorage.name);

  constructor(options: RequestDeduplicationModuleOptions) {
    super(options);
    this.initStorage();
  }

  public async initStorage() {
    try {
      const Memcached = await import('memcached').then(m => m.default || m);

      this.client = new Memcached(this.options.memcachedServer || 'localhost:11211');
      this.logger.log('Memcached storage initialized.');
    } catch (error) {
      this.logger.error('Memcached storage requires `memcached` dependency.', (error as Error).message);
      throw new Error('Missing dependency: memcached');
    }
  }

  public async set(key: string, value: any, ttl: number) {
    this.client.set(key, value, ttl / 1000, (error: any) => {
      if (error) {
        this.logger.error('Error setting cache in Memcached', (error as Error).message);
      }
    });
  }

  public async get(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.get(key, (error: any, result: any) => {
        if (error) {
          this.logger.error('Error getting cache from Memcached', (error as Error).message);
          reject(error);
        }
        resolve(result);
      });
    });
  }

  public async delete(key: string) {
    this.client.del(key, (error: any) => {
      if (error) {
        this.logger.error(`Error deleting cache from Memcached`, (error as Error).message);
      }
    });
  }
}
