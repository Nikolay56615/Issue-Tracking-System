import { axiosInstance } from '@/api/instance.ts';
import type { UserProfile } from '@/features/profile';

export const getProjectUsers = async (projectId: number) => {
  const { data } = await axiosInstance.get<UserProfile[]>(
    `/projects/${projectId}/members`
  );

  return data;
};
