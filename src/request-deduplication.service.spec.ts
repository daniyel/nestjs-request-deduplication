import { Test, TestingModule } from '@nestjs/testing';
import { RequestDeduplicationService } from './request-deduplication.service';
import { REQUEST_DEDUPLICATION_MODULE_OPTIONS } from './request-deduplication.constants';
import { MemoryStorage } from './storage/memory.storage';
import { Logger } from '@nestjs/common';

// Create a proper mock implementation that matches MemoryStorage structure
const mockMemoryStorageInstance = {
  memoryCache: new Map(),
  logger: new Logger(),
  initialized: false,
  client: undefined,
  options: {},
  initStorage: jest.fn().mockResolvedValue(undefined),
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn()
} as unknown as jest.Mocked<MemoryStorage>;

// Mock the MemoryStorage module
jest.mock('./storage/memory.storage', () => ({
  MemoryStorage: jest.fn().mockImplementation(() => mockMemoryStorageInstance)
}));

describe('RequestDeduplicationService', () => {
  let service: RequestDeduplicationService;
  let mockMemoryStorage: jest.Mocked<MemoryStorage>;
  let module: TestingModule;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.clearAllTimers();

    module = await Test.createTestingModule({
      providers: [
        RequestDeduplicationService,
        {
          provide: REQUEST_DEDUPLICATION_MODULE_OPTIONS,
          useValue: {
            storage: 'memory',
            ttl: 1000,
          },
        },
      ],
    }).compile();

    service = module.get<RequestDeduplicationService>(RequestDeduplicationService);
    // Get the mock instance
    mockMemoryStorage = mockMemoryStorageInstance;
    await service.onModuleInit();
  });

  afterEach(async () => {
    jest.clearAllTimers();
    await module?.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should process new request', async () => {
    mockMemoryStorage.get.mockResolvedValue(undefined);
    mockMemoryStorage.set.mockResolvedValue(undefined);

    const result = await service.processRequest('test-key', 'test-value', 1000);
    
    expect(result).toBeTruthy();
    expect(mockMemoryStorage.set).toHaveBeenCalledWith('test-key', 'test-value', 1000);
  });

  it('should detect duplicate request', async () => {
    mockMemoryStorage.get.mockResolvedValue('existing-value');
    
    const result = await service.processRequest('test-key', 'test-value', 1000);
    
    expect(result).toBeFalsy();
    expect(mockMemoryStorage.get).toHaveBeenCalledWith('test-key');
  });

  it('should handle storage errors gracefully', async () => {
    mockMemoryStorage.get.mockRejectedValue(new Error('Storage error'));

    await expect(service.processRequest('test-key', 'test-value', 1000))
      .rejects
      .toThrow('Storage error');
  });

  afterAll(async () => {
    await module?.close();
    jest.clearAllTimers();
  });
});
