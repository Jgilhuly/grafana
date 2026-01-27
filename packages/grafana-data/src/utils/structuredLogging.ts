export type StructuredLogLevel = 'debug' | 'info' | 'warn' | 'error';

export type StructuredLogContext = Record<string, unknown>;

export interface StructuredLogger {
  logDebug: (message: string, context?: StructuredLogContext) => void;
  logInfo: (message: string, context?: StructuredLogContext) => void;
  logWarning: (message: string, context?: StructuredLogContext) => void;
  logError: (error: unknown, context?: StructuredLogContext) => void;
}

export type StructuredLoggerFactory = (source: string, defaultContext?: StructuredLogContext) => StructuredLogger;

type StructuredLogPayload = {
  level: StructuredLogLevel;
  source: string;
  message: string;
  timestamp: string;
  context?: StructuredLogContext;
};

const noopLogger: StructuredLogger = {
  logDebug: () => {},
  logInfo: () => {},
  logWarning: () => {},
  logError: () => {},
};

const getGlobalStructuredLoggerFactory = (): StructuredLoggerFactory | undefined => {
  return (globalThis as typeof globalThis & { __grafanaStructuredLogger__?: StructuredLoggerFactory })
    .__grafanaStructuredLogger__;
};

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

const emitStructuredLog = (payload: StructuredLogPayload) => {
  const serialized = JSON.stringify(payload);

  if (typeof process !== 'undefined' && process.stdout?.write) {
    const stream = payload.level === 'error' ? process.stderr : process.stdout;
    stream.write(`${serialized}\n`);
    return;
  }

  if (typeof console === 'undefined') {
    return;
  }

  const method =
    payload.level === 'error'
      ? console.error
      : payload.level === 'warn'
        ? console.warn
        : payload.level === 'debug'
          ? console.debug
          : console.info;
  method?.call(console, serialized);
};

const buildContext = (defaultContext?: StructuredLogContext, context?: StructuredLogContext) => {
  if (!defaultContext && !context) {
    return undefined;
  }

  return {
    ...defaultContext,
    ...context,
  };
};

const createFallbackLogger = (source: string, defaultContext?: StructuredLogContext): StructuredLogger => {
  const log = (level: StructuredLogLevel, message: string, context?: StructuredLogContext) => {
    emitStructuredLog({
      level,
      source,
      message,
      timestamp: new Date().toISOString(),
      context: buildContext(defaultContext, context),
    });
  };

  return {
    logDebug: (message, context) => log('debug', message, context),
    logInfo: (message, context) => log('info', message, context),
    logWarning: (message, context) => log('warn', message, context),
    logError: (error, context) => {
      const normalizedError = toError(error);
      log('error', normalizedError.message, {
        errorName: normalizedError.name,
        errorStack: normalizedError.stack,
        ...context,
      });
    },
  };
};

export const createStructuredLogger = (source: string, defaultContext?: StructuredLogContext): StructuredLogger => {
  const fallbackLogger = createFallbackLogger(source, defaultContext);

  const resolveLogger = () => {
    const factory = getGlobalStructuredLoggerFactory();
    if (!factory) {
      return fallbackLogger;
    }

    return factory(source, defaultContext) ?? fallbackLogger;
  };

  return {
    logDebug: (message, context) => resolveLogger().logDebug(message, context),
    logInfo: (message, context) => resolveLogger().logInfo(message, context),
    logWarning: (message, context) => resolveLogger().logWarning(message, context),
    logError: (error, context) => resolveLogger().logError(toError(error), context),
  };
};
