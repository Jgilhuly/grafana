import { AnnotationEvent, DataFrame, toDataFrame } from '@grafana/data';
import { config, getBackendSrv } from '@grafana/runtime';
import { ScopedResourceClient } from 'app/features/apiserver/client';
import { Resource, ResourceForCreate, ResourceList } from 'app/features/apiserver/types';
import { StateHistoryItem } from 'app/types/unified-alerting';

import { AnnotationTagsResponse } from './types';

export interface AnnotationServer {
  query(params: Record<string, unknown>, requestId: string): Promise<DataFrame>;
  list(params: Record<string, unknown>, requestId?: string): Promise<AnnotationEvent[]>;
  forAlert(alertUID: string): Promise<StateHistoryItem[]>;
  save(annotation: AnnotationEvent): Promise<AnnotationEvent>;
  update(annotation: AnnotationEvent): Promise<unknown>;
  delete(annotation: AnnotationEvent): Promise<unknown>;
  tags(): Promise<Array<{ term: string; count: number }>>;
}

class LegacyAnnotationServer implements AnnotationServer {
  list(params: Record<string, unknown>, requestId?: string) {
    return getBackendSrv().get('/api/annotations', params, requestId);
  }

  query(params: Record<string, unknown>, requestId: string): Promise<DataFrame> {
    return this.list(params, requestId).then((v) => toDataFrame(v));
  }

  forAlert(alertUID: string) {
    return this.list({ alertUID });
  }

  save(annotation: AnnotationEvent) {
    return getBackendSrv().post('/api/annotations', annotation);
  }

  update(annotation: AnnotationEvent) {
    return getBackendSrv().put(`/api/annotations/${annotation.id}`, annotation);
  }

  delete(annotation: AnnotationEvent) {
    return getBackendSrv().delete(`/api/annotations/${annotation.id}`);
  }

  async tags() {
    const response = await getBackendSrv().get<AnnotationTagsResponse>('/api/annotations/tags?limit=1000');
    return response.result.tags.map(({ tag, count }) => ({
      term: tag,
      count,
    }));
  }
}

type K8sAnnotationSpec = {
  text: string;
  time: number;
  timeEnd?: number;
  dashboardUID?: string;
  panelID?: number;
  tags?: string[];
};

type K8sAnnotationStatus = {
  additionalFields?: Record<string, unknown>;
};

type K8sAnnotationResource = Resource<K8sAnnotationSpec, K8sAnnotationStatus, 'Annotation'>;
type K8sAnnotationList = ResourceList<K8sAnnotationSpec, K8sAnnotationStatus, 'Annotation'>;

type AnnotationQueryParams = {
  from?: number;
  to?: number;
  limit?: number;
  tags?: string[];
  matchAny?: boolean;
  dashboardUID?: string;
  panelId?: number;
  userId?: number;
  alertId?: number;
  alertUID?: string;
  type?: string;
};

const k8sAnnotationGvr = {
  group: 'annotation.grafana.app',
  version: 'v0alpha1',
  resource: 'annotations',
};

const annotationIdFromName = (name: string) => (name.startsWith('a-') ? name.slice(2) : name);

const annotationNameFromId = (id?: string | number) => {
  if (id === undefined || id === null || id === '') {
    return '';
  }
  const value = String(id);
  return value.startsWith('a-') ? value : `a-${value}`;
};

const coerceNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};

const coerceString = (value: unknown): string | undefined => (typeof value === 'string' && value !== '' ? value : undefined);

const toAnnotationEvent = (resource: K8sAnnotationResource): AnnotationEvent => {
  const additionalFields = resource.status?.additionalFields ?? {};
  const event: AnnotationEvent & { data?: unknown } = {
    id: annotationIdFromName(resource.metadata.name),
    text: resource.spec.text,
    time: resource.spec.time,
    timeEnd: resource.spec.timeEnd,
    tags: resource.spec.tags,
    dashboardUID: resource.spec.dashboardUID ?? null,
    panelId: resource.spec.panelID,
    userId: coerceNumber(additionalFields.userId),
    login: coerceString(additionalFields.login),
    email: coerceString(additionalFields.email),
    avatarUrl: coerceString(additionalFields.avatarUrl),
    alertId: coerceNumber(additionalFields.alertId),
    newState: coerceString(additionalFields.newState),
    prevState: coerceString(additionalFields.prevState),
    dashboardId: coerceNumber(additionalFields.dashboardId),
  };

  if (additionalFields.data !== undefined) {
    event.data = additionalFields.data;
  }

  return event;
};

const buildAnnotationSpec = (annotation: AnnotationEvent): K8sAnnotationSpec => {
  const spec: K8sAnnotationSpec = {
    text: annotation.text ?? '',
    time: annotation.time ?? 0,
  };

  if (annotation.timeEnd && annotation.timeEnd > 0) {
    spec.timeEnd = annotation.timeEnd;
  }
  if (annotation.dashboardUID) {
    spec.dashboardUID = annotation.dashboardUID;
  }
  if (annotation.panelId && annotation.panelId > 0) {
    spec.panelID = annotation.panelId;
  }
  if (annotation.tags) {
    spec.tags = annotation.tags;
  }

  return spec;
};

const normalizeTags = (tags: unknown): string[] => {
  if (typeof tags === 'string') {
    return tags.length > 0 ? [tags] : [];
  }
  if (!Array.isArray(tags)) {
    return [];
  }
  return tags.filter((tag): tag is string => typeof tag === 'string' && tag.length > 0);
};

const buildFieldSelector = (params: AnnotationQueryParams): string | undefined => {
  const selectors: string[] = [];
  const panelId = coerceNumber(params.panelId);
  const from = coerceNumber(params.from);
  const to = coerceNumber(params.to);
  const userId = coerceNumber(params.userId);
  const alertId = coerceNumber(params.alertId);
  const tags = normalizeTags(params.tags);

  if (params.dashboardUID) {
    selectors.push(`spec.dashboardUID=${params.dashboardUID}`);
  }
  if (panelId !== undefined) {
    selectors.push(`spec.panelID=${panelId}`);
  }
  if (from !== undefined) {
    selectors.push(`spec.time>${from}`);
  }
  if (to !== undefined) {
    selectors.push(`spec.time<${to}`);
  }
  if (userId !== undefined) {
    selectors.push(`spec.userId=${userId}`);
  }
  if (alertId !== undefined) {
    selectors.push(`spec.alertId=${alertId}`);
  }
  if (params.alertUID) {
    selectors.push(`spec.alertUID=${params.alertUID}`);
  }
  if (params.type) {
    selectors.push(`spec.type=${params.type}`);
  }

  if (tags.length > 0) {
    tags.forEach((tag) => selectors.push(`spec.tags=${tag}`));
    if (params.matchAny) {
      selectors.push('spec.matchAny=true');
    }
  }

  return selectors.length ? selectors.join(',') : undefined;
};

class K8sAnnotationServer implements AnnotationServer {
  private client = new ScopedResourceClient<K8sAnnotationSpec, K8sAnnotationStatus>(k8sAnnotationGvr);

  async list(params: Record<string, unknown>, requestId?: string): Promise<AnnotationEvent[]> {
    const queryParams = params as AnnotationQueryParams;
    const fieldSelector = buildFieldSelector(queryParams);
    const limit = coerceNumber(queryParams.limit);
    const requestParams: Record<string, unknown> = {};

    if (fieldSelector) {
      requestParams.fieldSelector = fieldSelector;
    }
    if (limit !== undefined) {
      requestParams.limit = limit;
    }

    const response = await getBackendSrv().get<K8sAnnotationList>(this.client.url, requestParams, requestId);
    return response.items.map(toAnnotationEvent);
  }

  query(params: Record<string, unknown>, requestId: string): Promise<DataFrame> {
    return this.list(params, requestId).then((items) => toDataFrame(items));
  }

  forAlert(alertUID: string): Promise<StateHistoryItem[]> {
    return this.list({ alertUID });
  }

  async save(annotation: AnnotationEvent): Promise<AnnotationEvent> {
    const payload: ResourceForCreate<K8sAnnotationSpec> = {
      apiVersion: `${k8sAnnotationGvr.group}/${k8sAnnotationGvr.version}`,
      kind: 'Annotation',
      metadata: {},
      spec: buildAnnotationSpec(annotation),
    };
    const created = await this.client.create(payload);
    return toAnnotationEvent(created);
  }

  async update(annotation: AnnotationEvent) {
    const name = annotationNameFromId(annotation.id);
    if (!name) {
      throw new Error('annotation id is required for update');
    }

    const payload: K8sAnnotationResource = {
      apiVersion: `${k8sAnnotationGvr.group}/${k8sAnnotationGvr.version}`,
      kind: 'Annotation',
      metadata: {
        name,
      },
      spec: buildAnnotationSpec(annotation),
    };
    return this.client.update(payload);
  }

  delete(annotation: AnnotationEvent) {
    const name = annotationNameFromId(annotation.id);
    if (!name) {
      throw new Error('annotation id is required for delete');
    }
    return this.client.delete(name, false);
  }

  async tags() {
    const response = await getBackendSrv().get<{ tags: Array<{ tag: string; count: number }> }>(
      `${this.client.url}/tags`,
      {
        limit: 1000,
      }
    );
    return response.tags.map(({ tag, count }) => ({
      term: tag,
      count,
    }));
  }
}

let instance: AnnotationServer | null = null;

export function annotationServer(): AnnotationServer {
  if (!instance) {
    instance = config.featureToggles.kubernetesAnnotations ? new K8sAnnotationServer() : new LegacyAnnotationServer();
  }
  return instance;
}
