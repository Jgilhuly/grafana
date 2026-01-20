import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { config } from '@grafana/runtime';
import { SceneTimeRange, VizPanel } from '@grafana/scenes';

import { DashboardScene } from '../../scene/DashboardScene';
import { DefaultGridLayoutManager } from '../../scene/layout-default/DefaultGridLayoutManager';

import { ExportToRepository, useIsRepositoryExportAvailable } from './ExportToRepository';

// Mock the provisioning hooks
jest.mock('app/features/provisioning/hooks/useRepositoryList', () => ({
  useRepositoryList: jest.fn(),
}));

jest.mock('app/features/provisioning/hooks/useCreateOrUpdateRepositoryFile', () => ({
  useCreateOrUpdateRepositoryFile: jest.fn(),
}));

// Mock RTK Query hooks for branch fetching
jest.mock('app/api/clients/provisioning/v0alpha1', () => ({
  useGetRepositoryRefsQuery: jest.fn().mockReturnValue({ data: { items: [] }, isLoading: false, error: null }),
}));

// Mock hooks that depend on router context
jest.mock('app/features/provisioning/hooks/usePRBranch', () => ({
  usePRBranch: jest.fn().mockReturnValue(undefined),
}));

jest.mock('app/features/provisioning/hooks/useLastBranch', () => ({
  useLastBranch: jest.fn().mockReturnValue({
    getLastBranch: jest.fn().mockReturnValue(undefined),
    setLastBranch: jest.fn(),
  }),
}));

// Import mocked modules
import { useRepositoryList } from 'app/features/provisioning/hooks/useRepositoryList';
import { useCreateOrUpdateRepositoryFile } from 'app/features/provisioning/hooks/useCreateOrUpdateRepositoryFile';

const mockUseRepositoryList = useRepositoryList as jest.MockedFunction<typeof useRepositoryList>;
const mockUseCreateOrUpdateRepositoryFile = useCreateOrUpdateRepositoryFile as jest.MockedFunction<
  typeof useCreateOrUpdateRepositoryFile
>;

function createMockDashboard() {
  const panel = new VizPanel({
    title: 'Panel A',
    pluginId: 'table',
    key: 'panel-12',
  });

  return new DashboardScene({
    title: 'Test Dashboard',
    uid: 'dash-1',
    $timeRange: new SceneTimeRange({}),
    body: DefaultGridLayoutManager.fromVizPanels([panel]),
  });
}

const mockRepositories = [
  {
    metadata: { name: 'test-repo' },
    spec: {
      title: 'Test Repository',
      type: 'github',
      workflows: ['write', 'branch'],
    },
    branch: 'main',
    type: 'github',
  },
  {
    metadata: { name: 'readonly-repo' },
    spec: {
      title: 'Read-only Repository',
      type: 'local',
      workflows: [],
    },
    type: 'local',
  },
];

describe('ExportToRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    config.featureToggles.provisioningUI = true;

    mockUseRepositoryList.mockReturnValue([mockRepositories, false]);
    mockUseCreateOrUpdateRepositoryFile.mockReturnValue([
      jest.fn().mockReturnValue({ unwrap: () => Promise.resolve({}) }),
      { isLoading: false, isSuccess: false, isError: false },
    ]);
  });

  describe('ExportToRepository Component', () => {
    it('should render drawer when isOpen is true', () => {
      const dashboard = createMockDashboard();
      const model = new ExportToRepository({ isOpen: true });
      model.parent = dashboard;

      render(<ExportToRepository.Component model={model} />);

      expect(screen.getByText('Export to Repository')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      const dashboard = createMockDashboard();
      const model = new ExportToRepository({ isOpen: false });
      model.parent = dashboard;

      const { container } = render(<ExportToRepository.Component model={model} />);

      expect(container).toBeEmptyDOMElement();
    });

    it('should show loading state while fetching repositories', () => {
      mockUseRepositoryList.mockReturnValue([undefined, true]);

      const dashboard = createMockDashboard();
      const model = new ExportToRepository({ isOpen: true });
      model.parent = dashboard;

      render(<ExportToRepository.Component model={model} />);

      expect(screen.getByText(/loading repositories/i)).toBeInTheDocument();
    });

    it('should show alert when no writable repositories are available', () => {
      mockUseRepositoryList.mockReturnValue([[mockRepositories[1]], false]); // Only readonly repo

      const dashboard = createMockDashboard();
      const model = new ExportToRepository({ isOpen: true });
      model.parent = dashboard;

      render(<ExportToRepository.Component model={model} />);

      expect(screen.getByText(/no repositories configured/i)).toBeInTheDocument();
    });

    it('should show repository selection dropdown when repositories are available', () => {
      const dashboard = createMockDashboard();
      const model = new ExportToRepository({ isOpen: true });
      model.parent = dashboard;

      render(<ExportToRepository.Component model={model} />);

      expect(screen.getByText('Repository')).toBeInTheDocument();
      expect(screen.getByText('Path')).toBeInTheDocument();
      expect(screen.getByText('Commit message')).toBeInTheDocument();
    });

    it('should show export button', () => {
      const dashboard = createMockDashboard();
      const model = new ExportToRepository({ isOpen: true });
      model.parent = dashboard;

      render(<ExportToRepository.Component model={model} />);

      expect(screen.getByRole('button', { name: /export to repository/i })).toBeInTheDocument();
    });

    it('should show cancel button', () => {
      const dashboard = createMockDashboard();
      const model = new ExportToRepository({ isOpen: true });
      model.parent = dashboard;

      render(<ExportToRepository.Component model={model} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should close drawer when cancel is clicked', async () => {
      const user = userEvent.setup();
      const onDismiss = jest.fn();
      const dashboard = createMockDashboard();
      const model = new ExportToRepository({ isOpen: true, onDismiss });
      model.parent = dashboard;

      render(<ExportToRepository.Component model={model} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(model.state.isOpen).toBe(false);
    });

    it('should disable export button when no repository is selected', () => {
      const dashboard = createMockDashboard();
      const model = new ExportToRepository({ isOpen: true });
      model.parent = dashboard;

      render(<ExportToRepository.Component model={model} />);

      const exportButton = screen.getByRole('button', { name: /export to repository/i });
      expect(exportButton).toBeDisabled();
    });
  });

  describe('useIsRepositoryExportAvailable hook', () => {
    it('should return true when writable repositories exist and feature toggle is enabled', () => {
      config.featureToggles.provisioningUI = true;
      mockUseRepositoryList.mockReturnValue([mockRepositories, false]);

      const TestComponent = () => {
        const isAvailable = useIsRepositoryExportAvailable();
        return <div data-testid="result">{isAvailable ? 'available' : 'not-available'}</div>;
      };

      render(<TestComponent />);

      expect(screen.getByTestId('result')).toHaveTextContent('available');
    });

    it('should return false when provisioningUI feature toggle is disabled', () => {
      config.featureToggles.provisioningUI = false;
      mockUseRepositoryList.mockReturnValue([mockRepositories, false]);

      const TestComponent = () => {
        const isAvailable = useIsRepositoryExportAvailable();
        return <div data-testid="result">{isAvailable ? 'available' : 'not-available'}</div>;
      };

      render(<TestComponent />);

      expect(screen.getByTestId('result')).toHaveTextContent('not-available');
    });

    it('should return false when no writable repositories exist', () => {
      config.featureToggles.provisioningUI = true;
      mockUseRepositoryList.mockReturnValue([[mockRepositories[1]], false]); // Only readonly repo

      const TestComponent = () => {
        const isAvailable = useIsRepositoryExportAvailable();
        return <div data-testid="result">{isAvailable ? 'available' : 'not-available'}</div>;
      };

      render(<TestComponent />);

      expect(screen.getByTestId('result')).toHaveTextContent('not-available');
    });

    it('should return false when no repositories exist', () => {
      config.featureToggles.provisioningUI = true;
      mockUseRepositoryList.mockReturnValue([[], false]);

      const TestComponent = () => {
        const isAvailable = useIsRepositoryExportAvailable();
        return <div data-testid="result">{isAvailable ? 'available' : 'not-available'}</div>;
      };

      render(<TestComponent />);

      expect(screen.getByTestId('result')).toHaveTextContent('not-available');
    });
  });
});
