type ConsoleMethod =
  | 'log'
  | 'info'
  | 'warn'
  | 'error'
  | 'debug'
  | 'trace'
  | 'group'
  | 'groupCollapsed'
  | 'groupEnd';

export interface StructuredConsoleEntry {
  method: ConsoleMethod;
  args: unknown[];
  timestamp: number;
}

export type StructuredLogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface StructuredLogPayload {
  level: StructuredLogLevel;
  message: string;
  context: Record<string, unknown>;
  error?: Error;
}

const logLevelByMethod: Record<ConsoleMethod, StructuredLogLevel> = {
  log: 'info',
  info: 'info',
  warn: 'warn',
  error: 'error',
  debug: 'debug',
  trace: 'debug',
  group: 'debug',
  groupCollapsed: 'debug',
  groupEnd: 'debug',
};

let isInstalled = false;
let consoleHandler: ((entry: StructuredConsoleEntry) => void) | undefined;
const pendingEntries: StructuredConsoleEntry[] = [];

export function installStructuredConsole(): void {
  if (isInstalled || typeof globalThis === 'undefined') {
    return;
  }

  const baseConsole = globalThis.console;
  if (!baseConsole) {
    return;
  }

  const structuredConsole = Object.create(baseConsole) as Console;
  const methods: ConsoleMethod[] = [
    'log',
    'info',
    'warn',
    'error',
    'debug',
    'trace',
    'group',
    'groupCollapsed',
    'groupEnd',
  ];

  for (const method of methods) {
    structuredConsole[method] = (...args: unknown[]) => {
      handleConsoleEntry({ method, args, timestamp: Date.now() });
      baseConsole[method](...args);
    };
  }

  globalThis.console = structuredConsole;
  isInstalled = true;
}

export function setStructuredConsoleHandler(handler: (entry: StructuredConsoleEntry) => void): void {
  consoleHandler = handler;

  if (pendingEntries.length > 0) {
    const entries = pendingEntries.splice(0, pendingEntries.length);
    for (const entry of entries) {
      consoleHandler(entry);
    }
  }
}

export function buildStructuredLogPayload(entry: StructuredConsoleEntry): StructuredLogPayload {
  const message = getMessage(entry.method, entry.args);
  const normalizedArgs = entry.args.map(normalizeArg);
  const contextArgs = typeof entry.args[0] === 'string' ? normalizedArgs.slice(1) : normalizedArgs;
  const groupAction = getGroupAction(entry.method);

  const context: Record<string, unknown> = {
    console: {
      method: entry.method,
      args: contextArgs,
      timestamp: entry.timestamp,
      ...(groupAction ? { groupAction } : {}),
    },
  };

  if (entry.method === 'trace') {
    context.console = {
      ...(context.console as Record<string, unknown>),
      stack: new Error().stack,
    };
  }

  return {
    level: logLevelByMethod[entry.method],
    message,
    context,
    error: entry.method === 'error' ? findError(entry.args) ?? new Error(message) : undefined,
  };
}

function handleConsoleEntry(entry: StructuredConsoleEntry): void {
  if (consoleHandler) {
    consoleHandler(entry);
    return;
  }

  pendingEntries.push(entry);
}

function getMessage(method: ConsoleMethod, args: unknown[]): string {
  if (typeof args[0] === 'string') {
    return args[0];
  }

  const error = findError(args);
  if (error) {
    return error.message;
  }

  return `console.${method}`;
}

function getGroupAction(method: ConsoleMethod): string | undefined {
  switch (method) {
    case 'group':
      return 'start';
    case 'groupCollapsed':
      return 'startCollapsed';
    case 'groupEnd':
      return 'end';
    default:
      return undefined;
  }
}

function findError(args: unknown[]): Error | undefined {
  return args.find((arg): arg is Error => arg instanceof Error);
}

function normalizeArg(arg: unknown): unknown {
  if (arg instanceof Error) {
    return {
      name: arg.name,
      message: arg.message,
      stack: arg.stack,
    };
  }

  if (typeof arg === 'bigint') {
    return arg.toString();
  }

  if (typeof arg === 'function') {
    return arg.name ? `[function ${arg.name}]` : '[function]';
  }

  if (typeof arg === 'symbol') {
    return arg.toString();
  }

  if (typeof arg === 'object' && arg !== null) {
    return safeSerialize(arg);
  }

  return arg;
}

function safeSerialize(value: unknown): unknown {
  try {
    return JSON.parse(
      JSON.stringify(value, (_key, nestedValue) => {
        if (typeof nestedValue === 'bigint') {
          return nestedValue.toString();
        }

        if (typeof nestedValue === 'function') {
          return nestedValue.name ? `[function ${nestedValue.name}]` : '[function]';
        }

        if (typeof nestedValue === 'symbol') {
          return nestedValue.toString();
        }

        return nestedValue;
      })
    );
  } catch {
    return String(value);
  }
}
