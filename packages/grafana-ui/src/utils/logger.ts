import { faro, LogContext, LogLevel } from '@grafana/faro-web-sdk';
import { throttle } from 'lodash';

type Args = Array<unknown>;

/**
 * @internal
 * */
const pushStructuredLog = (message: string, context: LogContext) => {
  if (faro?.api?.pushLog) {
    faro.api.pushLog([message], {
      level: LogLevel.DEBUG,
      context,
    });
    return;
  }

  console.info(JSON.stringify({ level: 'debug', message, context }));
};

const throttledLog = throttle((message: string, context: LogContext) => {
  pushStructuredLog(message, context);
}, 500);

/**
 * @internal
 */
export interface Logger {
  logger: (...t: Args) => void;
  enable: () => void;
  disable: () => void;
  isEnabled: () => boolean;
}

/** @internal */
export const createLogger = (name: string): Logger => {
  let loggingEnabled = false;

  if (typeof window !== 'undefined') {
    loggingEnabled = window.localStorage.getItem('grafana.debug') === 'true';
  }

  return {
    logger: (id: string, throttle = false, ...t: Args) => {
      if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test' || !loggingEnabled) {
        return;
      }
      const message = `[${name}: ${id}]`;
      const context = {
        source: `grafana-ui.${name}`,
        loggerId: id,
        args: t,
      };
      const fn = throttle ? throttledLog : pushStructuredLog;
      fn(message, context);
    },
    enable: () => (loggingEnabled = true),
    disable: () => (loggingEnabled = false),
    isEnabled: () => loggingEnabled,
  };
};
