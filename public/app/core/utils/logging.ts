import { createMonitoringLogger, MonitoringLogger } from '@grafana/runtime';

/**
 * Centralized logging utilities for Grafana frontend.
 * These loggers use the Faro web SDK to send structured logs
 * to the monitoring backend when enabled.
 *
 * Usage:
 * ```ts
 * import { dashboardLogger } from 'app/core/utils/logging';
 * dashboardLogger.logDebug('Loading dashboard', { uid: dashboard.uid });
 * ```
 */

// Dashboard feature loggers
export const dashboardLogger: MonitoringLogger = createMonitoringLogger('features.dashboard');
export const dashboardSceneLogger: MonitoringLogger = createMonitoringLogger('features.dashboard-scene');

// Explore feature logger
export const exploreLogger: MonitoringLogger = createMonitoringLogger('features.explore');

// Datasources feature logger
export const datasourcesLogger: MonitoringLogger = createMonitoringLogger('features.datasources');

// Core services logger
export const coreLogger: MonitoringLogger = createMonitoringLogger('core.services');

// Search feature logger
export const searchLogger: MonitoringLogger = createMonitoringLogger('features.search');

// Live/streaming feature logger
export const liveLogger: MonitoringLogger = createMonitoringLogger('features.live');

// Canvas feature logger
export const canvasLogger: MonitoringLogger = createMonitoringLogger('features.canvas');

// Plugins feature logger
export const pluginsLogger: MonitoringLogger = createMonitoringLogger('features.plugins');

// Auth/config feature logger
export const authLogger: MonitoringLogger = createMonitoringLogger('features.auth');

// Transformers feature logger
export const transformersLogger: MonitoringLogger = createMonitoringLogger('features.transformers');

// Panel feature logger
export const panelLogger: MonitoringLogger = createMonitoringLogger('features.panel');

// Query feature logger
export const queryLogger: MonitoringLogger = createMonitoringLogger('features.query');

// Variables feature logger
export const variablesLogger: MonitoringLogger = createMonitoringLogger('features.variables');

/**
 * Creates a feature-specific logger with additional context.
 * Use this when you need a more specific logger for a sub-feature.
 *
 * @param source - The source identifier for the logger
 * @param defaultContext - Optional default context to include in all logs
 */
export function createFeatureLogger(
  source: string,
  defaultContext?: Record<string, string>
): MonitoringLogger {
  return createMonitoringLogger(source, defaultContext);
}
