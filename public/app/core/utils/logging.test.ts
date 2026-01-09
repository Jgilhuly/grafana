import { LogLevel } from '@grafana/ui';

import {
  appLogger,
  createFeatureLogger,
  createFeatureThrottledLogger,
  logError,
  loggers,
  withAsyncLogging,
  withLogging,
} from './logging';

describe('logging utilities', () => {
  describe('appLogger', () => {
    it('should be defined', () => {
      expect(appLogger).toBeDefined();
      expect(appLogger.debug).toBeInstanceOf(Function);
      expect(appLogger.info).toBeInstanceOf(Function);
      expect(appLogger.warn).toBeInstanceOf(Function);
      expect(appLogger.error).toBeInstanceOf(Function);
    });
  });

  describe('createFeatureLogger', () => {
    it('should create a logger with the given name', () => {
      const logger = createFeatureLogger('TestFeature');
      expect(logger).toBeDefined();
      expect(logger.debug).toBeInstanceOf(Function);
    });

    it('should accept base context', () => {
      const logger = createFeatureLogger('TestFeature', { version: '1.0' });
      expect(logger).toBeDefined();
    });
  });

  describe('createFeatureThrottledLogger', () => {
    it('should create a throttled logger', () => {
      const logger = createFeatureThrottledLogger('TestFeature', 100);
      expect(logger).toBeDefined();
      expect(logger.debug).toBeInstanceOf(Function);
    });

    it('should accept base context', () => {
      const logger = createFeatureThrottledLogger('TestFeature', 200, { mode: 'test' });
      expect(logger).toBeDefined();
    });
  });

  describe('loggers', () => {
    it('should have pre-configured loggers', () => {
      expect(loggers.dashboard).toBeDefined();
      expect(loggers.alerting).toBeDefined();
      expect(loggers.explore).toBeDefined();
      expect(loggers.plugins).toBeDefined();
      expect(loggers.datasources).toBeDefined();
      expect(loggers.auth).toBeDefined();
      expect(loggers.api).toBeDefined();
      expect(loggers.scenes).toBeDefined();
      expect(loggers.live).toBeDefined();
      expect(loggers.performance).toBeDefined();
    });

    it('should have proper logger methods on all pre-configured loggers', () => {
      Object.values(loggers).forEach((logger) => {
        expect(logger.debug).toBeInstanceOf(Function);
        expect(logger.info).toBeInstanceOf(Function);
        expect(logger.warn).toBeInstanceOf(Function);
        expect(logger.error).toBeInstanceOf(Function);
      });
    });
  });

  describe('logError helper', () => {
    let mockLogger: ReturnType<typeof createFeatureLogger>;

    beforeEach(() => {
      mockLogger = createFeatureLogger('TestLogger');
      jest.spyOn(mockLogger, 'error').mockImplementation();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should log Error instances directly', () => {
      const error = new Error('Test error');
      logError(mockLogger, 'Operation failed', error, { context: 'test' });

      expect(mockLogger.error).toHaveBeenCalledWith('Operation failed', error, { context: 'test' });
    });

    it('should convert non-Error values to Error instances', () => {
      logError(mockLogger, 'Operation failed', 'string error', { context: 'test' });

      expect(mockLogger.error).toHaveBeenCalled();
      const call = (mockLogger.error as jest.Mock).mock.calls[0];
      expect(call[0]).toBe('Operation failed');
      expect(call[1]).toBeInstanceOf(Error);
      expect(call[2]).toEqual({ context: 'test', originalError: 'string error' });
    });
  });

  describe('withLogging helper', () => {
    let mockLogger: ReturnType<typeof createFeatureLogger>;
    let debugSpy: jest.SpyInstance;
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
      mockLogger = createFeatureLogger('TestLogger');
      debugSpy = jest.spyOn(mockLogger, 'debug').mockImplementation();
      errorSpy = jest.spyOn(mockLogger, 'error').mockImplementation();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should wrap synchronous functions', () => {
      const fn = jest.fn().mockReturnValue('result');
      const wrapped = withLogging(mockLogger, 'testOperation', fn);

      const result = wrapped();

      expect(result).toBe('result');
      expect(debugSpy).toHaveBeenCalledWith('testOperation started');
      expect(debugSpy).toHaveBeenCalledWith('testOperation completed');
    });

    it('should log errors for synchronous functions', () => {
      const error = new Error('Test error');
      const fn = jest.fn().mockImplementation(() => {
        throw error;
      });
      const wrapped = withLogging(mockLogger, 'testOperation', fn);

      expect(() => wrapped()).toThrow(error);
      expect(debugSpy).toHaveBeenCalledWith('testOperation started');
      expect(errorSpy).toHaveBeenCalledWith('testOperation failed', error);
    });
  });

  describe('withAsyncLogging helper', () => {
    let mockLogger: ReturnType<typeof createFeatureLogger>;
    let debugSpy: jest.SpyInstance;
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
      mockLogger = createFeatureLogger('TestLogger');
      debugSpy = jest.spyOn(mockLogger, 'debug').mockImplementation();
      errorSpy = jest.spyOn(mockLogger, 'error').mockImplementation();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should wrap async functions', async () => {
      const fn = jest.fn().mockResolvedValue('async result');
      const wrapped = withAsyncLogging(mockLogger, 'asyncOperation', fn);

      const result = await wrapped();

      expect(result).toBe('async result');
      expect(debugSpy).toHaveBeenCalledWith('asyncOperation started');
      expect(debugSpy).toHaveBeenCalledWith('asyncOperation completed');
    });

    it('should log errors for async functions', async () => {
      const error = new Error('Async error');
      const fn = jest.fn().mockRejectedValue(error);
      const wrapped = withAsyncLogging(mockLogger, 'asyncOperation', fn);

      await expect(wrapped()).rejects.toThrow(error);
      expect(debugSpy).toHaveBeenCalledWith('asyncOperation started');
      expect(errorSpy).toHaveBeenCalledWith('asyncOperation failed', error);
    });
  });

  describe('LogLevel export', () => {
    it('should export LogLevel enum', () => {
      expect(LogLevel).toBeDefined();
      expect(LogLevel.Debug).toBe(0);
      expect(LogLevel.Info).toBe(1);
      expect(LogLevel.Warn).toBe(2);
      expect(LogLevel.Error).toBe(3);
      expect(LogLevel.None).toBe(4);
    });
  });
});
