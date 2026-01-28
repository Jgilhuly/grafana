const serializeArg = (arg) => {
  if (arg instanceof Error) {
    return { name: arg.name, message: arg.message, stack: arg.stack };
  }

  return arg;
};

const buildPayload = (level, args) => {
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

const writeLog = (level, args) => {
  const payload = buildPayload(level, args);
  const line = `${JSON.stringify(payload)}\n`;
  const stream = level === 'error' ? process.stderr : process.stdout;
  stream.write(line);
};

const logInfo = (...args) => writeLog('info', args);
const logWarning = (...args) => writeLog('warn', args);
const logError = (...args) => writeLog('error', args);
const logDebug = (...args) => writeLog('debug', args);

module.exports = {
  logInfo,
  logWarning,
  logError,
  logDebug,
};
