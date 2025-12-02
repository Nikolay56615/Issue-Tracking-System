import type { Project } from '../project/types.ts';

export interface UserProfile {
  id: string;
  name: string;
  projects: Project[];
}
