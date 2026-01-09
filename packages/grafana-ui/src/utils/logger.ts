import { throttle } from 'lodash';

type Args = Parameters<typeof console.log>;

/**
 * Log level enumeration for structured logging
 * @public
 */
export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
  None = 4,
}

/**
 * Context object for structured logging with additional metadata
 * @public
 */
export interface LogContext {
  [key: string]: string | number | boolean | undefined;
}

/**
 * @internal
 */
const throttledLog = throttle((...t: Args) => {
  // eslint-disable-next-line no-console
  console.log(...t);
}, 500);

const throttledWarn = throttle((...t: Args) => {
  // eslint-disable-next-line no-console
  console.warn(...t);
}, 500);

const throttledError = throttle((...t: Args) => {
  // eslint-disable-next-line no-console
  console.error(...t);
}, 500);

/**
 * Safe localStorage access that doesn't violate eslint rules for packages.
 * This is needed because grafana-ui can't import from @grafana/data.
 */
function getLocalStorageItem(key: string): string | null {
  if (typeof window !== 'undefined') {
    try {
      // Access localStorage via window property to avoid eslint no-restricted-syntax rule
      const storage = Object.getOwnPropertyDescriptor(window, 'localStorage')?.value;
      if (storage && typeof storage.getItem === 'function') {
        return storage.getItem(key);
      }
    } catch {
      // localStorage might not be available (e.g., in some iframe contexts)
      return null;
    }
  }
  return null;
}

/**
 * Determines if logging is currently enabled globally via localStorage
 */
function isLoggingEnabled(): boolean {
  return getLocalStorageItem('grafana.debug') === 'true';
}

/**
 * Gets the current log level from localStorage or defaults to Warn in production
 */
function getLogLevel(): LogLevel {
  const levelStr = getLocalStorageItem('grafana.debug.level');
  if (levelStr) {
    const level = parseInt(levelStr, 10);
    if (!isNaN(level) && level >= LogLevel.Debug && level <= LogLevel.None) {
      return level;
    }
  }
  // Default: in production show only errors, in dev show all
  return process.env.NODE_ENV === 'production' ? LogLevel.Error : LogLevel.Debug;
}

/**
 * Formats a log message with timestamp and context
 */
function formatMessage(name: string, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  let formatted = `[${timestamp}] [${name}] ${message}`;

  if (context && Object.keys(context).length > 0) {
    const contextStr = Object.entries(context)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join(' ');
    if (contextStr) {
      formatted += ` | ${contextStr}`;
    }
  }

  return formatted;
}

/**
 * @internal
 * @deprecated Use StructuredLogger instead
 */
export interface Logger {
  logger: (...t: Args) => void;
  enable: () => void;
  disable: () => void;
  isEnabled: () => boolean;
}

/**
 * Structured logger interface with log levels
 * @public
 */
export interface StructuredLogger {
  /** Log a debug message - for detailed debugging information */
  debug: (message: string, context?: LogContext) => void;
  /** Log an info message - for general informational messages */
  info: (message: string, context?: LogContext) => void;
  /** Log a warning message - for potentially problematic situations */
  warn: (message: string, context?: LogContext) => void;
  /** Log an error message - for error conditions */
  error: (message: string, error?: Error | unknown, context?: LogContext) => void;
  /** Enable logging for this logger */
  enable: () => void;
  /** Disable logging for this logger */
  disable: () => void;
  /** Check if this logger is enabled */
  isEnabled: () => boolean;
  /** Set the minimum log level for this logger */
  setLevel: (level: LogLevel) => void;
  /** Get the current log level */
  getLevel: () => LogLevel;
  /** Create a child logger with additional base context */
  child: (childContext: LogContext) => StructuredLogger;
  /** The legacy logger function for backwards compatibility */
  logger: (...t: Args) => void;
}

/**
 * Creates a structured logger with log levels and context support.
 *
 * Features:
 * - Log levels: debug, info, warn, error
 * - Structured context for each log message
 * - Timestamp in ISO format
 * - Child loggers for adding base context
 * - Enable/disable logging dynamically
 * - Respects localStorage settings for debug mode
 *
 * Usage:
 * ```typescript
 * const logger = createLogger('MyComponent');
 *
 * // Basic logging
 * logger.debug('Processing data', { itemCount: 10 });
 * logger.info('Operation completed');
 * logger.warn('Deprecated API used', { api: 'oldMethod' });
 * logger.error('Failed to load', new Error('Network error'), { url: '/api/data' });
 *
 * // Child logger with base context
 * const childLogger = logger.child({ userId: '123' });
 * childLogger.info('User action'); // includes userId in context
 * ```
 *
 * @param name - The name/source of the logger (typically component or module name)
 * @param baseContext - Optional base context included in all log messages
 * @public
 */
export const createLogger = (name: string, baseContext?: LogContext): StructuredLogger => {
  let loggingEnabled = isLoggingEnabled();
  let currentLevel = getLogLevel();

  const shouldLog = (level: LogLevel): boolean => {
    if (process.env.NODE_ENV === 'test') {
      return false;
    }
    if (!loggingEnabled && process.env.NODE_ENV === 'production') {
      // In production, only log errors unless explicitly enabled
      return level >= LogLevel.Error;
    }
    return level >= currentLevel;
  };

  const mergeContext = (context?: LogContext): LogContext | undefined => {
    if (!baseContext && !context) {
      return undefined;
    }
    return { ...baseContext, ...context };
  };

  const logger: StructuredLogger = {
    debug: (message: string, context?: LogContext) => {
      if (!shouldLog(LogLevel.Debug)) {
        return;
      }
      const formatted = formatMessage(name, message, mergeContext(context));
      // eslint-disable-next-line no-console
      console.debug(formatted);
    },

    info: (message: string, context?: LogContext) => {
      if (!shouldLog(LogLevel.Info)) {
        return;
      }
      const formatted = formatMessage(name, message, mergeContext(context));
      // eslint-disable-next-line no-console
      console.log(formatted);
    },

    warn: (message: string, context?: LogContext) => {
      if (!shouldLog(LogLevel.Warn)) {
        return;
      }
      const formatted = formatMessage(name, message, mergeContext(context));
      // eslint-disable-next-line no-console
      console.warn(formatted);
    },

    error: (message: string, error?: Error | unknown, context?: LogContext) => {
      if (!shouldLog(LogLevel.Error)) {
        return;
      }
      const errorContext = mergeContext(context) || {};
      if (error instanceof Error) {
        errorContext.errorMessage = error.message;
        errorContext.errorName = error.name;
      }
      const formatted = formatMessage(name, message, errorContext);
      // eslint-disable-next-line no-console
      console.error(formatted, error);
    },

    enable: () => {
      loggingEnabled = true;
    },

    disable: () => {
      loggingEnabled = false;
    },

    isEnabled: () => loggingEnabled,

    setLevel: (level: LogLevel) => {
      currentLevel = level;
    },

    getLevel: () => currentLevel,

    child: (childContext: LogContext): StructuredLogger => {
      return createLogger(name, { ...baseContext, ...childContext });
    },

    // Legacy compatibility - deprecated
    logger: (id: string, useThrottle = false, ...t: Args) => {
      if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test' || !loggingEnabled) {
        return;
      }
      const fn = useThrottle ? throttledLog : console.log;
      // eslint-disable-next-line no-console
      fn(`[${name}: ${id}]:`, ...t);
    },
  };

  return logger;
};

/**
 * Creates a throttled structured logger for high-frequency logging scenarios.
 * Useful for logging in hot paths like render loops or mouse events.
 *
 * @param name - The name/source of the logger
 * @param throttleMs - Throttle interval in milliseconds (default: 500ms)
 * @param baseContext - Optional base context included in all log messages
 * @public
 */
export const createThrottledLogger = (
  name: string,
  throttleMs = 500,
  baseContext?: LogContext
): StructuredLogger => {
  let loggingEnabled = isLoggingEnabled();
  let currentLevel = getLogLevel();

  const throttledDebug = throttle((...t: Args) => {
    // eslint-disable-next-line no-console
    console.debug(...t);
  }, throttleMs);

  const throttledInfo = throttle((...t: Args) => {
    // eslint-disable-next-line no-console
    console.log(...t);
  }, throttleMs);

  const shouldLog = (level: LogLevel): boolean => {
    if (process.env.NODE_ENV === 'test') {
      return false;
    }
    if (!loggingEnabled && process.env.NODE_ENV === 'production') {
      return level >= LogLevel.Error;
    }
    return level >= currentLevel;
  };

  const mergeContext = (context?: LogContext): LogContext | undefined => {
    if (!baseContext && !context) {
      return undefined;
    }
    return { ...baseContext, ...context };
  };

  const logger: StructuredLogger = {
    debug: (message: string, context?: LogContext) => {
      if (!shouldLog(LogLevel.Debug)) {
        return;
      }
      const formatted = formatMessage(name, message, mergeContext(context));
      throttledDebug(formatted);
    },

    info: (message: string, context?: LogContext) => {
      if (!shouldLog(LogLevel.Info)) {
        return;
      }
      const formatted = formatMessage(name, message, mergeContext(context));
      throttledInfo(formatted);
    },

    warn: (message: string, context?: LogContext) => {
      if (!shouldLog(LogLevel.Warn)) {
        return;
      }
      const formatted = formatMessage(name, message, mergeContext(context));
      throttledWarn(formatted);
    },

    error: (message: string, error?: Error | unknown, context?: LogContext) => {
      if (!shouldLog(LogLevel.Error)) {
        return;
      }
      const errorContext = mergeContext(context) || {};
      if (error instanceof Error) {
        errorContext.errorMessage = error.message;
        errorContext.errorName = error.name;
      }
      const formatted = formatMessage(name, message, errorContext);
      throttledError(formatted, error);
    },

    enable: () => {
      loggingEnabled = true;
    },

    disable: () => {
      loggingEnabled = false;
    },

    isEnabled: () => loggingEnabled,

    setLevel: (level: LogLevel) => {
      currentLevel = level;
    },

    getLevel: () => currentLevel,

    child: (childContext: LogContext): StructuredLogger => {
      return createThrottledLogger(name, throttleMs, { ...baseContext, ...childContext });
    },

    // Legacy compatibility
    logger: (id: string, useThrottle = false, ...t: Args) => {
      if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test' || !loggingEnabled) {
        return;
      }
      const fn = useThrottle ? throttledLog : console.log;
      // eslint-disable-next-line no-console
      fn(`[${name}: ${id}]:`, ...t);
    },
  };

  return logger;
};
