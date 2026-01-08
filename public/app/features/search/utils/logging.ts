import { createMonitoringLogger } from '@grafana/runtime';

/**
 * Structured logger for search features
 * Use this instead of console.log for better observability
 */
export const searchLogger = createMonitoringLogger('features.search', {
  module: 'Search',
});
