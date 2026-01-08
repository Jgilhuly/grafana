import { createMonitoringLogger } from '@grafana/runtime';

/**
 * Structured logger for canvas features
 * Use this instead of console.log for better observability
 */
export const canvasLogger = createMonitoringLogger('features.canvas', {
  module: 'Canvas',
});
