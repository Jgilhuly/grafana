import { render, screen } from 'test/test-utils';

import { config } from '@grafana/runtime';

import LabsPage, { getEnabledFeatureFlags } from './LabsPage';

const labsNav = {
  id: 'labs',
  text: 'Labs',
  url: '/labs',
  subTitle: 'View enabled feature flags',
};

describe('getEnabledFeatureFlags', () => {
  const originalToggles = { ...config.featureToggles };

  afterEach(() => {
    config.featureToggles = { ...originalToggles };
  });

  it('returns only truthy flags, sorted', () => {
    config.featureToggles = {
      zebraToggle: true,
      alphaToggle: true,
      disabledToggle: false,
    } as typeof config.featureToggles;

    expect(getEnabledFeatureFlags()).toEqual(['alphaToggle', 'zebraToggle']);
  });

  it('returns an empty list when no flags are enabled', () => {
    config.featureToggles = { disabledToggle: false } as typeof config.featureToggles;

    expect(getEnabledFeatureFlags()).toEqual([]);
  });
});

describe('LabsPage', () => {
  const originalToggles = { ...config.featureToggles };

  afterEach(() => {
    config.featureToggles = { ...originalToggles };
  });

  it('lists enabled feature flags', async () => {
    config.featureToggles = {
      publicDashboards: true,
      restoreDashboards: false,
    } as typeof config.featureToggles;

    render(<LabsPage />, {
      preloadedState: { navIndex: { labs: labsNav } },
    });

    expect(await screen.findByRole('heading', { name: 'Labs' })).toBeInTheDocument();
    expect(screen.getByText('publicDashboards')).toBeInTheDocument();
    expect(screen.queryByText('restoreDashboards')).not.toBeInTheDocument();
  });

  it('shows an empty state when no flags are enabled', async () => {
    config.featureToggles = {};

    render(<LabsPage />, {
      preloadedState: { navIndex: { labs: labsNav } },
    });

    expect(await screen.findByText('No feature flags are enabled')).toBeInTheDocument();
  });
});
