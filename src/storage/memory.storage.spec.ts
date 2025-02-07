import { MemoryStorage } from './memory.storage';
import { RequestDeduplicationModuleOptions } from '../request-deduplication.interface';
import { Logger } from '@nestjs/common';

// Mock @nestjs/common before any other imports or code
jest.mock('@nestjs/common', () => {
  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };
  
  return {
    ...jest.requireActual('@nestjs/common'),
    Logger: jest.fn().mockImplementation(() => mockLogger),
  };
});

// Get the mock logger instance after mocking
const getMockLogger = () => (Logger as jest.MockedClass<typeof Logger>).mock.results[0]?.value;

describe('MemoryStorage', () => {
  let storage: MemoryStorage;
  let mockLogger: any;
  
  const options: RequestDeduplicationModuleOptions = { 
    storage: 'memory',
    ttl: 1000
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (MemoryStorage as any).instance = undefined;
    storage = new MemoryStorage(options);
    mockLogger = getMockLogger();
  });

  afterEach(() => {
    storage.clearAllTimeouts();
    jest.clearAllTimers();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when instantiated multiple times', () => {
      const storage2 = new MemoryStorage(options);
      expect(storage).toBe(storage2);
    });
  });

  describe('Storage Operations', () => {
    beforeEach(async () => {
      await storage.initStorage();
    });

    it('should store and retrieve values', async () => {
      await storage.set('test-key', 'test-value', 1000);
      const value = await storage.get('test-key');
      expect(value).toBe('test-value');
    });

    it('should return undefined for non-existent keys', async () => {
      const value = await storage.get('non-existent');
      expect(value).toBeUndefined();
    });

    it('should delete values', async () => {
      await storage.set('test-key', 'test-value', 1000);
      await storage.delete('test-key');
      const value = await storage.get('test-key');
      expect(value).toBeUndefined();
    });
  });

  describe('TTL Functionality', () => {
    beforeEach(async () => {
      jest.useFakeTimers();
      await storage.initStorage();
    });

    afterEach(() => {
      storage.clearAllTimeouts();
      jest.useRealTimers();
      jest.clearAllTimers();
    });

    it('should remove value after TTL expires', async () => {
      await storage.set('test-key', 'test-value', 1000);
      expect(await storage.get('test-key')).toBe('test-value');
      
      jest.advanceTimersByTime(1100);
      
      expect(await storage.get('test-key')).toBeUndefined();
    });
  });

  describe('Initialization', () => {
    it('should initialize only once', async () => {
      await storage.initStorage();
      await storage.initStorage(); // Second call should not log again
      
      expect(mockLogger.log).toHaveBeenCalledWith('In-memory storage initialized.');
      expect(mockLogger.log).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle undefined TTL', async () => {
      await storage.set('test-key', 'test-value', undefined);
      expect(await storage.get('test-key')).toBe('test-value');
    });

    it('should handle invalid keys gracefully', async () => {
      await expect(storage.get(undefined as unknown as string)).resolves.toBeUndefined();
      await expect(storage.delete(undefined as unknown as string)).resolves.toBeUndefined();
    });
  });

  afterAll(() => {
    storage.clearAllTimeouts();
    jest.useRealTimers();
    jest.clearAllTimers();
  });
});
