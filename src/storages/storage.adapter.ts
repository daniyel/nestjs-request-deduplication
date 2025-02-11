import type { Logger } from '@nestjs/common';

export interface StorageAdapter {
  logger: Logger;
  init(): Promise<void>;
  get(key: string): Promise<string>;
  set(key: string, value: string, ttl: number): Promise<void>;
  delete(key: string): Promise<void>;
}
