import { Test } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { RequestDeduplicationInterceptor } from './request-deduplication.interceptor';
import { RequestDeduplicationService } from './request-deduplication.service';
import { REQUEST_DEDUPLICATION_MODULE_OPTIONS } from './request-deduplication.constants';
import { of } from 'rxjs';

describe('RequestDeduplicationInterceptor', () => {
  let interceptor: RequestDeduplicationInterceptor;
  let requestDeduplicationService: jest.Mocked<RequestDeduplicationService>;

  beforeEach(async () => {
    const mockRequestDeduplicationService = {
      processRequest: jest.fn(),
    };

    const module = await Test.createTestingModule({
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
      ],
    }).compile();

    interceptor = module.get<RequestDeduplicationInterceptor>(RequestDeduplicationInterceptor);
    requestDeduplicationService = module.get(RequestDeduplicationService);
  });

  it('should allow first request to proceed', async () => {
    const context = createMockExecutionContext({
      method: 'GET',
      originalUrl: '/test',
      body: { data: 'test' },
    });
    const callHandler = createMockCallHandler({ result: 'success' });
    requestDeduplicationService.processRequest.mockResolvedValue(true);

    const result = await interceptor
      .intercept(context, callHandler)
      .toPromise();

    expect(result).toBe('success');
    expect(requestDeduplicationService.processRequest).toHaveBeenCalledWith(
      expect.any(String),
      'request_exists',
      1000
    );
  });

  it('should return duplicate message for duplicate requests', async () => {
    const context = createMockExecutionContext({
      method: 'POST',
      originalUrl: '/test',
      body: { data: 'test' },
    });
    const callHandler = createMockCallHandler({ result: 'success' });
    requestDeduplicationService.processRequest.mockResolvedValue(false);

    const result = await interceptor
      .intercept(context, callHandler)
      .toPromise();

    expect(result).toEqual({ message: 'Duplicate request' });
  });

  it('should generate different keys for different requests', async () => {
    const keys = new Set();
    const requests = [
      { method: 'GET', originalUrl: '/test1', body: {} },
      { method: 'GET', originalUrl: '/test2', body: {} },
      { method: 'POST', originalUrl: '/test1', body: { data: 'test' } },
    ];

    requests.forEach(reqData => {
      const context = createMockExecutionContext(reqData);
      interceptor.intercept(context, createMockCallHandler({ result: 'success' }));
      const key = (requestDeduplicationService.processRequest.mock.calls.pop() || [])[0];
      keys.add(key);
    });

    expect(keys.size).toBe(requests.length);
  });
});

function createMockExecutionContext(request: any): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

function createMockCallHandler(response: any): CallHandler {
  return {
    handle: () => of(response.result),
  };
}
