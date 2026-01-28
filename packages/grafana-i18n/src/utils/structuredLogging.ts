type StructuredLogger = {
  info?: (...args: unknown[]) => void;
  warn?: (...args: unknown[]) => void;
  error?: (...args: unknown[]) => void;
  debug?: (...args: unknown[]) => void;
};

const getLogger = (): StructuredLogger | undefined => {
  if (typeof globalThis === 'undefined') {
    return undefined;
  }

  return (globalThis as { __grafanaStructuredLogger?: StructuredLogger }).__grafanaStructuredLogger;
};

export const logError = (...args: unknown[]) => {
  getLogger()?.error?.(...args);
};

export const logWarning = (...args: unknown[]) => {
  getLogger()?.warn?.(...args);
};
