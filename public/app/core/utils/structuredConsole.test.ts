import { buildStructuredLogPayload, StructuredConsoleEntry } from './structuredConsole';

describe('buildStructuredLogPayload', () => {
  it('maps console.log to info with structured args', () => {
    const entry: StructuredConsoleEntry = {
      method: 'log',
      args: ['hello', { feature: 'logs' }],
      timestamp: 123,
    };

    const payload = buildStructuredLogPayload(entry);

    expect(payload.level).toBe('info');
    expect(payload.message).toBe('hello');
    expect(payload.context).toEqual({
      console: {
        method: 'log',
        args: [{ feature: 'logs' }],
        timestamp: 123,
      },
    });
  });

  it('maps console.error with Error to error level', () => {
    const error = new Error('boom');
    const entry: StructuredConsoleEntry = {
      method: 'error',
      args: [error, { requestId: 'abc' }],
      timestamp: 456,
    };

    const payload = buildStructuredLogPayload(entry);

    expect(payload.level).toBe('error');
    expect(payload.message).toBe('boom');
    expect(payload.error).toBe(error);
    expect(payload.context).toEqual({
      console: {
        method: 'error',
        args: [
          expect.objectContaining({
            name: 'Error',
            message: 'boom',
          }),
          { requestId: 'abc' },
        ],
        timestamp: 456,
      },
    });
  });

  it('maps console.groupCollapsed to debug with group metadata', () => {
    const entry: StructuredConsoleEntry = {
      method: 'groupCollapsed',
      args: ['Group'],
      timestamp: 789,
    };

    const payload = buildStructuredLogPayload(entry);

    expect(payload.level).toBe('debug');
    expect(payload.message).toBe('Group');
    expect(payload.context).toEqual({
      console: {
        method: 'groupCollapsed',
        args: [],
        timestamp: 789,
        groupAction: 'startCollapsed',
      },
    });
  });
});
