import memoizeOne from 'memoize-one';
import { useEffect, useState } from 'react';

import { Spec as DashboardV2Spec } from '@grafana/schema/dist/esm/schema/dashboard/v2';
import { getDashboardAPI } from 'app/features/dashboard/api/dashboard_api';
import { DashboardWithAccessInfo } from 'app/features/dashboard/api/types';
import { isDashboardV2Resource } from 'app/features/dashboard/api/utils';
import { DashboardDTO } from 'app/types/dashboard';

import { DashboardModel } from '../../../../dashboard/state/DashboardModel';
import { logError } from '../../Analytics';

export type DashboardResponse = DashboardDTO | DashboardWithAccessInfo<DashboardV2Spec>;

const ensureV1PanelsHaveIds = memoizeOne((dashboardDTO: DashboardDTO): DashboardResponse => {
  // RTKQuery freezes all returned objects. DashboardModel constructor runs migrations which might change the internal object
  // Hence we need to add structuredClone to make a deep copy of the API response object
  const dashboardDTOClone = structuredClone(dashboardDTO);
  const model = new DashboardModel(dashboardDTOClone.dashboard, dashboardDTOClone.meta);

  dashboardDTOClone.dashboard.panels = model.panels;

  return dashboardDTOClone;
});

export function useDashboardQuery(dashboardUid?: string) {
  const [dashboard, setDashboard] = useState<DashboardResponse>();
  const [isFetching, setIsFetching] = useState(false);
  useEffect(() => {
    if (!dashboardUid) {
      return;
    }

    setIsFetching(true);
    getDashboardAPI()
      .getDashboardDTO(dashboardUid)
      .then((dashboardDTO) => {
        if ('dashboard' in dashboardDTO) {
          setDashboard(ensureV1PanelsHaveIds(dashboardDTO));
          return;
        }

        if (isDashboardV2Resource(dashboardDTO)) {
          setDashboard(dashboardDTO);
          return;
        }

        logError(new Error('Unexpected dashboard format'), {
          dashboardUid,
          keys: Object.keys(dashboardDTO as Record<string, unknown>).join(','),
        });
      })
      .catch((error) => {
        logError(error instanceof Error ? error : new Error('Failed to load dashboard', { cause: error }), {
          dashboardUid,
        });
      })
      .finally(() => {
        setIsFetching(false);
      });
  }, [dashboardUid]);

  return { dashboard, isFetching };
}
