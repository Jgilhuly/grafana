import { createMonitoringLogger } from '@grafana/runtime';

import { buildStructuredLogPayload, setStructuredConsoleHandler } from './structuredConsole';

export function initializeStructuredConsoleLogging(source = 'console'): void {
  const logger = createMonitoringLogger(source);

  setStructuredConsoleHandler((entry) => {
    const payload = buildStructuredLogPayload(entry);

    switch (payload.level) {
      case 'error': {
        logger.logError(payload.error ?? new Error(payload.message), payload.context);
        break;
      }
      case 'warn': {
        logger.logWarning(payload.message, payload.context);
        break;
      }
      case 'debug': {
        logger.logDebug(payload.message, payload.context);
        break;
      }
      default: {
        logger.logInfo(payload.message, payload.context);
      }
    }
  });
}
