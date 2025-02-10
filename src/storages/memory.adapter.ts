import { Logger } from '@nestjs/common';
import Keyv from 'keyv';
import type { StorageAdapter } from './storage.adapter';
import type { RequestDeduplicationModuleOptions } from '../interfaces';

export class MemoryAdapter implements StorageAdapter {
  public readonly logger = new Logger(MemoryAdapter.name);
  private keyv!: Keyv;

  constructor(private options: RequestDeduplicationModuleOptions) {}

  async init(): Promise<void> {
    this.keyv = new Keyv({
      namespace: 'request-deduplication',
    });
    this.logger.log('Memory storage adapter initialized successfully');
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
