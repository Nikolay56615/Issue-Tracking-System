import { createAsyncThunk } from '@reduxjs/toolkit';
import type { CreateIssueRequest } from './board.types.ts';
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
    const issueId = await BoardRequests.createIssue(issueData);
    return { id: issueId, status: 'BACKLOG', ...issueData };
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
