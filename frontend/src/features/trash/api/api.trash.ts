import { axiosInstance } from '@/api/instance.ts';
import type { Issue } from '@/features/board/model';

export const getTrash = async (projectId: number) => {
  const { data } = await axiosInstance.get<Issue[]>(
    `/issues/trash?projectId=${projectId}`
  );

  return data;
};

export const restoreIssue = async (issueId: number) => {
  await axiosInstance.post(`/issues/${issueId}/restore`);
};
