import type { Project } from '@/features/project';

export interface UserProfile {
  id: string;
  name: string;
  projects: Project[];
}
