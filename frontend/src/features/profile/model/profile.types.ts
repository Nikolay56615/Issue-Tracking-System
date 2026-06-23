export type PermissionKey =
  | 'issue.view'
  | 'issue.create'
  | 'issue.edit'
  | 'issue.remove'
  | 'members.invite'
  | 'members.remove'
  | 'members.assignRole'
  | 'settings.manage'
  | 'project.archive'
  | 'project.restore'
  | 'template.export'
  | 'template.apply';

export interface UserProfile {
  id: number;
  email: string;
  username: string;
  globalAdmin?: boolean;
  active?: boolean;
}

export interface CustomRole {
  id: string;
  projectId: number;
  name: string;
  permissions: PermissionKey[];
}

export interface UserProfileWithRole {
  id: number;
  email: string;
  name: string;
  roleId: string;
  roleName: string;
  permissions: PermissionKey[];
}

export interface Project {
  id: number;
  name: string;
  ownerId: number;
  archived: boolean;
}

export type ProjectPermissionsById = Record<number, PermissionKey[]>;

export interface CurrentProjectRoleResponse {
  role: CustomRole;
}

export interface CreateProjectRequest {
  name: string;
  templateProjectId?: number;
}

export interface InviteUserRequest {
  projectId: number;
  userId: number;
  roleId: string;
}

export interface UpdateProjectMemberRoleRequest {
  projectId: number;
  userId: number;
  roleId: string;
}
