/**
 * Centralized logging utilities for the Grafana frontend application.
 *
 * This module provides structured logging with:
 * - Consistent log formatting with timestamps
 * - Log levels (debug, info, warn, error)
 * - Contextual information for each log message
 * - Integration with Grafana's monitoring infrastructure
 *
 * Usage:
 * ```typescript
 * import { appLogger, createFeatureLogger } from 'app/core/utils/logging';
 *
 * // Use the global app logger
 * appLogger.info('Application started');
 *
 * // Create a feature-specific logger
 * const logger = createFeatureLogger('Dashboard');
 * logger.debug('Loading dashboard', { dashboardUid: 'abc123' });
 * logger.error('Failed to save', error, { dashboardUid: 'abc123' });
 * ```
 *
 * Configuration via localStorage:
 * - Set `grafana.debug` to 'true' to enable debug logging
 * - Set `grafana.debug.level` to 0-4 to set minimum log level:
 *   - 0 = Debug, 1 = Info, 2 = Warn, 3 = Error, 4 = None
 */

import {
  createLogger,
  createThrottledLogger,
  type LogContext,
  type StructuredLogger,
} from '@grafana/ui';

// Note: For LogLevel enum and LogContext/StructuredLogger types, import directly from '@grafana/ui'

/**
 * Global application logger for core Grafana functionality.
 * Use this for app-wide logging that doesn't belong to a specific feature.
 */
export const appLogger = createLogger('Grafana');

/**
 * Creates a logger for a specific feature/module of Grafana.
 *
 * @param featureName - The name of the feature (e.g., 'Dashboard', 'Alerting', 'Explore')
 * @param baseContext - Optional context to include in all log messages
 * @returns A structured logger instance
 *
 * @example
 * ```typescript
 * const logger = createFeatureLogger('Alerting');
 * logger.info('Rule evaluated', { ruleId: '123', result: 'firing' });
 * ```
 */
export function createFeatureLogger(featureName: string, baseContext?: LogContext): StructuredLogger {
  return createLogger(featureName, baseContext);
}

/**
 * Creates a throttled logger for high-frequency logging scenarios.
 * Useful in performance-critical paths like render loops or event handlers.
 *
 * @param featureName - The name of the feature
 * @param throttleMs - Throttle interval in milliseconds (default: 500)
 * @param baseContext - Optional context to include in all log messages
 * @returns A throttled structured logger instance
 *
 * @example
 * ```typescript
 * const logger = createFeatureThrottledLogger('Canvas', 100);
 * // This will only log at most once every 100ms
 * logger.debug('Mouse moved', { x: 100, y: 200 });
 * ```
 */
export function createFeatureThrottledLogger(
  featureName: string,
  throttleMs = 500,
  baseContext?: LogContext
): StructuredLogger {
  return createThrottledLogger(featureName, throttleMs, baseContext);
}

/**
 * Pre-configured loggers for common Grafana features.
 * Import and use these directly for consistent logging across the codebase.
 */
export const loggers = {
  /** Logger for dashboard-related operations */
  dashboard: createLogger('Dashboard'),

  /** Logger for alerting-related operations */
  alerting: createLogger('Alerting'),

  /** Logger for explore-related operations */
  explore: createLogger('Explore'),

  /** Logger for plugin-related operations */
  plugins: createLogger('Plugins'),

  /** Logger for data source operations */
  datasources: createLogger('DataSources'),

  /** Logger for authentication and authorization */
  auth: createLogger('Auth'),

  /** Logger for API and network operations */
  api: createLogger('API'),

  /** Logger for scene-related operations */
  scenes: createLogger('Scenes'),

  /** Logger for live/streaming operations */
  live: createLogger('Live'),

  /** Logger for performance monitoring */
  performance: createLogger('Performance'),
};

/**
 * Helper function to safely log errors with proper error extraction.
 * Handles cases where the error might not be an Error instance.
 *
 * @param logger - The logger to use
 * @param message - The error message
 * @param error - The error object (can be unknown)
 * @param context - Additional context
 */
export function logError(
  logger: StructuredLogger,
  message: string,
  error: unknown,
  context?: LogContext
): void {
  if (error instanceof Error) {
    logger.error(message, error, context);
  } else {
    logger.error(message, new Error(String(error)), { ...context, originalError: String(error) });
  }
}

/**
 * Wraps a synchronous function with logging of its execution.
 * Logs when the function starts, completes, and if it throws an error.
 *
 * @param logger - The logger to use
 * @param name - Name of the operation for logging
 * @param fn - The function to wrap
 * @returns The wrapped function
 *
 * @example
 * ```typescript
 * const processData = withLogging(logger, 'processData', (data) => {
 *   // process logic
 *   return result;
 * });
 * ```
 */
export function withLogging<TArgs extends unknown[], TReturn>(
  logger: StructuredLogger,
  name: string,
  fn: (...args: TArgs) => TReturn
): (...args: TArgs) => TReturn {
  return (...args: TArgs): TReturn => {
    logger.debug(`${name} started`);
    try {
      const result = fn(...args);
      logger.debug(`${name} completed`);
      return result;
    } catch (error) {
      logger.error(`${name} failed`, error);
      throw error;
    }
  };
}

/**
 * Wraps an async function with logging of its execution.
 * Logs when the function starts, completes, and if it throws an error.
 *
 * @param logger - The logger to use
 * @param name - Name of the operation for logging
 * @param fn - The async function to wrap
 * @returns The wrapped async function
 *
 * @example
 * ```typescript
 * const saveDashboard = withAsyncLogging(logger, 'saveDashboard', async (dashboard) => {
 *   // save logic
 *   return result;
 * });
 * ```
 */
export function withAsyncLogging<TArgs extends unknown[], TReturn>(
  logger: StructuredLogger,
  name: string,
  fn: (...args: TArgs) => Promise<TReturn>
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    logger.debug(`${name} started`);
    try {
      const result = await fn(...args);
      logger.debug(`${name} completed`);
      return result;
    } catch (error) {
      logger.error(`${name} failed`, error);
      throw error;
    }
  };
}
