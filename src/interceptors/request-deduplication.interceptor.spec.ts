import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { ExecutionContext, CallHandler } from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestDeduplicationInterceptor } from './request-deduplication.interceptor';
import { RequestDeduplicationService } from '../services';
import { REQUEST_DEDUPLICATION_MODULE_OPTIONS } from '../constants';
import { of, firstValueFrom } from 'rxjs';

describe('RequestDeduplicationInterceptor', () => {
  let interceptor: RequestDeduplicationInterceptor;
  let requestDeduplicationService: jest.Mocked<RequestDeduplicationService>;
  let reflector: jest.Mocked<Reflector>;
  let module: TestingModule;

  beforeEach(async () => {
    const mockRequestDeduplicationService = {
      processRequest: jest.fn(),
    };

    const mockReflector = {
      get: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        RequestDeduplicationInterceptor,
        {
          provide: RequestDeduplicationService,
          useValue: mockRequestDeduplicationService,
        },
        {
          provide: REQUEST_DEDUPLICATION_MODULE_OPTIONS,
          useValue: { ttl: 1000 },
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    interceptor = module.get<RequestDeduplicationInterceptor>(RequestDeduplicationInterceptor);
    requestDeduplicationService = module.get(RequestDeduplicationService);
    reflector = module.get(Reflector);
  });

  afterEach(async () => {
    await module?.close();
  });

  const mockCallHandler: CallHandler = {
    handle: () => of('success'),
  };

  it('should skip deduplication when Skip decorator is present', async () => {
    reflector.get.mockReturnValue(true);
    const context = createMockExecutionContext();
    const callHandler = createMockCallHandler({ result: 'success' });

    const result = await firstValueFrom(interceptor.intercept(context, callHandler));

    expect(result).toBe('success');
    expect(requestDeduplicationService.processRequest).not.toHaveBeenCalled();
  });

  it('should skip deduplication when skipRequestDeduplication flag is true', async () => {
    reflector.get.mockReturnValue(false);
    const context = createMockExecutionContext({
      skipRequestDeduplication: true,
    });
    const callHandler = createMockCallHandler({ result: 'success' });

    const result = await firstValueFrom(interceptor.intercept(context, callHandler));

    expect(result).toBe('success');
    expect(requestDeduplicationService.processRequest).not.toHaveBeenCalled();
  });

  it('should throw HttpException for duplicate requests', async () => {
    reflector.get.mockReturnValue(false);
    const context = createMockExecutionContext({
      method: 'POST',
      originalUrl: '/test',
      body: { data: 'test' },
    });
    const callHandler = createMockCallHandler({ result: 'success' });
    requestDeduplicationService.processRequest.mockResolvedValue(false);

    try {
      await firstValueFrom(interceptor.intercept(context, callHandler));
      fail('Expected HttpException to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      if (error instanceof HttpException) {
        expect(error.getStatus()).toBe(HttpStatus.CONFLICT);
        expect(error.getResponse()).toEqual({
          status: HttpStatus.CONFLICT,
          error: 'Duplicate request',
        });
      }
    }
  });

  it('should process non-duplicate requests', async () => {
    reflector.get.mockReturnValue(false);
    const context = createMockExecutionContext({
      method: 'POST',
      originalUrl: '/test',
      body: { data: 'test' },
    });
    const callHandler = createMockCallHandler({ result: 'success' });
    requestDeduplicationService.processRequest.mockResolvedValue(true);

    const result = await firstValueFrom(interceptor.intercept(context, callHandler));

    expect(result).toBe('success');
    expect(requestDeduplicationService.processRequest).toHaveBeenCalled();
  });

  it('should allow first request to proceed', async () => {
    reflector.get.mockReturnValue(false);
    const context = createMockExecutionContext({
      method: 'GET',
      originalUrl: '/test',
      body: { data: 'test' },
    });
    const callHandler = createMockCallHandler({ result: 'success' });
    requestDeduplicationService.processRequest.mockResolvedValue(true);

    const result = await firstValueFrom(interceptor.intercept(context, callHandler));

    expect(result).toBe('success');
    expect(requestDeduplicationService.processRequest).toHaveBeenCalledWith(
      expect.any(String),
      'request_exists',
      1000,
    );
  });

  it('should generate different keys for different requests', async () => {
    const requests = [
      { method: 'GET', originalUrl: '/test1', body: {} },
      { method: 'GET', originalUrl: '/test2', body: {} },
      { method: 'POST', originalUrl: '/test1', body: { data: 'test' } },
    ];

    requestDeduplicationService.processRequest.mockResolvedValue(true);

    const processPromises = requests.map(async (reqData) => {
      const context = createMockExecutionContext(reqData);
      const result$ = interceptor.intercept(context, createMockCallHandler({ result: 'success' }));
      await firstValueFrom(result$);
    });

    await Promise.all(processPromises);

    const keys = new Set(
      requestDeduplicationService.processRequest.mock.calls.map((call) => call[0]),
    );

    expect(keys.size).toBe(requests.length);
    expect(requestDeduplicationService.processRequest).toHaveBeenCalledTimes(requests.length);
  });

  describe('request hash generation', () => {
    beforeEach(() => {
      // Set up default mock response for processRequest
      requestDeduplicationService.processRequest.mockResolvedValue(true);
    });

    it('should generate hash including headers', async () => {
      const ctx = createMockExecutionContext({
        method: 'POST',
        originalUrl: '/test',
        headers: { 'custom-header': 'test' },
      });

      await firstValueFrom(interceptor.intercept(ctx, mockCallHandler));

      expect(requestDeduplicationService.processRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(Number),
      );
    });

    it('should generate hash including query params', async () => {
      const ctx = createMockExecutionContext({
        method: 'POST',
        originalUrl: '/test',
        params: { id: '123' },
      });

      await firstValueFrom(interceptor.intercept(ctx, mockCallHandler));

      expect(requestDeduplicationService.processRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(Number),
      );
    });

    it('should generate hash including request body', async () => {
      const ctx = createMockExecutionContext({
        method: 'POST',
        originalUrl: '/test',
        body: { data: 'test-data' },
      });

      await firstValueFrom(interceptor.intercept(ctx, mockCallHandler));

      expect(requestDeduplicationService.processRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(Number),
      );
    });

    it('should handle undefined request properties', async () => {
      const ctx = createMockExecutionContext({
        method: 'POST',
        originalUrl: '/test',
        headers: undefined,
        params: undefined,
        body: undefined,
      });

      await firstValueFrom(interceptor.intercept(ctx, mockCallHandler));

      expect(requestDeduplicationService.processRequest).toHaveBeenCalled();
    });

    it('should generate different hashes for different requests', async () => {
      const ctx1 = createMockExecutionContext({
        method: 'POST',
        originalUrl: '/test/1',
        headers: { header: '1' },
        params: { param: '1' },
        body: { body: '1' },
      });

      const ctx2 = createMockExecutionContext({
        method: 'POST',
        originalUrl: '/test/2',
        headers: { header: '2' },
        params: { param: '2' },
        body: { body: '2' },
      });

      await firstValueFrom(interceptor.intercept(ctx1, mockCallHandler));
      await firstValueFrom(interceptor.intercept(ctx2, mockCallHandler));

      const [[firstCall], [secondCall]] = requestDeduplicationService.processRequest.mock.calls;
      expect(firstCall).not.toEqual(secondCall);
    });
  });

  afterAll(async () => {
    await module?.close();
  });
});

function createMockExecutionContext(request: any = {}): ExecutionContext {
  const mockHandler = jest.fn();
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        method: 'GET',
        originalUrl: '/test',
        body: {},
        ...request,
      }),
    }),
    getHandler: () => mockHandler,
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

function createMockCallHandler(response: any): CallHandler {
  return {
    handle: () => of(response.result),
  };
}
