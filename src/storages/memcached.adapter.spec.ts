import { MemcachedAdapter } from './memcached.adapter';
import Keyv from 'keyv';
import KeyvMemcache from '@keyv/memcache';
import type { RequestDeduplicationModuleOptions } from '../interfaces';

jest.mock('keyv');
jest.mock('@keyv/memcache');

describe('MemcachedAdapter', () => {
  let adapter: MemcachedAdapter;
  const mockOptions: RequestDeduplicationModuleOptions = {
    memcachedConfig: {
      uri: 'localhost:11211',
      options: { retries: 3 },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new MemcachedAdapter(mockOptions);
  });

  describe('init', () => {
    it('should initialize keyv with memcached store', async () => {
      await adapter.init();

      expect(KeyvMemcache).toHaveBeenCalledWith(
        mockOptions.memcachedConfig?.uri,
        mockOptions.memcachedConfig,
      );
      expect(Keyv).toHaveBeenCalledWith({
        store: expect.any(KeyvMemcache),
        namespace: 'request-deduplication',
      });
    });

    it('should throw error if memcached config is missing', async () => {
      adapter = new MemcachedAdapter({});
      await expect(adapter.init()).rejects.toThrow('Memcached configuration is required');
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

    it('should throw error when key not found', async () => {
      const mockGet = jest.fn().mockResolvedValue(undefined);
      (Keyv as unknown as jest.Mock).mockImplementation(() => ({ get: mockGet }));

      await adapter.init();
      await expect(adapter.get('non-existent-key')).rejects.toThrow(
        'Key non-existent-key not found',
      );
    });

    it('should handle get errors', async () => {
      const mockGet = jest.fn().mockRejectedValue(new Error('Connection error'));
      (Keyv as unknown as jest.Mock).mockImplementation(() => ({ get: mockGet }));

      await adapter.init();
      await expect(adapter.get('test-key')).rejects.toThrow('Connection error');
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

    it('should handle set errors', async () => {
      const mockSet = jest.fn().mockRejectedValue(new Error('Storage error'));
      (Keyv as unknown as jest.Mock).mockImplementation(() => ({ set: mockSet }));

      await adapter.init();
      await expect(adapter.set('test-key', 'test-value', 1000)).rejects.toThrow('Storage error');
    });
  });

  describe('delete', () => {
    it('should delete value from storage', async () => {
      const mockDelete = jest.fn().mockResolvedValue(true);
      (Keyv as unknown as jest.Mock).mockImplementation(() => ({ delete: mockDelete }));

      await adapter.init();
      await adapter.delete('test-key');

      expect(mockDelete).toHaveBeenCalledWith('test-key');
    });

    it('should handle delete errors', async () => {
      const mockDelete = jest.fn().mockRejectedValue(new Error('Delete error'));
      (Keyv as unknown as jest.Mock).mockImplementation(() => ({ delete: mockDelete }));

      await adapter.init();
      await expect(adapter.delete('test-key')).rejects.toThrow('Delete error');
    });
  });
});
