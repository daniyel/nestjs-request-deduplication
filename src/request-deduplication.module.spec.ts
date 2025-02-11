import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { RequestDeduplicationModule } from './request-deduplication.module';
import { RequestDeduplicationService } from './services';
import { RequestDeduplicationInterceptor } from './interceptors';
import { REQUEST_DEDUPLICATION_MODULE_OPTIONS } from './constants';
import { Reflector } from '@nestjs/core';
import { StorageType } from './interfaces';
import { GLOBAL_MODULE_METADATA } from '@nestjs/common/constants';

describe('RequestDeduplicationModule', () => {
  describe('forRoot', () => {
    it('should provide default options when minimal config is provided', async () => {
      const module = await Test.createTestingModule({
        imports: [RequestDeduplicationModule.forRoot({})],
      }).compile();

      const options = module.get(REQUEST_DEDUPLICATION_MODULE_OPTIONS);
      expect(options).toEqual({
        storage: StorageType.MEMORY,
        ttl: 1000,
      });
    });

    it('should merge provided options with defaults for Redis', async () => {
      const customOptions = {
        storage: StorageType.REDIS,
        ttl: 2000,
        redisConfig: {
          url: 'redis://localhost:6379',
        },
      };

      const module = await Test.createTestingModule({
        imports: [RequestDeduplicationModule.forRoot(customOptions)],
      }).compile();

      const options = module.get(REQUEST_DEDUPLICATION_MODULE_OPTIONS);
      expect(options).toEqual(customOptions);
    });

    it('should merge provided options with defaults for Memcached', async () => {
      const customOptions = {
        storage: StorageType.MEMCACHED,
        ttl: 3000,
        memcachedConfig: {
          uri: 'localhost:11211',
          options: { retries: 3 },
        },
      };

      const module = await Test.createTestingModule({
        imports: [RequestDeduplicationModule.forRoot(customOptions)],
      }).compile();

      const options = module.get(REQUEST_DEDUPLICATION_MODULE_OPTIONS);
      expect(options).toEqual(customOptions);
    });

    it('should provide required dependencies', async () => {
      const module = await Test.createTestingModule({
        imports: [RequestDeduplicationModule.forRoot({})],
      }).compile();

      expect(module.get(RequestDeduplicationService)).toBeDefined();
      expect(module.get(RequestDeduplicationInterceptor)).toBeDefined();
      expect(module.get(Reflector)).toBeDefined();
    });

    it('should properly inject dependencies into interceptor', async () => {
      const module = await Test.createTestingModule({
        imports: [RequestDeduplicationModule.forRoot({})],
      }).compile();

      const interceptor = module.get(RequestDeduplicationInterceptor);

      // Verify the interceptor was constructed with the correct dependencies
      expect(interceptor).toHaveProperty('requestDeduplicationService');
      expect(interceptor).toHaveProperty('options');
      expect(interceptor).toHaveProperty('reflector');
    });

    it('should be registered as global module', () => {
      const moduleMetadata = Reflect.getMetadata(
        GLOBAL_MODULE_METADATA,
        RequestDeduplicationModule,
      );

      const moduleDefinition = Reflect.getMetadata('modules', RequestDeduplicationModule);
      const isGlobalModule = moduleDefinition?.global || moduleMetadata === true;

      expect(isGlobalModule).toBe(true);
    });

    it('should export all required providers', () => {
      const dynamicModule = RequestDeduplicationModule.forRoot({});

      expect(dynamicModule.exports).toContain(RequestDeduplicationService);
      expect(dynamicModule.exports).toContain(RequestDeduplicationInterceptor);
      expect(dynamicModule.exports).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            provide: REQUEST_DEDUPLICATION_MODULE_OPTIONS,
          }),
        ]),
      );
    });
  });
});
