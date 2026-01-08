import { createMonitoringLogger } from '@grafana/runtime';

/**
 * Structured logger for dashboard-scene features
 * Use this instead of console.log for better observability
 */
export const dashboardSceneLogger = createMonitoringLogger('features.dashboard-scene', {
  module: 'DashboardScene',
});
