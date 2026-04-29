import { axiosInstance } from '@/api/instance.ts';
import type { UserProfileWithRole } from '@/features/profile';
import type { UpdateProjectMemberRoleRequest } from '@/features/profile/model/profile.types.ts';

export const getProjectUsers = async (projectId: number) => {
  const { data } = await axiosInstance.get<UserProfileWithRole[]>(
    `/projects/${projectId}/members`
  );

  return data;
};

export const updateProjectUserRole = async ({
  projectId,
  userId,
  roleId,
}: UpdateProjectMemberRoleRequest) => {
  const { data } = await axiosInstance.put<UserProfileWithRole>(
    `/projects/${projectId}/members/${userId}/role`,
    {
      roleId,
    }
  );

  return data;
};

export const removeProjectUser = async (projectId: number, userId: number) => {
  await axiosInstance.delete(`/projects/${projectId}/members/${userId}`);
};
