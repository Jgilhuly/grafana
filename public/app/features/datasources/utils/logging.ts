import { createMonitoringLogger } from '@grafana/runtime';

/**
 * Structured logger for datasources features
 * Use this instead of console.log for better observability
 */
export const datasourcesLogger = createMonitoringLogger('features.datasources', {
  module: 'Datasources',
});
