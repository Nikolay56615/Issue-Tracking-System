export interface UserProfile {
  id: number;
  email: string;
  username: string;
}

export interface Project {
  id: number;
  name: string;
  ownerId: number;
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
