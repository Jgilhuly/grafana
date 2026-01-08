import { createMonitoringLogger } from '@grafana/runtime';

/**
 * Structured logger for plugin features
 * Use this instead of console.log for better observability
 */
export const pluginLogger = createMonitoringLogger('plugins', {
  module: 'Plugins',
});
