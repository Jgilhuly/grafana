'use strict';

const DEFAULT_CONTEXT = {
  env: process.env.NODE_ENV || 'unknown',
};

const writeLog = (level, message, context = {}) => {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context: {
      ...DEFAULT_CONTEXT,
      ...context,
    },
  };

  const stream = level === 'error' ? process.stderr : process.stdout;
  stream.write(`${JSON.stringify(entry)}\n`);
};

const createStructuredLogger = (source) => ({
  debug: (message, context = {}) => writeLog('debug', message, { source, ...context }),
  info: (message, context = {}) => writeLog('info', message, { source, ...context }),
  warn: (message, context = {}) => writeLog('warn', message, { source, ...context }),
  error: (message, context = {}) => writeLog('error', message, { source, ...context }),
});

module.exports = { createStructuredLogger };
