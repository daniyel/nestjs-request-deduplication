import type { Logger } from '@nestjs/common';

export interface StorageAdapter {
  logger: Logger;
  init(): Promise<void>;
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl: number): Promise<void>;
  delete(key: string): Promise<void>;
}
