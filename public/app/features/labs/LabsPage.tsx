import { css } from '@emotion/css';

import { GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import { EmptyState, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

const flagNameCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

export function getEnabledFeatureFlags(): string[] {
  const toggles = config.featureToggles ?? {};

  return Object.entries(toggles)
    .filter(([, enabled]) => enabled === true)
    .map(([name]) => name)
    .sort(flagNameCollator.compare);
}

export default function LabsPage() {
  const styles = useStyles2(getStyles);
  const enabledFlags = getEnabledFeatureFlags();

  return (
    <Page navId="labs">
      <Page.Contents>
        {enabledFlags.length === 0 ? (
          <EmptyState
            variant="not-found"
            message={t('labs.empty.message', 'No feature flags are enabled')}
          />
        ) : (
          <table className="filter-table" data-testid="labs-page">
            <thead>
              <tr>
                <th>
                  <Trans i18nKey="labs.table.flag">Feature flag</Trans>
                </th>
              </tr>
            </thead>
            <tbody>
              {enabledFlags.map((flag) => (
                <tr key={flag}>
                  <td className={styles.flagName}>{flag}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Page.Contents>
    </Page>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  flagName: css({
    fontFamily: theme.typography.fontFamilyMonospace,
  }),
});
