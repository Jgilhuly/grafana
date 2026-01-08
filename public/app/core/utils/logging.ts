import { createMonitoringLogger } from '@grafana/runtime';

/**
 * Structured logger for core utilities
 * Use this instead of console.log for better observability
 */
export const coreLogger = createMonitoringLogger('core', {
  module: 'Core',
});
