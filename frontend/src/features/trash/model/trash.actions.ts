import { createAsyncThunk } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import type { Issue } from '@/features/board/model';
import { TrashRequests } from '@/features/trash/api';

export const getTrash = createAsyncThunk<
  Issue[],
  number,
  { rejectValue: string }
>('trash/get', async (projectId, { rejectWithValue }) => {
  try {
    return await TrashRequests.getTrash(projectId);
  } catch (e) {
    if (e instanceof AxiosError) {
      return rejectWithValue(e.response?.data?.message || 'Error happened');
    }
    return rejectWithValue('Error happened');
  }
});

export const restoreIssue = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>('trash/restore', async (issueId, { rejectWithValue }) => {
  try {
    await TrashRequests.restoreIssue(issueId);
    return issueId;
  } catch (e) {
    if (e instanceof AxiosError) {
      return rejectWithValue(e.response?.data?.message || 'Error happened');
    }
    return rejectWithValue('Error happened');
  }
});
