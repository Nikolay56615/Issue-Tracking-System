import type { CreateIssueRequest } from '@/features/board/api/api.const.ts';
import { axiosInstance } from '@/api/instance.ts';

export const createIssue = async ({
  projectId,
  name,
  type,
  priority,
  description,
}: CreateIssueRequest) => {
  const { data } = await axiosInstance.post<number>('/issues', {
    projectId,
    name,
    type,
    priority,
    description,
  });

  return data;
};
