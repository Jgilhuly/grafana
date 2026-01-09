import { createLogger, createThrottledLogger, LogLevel } from './logger';

describe('createLogger', () => {
  let originalEnv: string | undefined;
  let consoleDebugSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    // Set to development to enable logging
    process.env.NODE_ENV = 'development';

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => {
          if (key === 'grafana.debug') {
            return 'true';
          }
          return null;
        }),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });

    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.restoreAllMocks();
  });

  describe('basic logging', () => {
    it('should create a logger with the given name', () => {
      const logger = createLogger('TestLogger');
      expect(logger).toBeDefined();
      expect(logger.debug).toBeInstanceOf(Function);
      expect(logger.info).toBeInstanceOf(Function);
      expect(logger.warn).toBeInstanceOf(Function);
      expect(logger.error).toBeInstanceOf(Function);
    });

    it('should include logger name in debug messages', () => {
      const logger = createLogger('TestComponent');
      logger.enable();
      logger.setLevel(LogLevel.Debug);

      logger.debug('Test message');

      expect(consoleDebugSpy).toHaveBeenCalled();
      const loggedMessage = consoleDebugSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('[TestComponent]');
      expect(loggedMessage).toContain('Test message');
    });

    it('should include logger name in info messages', () => {
      const logger = createLogger('TestComponent');
      logger.enable();
      logger.setLevel(LogLevel.Debug);

      logger.info('Info message');

      expect(consoleLogSpy).toHaveBeenCalled();
      const loggedMessage = consoleLogSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('[TestComponent]');
      expect(loggedMessage).toContain('Info message');
    });

    it('should include logger name in warn messages', () => {
      const logger = createLogger('TestComponent');
      logger.enable();
      logger.setLevel(LogLevel.Debug);

      logger.warn('Warning message');

      expect(consoleWarnSpy).toHaveBeenCalled();
      const loggedMessage = consoleWarnSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('[TestComponent]');
      expect(loggedMessage).toContain('Warning message');
    });

    it('should include logger name in error messages', () => {
      const logger = createLogger('TestComponent');
      logger.enable();
      logger.setLevel(LogLevel.Debug);

      const error = new Error('Test error');
      logger.error('Error occurred', error);

      expect(consoleErrorSpy).toHaveBeenCalled();
      const loggedMessage = consoleErrorSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('[TestComponent]');
      expect(loggedMessage).toContain('Error occurred');
    });
  });

  describe('log levels', () => {
    it('should respect log level settings', () => {
      const logger = createLogger('TestLogger');
      logger.enable();
      logger.setLevel(LogLevel.Warn);

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message', new Error('test'));

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should allow changing log level dynamically', () => {
      const logger = createLogger('TestLogger');
      logger.enable();

      logger.setLevel(LogLevel.Error);
      logger.warn('Should not appear');
      expect(consoleWarnSpy).not.toHaveBeenCalled();

      logger.setLevel(LogLevel.Warn);
      logger.warn('Should appear');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should return current log level', () => {
      const logger = createLogger('TestLogger');
      logger.setLevel(LogLevel.Info);
      expect(logger.getLevel()).toBe(LogLevel.Info);
    });
  });

  describe('context support', () => {
    it('should include context in log messages', () => {
      const logger = createLogger('TestLogger');
      logger.enable();
      logger.setLevel(LogLevel.Debug);

      logger.info('User action', { userId: '123', action: 'click' });

      expect(consoleLogSpy).toHaveBeenCalled();
      const loggedMessage = consoleLogSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('userId');
      expect(loggedMessage).toContain('123');
      expect(loggedMessage).toContain('action');
      expect(loggedMessage).toContain('click');
    });

    it('should include base context in all messages', () => {
      const logger = createLogger('TestLogger', { component: 'Dashboard' });
      logger.enable();
      logger.setLevel(LogLevel.Debug);

      logger.info('Loading');

      expect(consoleLogSpy).toHaveBeenCalled();
      const loggedMessage = consoleLogSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('component');
      expect(loggedMessage).toContain('Dashboard');
    });

    it('should merge base context with message context', () => {
      const logger = createLogger('TestLogger', { component: 'Dashboard' });
      logger.enable();
      logger.setLevel(LogLevel.Debug);

      logger.info('Panel loaded', { panelId: '1' });

      expect(consoleLogSpy).toHaveBeenCalled();
      const loggedMessage = consoleLogSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('component');
      expect(loggedMessage).toContain('panelId');
    });
  });

  describe('child loggers', () => {
    it('should create child logger with inherited context', () => {
      const parentLogger = createLogger('Parent', { app: 'grafana' });
      const childLogger = parentLogger.child({ feature: 'alerting' });

      childLogger.enable();
      childLogger.setLevel(LogLevel.Debug);

      childLogger.info('Child message');

      expect(consoleLogSpy).toHaveBeenCalled();
      const loggedMessage = consoleLogSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('app');
      expect(loggedMessage).toContain('feature');
    });
  });

  describe('enable/disable', () => {
    it('should track enabled state', () => {
      const logger = createLogger('TestLogger');
      logger.enable();
      expect(logger.isEnabled()).toBe(true);

      logger.disable();
      expect(logger.isEnabled()).toBe(false);
    });
  });

  describe('error logging', () => {
    it('should include error details in context', () => {
      const logger = createLogger('TestLogger');
      logger.enable();
      logger.setLevel(LogLevel.Debug);

      const error = new Error('Something went wrong');
      logger.error('Operation failed', error);

      expect(consoleErrorSpy).toHaveBeenCalled();
      const loggedMessage = consoleErrorSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('errorMessage');
      expect(loggedMessage).toContain('errorName');
    });

    it('should pass error object to console.error', () => {
      const logger = createLogger('TestLogger');
      logger.enable();
      logger.setLevel(LogLevel.Debug);

      const error = new Error('Test error');
      logger.error('Failed', error);

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][1]).toBe(error);
    });
  });

  describe('legacy compatibility', () => {
    it('should provide legacy logger function', () => {
      const logger = createLogger('TestLogger');
      logger.enable();

      expect(logger.logger).toBeInstanceOf(Function);
    });
  });
});

describe('createThrottledLogger', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'development';

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => {
          if (key === 'grafana.debug') {
            return 'true';
          }
          return null;
        }),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should create a throttled logger', () => {
    const logger = createThrottledLogger('ThrottledLogger', 100);
    expect(logger).toBeDefined();
    expect(logger.debug).toBeInstanceOf(Function);
    expect(logger.info).toBeInstanceOf(Function);
    expect(logger.warn).toBeInstanceOf(Function);
    expect(logger.error).toBeInstanceOf(Function);
  });

  it('should have child logger support', () => {
    const logger = createThrottledLogger('ThrottledLogger');
    const childLogger = logger.child({ feature: 'test' });
    expect(childLogger).toBeDefined();
  });
});

describe('LogLevel enum', () => {
  it('should have correct level values', () => {
    expect(LogLevel.Debug).toBe(0);
    expect(LogLevel.Info).toBe(1);
    expect(LogLevel.Warn).toBe(2);
    expect(LogLevel.Error).toBe(3);
    expect(LogLevel.None).toBe(4);
  });
});
