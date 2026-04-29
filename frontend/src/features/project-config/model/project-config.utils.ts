import type { Issue } from '@/features/board/model/board.types.ts';
import type {
  CustomFieldDefinition,
  CustomStatus,
  ProjectConfig,
  Transition,
  TransitionCondition,
} from '@/features/project-config/model/project-config.types.ts';
import type {
  CustomRole,
  PermissionKey,
  UserProfileWithRole,
} from '@/features/profile/model/profile.types.ts';

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
