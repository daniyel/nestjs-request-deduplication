import { Injectable, Logger } from '@nestjs/common';
import { RequestDeduplicationStorage } from './request-deduplication.storage';
import { RequestDeduplicationModuleOptions } from '../request-deduplication.interface';
import Redis from 'ioredis';
@Injectable()
export class RedisStorage extends RequestDeduplicationStorage {
  private readonly logger = new Logger(RedisStorage.name);

  constructor(options: RequestDeduplicationModuleOptions) {
    super(options);
    this.initStorage();
  }

  public async initStorage() {
    try {
      const redisConfig = {
        host: 'localhost',
        port: 6379,
        ...this.options.redisConfig,
      };

      this.client = new Redis(redisConfig.port || 6379, redisConfig.host || 'localhost', redisConfig); // Assuming redisConfig is passed as part of options
      this.logger.log('Redis storage initialized.');
    } catch (error) {
      this.logger.error('Redis storage requires `ioredis` dependency.');
      throw new Error('Missing dependency: ioredis');
    }
  }

  public async set(key: string, value: any, ttl: number) {
    try {
      await this.client.set(key, JSON.stringify(value));

      if (ttl) {
        await this.client.expire(key, ttl / 1000); // TTL in seconds for Redis
      }
    } catch (error) {
      this.logger.error(`Error setting cache in Redis: ${(error as Error).message}`);
    }
  }

  public async get(key: string): Promise<any> {
    try {
      const result = await this.client.get(key);
      return result ? JSON.parse(result) : null;
    } catch (error) {
      this.logger.error(`Error getting cache from Redis: ${(error as Error).message}`);
      return null;
    }
  }

  public async delete(key: string) {
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.error(`Error deleting cache from Redis: ${(error as Error).message}`);
    }
  }
}
