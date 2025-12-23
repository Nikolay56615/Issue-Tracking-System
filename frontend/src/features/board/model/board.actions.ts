import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  ChangeIssueStatusRequest,
  CreateIssueRequest,
  IssueStatus,
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
