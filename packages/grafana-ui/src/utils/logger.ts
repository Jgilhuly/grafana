import { throttle } from 'lodash';

import { createStructuredLogger, type StructuredLogContext } from '@grafana/data/internal';

type Args = unknown[];

/**
 * @internal
 * */
/**
 * @internal
 */
export interface Logger {
  logger: (id: string, throttle?: boolean, ...t: Args) => void;
  enable: () => void;
  disable: () => void;
  isEnabled: () => boolean;
}

/** @internal */
export const createLogger = (name: string): Logger => {
  let loggingEnabled = false;
  const structuredLogger = createStructuredLogger(`grafana-ui.${name}`);
  const throttledLog = throttle((message: string, context?: StructuredLogContext) => {
    structuredLogger.logDebug(message, context);
  }, 500);

  if (typeof window !== 'undefined') {
    loggingEnabled = window.localStorage.getItem('grafana.debug') === 'true';
  }

  return {
    logger: (id: string, throttle = false, ...t: Args) => {
      if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test' || !loggingEnabled) {
        return;
      }
      const context = t.length > 0 ? { args: t } : undefined;
      const fn = throttle ? throttledLog : structuredLogger.logDebug;
      fn(`[${name}: ${id}]:`, context);
    },
    enable: () => (loggingEnabled = true),
    disable: () => (loggingEnabled = false),
    isEnabled: () => loggingEnabled,
  };
};
