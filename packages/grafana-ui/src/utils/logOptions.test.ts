import { getStructuredLogger, setStructuredLogger, type StructuredLogger } from '@grafana/data';

import { logOptions } from './logOptions';

const RECOMMENDED_AMOUNT = 10;

describe('logOptions', () => {
  let originalLogger: StructuredLogger;
  let loggerSpy: StructuredLogger;

  beforeAll(() => {
    originalLogger = getStructuredLogger();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    loggerSpy = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    setStructuredLogger(loggerSpy);
  });

  afterEach(() => {
    setStructuredLogger(originalLogger);
  });

  it('should not log anything if amount is less than or equal to recommendedAmount', () => {
    logOptions(5, RECOMMENDED_AMOUNT, 'test-id', 'test-aria');

    expect(loggerSpy.warn).not.toHaveBeenCalled();
  });

  it('should log a warning if amount exceeds recommendedAmount', () => {
    logOptions(15, RECOMMENDED_AMOUNT, 'test-id', 'test-aria');

    expect(loggerSpy.warn).toHaveBeenCalledWith('[Combobox] Items exceed the recommended amount 10.', {
      itemsCount: '15',
      recommendedAmount: '10',
      'aria-labelledby': 'test-aria',
      id: 'test-id',
    });
  });
});
