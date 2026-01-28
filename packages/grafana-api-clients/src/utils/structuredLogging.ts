type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const serializeArg = (arg: unknown) => {
  if (arg instanceof Error) {
    return { name: arg.name, message: arg.message, stack: arg.stack };
  }

  return arg;
};

const buildPayload = (level: LogLevel, args: unknown[]) => {
  const [first, ...rest] = args;
  const message = typeof first === 'string' ? first : 'log';
  const extraArgs = typeof first === 'string' ? rest : args;

  return {
    level,
    message,
    args: extraArgs.map(serializeArg),
    timestamp: new Date().toISOString(),
  };
};

const writeLog = (level: LogLevel, args: unknown[]) => {
  const payload = buildPayload(level, args);
  const line = `${JSON.stringify(payload)}\n`;
  const stream = level === 'error' ? process.stderr : process.stdout;
  stream.write(line);
};

export const logInfo = (...args: unknown[]) => writeLog('info', args);
export const logWarning = (...args: unknown[]) => writeLog('warn', args);
export const logError = (...args: unknown[]) => writeLog('error', args);
export const logDebug = (...args: unknown[]) => writeLog('debug', args);
