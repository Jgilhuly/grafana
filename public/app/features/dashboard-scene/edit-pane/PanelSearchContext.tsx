import React, { createContext, useContext, useMemo } from 'react';

import { VizPanel } from '@grafana/scenes';

import { DashboardEditPane } from './DashboardEditPane';

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
      if (!query) {
        return false;
      }
      const lowerQuery = query.toLowerCase();
      const title = panel.state.title?.toLowerCase() ?? '';
      const type = panel.state.pluginId?.toLowerCase() ?? '';
      
      return title.includes(lowerQuery) || type.includes(lowerQuery);
    };

    return {
      searchQuery: query,
      isMatch,
    };
  }, [panelSearchQuery]);

  return <PanelSearchContext.Provider value={contextValue}>{children}</PanelSearchContext.Provider>;
}
