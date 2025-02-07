import { Test, TestingModule } from '@nestjs/testing';
import { RequestDeduplicationService } from './request-deduplication.service';
import { REQUEST_DEDUPLICATION_MODULE_OPTIONS } from './request-deduplication.constants';
import { MemoryStorage } from './storage/memory.storage';

jest.mock('./storage/memory.storage');

describe('RequestDeduplicationService', () => {
  let service: RequestDeduplicationService;
  let mockMemoryStorage: jest.Mocked<MemoryStorage>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
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
    
    // Get the mock instance after service initialization
    mockMemoryStorage = (MemoryStorage as unknown as jest.Mock).mock.instances[0];

    // Wait for module initialization
    await service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should process new request', async () => {
    // Setup mock return values
    mockMemoryStorage.get.mockResolvedValue(undefined);
    mockMemoryStorage.set.mockResolvedValue(undefined);

    const result = await service.processRequest('test-key', 'test-value', 1000);
    
    expect(result).toBeTruthy();
    expect(mockMemoryStorage.set).toHaveBeenCalledWith('test-key', 'test-value', 1000);
  });

  it('should detect duplicate request', async () => {
    // Setup mock return values
    mockMemoryStorage.get.mockResolvedValueOnce('existing-value');
    
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
});
