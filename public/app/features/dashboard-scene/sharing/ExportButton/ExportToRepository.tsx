import { css } from '@emotion/css';
import { useCallback, useMemo, useState } from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { useAsync } from 'react-use';

import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { selectors as e2eSelectors } from '@grafana/e2e-selectors';
import { Trans, t } from '@grafana/i18n';
import { config, reportInteraction } from '@grafana/runtime';
import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import {
  Alert,
  Button,
  Drawer,
  Field,
  Input,
  Select,
  Spinner,
  Stack,
  TextArea,
  useStyles2,
} from '@grafana/ui';
import { Repository, RepositoryView } from 'app/api/clients/provisioning/v0alpha1';
import { notifyApp } from 'app/core/actions';
import { createErrorNotification, createSuccessNotification } from 'app/core/copy/appNotification';
import { dispatch } from 'app/store/store';

import { DashboardScene } from '../../scene/DashboardScene';
import { getDashboardSceneFor } from '../../utils/utils';

import { useCreateOrUpdateRepositoryFile } from '../../../provisioning/hooks/useCreateOrUpdateRepositoryFile';
import { useRepositoryList } from '../../../provisioning/hooks/useRepositoryList';
import { getDefaultWorkflow, getWorkflowOptions } from '../../../provisioning/components/defaults';
import { ResourceEditFormSharedFields } from '../../../provisioning/components/Shared/ResourceEditFormSharedFields';
import { generateTimestamp } from '../../../provisioning/components/utils/timestamp';
import { WorkflowOption } from '../../../provisioning/types';
import { isGitProvider } from '../../../provisioning/utils/repositoryTypes';

const selector = e2eSelectors.pages.ExportDashboardDrawer;

interface ExportToRepositoryFormData {
  repo: string;
  path: string;
  comment: string;
  workflow: WorkflowOption;
  ref: string;
}

export interface ExportToRepositoryState extends SceneObjectState {
  isOpen?: boolean;
  onDismiss?: () => void;
}

export class ExportToRepository extends SceneObjectBase<ExportToRepositoryState> {
  static Component = ExportToRepositoryRenderer;

  public open = () => {
    this.setState({ isOpen: true });
  };

  public close = () => {
    this.setState({ isOpen: false });
    this.state.onDismiss?.();
  };
}

function ExportToRepositoryRenderer({ model }: SceneComponentProps<ExportToRepository>) {
  const styles = useStyles2(getStyles);
  const { isOpen } = model.useState();
  const [repositories, isLoadingRepos] = useRepositoryList();
  const [selectedRepo, setSelectedRepo] = useState<RepositoryView | undefined>();
  const [createOrUpdateFile, request] = useCreateOrUpdateRepositoryFile();

  const scene = getDashboardSceneFor(model);
  const dashboardTitle = scene.state.title || 'dashboard';
  const timestamp = useMemo(() => generateTimestamp(), []);

  // Filter to only show writable repositories
  const writableRepositories = useMemo(() => {
    return repositories?.filter((repo) => {
      const workflows = repo.spec?.workflows || [];
      return workflows.length > 0;
    });
  }, [repositories]);

  const repositoryOptions: Array<SelectableValue<string>> = useMemo(() => {
    return (
      writableRepositories?.map((repo) => ({
        label: repo.spec?.title || repo.metadata?.name || '',
        value: repo.metadata?.name || '',
        description: repo.spec?.type,
      })) || []
    );
  }, [writableRepositories]);

  const workflowOptions = useMemo(() => {
    return getWorkflowOptions(selectedRepo);
  }, [selectedRepo]);

  const defaultPath = useMemo(() => {
    const slug = dashboardTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `${slug}-${timestamp}.json`;
  }, [dashboardTitle, timestamp]);

  const methods = useForm<ExportToRepositoryFormData>({
    defaultValues: {
      repo: '',
      path: defaultPath,
      comment: '',
      workflow: 'write',
      ref: '',
    },
  });

  const { handleSubmit, control, watch, setValue, reset } = methods;
  const [workflow, repoName] = watch(['workflow', 'repo']);

  // Update selected repository when repo changes
  const handleRepoChange = useCallback(
    (value: string) => {
      const repo = writableRepositories?.find((r) => r.metadata?.name === value);
      setSelectedRepo(repo);
      if (repo) {
        const defaultWorkflow = getDefaultWorkflow(repo);
        if (defaultWorkflow) {
          setValue('workflow', defaultWorkflow);
        }
        if (repo.branch) {
          setValue('ref', repo.branch);
        }
      }
    },
    [writableRepositories, setValue]
  );

  // Export the dashboard JSON
  const dashboardJson = useAsync(async () => {
    const exportable = await scene.serializer.makeExportableExternally(scene);
    return exportable;
  }, [scene]);

  const onSubmit = async (data: ExportToRepositoryFormData) => {
    if (!data.repo || !data.path) {
      return;
    }

    const repo = writableRepositories?.find((r) => r.metadata?.name === data.repo);
    if (!repo) {
      dispatch(
        notifyApp(
          createErrorNotification(
            t('export.repository.error-repo-not-found', 'Repository not found')
          )
        )
      );
      return;
    }

    try {
      const exportedJson = await scene.serializer.makeExportableExternally(scene);
      const saveModel = scene.getSaveResource({
        isNew: true,
        title: dashboardTitle,
      });

      const message = data.comment || `Export dashboard: ${dashboardTitle}`;

      reportInteraction('grafana_dashboard_export_to_repository', {
        workflow: data.workflow,
        repositoryName: data.repo,
        repositoryType: repo.spec?.type ?? 'unknown',
      });

      await createOrUpdateFile({
        name: data.repo,
        path: data.path,
        ref: data.ref !== repo.branch ? data.ref : undefined,
        message,
        body: saveModel,
      }).unwrap();

      dispatch(
        notifyApp(
          createSuccessNotification(
            t('export.repository.success', 'Dashboard exported to repository successfully')
          )
        )
      );

      model.close();
      reset();
    } catch (error) {
      dispatch(
        notifyApp(
          createErrorNotification(
            t('export.repository.error', 'Failed to export dashboard to repository'),
            error instanceof Error ? error : undefined
          )
        )
      );
    }
  };

  if (!isOpen) {
    return null;
  }

  const hasRepositories = writableRepositories && writableRepositories.length > 0;
  const isSubmitting = request.isLoading;

  return (
    <Drawer
      title={t('export.repository.title', 'Export to Repository')}
      onClose={model.close}
      size="md"
    >
      <div className={styles.container}>
        {isLoadingRepos ? (
          <Stack alignItems="center" justifyContent="center">
            <Spinner />
            <Trans i18nKey="export.repository.loading">Loading repositories...</Trans>
          </Stack>
        ) : !hasRepositories ? (
          <Alert
            title={t('export.repository.no-repos-title', 'No repositories configured')}
            severity="info"
          >
            <Trans i18nKey="export.repository.no-repos">
              You need to configure at least one repository with write access to export dashboards.
              Go to Administration &gt; General &gt; Provisioning to set up a repository.
            </Trans>
          </Alert>
        ) : (
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
              <Stack direction="column" gap={2}>
                {/* Repository Selection */}
                <Field
                  label={t('export.repository.field-repo', 'Repository')}
                  description={t(
                    'export.repository.field-repo-description',
                    'Select a repository to export the dashboard to'
                  )}
                >
                  <Controller
                    name="repo"
                    control={control}
                    rules={{ required: t('export.repository.repo-required', 'Repository is required') }}
                    render={({ field: { ref, onChange, ...field } }) => (
                      <Select
                        {...field}
                        inputId="export-repo-select"
                        options={repositoryOptions}
                        onChange={(option) => {
                          const value = option?.value || '';
                          onChange(value);
                          handleRepoChange(value);
                        }}
                        placeholder={t('export.repository.select-repo', 'Select a repository')}
                      />
                    )}
                  />
                </Field>

                {/* Path Input */}
                <Field
                  label={t('export.repository.field-path', 'Path')}
                  description={t(
                    'export.repository.field-path-description',
                    'File path inside the repository (.json or .yaml)'
                  )}
                >
                  <Controller
                    name="path"
                    control={control}
                    rules={{ required: t('export.repository.path-required', 'Path is required') }}
                    render={({ field }) => (
                      <Input {...field} id="export-path-input" placeholder="dashboard.json" />
                    )}
                  />
                </Field>

                {/* Commit Message */}
                <Field
                  label={t('export.repository.field-comment', 'Commit message')}
                  description={t(
                    'export.repository.field-comment-description',
                    'A message describing this export (optional)'
                  )}
                >
                  <Controller
                    name="comment"
                    control={control}
                    render={({ field }) => (
                      <TextArea
                        {...field}
                        id="export-comment-input"
                        placeholder={t(
                          'export.repository.comment-placeholder',
                          'Export dashboard: {{title}}',
                          { title: dashboardTitle }
                        )}
                        rows={3}
                      />
                    )}
                  />
                </Field>

                {/* Workflow and Branch (for Git providers) */}
                {selectedRepo && isGitProvider(selectedRepo.type) && (
                  <ResourceEditFormSharedFields
                    resourceType="dashboard"
                    workflowOptions={workflowOptions}
                    isNew={true}
                    workflow={workflow}
                    repository={selectedRepo}
                    hidePath
                  />
                )}

                {/* Submit Buttons */}
                <div className={styles.buttons}>
                  <Stack gap={1}>
                    <Button
                      type="submit"
                      variant="primary"
                      icon="upload"
                      disabled={!repoName || isSubmitting}
                    >
                      {isSubmitting ? (
                        <Trans i18nKey="export.repository.exporting">Exporting...</Trans>
                      ) : (
                        <Trans i18nKey="export.repository.export-button">Export to repository</Trans>
                      )}
                    </Button>
                    <Button variant="secondary" fill="outline" onClick={model.close}>
                      <Trans i18nKey="export.repository.cancel-button">Cancel</Trans>
                    </Button>
                  </Stack>
                </div>
              </Stack>
            </form>
          </FormProvider>
        )}
      </div>
    </Drawer>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    container: css({
      padding: theme.spacing(2),
      height: '100%',
    }),
    form: css({
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }),
    buttons: css({
      marginTop: theme.spacing(2),
    }),
  };
}

/**
 * Hook to check if repository export is available
 */
export function useIsRepositoryExportAvailable(): boolean {
  const [repositories] = useRepositoryList();

  if (!config.featureToggles.provisioningUI) {
    return false;
  }

  // Check if there are any repositories with write workflows
  const hasWritableRepos = repositories?.some((repo) => {
    const workflows = repo.spec?.workflows || [];
    return workflows.length > 0;
  });

  return Boolean(hasWritableRepos);
}
