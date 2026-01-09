import { throttle } from 'lodash';

import { store } from '@grafana/data';
import { LogContext } from '@grafana/faro-web-sdk';
import { createMonitoringLogger, MonitoringLogger } from '@grafana/runtime';

// Context type that accepts any values for logging - converted to strings for monitoring
type StructuredLogContext = Record<string, unknown>;

/**
 * Structured logger interface that provides consistent logging across the application.
 * Combines development console logging with production monitoring.
 */
export interface StructuredLogger {
  /** Log debug-level message (development only, requires grafana.debug localStorage flag) */
  debug: (message: string, context?: StructuredLogContext) => void;
  /** Log info-level message */
  info: (message: string, context?: StructuredLogContext) => void;
  /** Log warning-level message */
  warn: (message: string, context?: StructuredLogContext) => void;
  /** Log error-level message */
  error: (message: string, context?: StructuredLogContext, error?: Error) => void;
  /** Enable debug logging for this logger */
  enable: () => void;
  /** Disable debug logging for this logger */
  disable: () => void;
  /** Check if debug logging is enabled */
  isEnabled: () => boolean;
  /** Create a child logger with additional base context */
  child: (childContext: StructuredLogContext) => StructuredLogger;
}

/**
 * Convert context values to strings for monitoring logger compatibility
 */
function toStringContext(context?: StructuredLogContext): LogContext {
  if (!context) {
    return {};
  }
  return Object.entries(context).reduce<LogContext>((acc, [key, value]) => {
    acc[key] = value === undefined ? 'undefined' : String(value);
    return acc;
  }, {});
}

const DEBUG_STORAGE_KEY = 'grafana.debug';
const DEBUG_LOGGERS_KEY = 'grafana.debug.loggers';

/**
 * Check if specific logger is enabled via localStorage.
 * Supports both global 'grafana.debug' = 'true' and specific 'grafana.debug.loggers' = 'logger1,logger2'
 */
function isLoggerEnabled(name: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // Check global debug flag
  if (store.get(DEBUG_STORAGE_KEY) === 'true') {
    return true;
  }

  // Check specific logger list
  const enabledLoggers = store.get(DEBUG_LOGGERS_KEY);
  if (enabledLoggers) {
    const loggerList = String(enabledLoggers).split(',').map((l) => l.trim());
    return loggerList.includes(name) || loggerList.includes('*');
  }

  return false;
}

/**
 * Format log message with logger name prefix
 */
function formatMessage(name: string, message: string): string {
  return `[${name}] ${message}`;
}

/**
 * Create throttled console log to prevent log spam
 */
const createThrottledLog = () =>
  throttle((method: 'log' | 'info' | 'warn' | 'error', message: string, context?: StructuredLogContext) => {
    if (context && Object.keys(context).length > 0) {
      // eslint-disable-next-line no-console
      console[method](message, context);
    } else {
      // eslint-disable-next-line no-console
      console[method](message);
    }
  }, 500);

/**
 * Creates a structured logger for the specified component/module.
 *
 * Features:
 * - Structured context attached to all log messages
 * - Development console output with formatted messages
 * - Production monitoring integration via Faro when enabled
 * - Configurable debug logging via localStorage
 * - Child loggers for adding additional context
 *
 * @example
 * ```ts
 * const logger = createStructuredLogger('DashboardService');
 *
 * logger.info('Dashboard loaded', { dashboardId: '123', panelCount: 5 });
 * logger.warn('Deprecated API used', { api: 'oldEndpoint' });
 * logger.error('Failed to save', { dashboardId: '123' }, error);
 *
 * // Create child logger with additional context
 * const panelLogger = logger.child({ panelId: 'panel-1' });
 * panelLogger.debug('Panel rendered');
 * ```
 *
 * Enable debug logging:
 * - All loggers: localStorage.setItem('grafana.debug', 'true')
 * - Specific loggers: localStorage.setItem('grafana.debug.loggers', 'DashboardService,PanelService')
 *
 * @param name - Logger name, typically the component or module name
 * @param baseContext - Optional base context to include in all log messages
 * @returns StructuredLogger instance
 */
export function createStructuredLogger(name: string, baseContext?: StructuredLogContext): StructuredLogger {
  let debugEnabled = isLoggerEnabled(name);
  const throttledLog = createThrottledLog();
  let monitoringLogger: MonitoringLogger | undefined;

  // Lazily initialize monitoring logger to avoid circular dependencies
  const getMonitoringLogger = (): MonitoringLogger => {
    if (!monitoringLogger) {
      monitoringLogger = createMonitoringLogger(name, toStringContext(baseContext));
    }
    return monitoringLogger;
  };

  const shouldLogToConsole = (): boolean => {
    return process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';
  };

  const logger: StructuredLogger = {
    debug: (message: string, context?: StructuredLogContext) => {
      if (!debugEnabled) {
        return;
      }

      const fullContext = { ...baseContext, ...context };
      const formattedMessage = formatMessage(name, message);

      if (shouldLogToConsole()) {
        throttledLog('log', formattedMessage, fullContext);
      }

      // Also send to monitoring if enabled (as debug level)
      getMonitoringLogger().logDebug(message, toStringContext(fullContext));
    },

    info: (message: string, context?: StructuredLogContext) => {
      const fullContext = { ...baseContext, ...context };
      const formattedMessage = formatMessage(name, message);

      if (shouldLogToConsole()) {
        // eslint-disable-next-line no-console
        console.info(formattedMessage, fullContext);
      }

      getMonitoringLogger().logInfo(message, toStringContext(fullContext));
    },

    warn: (message: string, context?: StructuredLogContext) => {
      const fullContext = { ...baseContext, ...context };
      const formattedMessage = formatMessage(name, message);

      if (shouldLogToConsole()) {
        // eslint-disable-next-line no-console
        console.warn(formattedMessage, fullContext);
      }

      getMonitoringLogger().logWarning(message, toStringContext(fullContext));
    },

    error: (message: string, context?: StructuredLogContext, error?: Error) => {
      const fullContext = { ...baseContext, ...context };
      const formattedMessage = formatMessage(name, message);

      if (shouldLogToConsole()) {
        if (error) {
          // eslint-disable-next-line no-console
          console.error(formattedMessage, fullContext, error);
        } else {
          // eslint-disable-next-line no-console
          console.error(formattedMessage, fullContext);
        }
      }

      const errorToLog = error ?? new Error(message);
      getMonitoringLogger().logError(errorToLog, toStringContext(fullContext));
    },

    enable: () => {
      debugEnabled = true;
    },

    disable: () => {
      debugEnabled = false;
    },

    isEnabled: () => debugEnabled,

    child: (childContext: StructuredLogContext): StructuredLogger => {
      return createStructuredLogger(name, { ...baseContext, ...childContext });
    },
  };

  return logger;
}

/**
 * Pre-configured loggers for common use cases.
 * Import these directly or create custom loggers with createStructuredLogger.
 */
export const dashboardLogger = createStructuredLogger('Dashboard');
export const dataSourceLogger = createStructuredLogger('DataSource');
export const pluginLogger = createStructuredLogger('Plugin');
export const queryLogger = createStructuredLogger('Query');
export const sceneLogger = createStructuredLogger('Scene');
