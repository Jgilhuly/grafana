import { createMonitoringLogger } from '@grafana/runtime';

/**
 * Structured logger for live features
 * Use this instead of console.log for better observability
 */
export const liveLogger = createMonitoringLogger('features.live', {
  module: 'Live',
});
