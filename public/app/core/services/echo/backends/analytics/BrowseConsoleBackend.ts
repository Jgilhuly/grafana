import {
  EchoBackend,
  EchoEventType,
  isExperimentViewEvent,
  isInteractionEvent,
  isPageviewEvent,
  PageviewEchoEvent,
} from '@grafana/runtime';
import { logInfo, logWarning } from '@grafana/data';

export class BrowserConsoleBackend implements EchoBackend<PageviewEchoEvent, unknown> {
  options = {};
  supportedEvents = [EchoEventType.Pageview, EchoEventType.Interaction, EchoEventType.ExperimentView];

  constructor() {}

  addEvent = (e: PageviewEchoEvent) => {
    if (isPageviewEvent(e)) {
      logInfo('[EchoSrv:pageview]', e.payload.page);
    }

    if (isInteractionEvent(e)) {
      const eventName = e.payload.interactionName;
      logInfo('[EchoSrv:event]', eventName, e.payload.properties);

      // Warn for non-scalar property values. We're not yet making this a hard a
      const invalidTypeProperties = Object.entries(e.payload.properties ?? {}).filter(([_, value]) => {
        const valueType = typeof value;
        const isValidType =
          valueType === 'string' || valueType === 'number' || valueType === 'boolean' || valueType === 'undefined';
        return !isValidType;
      });

      if (invalidTypeProperties.length > 0) {
        logWarning(
          'Event',
          eventName,
          'has invalid property types. Event properties should only be string, number or boolean. Invalid properties:',
          Object.fromEntries(invalidTypeProperties)
        );
      }
    }

    if (isExperimentViewEvent(e)) {
      logInfo('[EchoSrv:experiment]', e.payload);
    }
  };

  flush = () => {};
}
