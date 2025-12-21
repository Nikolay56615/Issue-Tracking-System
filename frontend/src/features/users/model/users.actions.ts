import { createAsyncThunk } from '@reduxjs/toolkit';
import type { UserProfile } from '@/features/profile/model/profile.types.ts';
import { AxiosError } from 'axios';
import { UsersRequests } from '@/features/users/api';

export const getProjectUsers = createAsyncThunk<
  UserProfile[],
  number,
  { rejectValue: string }
>('getProjectUsers', async (projectId, { rejectWithValue }) => {
  try {
    return await UsersRequests.getProjectUsers(projectId);
  } catch (e) {
    if (e instanceof AxiosError) {
      return rejectWithValue(e.response?.data?.message || 'Error happened');
    }

    return rejectWithValue('Error happened');
  }
});
