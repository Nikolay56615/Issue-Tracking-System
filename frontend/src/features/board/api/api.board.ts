import type { CreateIssueRequest } from '../model';
import { axiosInstance } from '@/api/instance.ts';
import type {
  ChangeIssueStatusRequest,
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

export const getBoard = async ({ projectId, filters }: GetBoardRequest) => {
  const { data } = await axiosInstance.post<Issue[]>(
    'issues/board?projectId=' + projectId,
    { filters: filters }
  );

  return data;
};

export const changeIssueStatus = async ({
  id,
  newStatus,
}: ChangeIssueStatusRequest) => {
  await axiosInstance.put(`/issues/${id}/status`, { newStatus });
};
