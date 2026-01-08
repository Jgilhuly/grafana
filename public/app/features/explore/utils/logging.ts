import { createMonitoringLogger } from '@grafana/runtime';

/**
 * Structured logger for explore features
 * Use this instead of console.log for better observability
 */
export const exploreLogger = createMonitoringLogger('features.explore', {
  module: 'Explore',
});
