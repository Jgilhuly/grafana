import { createMonitoringLogger } from '@grafana/runtime';
import { createLogger } from '@grafana/ui';

type LogContext = Record<string, unknown>;

export interface StructuredLogger {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (error: Error, context?: LogContext) => void;
}

/**
 * Creates a logger that:
 * - writes structured logs to the monitoring pipeline (Faro) when enabled
 * - optionally mirrors logs to the browser console in development when `grafana.debug=true`
 */
export function createStructuredLogger(source: string): StructuredLogger {
  const monitoring = createMonitoringLogger(source);
  const debugLogger = createLogger(source);

  const mirrorToConsole = (level: 'debug' | 'info' | 'warn' | 'error', messageOrError: unknown, context?: LogContext) => {
    // `createLogger` already gates output based on env and `grafana.debug`.
    debugLogger.logger(level, false, messageOrError, context);
  };

  return {
    debug: (message: string, context?: LogContext) => {
      monitoring.logDebug(message, context);
      mirrorToConsole('debug', message, context);
    },
    info: (message: string, context?: LogContext) => {
      monitoring.logInfo(message, context);
      mirrorToConsole('info', message, context);
    },
    warn: (message: string, context?: LogContext) => {
      monitoring.logWarning(message, context);
      mirrorToConsole('warn', message, context);
    },
    error: (error: Error, context?: LogContext) => {
      monitoring.logError(error, context);
      mirrorToConsole('error', error, context);
    },
  };
}

