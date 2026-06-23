import type {
  CurrentProjectRoleResponse,
  CustomRole,
  PermissionKey,
} from './profile.types.ts';

const ALL_PERMISSIONS: PermissionKey[] = [
  'issue.view',
  'issue.create',
  'issue.edit',
  'issue.remove',
  'members.view',
  'members.invite',
  'members.remove',
  'members.assignRole',
  'settings.manage',
  'project.archive',
  'project.restore',
  'template.export',
  'template.apply',
];

const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionKey[]> = {
  OWNER: ALL_PERMISSIONS,
  GLOBAL_ADMIN: ALL_PERMISSIONS,
  ADMIN: [
    'issue.view',
    'issue.create',
    'issue.edit',
    'issue.remove',
    'members.invite',
    'members.remove',
    'members.assignRole',
    'settings.manage',
    'template.export',
    'template.apply',
  ],
  REVIEWER: ['issue.view', 'issue.create', 'issue.edit', 'issue.remove'],
  WORKER: ['issue.view', 'issue.create', 'issue.edit'],
};

const DEFAULT_ROLE_NAMES: Record<string, string> = {
  OWNER: 'Owner',
  GLOBAL_ADMIN: 'Global Admin',
  ADMIN: 'Admin',
  REVIEWER: 'Reviewer',
  WORKER: 'Worker',
};

const isRoleLike = (value: unknown): value is Partial<CustomRole> => {
  if (value === null || typeof value !== 'object') return false;
  const role = value as Partial<CustomRole>;

  return (
    typeof role.id === 'string' &&
    typeof role.name === 'string' &&
    Array.isArray(role.permissions)
  );
};

const normalizeRole = (role: Partial<CustomRole>, projectId: number) => ({
  id: role.id as string,
  projectId: role.projectId ?? projectId,
  name: role.name as string,
  permissions: role.permissions as PermissionKey[],
});

const roleFromId = (roleId: string, projectId: number): CustomRole => ({
  id: roleId,
  projectId,
  name: DEFAULT_ROLE_NAMES[roleId] ?? roleId,
  permissions: DEFAULT_ROLE_PERMISSIONS[roleId] ?? [],
});

export const normalizeProjectRoleResponse = (
  response: unknown,
  projectId: number
): CurrentProjectRoleResponse => {
  if (typeof response === 'string') {
    return { role: roleFromId(response, projectId) };
  }

  if (isRoleLike(response)) {
    return { role: normalizeRole(response, projectId) };
  }

  if (response !== null && typeof response === 'object' && 'role' in response) {
    const role = (response as { role: unknown }).role;
    if (typeof role === 'string') {
      return { role: roleFromId(role, projectId) };
    }
    if (isRoleLike(role)) {
      return { role: normalizeRole(role, projectId) };
    }
  }

  throw new Error('Invalid project role response');
};
