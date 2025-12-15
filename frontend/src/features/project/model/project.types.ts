import type { UserProfile } from '@/features/profile';

export interface Project {
  id: string;
  name: string;
  description?: string;
  users: UserProfile[];
}
