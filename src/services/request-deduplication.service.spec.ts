import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { RequestDeduplicationService } from './request-deduplication.service';
import { REQUEST_DEDUPLICATION_MODULE_OPTIONS } from '../constants';
import type { StorageAdapter } from '../storages';
import { RedisAdapter, MemcachedAdapter, MemoryAdapter } from '../storages';
import { StorageType } from '../interfaces';

jest.mock('../storages/redis.adapter');
jest.mock('../storages/memcached.adapter');
jest.mock('../storages/memory.adapter');

describe('RequestDeduplicationService', () => {
  let service: RequestDeduplicationService;
  let mockStorage: jest.Mocked<StorageAdapter>;

  beforeEach(async () => {
    const mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      log: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      fatal: jest.fn(),
      setLogLevels: jest.fn(),
      localInstance: null,
      registerLocalInstanceRef: jest.fn(),
    } as any;

    mockStorage = {
      init: jest.fn().mockResolvedValue(undefined),
      get: jest.fn(),
      set: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      logger: mockLogger,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestDeduplicationService,
        {
          provide: REQUEST_DEDUPLICATION_MODULE_OPTIONS,
          useValue: {
            ttl: 1000,
          },
        },
      ],
    }).compile();

    service = module.get<RequestDeduplicationService>(RequestDeduplicationService);

    Object.defineProperty(RequestDeduplicationService, 'storageAdapter', {
      value: mockStorage,
      writable: true,
    });
  });

  describe('processRequest', () => {
    it('should return true for first-time requests', async () => {
      mockStorage.get.mockResolvedValue(null);

      const result = await service.processRequest('test-key', 'value', 1000);

      expect(result).toBe(true);
      expect(mockStorage.get).toHaveBeenCalledWith('test-key');
      expect(mockStorage.set).toHaveBeenCalledWith('test-key', 'value', 1000);
    });

    it('should return false for duplicate requests', async () => {
      mockStorage.get.mockResolvedValue('existing-value');

      const result = await service.processRequest('test-key', 'value', 1000);

      expect(result).toBe(false);
      expect(mockStorage.get).toHaveBeenCalledWith('test-key');
      expect(mockStorage.set).not.toHaveBeenCalled();
    });

    it('should throw error when storage fails', async () => {
      mockStorage.get.mockRejectedValue(new Error('Storage error'));

      await expect(service.processRequest('test-key', 'value', 1000)).rejects.toThrow(
        'Storage error',
      );
    });
  });

  describe('deleteRequest', () => {
    it('should delete existing request', async () => {
      await service.deleteRequest('test-key');

      expect(mockStorage.delete).toHaveBeenCalledWith('test-key');
    });

    it('should handle delete errors gracefully', async () => {
      mockStorage.delete.mockRejectedValue(new Error('Delete error'));

      await expect(service.deleteRequest('test-key')).resolves.not.toThrow();
    });
  });

  describe('storage initialization', () => {
    it('should initialize memory storage by default', async () => {
      await service.onModuleInit();

      expect(service['storage']).toBeDefined();
    });

    it('should initialize redis storage when config provided', async () => {
      const moduleWithRedis: TestingModule = await Test.createTestingModule({
        providers: [
          RequestDeduplicationService,
          {
            provide: REQUEST_DEDUPLICATION_MODULE_OPTIONS,
            useValue: {
              ttl: 1000,
              redisConfig: {
                host: 'localhost',
                port: 6379,
              },
            },
          },
        ],
      }).compile();

      const serviceWithRedis = moduleWithRedis.get<RequestDeduplicationService>(
        RequestDeduplicationService,
      );
      await serviceWithRedis.onModuleInit();

      expect(serviceWithRedis['storage']).toBeDefined();
    });

    it('should initialize memcached storage when config provided', async () => {
      const moduleWithMemcached: TestingModule = await Test.createTestingModule({
        providers: [
          RequestDeduplicationService,
          {
            provide: REQUEST_DEDUPLICATION_MODULE_OPTIONS,
            useValue: {
              ttl: 1000,
              memcachedConfig: {
                servers: ['localhost:11211'],
              },
            },
          },
        ],
      }).compile();

      const serviceWithMemcached = moduleWithMemcached.get<RequestDeduplicationService>(
        RequestDeduplicationService,
      );
      await serviceWithMemcached.onModuleInit();

      expect(serviceWithMemcached['storage']).toBeDefined();
    });
  });

  describe('storage adapter initialization', () => {
    beforeEach(() => {
      // Reset the static storage adapter before each test using type assertion
      (RequestDeduplicationService as any).storageAdapter = undefined;
      jest.clearAllMocks();
    });

    it('should initialize Redis adapter when redisConfig is provided', async () => {
      const moduleRef = await Test.createTestingModule({
        providers: [
          RequestDeduplicationService,
          {
            provide: REQUEST_DEDUPLICATION_MODULE_OPTIONS,
            useValue: {
              storage: StorageType.REDIS,
              redisConfig: {
                url: 'redis://localhost:6379',
              },
            },
          },
        ],
      }).compile();

      const service = moduleRef.get(RequestDeduplicationService);
      await service.onModuleInit();

      // Access private static property using type assertion
      const adapter = (RequestDeduplicationService as any).storageAdapter;

      expect(RedisAdapter).toHaveBeenCalledWith(
        expect.objectContaining({
          redisConfig: expect.any(Object),
        }),
      );
      expect(adapter.init).toHaveBeenCalled();
    });

    it('should initialize Memcached adapter when memcachedConfig is provided', async () => {
      const moduleRef = await Test.createTestingModule({
        providers: [
          RequestDeduplicationService,
          {
            provide: REQUEST_DEDUPLICATION_MODULE_OPTIONS,
            useValue: {
              storage: StorageType.MEMCACHED,
              memcachedConfig: {
                uri: 'localhost:11211',
              },
            },
          },
        ],
      }).compile();

      const service = moduleRef.get(RequestDeduplicationService);
      await service.onModuleInit();

      const adapter = (RequestDeduplicationService as any).storageAdapter;

      expect(MemcachedAdapter).toHaveBeenCalledWith(
        expect.objectContaining({
          memcachedConfig: expect.any(Object),
        }),
      );
      expect(adapter.init).toHaveBeenCalled();
    });

    it('should initialize Memory adapter when no specific config is provided', async () => {
      const moduleRef = await Test.createTestingModule({
        providers: [
          RequestDeduplicationService,
          {
            provide: REQUEST_DEDUPLICATION_MODULE_OPTIONS,
            useValue: {
              storage: StorageType.MEMORY,
            },
          },
        ],
      }).compile();

      const service = moduleRef.get(RequestDeduplicationService);
      await service.onModuleInit();

      const adapter = (RequestDeduplicationService as any).storageAdapter;

      expect(MemoryAdapter).toHaveBeenCalled();
      expect(adapter.init).toHaveBeenCalled();
    });

    it('should throw error if storage adapter initialization fails', async () => {
      const initError = new Error('Failed to initialize storage');
      (
        MemoryAdapter as jest.MockedClass<typeof MemoryAdapter>
      ).prototype.init.mockRejectedValueOnce(initError);

      const moduleRef = await Test.createTestingModule({
        providers: [
          RequestDeduplicationService,
          {
            provide: REQUEST_DEDUPLICATION_MODULE_OPTIONS,
            useValue: {
              storage: StorageType.MEMORY,
            },
          },
        ],
      }).compile();

      const service = moduleRef.get(RequestDeduplicationService);
      await expect(service.onModuleInit()).rejects.toThrow(initError);
    });
  });
});
