import { axiosInstance } from '@/api/instance.ts';
import type { CreateProjectRequest, Project, UserProfile, } from '@/features/profile/model/profile.types.ts';

export const fetchProjects = async () => {
  const { data } = await axiosInstance.get<Project[]>('/projects');

  return data;
};

export const getCurrentUser = async () => {
  const { data } = await axiosInstance.get<UserProfile>('/users/me');

  return data;
};

export const createProject = async ({ name }: CreateProjectRequest) => {
  const { data } = await axiosInstance.post<Project>('/projects', { name: name });

  return data
}