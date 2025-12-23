export interface UserProfile {
  id: number;
  email: string;
  username: string;
}

export interface UserProfileWithRole {
  id: number;
  email: string;
  name: string;
  role: UserRole;
}

export interface Project {
  id: number;
  name: string;
  ownerId: number;
  archived: boolean;
}

export interface CreateProjectRequest {
  name: string;
}

export interface InviteUserRequest {
  projectId: number;
  userId: number;
  role: UserRole;
}

export type UserRole = 'WORKER' | 'REVIEWER' | 'ADMIN' | 'OWNER';
