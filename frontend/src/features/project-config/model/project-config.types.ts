import type {
  CustomRole,
  PermissionKey,
} from '@/features/profile/model/profile.types.ts';

export type SystemIssueFieldId =
  | 'name'
  | 'description'
  | 'type'
  | 'priority'
  | 'assignee'
  | 'startDate'
  | 'dueDate'
  | 'attachments';

export type CustomFieldType =
  | 'text'
  | 'number'
  | 'user_reference'
  | 'issue_reference';

export interface BaseCustomFieldDefinition {
  id: string;
  projectId: number;
  name: string;
  type: CustomFieldType;
  required: boolean;
}

export interface TextFieldDefinition extends BaseCustomFieldDefinition {
  type: 'text';
  config: {
    maxLength?: number;
  };
}

export interface NumberFieldDefinition extends BaseCustomFieldDefinition {
  type: 'number';
  config: {
    min?: number;
    max?: number;
    isInteger?: boolean;
  };
}

export interface UserReferenceFieldDefinition
  extends BaseCustomFieldDefinition {
  type: 'user_reference';
  config: {
    allowedRoleIds: string[];
  };
}

export interface IssueReferenceFieldDefinition
  extends BaseCustomFieldDefinition {
  type: 'issue_reference';
  config: Record<string, never>;
}

export type CustomFieldDefinition =
  | TextFieldDefinition
  | NumberFieldDefinition
  | UserReferenceFieldDefinition
  | IssueReferenceFieldDefinition;

export interface CustomStatus {
  id: string;
  projectId: number;
  name: string;
  displayOrder: number;
  color: string;
  isInitial?: boolean;
}

export type TransitionCondition =
  | {
      type: 'role';
      roleId: string;
    }
  | {
      type: 'author';
    }
  | {
      type: 'assignee';
    }
  | {
      type: 'field_user_reference';
      customFieldId: string;
    };

export interface Transition {
  id: string;
  fromStatusId: string;
  toStatusId: string;
  conditions: TransitionCondition[];
}

export interface LifecycleConfig {
  statuses: CustomStatus[];
  transitions: Transition[];
}

export interface ProjectConfig {
  projectId: number;
  roles: CustomRole[];
  lifecycle: LifecycleConfig;
  customFields: CustomFieldDefinition[];
  updatedAt: string;
}

export interface ProjectTemplate {
  sourceProjectId: number;
  sourceProjectName: string;
  config: Omit<ProjectConfig, 'projectId' | 'updatedAt'>;
}

export interface ProjectTemplateSummary {
  projectId: number;
  projectName: string;
}

export const PERMISSION_GROUPS: Array<{
  label: string;
  permissions: PermissionKey[];
}> = [
  {
    label: 'Issues',
    permissions: ['issue.view', 'issue.create', 'issue.edit', 'issue.remove'],
  },
  {
    label: 'Members',
    permissions: ['members.invite', 'members.remove', 'members.assignRole'],
  },
  {
    label: 'Project Settings',
    permissions: ['settings.manage', 'template.export', 'template.apply'],
  },
  {
    label: 'Project',
    permissions: ['project.archive', 'project.restore'],
  },
];

export const SYSTEM_ISSUE_FIELDS: Array<{
  id: SystemIssueFieldId;
  label: string;
}> = [
  { id: 'name', label: 'Name' },
  { id: 'description', label: 'Description' },
  { id: 'type', label: 'Type' },
  { id: 'priority', label: 'Priority' },
  { id: 'assignee', label: 'Assignee' },
  { id: 'startDate', label: 'Start date' },
  { id: 'dueDate', label: 'Due date' },
  { id: 'attachments', label: 'Attachments' },
];
