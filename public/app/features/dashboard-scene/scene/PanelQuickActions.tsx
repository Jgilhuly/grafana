import { css } from '@emotion/css';

import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { locationService } from '@grafana/runtime';
import { SceneComponentProps, SceneObjectBase, SceneObjectState, VizPanel } from '@grafana/scenes';
import { IconButton, Stack, useStyles2 } from '@grafana/ui';
import { appEvents } from 'app/core/app_events';
import { ShowConfirmModalEvent } from 'app/types/events';

import { dashboardSceneGraph } from '../utils/dashboardSceneGraph';
import { DashboardInteractions } from '../utils/interactions';
import { getDashboardSceneFor, getPanelIdForVizPanel } from '../utils/utils';

import { isRepeatCloneOrChildOf } from '../utils/clone';

export interface PanelQuickActionsState extends SceneObjectState {}

export class PanelQuickActions extends SceneObjectBase<PanelQuickActionsState> {
  static Component = PanelQuickActionsRenderer;

  constructor(state: Partial<PanelQuickActionsState> = {}) {
    super(state);
  }

  private getPanel(): VizPanel {
    if (!this.parent || !(this.parent instanceof VizPanel)) {
      throw new Error('PanelQuickActions must be a child of a VizPanel');
    }
    return this.parent;
  }

  public onEdit = () => {
    const panel = this.getPanel();
    const panelId = getPanelIdForVizPanel(panel);
    DashboardInteractions.panelActionClicked('edit', panelId, 'panel');
    locationService.partial({ editPanel: panelId });
  };

  public onDuplicate = () => {
    const panel = this.getPanel();
    const panelId = getPanelIdForVizPanel(panel);
    DashboardInteractions.panelActionClicked('duplicate', panelId, 'panel');
    const layout = dashboardSceneGraph.getLayoutManagerFor(panel);
    layout.duplicatePanel?.(panel);
  };

  public onCopy = () => {
    const panel = this.getPanel();
    const panelId = getPanelIdForVizPanel(panel);
    DashboardInteractions.panelActionClicked('copy', panelId, 'panel');
    const dashboard = getDashboardSceneFor(panel);
    dashboard.copyPanel(panel);
  };

  public onDelete = () => {
    const panel = this.getPanel();
    const panelId = getPanelIdForVizPanel(panel);
    DashboardInteractions.panelActionClicked('delete', panelId, 'panel');

    appEvents.publish(
      new ShowConfirmModalEvent({
        title: t('panel.quick-actions.delete-title', 'Delete panel'),
        text: t('panel.quick-actions.delete-text', 'Are you sure you want to delete this panel?'),
        icon: 'trash-alt',
        yesText: t('panel.quick-actions.delete-confirm', 'Delete'),
        onConfirm: () => {
          const layout = dashboardSceneGraph.getLayoutManagerFor(panel);
          layout.removePanel?.(panel);
        },
      })
    );
  };
}

export function PanelQuickActionsRenderer({ model }: SceneComponentProps<PanelQuickActions>) {
  const styles = useStyles2(getStyles);

  // Get the parent panel
  const panel = model.parent;
  if (!(panel instanceof VizPanel)) {
    return null;
  }

  // Get dashboard state to check if we're in edit mode
  const dashboard = getDashboardSceneFor(panel);
  const { isEditing } = dashboard.useState();

  // Check if this is a repeat clone (should not show actions)
  const isReadOnlyRepeat = isRepeatCloneOrChildOf(panel);

  // Only show quick actions when editing and not a repeat clone
  if (!isEditing || isReadOnlyRepeat) {
    return null;
  }

  return (
    <div className="show-on-hover">
      <Stack direction="row" gap={0.5} alignItems="center">
        <IconButton
          name="pen"
          size="md"
          tooltip={t('panel.quick-actions.edit', 'Edit')}
          onClick={model.onEdit}
          className={styles.actionButton}
          aria-label={t('panel.quick-actions.edit-aria', 'Edit panel')}
        />
        <IconButton
          name="copy"
          size="md"
          tooltip={t('panel.quick-actions.duplicate', 'Duplicate')}
          onClick={model.onDuplicate}
          className={styles.actionButton}
          aria-label={t('panel.quick-actions.duplicate-aria', 'Duplicate panel')}
        />
        <IconButton
          name="clipboard-alt"
          size="md"
          tooltip={t('panel.quick-actions.copy', 'Copy')}
          onClick={model.onCopy}
          className={styles.actionButton}
          aria-label={t('panel.quick-actions.copy-aria', 'Copy panel to clipboard')}
        />
        <IconButton
          name="trash-alt"
          size="md"
          tooltip={t('panel.quick-actions.delete', 'Delete')}
          onClick={model.onDelete}
          className={styles.actionButton}
          aria-label={t('panel.quick-actions.delete-aria', 'Delete panel')}
        />
      </Stack>
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    actionButton: css({
      color: theme.colors.text.secondary,
      '&:hover': {
        color: theme.colors.text.primary,
      },
    }),
  };
}
