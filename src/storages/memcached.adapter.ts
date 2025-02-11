import Keyv from 'keyv';
import type { KeyvStoreAdapter } from 'keyv';
import KeyvMemcache from '@keyv/memcache';
import type { StorageAdapter } from './storage.adapter';
import type { RequestDeduplicationModuleOptions } from '../interfaces';
import { Logger } from '@nestjs/common';

export class MemcachedAdapter implements StorageAdapter {
  public readonly logger = new Logger(MemcachedAdapter.name);
  private keyv!: Keyv;

  constructor(private readonly options: RequestDeduplicationModuleOptions) {}

  async init(): Promise<void> {
    if (!this.options.memcachedConfig) {
      throw new Error('Memcached configuration is required');
    }

    const uri = this.options.memcachedConfig.uri;
    const memcache = new KeyvMemcache(uri, this.options.memcachedConfig);
    this.keyv = new Keyv({
      store: memcache as unknown as KeyvStoreAdapter,
      namespace: 'request-deduplication',
    });
    this.logger.log('Memcached storage adapter initialized successfully');
  }

  async get(key: string): Promise<string> {
    const value = await this.keyv.get(key);
    if (value === undefined) {
      throw new Error(`Key ${key} not found`);
    }
    return value;
  }

  async set(key: string, value: string, ttl: number): Promise<void> {
    await this.keyv.set(key, value, ttl);
  }

  async delete(key: string): Promise<void> {
    await this.keyv.delete(key);
  }
}
