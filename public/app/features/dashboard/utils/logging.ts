import { createMonitoringLogger } from '@grafana/runtime';

/**
 * Structured logger for dashboard features
 * Use this instead of console.log for better observability
 */
export const dashboardLogger = createMonitoringLogger('features.dashboard', {
  module: 'Dashboard',
});
