import type { Issue } from '@/features/board/model/board.types.ts';
import type {
  CustomFieldDefinition,
  CustomFieldType,
  CustomStatus,
  ProjectConfig,
  SystemIssueFieldId,
  Transition,
  TransitionCondition,
} from '@/features/project-config/model/project-config.types.ts';
import { SYSTEM_ISSUE_FIELDS } from '@/features/project-config/model/project-config.types.ts';
import type {
  CustomRole,
  PermissionKey,
  UserProfileWithRole,
} from '@/features/profile/model/profile.types.ts';

export interface OrderedIssueFieldEntry {
  id: string;
  label: string;
  kind: 'system' | 'custom';
  systemFieldId?: SystemIssueFieldId;
  customField?: CustomFieldDefinition;
}

export const FIELD_TYPE_OPTIONS: CustomFieldType[] = [
  'text',
  'number',
  'date',
  'checkbox',
  'user_reference',
  'issue_reference',
];

export const CONDITION_EDITOR_OPTIONS = [
  { value: 'role', label: 'Role' },
  { value: 'user_source', label: 'User source' },
] as const;

const SYSTEM_FIELD_LABELS = new Map(
  SYSTEM_ISSUE_FIELDS.map((field) => [field.id, field.label])
);

export const getDefaultFieldOrder = (
  customFields: CustomFieldDefinition[]
): string[] => [
  ...SYSTEM_ISSUE_FIELDS.map((field) => field.id),
  ...customFields.map((field) => field.id),
];

export const getNormalizedFieldOrder = (
  config: Pick<ProjectConfig, 'customFields' | 'fieldOrder'> | null | undefined
) => {
  const fallback = getDefaultFieldOrder(config?.customFields ?? []);

  if (!config?.fieldOrder?.length) {
    return fallback;
  }

  const validIds = new Set(fallback);
  const ordered = config.fieldOrder.filter((fieldId) => validIds.has(fieldId));
  const missing = fallback.filter((fieldId) => !ordered.includes(fieldId));

  return [...ordered, ...missing];
};

export const getSystemFieldLabel = (fieldId: SystemIssueFieldId) =>
  SYSTEM_FIELD_LABELS.get(fieldId) ?? fieldId;

export const isSystemFieldId = (fieldId: string): fieldId is SystemIssueFieldId =>
  SYSTEM_FIELD_LABELS.has(fieldId as SystemIssueFieldId);

export const getOrderedIssueFields = (
  config: ProjectConfig | null
): OrderedIssueFieldEntry[] => {
  if (config == null) {
    return [];
  }

  const customFieldsById = new Map(
    config.customFields.map((field) => [field.id, field])
  );

  return getNormalizedFieldOrder(config).reduce<OrderedIssueFieldEntry[]>(
    (entries, fieldId) => {
      if (isSystemFieldId(fieldId)) {
        entries.push({
          id: fieldId,
          label: getSystemFieldLabel(fieldId),
          kind: 'system',
          systemFieldId: fieldId,
        });

        return entries;
      }

      const customField = customFieldsById.get(fieldId);
      if (customField) {
        entries.push({
          id: customField.id,
          label: customField.name,
          kind: 'custom',
          customField,
        });
      }

      return entries;
    },
    []
  );
};

export const getOrderedCustomFields = (
  config: ProjectConfig | null
): CustomFieldDefinition[] =>
  getOrderedIssueFields(config)
    .filter((entry) => entry.kind === 'custom')
    .map((entry) => entry.customField)
    .filter((field): field is CustomFieldDefinition => field != null);

export const getOrderedStatuses = (config: ProjectConfig | null): CustomStatus[] =>
  [...(config?.lifecycle.statuses ?? [])].sort(
    (left, right) => left.displayOrder - right.displayOrder
  );

export const isTransitionRulesEnabled = (config: ProjectConfig | null) =>
  config?.lifecycle.transitionRulesEnabled !== false;

export const getStatusById = (config: ProjectConfig | null, statusId: string) =>
  config?.lifecycle.statuses.find((status) => status.id === statusId);

export const getStatusLabel = (config: ProjectConfig | null, statusId: string) =>
  getStatusById(config, statusId)?.name ?? statusId;

export const getCustomFieldById = (
  config: ProjectConfig | null,
  fieldId: string
): CustomFieldDefinition | undefined =>
  config?.customFields.find((field) => field.id === fieldId);

export const getRoleById = (
  config: ProjectConfig | null,
  roleId: string
): CustomRole | undefined => config?.roles.find((role) => role.id === roleId);

export const hasPermission = (
  role: CustomRole | null | undefined,
  permission: PermissionKey
) => Boolean(role?.permissions.includes(permission));

export const getAssignableMembersForField = (
  field: CustomFieldDefinition,
  members: UserProfileWithRole[]
) => {
  if (field.type !== 'user_reference') {
    return members;
  }

  if (!field.config.allowedRoleIds.length) {
    return members;
  }

  return members.filter((member) =>
    field.config.allowedRoleIds.includes(member.roleId)
  );
};

export const formatCustomFieldValue = (
  field: CustomFieldDefinition,
  value: boolean | number | string | null | undefined,
  params: {
    issues?: Issue[];
    members?: UserProfileWithRole[];
  } = {}
) => {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  if (field.type === 'user_reference') {
    const member = params.members?.find((item) => item.id === value);
    return member?.name ?? `User #${value}`;
  }

  if (field.type === 'issue_reference') {
    const issue = params.issues?.find((item) => item.id === value);
    return issue?.name ?? `Issue #${value}`;
  }

  if (field.type === 'checkbox') {
    return value === true ? 'Checked' : 'Unchecked';
  }

  return String(value);
};

export const transitionHasConditionType = (
  transition: Transition,
  type: TransitionCondition['type']
) => transition.conditions.some((condition) => condition.type === type);

export const isTransitionAllowedForIssue = (params: {
  transition: Transition;
  issue: Issue;
  currentUserId: number | null;
  currentRoleId: string | null;
}) => {
  const { transition, issue, currentUserId, currentRoleId } = params;

  if (currentUserId == null) {
    return false;
  }

  return transition.conditions.some((condition) => {
    if (condition.type === 'role') {
      return condition.roleId === currentRoleId;
    }

    if (condition.type === 'author') {
      return issue.authorId === currentUserId;
    }

    if (condition.type === 'assignee') {
      return issue.assigneeIds.includes(currentUserId);
    }

    if (condition.type === 'field_user_reference') {
      return issue.customFields?.[condition.customFieldId] === currentUserId;
    }

    return false;
  });
};

export const formatFieldTypeLabel = (type: CustomFieldType) =>
  type.replace('_', ' ');

export const formatConditionLabel = (type: TransitionCondition['type']) =>
  type.replace(/_/g, ' ');

export const formatPermissionLabel = (permission: string) =>
  permission.replace(/^[^.]+\./, '');

export const cloneConfig = (config: ProjectConfig) => structuredClone(config);

export const getInitialRole = (config: ProjectConfig) =>
  config.roles.find((role) => role.permissions.includes('settings.manage')) ??
  config.roles[0];

export const createRoleDraft = (projectId: number): CustomRole => ({
  id: `project-${projectId}-role-${Date.now()}`,
  projectId,
  name: 'New Role',
  permissions: ['issue.view'],
});

export const createStatusDraft = (
  projectId: number,
  displayOrder: number
): CustomStatus => ({
  id: `project-${projectId}-status-${Date.now()}`,
  projectId,
  name: `Status ${displayOrder}`,
  displayOrder,
  color: '#64748b',
});

export const createFieldDraft = (projectId: number): CustomFieldDefinition => ({
  id: `project-${projectId}-field-${Date.now()}`,
  projectId,
  name: 'New Field',
  type: 'text',
  required: false,
  config: {
    maxLength: 80,
  },
});

export const createTransitionDraft = (
  config: ProjectConfig
): Transition | null => {
  if (config.lifecycle.statuses.length < 2 || config.roles.length === 0) {
    return null;
  }

  return {
    id: `project-${config.projectId}-transition-${Date.now()}`,
    fromStatusId: config.lifecycle.statuses[0].id,
    toStatusId: config.lifecycle.statuses[1].id,
    conditions: [
      {
        type: 'role',
        roleId: getInitialRole(config).id,
      },
    ],
  };
};

export const getIssueCountForStatus = (issues: Issue[], statusId: string) =>
  issues.filter((issue) => issue.status === statusId).length;

export const hasValuesForField = (issues: Issue[], fieldId: string) =>
  issues.some((issue) => {
    const value = issue.customFields?.[fieldId];
    return value !== null && value !== undefined && value !== '';
  });

export const toTextConfig = (field: CustomFieldDefinition) => ({
  ...field,
  type: 'text' as const,
  config: {
    maxLength: field.type === 'text' ? field.config.maxLength : 80,
  },
});

export const toNumberConfig = (field: CustomFieldDefinition) => ({
  ...field,
  type: 'number' as const,
  config: {
    min: field.type === 'number' ? field.config.min : 1,
    max: field.type === 'number' ? field.config.max : 100,
    isInteger:
      field.type === 'number' ? (field.config.isInteger ?? true) : true,
  },
});

export const toDateConfig = (field: CustomFieldDefinition) => ({
  ...field,
  type: 'date' as const,
  config: {},
});

export const toCheckboxConfig = (field: CustomFieldDefinition) => ({
  ...field,
  type: 'checkbox' as const,
  config: {},
});

export const toUserReferenceConfig = (
  field: CustomFieldDefinition,
  roles: CustomRole[]
) => ({
  ...field,
  type: 'user_reference' as const,
  config: {
    allowedRoleIds:
      field.type === 'user_reference'
        ? field.config.allowedRoleIds
        : roles[0]
          ? [roles[0].id]
          : [],
  },
});

export const toIssueReferenceConfig = (field: CustomFieldDefinition) => ({
  ...field,
  type: 'issue_reference' as const,
  config: {},
});

export const switchFieldType = (
  field: CustomFieldDefinition,
  type: CustomFieldType,
  roles: CustomRole[]
): CustomFieldDefinition => {
  if (type === 'text') return toTextConfig(field);
  if (type === 'number') return toNumberConfig(field);
  if (type === 'date') return toDateConfig(field);
  if (type === 'checkbox') return toCheckboxConfig(field);
  if (type === 'user_reference') return toUserReferenceConfig(field, roles);
  return toIssueReferenceConfig(field);
};

export const createCondition = (
  type: TransitionCondition['type'],
  config: ProjectConfig
): TransitionCondition => {
  if (type === 'role') {
    return {
      type,
      roleId: getInitialRole(config).id,
    };
  }

  if (type === 'field_user_reference') {
    const field = config.customFields.find(
      (item) => item.type === 'user_reference'
    );
    return {
      type,
      customFieldId: field?.id ?? '',
    };
  }

  return { type };
};

export const getConditionEditorKind = (condition: TransitionCondition) =>
  condition.type === 'role' ? 'role' : 'user_source';

export const getUserSourceValue = (condition: TransitionCondition) => {
  if (condition.type === 'field_user_reference') {
    return `field:${condition.customFieldId}`;
  }

  return condition.type;
};

export const createConditionFromUserSource = (
  value: string,
  config: ProjectConfig
): TransitionCondition => {
  if (value === 'author') {
    return { type: 'author' };
  }

  if (value === 'assignee') {
    return { type: 'assignee' };
  }

  const fallbackField = config.customFields.find(
    (field) => field.type === 'user_reference'
  );

  return {
    type: 'field_user_reference',
    customFieldId: value.replace(/^field:/, '') || fallbackField?.id || '',
  };
};

export const getRoleMemberCount = (
  users: Array<{ roleId: string }>,
  roleId: string
) => users.filter((user) => user.roleId === roleId).length;

export const describeTransitionCondition = (
  condition: TransitionCondition,
  config: ProjectConfig
) => {
  if (condition.type === 'role') {
    return (
      config.roles.find((role) => role.id === condition.roleId)?.name ?? 'Role'
    );
  }

  if (condition.type === 'field_user_reference') {
    return (
      config.customFields.find((field) => field.id === condition.customFieldId)
        ?.name ?? 'User field'
    );
  }

  return formatConditionLabel(condition.type);
};

export const getFieldEntryMeta = (
  fieldEntry: OrderedIssueFieldEntry,
  issues: Issue[]
) => {
  if (fieldEntry.kind === 'system') {
    if (fieldEntry.systemFieldId === 'author') {
      return 'System field · read only';
    }

    return 'System field';
  }

  const customField = fieldEntry.customField;
  if (!customField) {
    return 'Custom field';
  }

  if (hasValuesForField(issues, customField.id)) {
    return 'Has issue values';
  }

  return customField.required ? 'Required' : 'Optional';
};
