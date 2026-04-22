import type {
  IssueCustomFieldValue,
  IssuePriority,
  IssueType,
} from '@/features/board/model';
import type { UserRole } from '@/features/profile';

export type IssueFieldSource = 'system' | 'custom';

export type IssueFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'checkbox'
  | 'select'
  | 'multiSelect';

export type IssueFieldSurface =
  | 'create'
  | 'edit'
  | 'card'
  | 'dialog'
  | 'filter';

export type SystemIssueFieldId =
  | 'id'
  | 'projectId'
  | 'name'
  | 'type'
  | 'priority'
  | 'status'
  | 'description'
  | 'assigneeIds'
  | 'authorId'
  | 'startDate'
  | 'dueDate'
  | 'attachments';

export interface IssueFieldOption {
  label: string;
  value: string;
}

export interface IssueFieldConfig {
  id: string;
  source: IssueFieldSource;
  label: string;
  type: IssueFieldType;
  required: boolean;
  editable: boolean;
  order: number;
  visibleOn: IssueFieldSurface[];
  options?: IssueFieldOption[];
}

export interface LifecycleStatusConfig {
  id: string;
  label: string;
  order: number;
  isInitial?: boolean;
}

export interface LifecycleTransitionConfig {
  from: string;
  to: string;
  allowedRoles: UserRole[];
  authorAllowed: boolean;
  assigneeAllowed: boolean;
}

export interface LifecycleConfig {
  statuses: LifecycleStatusConfig[];
  transitions: LifecycleTransitionConfig[];
}

export interface ProjectConfig {
  projectId: number;
  issueFields: IssueFieldConfig[];
  lifecycle: LifecycleConfig;
  updatedAt: string;
}

export type ProjectConfigFieldValue =
  | IssueCustomFieldValue
  | IssueType
  | IssuePriority
  | number[]
  | undefined;

export const PROTECTED_SYSTEM_FIELD_IDS: SystemIssueFieldId[] = [
  'id',
  'projectId',
  'name',
  'status',
  'authorId',
];
