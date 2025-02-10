import { RedisAdapter } from './redis.adapter';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';
import type { RequestDeduplicationModuleOptions } from '../interfaces';

jest.mock('keyv');
jest.mock('@keyv/redis');

describe('RedisAdapter', () => {
  let adapter: RedisAdapter;
  const mockOptions: RequestDeduplicationModuleOptions = {
    redisConfig: {
      url: 'localhost:6379',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new RedisAdapter(mockOptions);
  });

  describe('init', () => {
    it('should initialize keyv with redis store', async () => {
      await adapter.init();

      expect(KeyvRedis).toHaveBeenCalledWith(mockOptions.redisConfig);
      expect(Keyv).toHaveBeenCalledWith({
        store: expect.any(KeyvRedis),
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
