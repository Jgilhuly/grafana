import { createMonitoringLogger } from '@grafana/runtime';

/**
 * Structured logger for auth-config features
 * Use this instead of console.log for better observability
 */
export const authConfigLogger = createMonitoringLogger('features.auth-config', {
  module: 'AuthConfig',
});
