import type { Issue } from '@/features/board/model/board.types.ts';
import type {
  CustomFieldDefinition,
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
  value: number | string | null | undefined,
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
