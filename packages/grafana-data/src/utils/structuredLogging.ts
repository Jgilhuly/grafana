export type StructuredLogArgs = unknown[];

export interface StructuredLogger {
  info: (...args: StructuredLogArgs) => void;
  warn: (...args: StructuredLogArgs) => void;
  error: (...args: StructuredLogArgs) => void;
  debug: (...args: StructuredLogArgs) => void;
}

const noop = () => {};

let activeLogger: StructuredLogger = {
  info: noop,
  warn: noop,
  error: noop,
  debug: noop,
};

export const setStructuredLogger = (logger: StructuredLogger) => {
  activeLogger = logger;
  if (typeof globalThis !== 'undefined') {
    (globalThis as { __grafanaStructuredLogger?: StructuredLogger }).__grafanaStructuredLogger = logger;
  }
};

export const getStructuredLogger = () => activeLogger;

export const logInfo = (...args: StructuredLogArgs) => activeLogger.info(...args);
export const logWarning = (...args: StructuredLogArgs) => activeLogger.warn(...args);
export const logError = (...args: StructuredLogArgs) => activeLogger.error(...args);
export const logDebug = (...args: StructuredLogArgs) => activeLogger.debug(...args);
