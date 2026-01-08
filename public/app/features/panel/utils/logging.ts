import { createMonitoringLogger } from '@grafana/runtime';

/**
 * Structured logger for panel features
 * Use this instead of console.log for better observability
 */
export const panelLogger = createMonitoringLogger('features.panel', {
  module: 'Panel',
});
