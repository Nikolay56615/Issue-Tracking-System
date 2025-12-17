import type { CreateIssueRequest } from '@/features/board/api/api.const.ts';
import { axiosInstance } from '@/api/instance.ts';
import type { GetBoardRequest } from '@/features/board/model/board.types.ts';

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

export const getBoard = async ({ projectId }: GetBoardRequest) => {
  const { data } = await axiosInstance.get('issues/board', {
    params: { projectId },
  });

  return data;
};
