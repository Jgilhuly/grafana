import { throttle } from 'lodash';

type Args = Parameters<typeof console.debug>;

/**
 * @internal
 * */
const throttledLog = throttle((...t: Args) => {
  console.debug(...t);
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
      const fn = throttle ? throttledLog : console.debug;
      // Keep logs machine-parseable for easier debugging.
      fn({ source: name, id, args: t });
    },
    enable: () => (loggingEnabled = true),
    disable: () => (loggingEnabled = false),
    isEnabled: () => loggingEnabled,
  };
};
