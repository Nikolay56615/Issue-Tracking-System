import type { CreateIssueRequest } from '../model';
import { axiosInstance } from '@/api/instance.ts';
import type {
  ChangeIssueStatusRequest,
  GetBoardRequest,
  Issue,
  LifecycleGraph,
  UploadResponse,
} from '@/features/board/model/board.types.ts';

export const createIssue = async (request: CreateIssueRequest) => {
  const { data } = await axiosInstance.post<Issue>('/issues', request);

  return data;
};

export const getBoard = async ({ projectId, filters }: GetBoardRequest) => {
  const { data } = await axiosInstance.post<Issue[]>(
    'issues/board?projectId=' + projectId,
    filters
  );

  return data;
};

export const changeIssueStatus = async ({
  id,
  newStatus,
}: ChangeIssueStatusRequest) => {
  await axiosInstance.put(`/issues/${id}/status`, { newStatus });
};

export const uploadAttachment = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await axiosInstance.post<UploadResponse>(
    '/attachments/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return data;
};

export const deleteIssue = async (id: number) => {
  await axiosInstance.delete(`/issues/${id}`);
};

export const getLifecycleGraph = async () => {
  const { data } = await axiosInstance.get<LifecycleGraph>(`/lifecycle/graph`);

  return data;
};

export const downloadAttachment = async (filename: string) => {
  return await axiosInstance.get(`/attachments/download`, {
    params: { filename },
    responseType: 'blob',
  });
};

export const deleteAttachment = async (filename: string) => {
  await axiosInstance.delete(`/api/attachments/delete`, {
    params: { filename },
  });
};
