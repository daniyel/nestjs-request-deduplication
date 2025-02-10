import { type RedisClientOptions as RedisOptions } from '@keyv/redis';
import { type Request as ExpressRequest } from 'express';
import { type FastifyRequest } from 'fastify';

export enum StorageType {
  MEMORY = 'memory',
  REDIS = 'redis',
  MEMCACHED = 'memcached',
}

export interface SerializerReturnValue {
  value: any;
  extras: any;
}

export interface MemcachedServerOptionsSerializer {
  serialize: (opcode: number, value: string, extras: Buffer) => SerializerReturnValue;
  deserialize: (opcode: number, value: string, extras: Buffer) => SerializerReturnValue;
}

export interface MemcachedLogger {
  log: (message: string) => void;
}

export interface MemcachedStandardOptions {
  expires?: number;
  retries?: number;
  logger?: Console | MemcachedLogger;
  failover?: boolean;
  failoverTime?: number;
  serializer?: MemcachedServerOptionsSerializer;
}

export interface MemcachedServersOptions {
  username?: string;
  password?: string;
  timeout?: number;
  conntimeout?: number;
  keepAlive?: boolean;
  keepAliveDelay?: number;
}

export interface MemcachedClientOptions extends MemcachedStandardOptions, MemcachedServersOptions {}

export interface MemcachedOptions {
  uri: string;
  options: MemcachedClientOptions;
}

export interface RequestDeduplicationModuleOptions {
  storage?: StorageType;
  ttl?: number;
  memcachedConfig?: MemcachedOptions;
  redisConfig?: RedisOptions;
  exclude?: string[];
}

export type RequestDeduplicationModuleOptionsWithRequired = Required<
  Pick<RequestDeduplicationModuleOptions, 'storage' | 'ttl'>
> &
  RequestDeduplicationModuleOptions;

export type Request = ExpressRequest | FastifyRequest;
