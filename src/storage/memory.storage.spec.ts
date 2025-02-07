import { MemoryStorage } from './memory.storage';
import { RequestDeduplicationModuleOptions } from '../request-deduplication.interface';

describe('MemoryStorage', () => {
  let storage: MemoryStorage;
  const options: RequestDeduplicationModuleOptions = { 
    storage: 'memory',
    ttl: 1000
  };

  beforeEach(() => {
    // Reset the singleton instance before each test
    (MemoryStorage as any).instance = undefined;
    storage = new MemoryStorage(options);
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
      await storage.initStorage();
    });

    it('should remove value after TTL expires', async () => {
      jest.useFakeTimers();
      
      await storage.set('test-key', 'test-value', 1000);
      expect(await storage.get('test-key')).toBe('test-value');
      
      jest.advanceTimersByTime(1100);
      
      expect(await storage.get('test-key')).toBeUndefined();
      
      jest.useRealTimers();
    });
  });

  describe('Initialization', () => {
    it('should initialize only once', async () => {
      const logSpy = jest.spyOn(console, 'log');
      
      await storage.initStorage();
      await storage.initStorage(); // Second call should not re-initialize
      
      expect(logSpy).toHaveBeenCalledWith('In-memory storage initialized.');
      expect(logSpy).toHaveBeenCalledTimes(1);
      
      logSpy.mockRestore();
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
});
