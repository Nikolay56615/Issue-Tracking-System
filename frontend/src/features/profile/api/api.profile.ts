import { axiosInstance } from '@/api/instance.ts';
import type {
  CreateProjectRequest,
  InviteUserRequest,
  Project,
  UserProfile,
} from '@/features/profile/model/profile.types.ts';

export const fetchProjects = async () => {
  const { data } = await axiosInstance.get<Project[]>('/projects');

  return data;
};

export const getCurrentUser = async () => {
  const { data } = await axiosInstance.get<UserProfile>('/users/me');

  return data;
};

export const createProject = async ({ name }: CreateProjectRequest) => {
  const { data } = await axiosInstance.post<Project>('/projects', {
    name: name,
  });

  return data;
};

export const inviteUser = async ({
  projectId,
  userId,
  role,
}: InviteUserRequest) => {
  const { data } = await axiosInstance.post(`/projects/${projectId}/invite`, {
    userId,
    role,
  });

  return data;
};

export const searchUsers = async (query: string) => {
  const { data } = await axiosInstance.get<UserProfile[]>(
    `/users/search?query=${query}`
  );

  return data;
};

export const archiveProject = async (id: number) => {
  await axiosInstance.post(`/projects/${id}/archive`);
};

export const restoreProject = async (id: number) => {
  await axiosInstance.post(`/projects/${id}/restore`);
};
