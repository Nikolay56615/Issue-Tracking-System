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