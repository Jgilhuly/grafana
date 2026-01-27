import { createMonitoringLogger } from '@grafana/runtime';
import { StructuredLogContext, StructuredLogger, StructuredLoggerFactory } from '@grafana/data/internal';

const toError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'string') {
    return new Error(error);
  }

  try {
    return new Error(JSON.stringify(error));
  } catch {
    return new Error(String(error));
  }
};

export const registerStructuredLogger = () => {
  const factory: StructuredLoggerFactory = (source: string, defaultContext?: StructuredLogContext): StructuredLogger => {
    const monitoringLogger = createMonitoringLogger(source, defaultContext);

    return {
      logDebug: (message, context) => monitoringLogger.logDebug(message, context),
      logInfo: (message, context) => monitoringLogger.logInfo(message, context),
      logWarning: (message, context) => monitoringLogger.logWarning(message, context),
      logError: (error, context) => monitoringLogger.logError(toError(error), context),
    };
  };

  (globalThis as typeof globalThis & { __grafanaStructuredLogger__?: StructuredLoggerFactory }).__grafanaStructuredLogger__ =
    factory;
};
