/* eslint-disable no-console */
import {
  EchoBackend,
  EchoEventType,
  isExperimentViewEvent,
  isInteractionEvent,
  isPageviewEvent,
  PageviewEchoEvent,
} from '@grafana/runtime';

const logStructured = (level: 'info' | 'warn', message: string, context: Record<string, unknown>) => {
  const payload = { level, message, context };
  if (level === 'warn') {
    console.warn(JSON.stringify(payload));
  } else {
    console.info(JSON.stringify(payload));
  }
};

export class BrowserConsoleBackend implements EchoBackend<PageviewEchoEvent, unknown> {
  options = {};
  supportedEvents = [EchoEventType.Pageview, EchoEventType.Interaction, EchoEventType.ExperimentView];

  constructor() {}

  addEvent = (e: PageviewEchoEvent) => {
    if (isPageviewEvent(e)) {
      logStructured('info', 'Echo pageview', { page: e.payload.page });
    }

    if (isInteractionEvent(e)) {
      const eventName = e.payload.interactionName;
      logStructured('info', 'Echo interaction', { eventName, properties: e.payload.properties });

      // Warn for non-scalar property values. We're not yet making this a hard a
      const invalidTypeProperties = Object.entries(e.payload.properties ?? {}).filter(([_, value]) => {
        const valueType = typeof value;
        const isValidType =
          valueType === 'string' || valueType === 'number' || valueType === 'boolean' || valueType === 'undefined';
        return !isValidType;
      });

      if (invalidTypeProperties.length > 0) {
        logStructured('warn', 'Echo event has invalid property types', {
          eventName,
          invalidProperties: Object.fromEntries(invalidTypeProperties),
        });
      }
    }

    if (isExperimentViewEvent(e)) {
      logStructured('info', 'Echo experiment', { payload: e.payload });
    }
  };

  flush = () => {};
}
