import React, { createContext, useContext, useMemo } from 'react';

import { VizPanel } from '@grafana/scenes';

import { DashboardEditPane } from './DashboardEditPane';
import { panelMatchesSearch } from './panelSearchUtils';

export interface PanelSearchContextValue {
  searchQuery: string;
  isMatch: (panel: VizPanel) => boolean;
}

export const PanelSearchContext = createContext<PanelSearchContextValue | null>(null);

export function usePanelSearchContext() {
  return useContext(PanelSearchContext);
}

export function PanelSearchContextProvider({
  children,
  editPane,
}: {
  children: React.ReactNode;
  editPane: DashboardEditPane;
}) {
  const { panelSearchQuery } = editPane.useState();

  const contextValue = useMemo<PanelSearchContextValue>(() => {
    const query = panelSearchQuery ?? '';

    const isMatch = (panel: VizPanel): boolean => {
      return panelMatchesSearch(panel, query);
    };

    return {
      searchQuery: query,
      isMatch,
    };
  }, [panelSearchQuery]);

  return <PanelSearchContext.Provider value={contextValue}>{children}</PanelSearchContext.Provider>;
}
