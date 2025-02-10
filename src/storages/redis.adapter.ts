import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';
import type { StorageAdapter } from './storage.adapter';
import type { RequestDeduplicationModuleOptions } from '../interfaces';
import { Logger } from '@nestjs/common';

export class RedisAdapter implements StorageAdapter {
  public readonly logger = new Logger(RedisAdapter.name);
  private keyv!: Keyv;

  constructor(private options: RequestDeduplicationModuleOptions) {}

  async init(): Promise<void> {
    this.keyv = new Keyv({
      store: new KeyvRedis(this.options.redisConfig),
      namespace: 'request-deduplication',
    });
    this.logger.log('Redis storage adapter initialized successfully');
  }

  async get(key: string): Promise<any> {
    return this.keyv.get(key);
  }

  async set(key: string, value: any, ttl: number): Promise<void> {
    await this.keyv.set(key, value, ttl);
  }

  async delete(key: string): Promise<void> {
    await this.keyv.delete(key);
  }
}
