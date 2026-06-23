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
  | 'author'
  | 'startDate'
  | 'dueDate'
  | 'attachments';

export type CustomFieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'checkbox'
  | 'enum'
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

export interface DateFieldDefinition extends BaseCustomFieldDefinition {
  type: 'date';
  config: Record<string, never>;
}

export interface CheckboxFieldDefinition extends BaseCustomFieldDefinition {
  type: 'checkbox';
  config: Record<string, never>;
}

export interface EnumFieldOption {
  id: string;
  label: string;
  color: string;
}

export interface EnumFieldDefinition extends BaseCustomFieldDefinition {
  type: 'enum';
  config: {
    options: EnumFieldOption[];
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
  | DateFieldDefinition
  | CheckboxFieldDefinition
  | EnumFieldDefinition
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
  transitionRulesEnabled: boolean;
  statuses: CustomStatus[];
  transitions: Transition[];
}

export interface ProjectConfig {
  projectId: number;
  roles: CustomRole[];
  lifecycle: LifecycleConfig;
  customFields: CustomFieldDefinition[];
  fieldOrder: string[];
  boardCardFieldIds: string[];
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
    permissions: [
      'members.view',
      'members.invite',
      'members.remove',
      'members.assignRole',
    ],
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
  { id: 'author', label: 'Author' },
  { id: 'startDate', label: 'Start date' },
  { id: 'dueDate', label: 'Due date' },
  { id: 'attachments', label: 'Attachments' },
];
