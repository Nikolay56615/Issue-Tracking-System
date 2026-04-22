import type {
  IssueFieldConfig,
  IssueFieldSurface,
  LifecycleStatusConfig,
  ProjectConfig,
  SystemIssueFieldId,
} from '@/features/project-config/model/project-config.types.ts';

export const sortIssueFields = (fields: IssueFieldConfig[]) =>
  [...fields].sort((a, b) => a.order - b.order);

export const getVisibleFields = (
  config: ProjectConfig | null,
  surface: IssueFieldSurface
) =>
  sortIssueFields(config?.issueFields ?? []).filter((field) =>
    field.visibleOn.includes(surface)
  );

export const getEditableFields = (
  config: ProjectConfig | null,
  surface: 'create' | 'edit'
) =>
  getVisibleFields(config, surface).filter(
    (field) => field.editable || field.source === 'custom'
  );

export const getSystemField = (
  config: ProjectConfig | null,
  id: SystemIssueFieldId
) => config?.issueFields.find((field) => field.id === id);

export const getOrderedStatuses = (config: ProjectConfig | null) =>
  [...(config?.lifecycle.statuses ?? [])].sort((a, b) => a.order - b.order);

export const getStatusLabel = (
  statuses: LifecycleStatusConfig[],
  statusId: string
) => statuses.find((status) => status.id === statusId)?.label ?? statusId;
