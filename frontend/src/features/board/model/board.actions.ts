import { createAsyncThunk } from '@reduxjs/toolkit';
import type { CreateIssueRequest } from '@/features/board/api/api.const.ts';
import type { Issue } from '@/features/board/model/board.types.ts';
import { BoardRequests } from '@/features/board/api';
import { AxiosError } from 'axios';

export const createIssue = createAsyncThunk<
  Issue,
  CreateIssueRequest,
  { rejectValue: string }
>('issues/create', async (issueData, { rejectWithValue }) => {
  try {
    const issueId = await BoardRequests.createIssue(issueData);
    return { id: issueId, status: 'backlog', ...issueData };
  } catch (e) {
    if (e instanceof AxiosError) {
      return rejectWithValue(e.response?.data?.message || 'Error happened');
    }

    return rejectWithValue('Error happened');
  }
});
