import { css } from '@emotion/css';
import { RefObject, useMemo } from 'react';

import { config } from '@grafana/runtime';
import { LazyLoader, SceneComponentProps, VizPanel } from '@grafana/scenes';
import { css, cx } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { GRID_CELL_HEIGHT, GRID_CELL_VMARGIN } from 'app/core/constants';

import { useDashboardState } from '../../utils/utils';
import { SoloPanelContextValueWithSearchStringFilter } from '../PanelSearchLayout';
import { renderMatchingSoloPanels, useSoloPanelContext } from '../SoloPanelContext';
import { getIsLazy } from '../layouts-shared/utils';
import { usePanelSearchContext } from '../../edit-pane/PanelSearchContext';

import { DashboardGridItem, RepeatDirection } from './DashboardGridItem';

interface PanelWrapperProps {
  panel: VizPanel;
  isLazy: boolean;
  containerRef?: RefObject<HTMLDivElement>;
}

function PanelWrapper({ panel, isLazy, containerRef }: PanelWrapperProps) {
  const searchContext = usePanelSearchContext();
  const styles = useStyles2(getPanelStyles);
  const isMatch = searchContext?.isMatch(panel) ?? false;
  const hasSearchQuery = Boolean(searchContext?.searchQuery);

  const wrapperClassName = cx(panelWrapper, {
    [styles.panelMatch]: isMatch && hasSearchQuery,
    [styles.panelNoMatch]: !isMatch && hasSearchQuery,
  });

  if (isLazy) {
    return (
      <LazyLoader key={panel.state.key!} ref={containerRef} className={wrapperClassName}>
        <panel.Component model={panel} />
      </LazyLoader>
    );
  }
  return (
    <div className={wrapperClassName} ref={containerRef}>
      <panel.Component model={panel} />
    </div>
  );
}

export function DashboardGridItemRenderer({ model }: SceneComponentProps<DashboardGridItem>) {
  const { repeatedPanels = [], itemHeight, variableName, body } = model.useState();
  const soloPanelContext = useSoloPanelContext();
  const { preload } = useDashboardState(model);
  const isLazy = useMemo(() => getIsLazy(preload), [preload]);
  const layoutStyle = useLayoutStyle(
    model.getRepeatDirection(),
    model.getChildCount(),
    model.getMaxPerRow(),
    itemHeight ?? 10
  );

  if (soloPanelContext) {
    // Use lazy loading only for panel search layout (SoloPanelContextValueWithSearchStringFilter)
    // as it renders multiple panels in a grid. Skip lazy loading for viewPanel URL param
    // (SoloPanelContextWithPathIdFilter) since single panels should render immediately.
    const useLazyForSoloPanel = isLazy && soloPanelContext instanceof SoloPanelContextValueWithSearchStringFilter;
    return renderMatchingSoloPanels(soloPanelContext, [body, ...repeatedPanels], useLazyForSoloPanel);
  }

  if (!variableName) {
    return <PanelWrapper panel={body} isLazy={isLazy} containerRef={model.containerRef} />;
  }

  return (
    <div className={layoutStyle} ref={model.containerRef}>
      <PanelWrapper panel={body} isLazy={isLazy} />
      {repeatedPanels.map((panel) => (
        <PanelWrapper key={panel.state.key!} panel={panel} isLazy={isLazy} />
      ))}
    </div>
  );
}

function useLayoutStyle(direction: RepeatDirection, itemCount: number, maxPerRow: number, itemHeight: number) {
  return useMemo(() => {
    const theme = config.theme2;

    // In mobile responsive layout we have to calculate the absolute height
    const mobileHeight = itemHeight * GRID_CELL_HEIGHT * itemCount + (itemCount - 1) * GRID_CELL_VMARGIN;

    if (direction === 'h') {
      const rowCount = Math.ceil(itemCount / maxPerRow);
      const columnCount = Math.min(itemCount, maxPerRow);

      return css({
        display: 'grid',
        height: '100%',
        width: '100%',
        gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
        gridTemplateRows: `repeat(${rowCount}, 1fr)`,
        gridColumnGap: theme.spacing(1),
        gridRowGap: theme.spacing(1),

        [theme.breakpoints.down('md')]: {
          display: 'flex',
          flexDirection: 'column',
          height: mobileHeight,
        },
      });
    }

    // Vertical is a bit simpler
    return css({
      display: 'flex',
      height: '100%',
      width: '100%',
      flexDirection: 'column',
      gap: theme.spacing(1),
      [theme.breakpoints.down('md')]: {
        height: mobileHeight,
      },
    });
  }, [direction, itemCount, maxPerRow, itemHeight]);
}

const panelWrapper = css({
  display: 'flex',
  flexGrow: 1,
  position: 'relative',
  width: '100%',
  height: '100%',
});

function getPanelStyles(theme: GrafanaTheme2) {
  return {
    panelMatch: css({
      outline: `2px solid ${theme.colors.success.border}`,
      outlineOffset: '2px',
      borderRadius: theme.shape.radius.default,
      transition: 'outline 0.2s ease-in-out',
    }),
    panelNoMatch: css({
      opacity: 0.4,
      transition: 'opacity 0.2s ease-in-out',
    }),
  };
}
