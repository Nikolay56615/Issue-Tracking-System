import type { CreateIssueRequest } from '../model';
import { axiosInstance } from '@/api/instance.ts';
import type {
  GetBoardRequest,
  Issue,
} from '@/features/board/model/board.types.ts';

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
  const { data } = await axiosInstance.post<Issue[]>(
    'issues/board?projectId=' + projectId
  );

  return data;
};
