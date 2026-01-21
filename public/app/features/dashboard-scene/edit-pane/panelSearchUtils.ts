import { VizPanel } from '@grafana/scenes';

/**
 * Checks if a panel matches the given search query.
 * Searches in panel title and plugin type.
 * 
 * @param panel - The VizPanel to check
 * @param query - The search query string
 * @returns true if the panel matches the query, false otherwise
 */
export function panelMatchesSearch(panel: VizPanel, query: string): boolean {
  if (!query) {
    return true;
  }
  const lowerQuery = query.toLowerCase();
  const title = panel.state.title?.toLowerCase() ?? '';
  const type = panel.state.pluginId?.toLowerCase() ?? '';
  
  return title.includes(lowerQuery) || type.includes(lowerQuery);
}
