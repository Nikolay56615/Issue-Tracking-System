import type { UserProfile } from '../profile/types.ts';

export interface Project {
  id: string;
  name: string;
  description?: string;
  users: UserProfile[];
}
