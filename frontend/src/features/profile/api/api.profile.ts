import { axiosInstance } from '@/api/instance.ts';
import type {
  CreateProjectRequest,
  CurrentProjectRoleResponse,
  InviteUserRequest,
  Project,
  UpdateProjectMemberRoleRequest,
  UserProfile,
} from '@/features/profile/model/profile.types.ts';
import { normalizeProjectRoleResponse } from '@/features/profile/model/project-role.utils.ts';

export const fetchProjects = async () => {
  const { data } = await axiosInstance.get<Project[]>('/projects');

  return data;
};

export const getCurrentUser = async () => {
  const { data } = await axiosInstance.get<UserProfile>('/users/me');

  return data;
};

export const createProject = async ({
  name,
  templateProjectId,
}: CreateProjectRequest) => {
  const { data } = await axiosInstance.post<Project>('/projects', {
    name,
    templateProjectId,
  });

  return data;
};

export const getMyRole = async (id: number) => {
  const { data } = await axiosInstance.get<unknown>(
    `/projects/${id}/my-role`
  );

  return normalizeProjectRoleResponse(
    data,
    id
  ) satisfies CurrentProjectRoleResponse;
};

export const inviteUser = async ({
  projectId,
  userId,
  roleId,
}: InviteUserRequest) => {
  const { data } = await axiosInstance.post(`/projects/${projectId}/invite`, {
    userId,
    roleId,
  });

  return data;
};

export const updateProjectMemberRole = async ({
  projectId,
  userId,
  roleId,
}: UpdateProjectMemberRoleRequest) => {
  const { data } = await axiosInstance.put(
    `/projects/${projectId}/members/${userId}/role`,
    {
      roleId,
    }
  );

  return data;
};

export const removeProjectMember = async (projectId: number, userId: number) => {
  await axiosInstance.delete(`/projects/${projectId}/members/${userId}`);
};

export const searchUsers = async (query: string) => {
  const { data } = await axiosInstance.get<UserProfile[]>(
    `/users/search?query=${query}`
  );

  return data;
};

export const getInviteCandidates = async (
  projectId: number,
  query: string
) => {
  const { data } = await axiosInstance.get<UserProfile[]>(
    `/projects/${projectId}/invite-candidates`,
    {
      params: { query },
    }
  );

  return data;
};

export const archiveProject = async (id: number) => {
  await axiosInstance.post(`/projects/${id}/archive`);
};

export const restoreProject = async (id: number) => {
  await axiosInstance.post(`/projects/${id}/restore`);
};
