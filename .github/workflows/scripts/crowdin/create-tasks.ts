import crowdinImport from '@crowdin/crowdin-api-client';
const TRANSLATED_CONNECTOR_DESCRIPTION = '{{tos_service_type: premium}}';
const TRANSLATE_BY_VENDOR_WORKFLOW_TYPE = 'TranslateByVendor'
const LOG_SOURCE = 'github.crowdin.create-tasks'

type LogLevel = 'info' | 'error'

const toError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error
  }

  if (typeof error === 'string') {
    return new Error(error)
  }

  try {
    return new Error(JSON.stringify(error))
  } catch {
    return new Error(String(error))
  }
}

const getErrorContext = (error?: unknown) => {
  if (!error) {
    return {}
  }

  const normalizedError = toError(error)
  const context: Record<string, unknown> = {
    errorMessage: normalizedError.message,
    errorName: normalizedError.name,
    errorStack: normalizedError.stack,
  }

  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: unknown; status?: number } }).response
    if (response?.status) {
      context.responseStatus = response.status
    }
    if (response?.data) {
      context.responseData = response.data
    }
  }

  return context
}

const log = (level: LogLevel, message: string, context: Record<string, unknown> = {}) => {
  const payload = {
    level,
    message,
    context,
    source: LOG_SOURCE,
    timestamp: new Date().toISOString(),
  }
  process.stderr.write(`${JSON.stringify(payload)}\n`)
}

const logInfo = (message: string, context: Record<string, unknown> = {}) => {
  log('info', message, context)
}

const logError = (message: string, error?: unknown, context: Record<string, unknown> = {}) => {
  log('error', message, { ...getErrorContext(error), ...context })
}

// TODO Remove this type assertion when https://github.com/crowdin/crowdin-api-client-js/issues/508 is fixed
// @ts-expect-error
const crowdin = crowdinImport.default as typeof crowdinImport;

const API_TOKEN = process.env.CROWDIN_PERSONAL_TOKEN;
if (!API_TOKEN) {
  logError('CROWDIN_PERSONAL_TOKEN environment variable is not set')
  process.exit(1);
}

const PROJECT_ID = process.env.CROWDIN_PROJECT_ID ? parseInt(process.env.CROWDIN_PROJECT_ID, 10) : undefined;
if (!PROJECT_ID) {
  logError('CROWDIN_PROJECT_ID environment variable is not set')
  process.exit(1);
}

const credentials = {
  token: API_TOKEN,
  organization: 'grafana'
};

const { tasksApi, projectsGroupsApi, sourceFilesApi, workflowsApi } = new crowdin(credentials);

const languages = await getLanguages(PROJECT_ID);
const fileIds = await getFileIds(PROJECT_ID);
const workflowStepId = await getWorkflowStepId(PROJECT_ID);

for (const language of languages) {
  const { name, id } = language;
  await createTask(PROJECT_ID, `Translate to ${name}`, id, fileIds, workflowStepId);
}

async function getLanguages(projectId: number) {
  try {
    const project = await projectsGroupsApi.getProject(projectId);
    const languages = project.data.targetLanguages;
    logInfo('Fetched languages successfully', { projectId, languageCount: languages.length })
    return languages;
  } catch (error) {
    logError('Failed to fetch languages', error, { projectId })
    process.exit(1);
  }
}

async function getFileIds(projectId: number) {
  try {
    const response = await sourceFilesApi.listProjectFiles(projectId);
    const files = response.data;
    const fileIds = files.map(file => file.data.id);
    logInfo('Fetched file IDs successfully', { projectId, fileCount: fileIds.length })
    return fileIds;
  } catch (error) {
    logError('Failed to fetch file IDs', error, { projectId })
    process.exit(1);
  }
}

async function getWorkflowStepId(projectId: number) {
  try {
    const response = await workflowsApi.listWorkflowSteps(projectId);
    const workflowSteps = response.data;
    const workflowStepId = workflowSteps.find(step => step.data.type === TRANSLATE_BY_VENDOR_WORKFLOW_TYPE)?.data.id;
    if (!workflowStepId) {
      throw new Error(`Workflow step with type "${TRANSLATE_BY_VENDOR_WORKFLOW_TYPE}" not found`);
    }
    logInfo('Fetched workflow step ID successfully', { projectId, workflowStepId })
    return workflowStepId;
  } catch (error) {
    logError('Failed to fetch workflow step ID', error, { projectId })
    process.exit(1);
  }
}

async function createTask(projectId: number, title: string, languageId: string, fileIds: number[], workflowStepId: number) {
  try {
    const taskParams = {
      title,
      description: TRANSLATED_CONNECTOR_DESCRIPTION,
      languageId,
      workflowStepId,
      skipAssignedStrings: true,
      fileIds,
    };

    logInfo('Creating Crowdin task', { title, languageId, projectId, fileCount: fileIds.length })

    const response = await tasksApi.addTask(projectId, taskParams);
    logInfo('Task created successfully', { taskId: response.data.id, title, languageId })
    return response.data;
  } catch (error) {
    logError('Failed to create Crowdin task', error, { title, languageId, projectId })
    process.exit(1);
  }
}
