import { DashboardLoadedEvent, getStructuredLogger, setStructuredLogger } from '@grafana/data';
import { reportInteraction } from '@grafana/runtime';

import { ElasticsearchDataQuery } from './dataquery.gen';
import pluginJson from './plugin.json';
import { onDashboardLoadedHandler } from './tracking';

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  reportInteraction: jest.fn(),
}));

const targets: ElasticsearchDataQuery[] = [
  {
    refId: 'test',
    alias: '$varAlias',
    bucketAggs: [],
    metrics: [],
    query: 'test',
  },
];

afterAll(() => {
  jest.clearAllMocks();
});

describe('onDashboardLoadedHandler', () => {
  const originalLogger = getStructuredLogger();
  const errorMock = jest.fn();
  beforeEach(() => {
    jest.mocked(reportInteraction).mockClear();
    setStructuredLogger({ ...originalLogger, error: errorMock });
  });
  afterEach(() => setStructuredLogger(originalLogger));
  test('Reports dashboard loaded interactions', () => {
    const event = new DashboardLoadedEvent({
      dashboardId: 'test',
      orgId: 1,
      userId: 2,
      grafanaVersion: '11',
      queries: {
        [pluginJson.id]: targets,
      },
    });
    onDashboardLoadedHandler(event);

    expect(reportInteraction).toHaveBeenCalled();
    expect(errorMock).not.toHaveBeenCalled();
  });

  test('Does not report or fails when the dashboard id has no queries', () => {
    const event = new DashboardLoadedEvent({
      dashboardId: 'test',
      orgId: 1,
      userId: 2,
      grafanaVersion: '11',
      queries: {
        'not elasticsearch': targets,
      },
    });
    onDashboardLoadedHandler(event);

    expect(reportInteraction).not.toHaveBeenCalled();
    expect(errorMock).not.toHaveBeenCalled();
  });
});
