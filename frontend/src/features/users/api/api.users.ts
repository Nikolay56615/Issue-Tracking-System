import { axiosInstance } from '@/api/instance.ts';
import type { UserProfileWithRole } from '@/features/profile';

export const getProjectUsers = async (projectId: number) => {
  const { data } = await axiosInstance.get<UserProfileWithRole[]>(
    `/projects/${projectId}/members`
  );

  return data;
};
