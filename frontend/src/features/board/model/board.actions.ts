import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  ChangeIssueStatusRequest,
  CreateIssueRequest,
  IssueStatus,
  LifecycleGraph,
} from './board.types.ts';
import type {
  GetBoardRequest,
  Issue,
} from '@/features/board/model/board.types.ts';
import { BoardRequests } from '@/features/board/api';
import { AxiosError } from 'axios';

export const createIssue = createAsyncThunk<
  Issue,
  CreateIssueRequest,
  { rejectValue: string }
>('issues/create', async (issueData, { rejectWithValue }) => {
  try {
    return await BoardRequests.createIssue(issueData);
  } catch (e) {
    if (e instanceof AxiosError) {
      return rejectWithValue(e.response?.data?.message || 'Error happened');
    }

    return rejectWithValue('Error happened');
  }
});

export const getBoard = createAsyncThunk<
  Issue[],
  GetBoardRequest,
  { rejectValue: string }
>('board', async (request, { rejectWithValue }) => {
  try {
    return await BoardRequests.getBoard(request);
  } catch (e) {
    if (e instanceof AxiosError) {
      return rejectWithValue(e.response?.data?.message || 'Error happened');
    }

    return rejectWithValue('Error happened');
  }
});

export const changeIssueStatus = createAsyncThunk<
  void,
  ChangeIssueStatusRequest & { previousStatus: IssueStatus },
  { rejectValue: { message: string; previousStatus: IssueStatus } }
>('issue/change-status', async (request, { rejectWithValue }) => {
  try {
    await BoardRequests.changeIssueStatus(request);
  } catch (e) {
    if (e instanceof AxiosError) {
      return rejectWithValue({
        message: e.response?.data?.message || 'Error happened',
        previousStatus: request.previousStatus,
      });
    }
    return rejectWithValue({
      message: 'Error happened',
      previousStatus: request.previousStatus,
    });
  }
});

export const uploadAttachment = createAsyncThunk<
  string,
  File,
  { rejectValue: string }
>('attachments/upload', async (file, { rejectWithValue }) => {
  try {
    const { url } = await BoardRequests.uploadAttachment(file);

    return url;
  } catch (e) {
    if (e instanceof AxiosError) {
      return rejectWithValue(e.response?.data?.message || 'Error happened');
    }

    return rejectWithValue('Error happened');
  }
});

export const deleteIssue = createAsyncThunk<
  void,
  number,
  { rejectValue: string }
>('issues/delete', async (id, { rejectWithValue }) => {
  try {
    await BoardRequests.deleteIssue(id);
  } catch (e) {
    if (e instanceof AxiosError) {
      return rejectWithValue(e.response?.data?.message || 'Error happened');
    }

    return rejectWithValue('Error happened');
  }
});

export const getLifecycleGraph = createAsyncThunk<
  LifecycleGraph,
  void,
  { rejectValue: string }
>('board/lifecycle', async (_, { rejectWithValue }) => {
  try {
    return await BoardRequests.getLifecycleGraph();
  } catch (e) {
    if (e instanceof AxiosError) {
      return rejectWithValue(e.response?.data?.message || 'Error happened');
    }
    return rejectWithValue('Error happened');
  }
});

export const downloadAttachment = createAsyncThunk<
  { filename: string; blob: Blob },
  string,
  { rejectValue: string }
>('attachments/download', async (filename, { rejectWithValue }) => {
  try {
    const res = await BoardRequests.downloadAttachment(filename);
    const blob = res.data as Blob;

    const header = res.headers['content-disposition'] as string | undefined;
    let realName = filename;
    if (header) {
      const idx = header.toLowerCase().indexOf('filename=');
      if (idx !== -1) {
        realName = header
          .substring(idx + 'filename='.length)
          .trim()
          .replace(/"/g, '');
      }
    }

    return { filename: realName, blob };
  } catch (e) {
    if (e instanceof AxiosError) {
      return rejectWithValue(e.response?.data?.message || 'Error happened');
    }
    return rejectWithValue('Error happened');
  }
});

export const deleteAttachment = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('attachments/deleteAttachment', async (filename, { rejectWithValue }) => {
  try {
    await BoardRequests.deleteAttachment(filename);
    return filename;
  } catch (e) {
    if (e instanceof AxiosError) {
      return rejectWithValue(e.response?.data?.message || 'Error happened');
    }
    return rejectWithValue('Error happened');
  }
});
