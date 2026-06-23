import type { Project, UserProfile } from '@/features/profile';

export interface AdminUser extends UserProfile {
  globalAdmin: boolean;
  active: boolean;
}

export type AdminProject = Project;
