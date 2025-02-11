import { MemoryAdapter } from './memory.adapter';
import Keyv from 'keyv';
import type { RequestDeduplicationModuleOptions } from '../interfaces';

jest.mock('keyv');

describe('MemoryAdapter', () => {
  let adapter: MemoryAdapter;
  const mockOptions: RequestDeduplicationModuleOptions = {};

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new MemoryAdapter(mockOptions);
  });

  describe('init', () => {
    it('should initialize keyv with memory store', async () => {
      await adapter.init();

      expect(Keyv).toHaveBeenCalledWith({
        namespace: 'request-deduplication',
      });
    });
  });

  describe('get', () => {
    it('should retrieve value from storage', async () => {
      const mockValue = { data: 'test' };
      const mockGet = jest.fn().mockResolvedValue(mockValue);
      (Keyv as unknown as jest.Mock).mockImplementation(() => ({ get: mockGet }));

      await adapter.init();
      const result = await adapter.get('test-key');

      expect(mockGet).toHaveBeenCalledWith('test-key');
      expect(result).toEqual(mockValue);
    });

    it('should throw error for non-existent key', async () => {
      const mockGet = jest.fn().mockResolvedValue(undefined);
      (Keyv as unknown as jest.Mock).mockImplementation(() => ({ get: mockGet }));

      await adapter.init();
      await expect(adapter.get('non-existent-key')).rejects.toThrow(
        'Key non-existent-key not found',
      );
    });
  });

  describe('set', () => {
    it('should store value with ttl', async () => {
      const mockSet = jest.fn().mockResolvedValue(undefined);
      (Keyv as unknown as jest.Mock).mockImplementation(() => ({ set: mockSet }));

      await adapter.init();
      await adapter.set('test-key', 'test-value', 1000);

      expect(mockSet).toHaveBeenCalledWith('test-key', 'test-value', 1000);
    });
  });

  describe('delete', () => {
    it('should delete value from storage', async () => {
      const mockDelete = jest.fn().mockResolvedValue(undefined);
      (Keyv as unknown as jest.Mock).mockImplementation(() => ({ delete: mockDelete }));

      await adapter.init();
      await adapter.delete('test-key');

      expect(mockDelete).toHaveBeenCalledWith('test-key');
    });
  });
});
