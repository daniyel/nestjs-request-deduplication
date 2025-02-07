import { RedisOptions } from "ioredis";

export interface RequestDeduplicationModuleOptions {
  storage: 'memory' | 'redis' | 'memcached';
  ttl: number;
  redisUrl?: string;
  memcachedServer?: string;
  redisConfig?: RedisOptions;
  exclude?: string[];
}
