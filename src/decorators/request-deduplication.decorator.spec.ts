import 'reflect-metadata';
import { SKIP_DEDUPLICATE_REQUEST_KEY } from '../constants';
import { SkipDeduplicateRequest } from './request-deduplication.decorator';

describe('SkipDeduplicateRequest', () => {
  it('should set metadata with correct key and value', () => {
    @SkipDeduplicateRequest()
    class TestClass {}

    const metadata = Reflect.getMetadata(SKIP_DEDUPLICATE_REQUEST_KEY, TestClass);
    expect(metadata).toBe(true);
  });

  it('should set metadata on method level', () => {
    class TestClass {
      @SkipDeduplicateRequest()
      testMethod() {}
    }

    const instance = new TestClass();
    const metadata = Reflect.getMetadata(SKIP_DEDUPLICATE_REQUEST_KEY, instance.testMethod);

    expect(metadata).toBe(true);
  });

  it('should not affect other methods or classes', () => {
    class TestClass {
      @SkipDeduplicateRequest()
      decoratedMethod() {}

      undecoratedMethod() {}
    }

    const instance = new TestClass();
    const decoratedMetadata = Reflect.getMetadata(
      SKIP_DEDUPLICATE_REQUEST_KEY,
      instance.decoratedMethod,
    );
    const undecoratedMetadata = Reflect.getMetadata(
      SKIP_DEDUPLICATE_REQUEST_KEY,
      instance.undecoratedMethod,
    );

    expect(decoratedMetadata).toBe(true);
    expect(undecoratedMetadata).toBeUndefined();
  });
});
