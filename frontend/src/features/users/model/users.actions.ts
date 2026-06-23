import { createAsyncThunk } from '@reduxjs/toolkit';
import type { UserProfileWithRole } from '@/features/profile';
import { AxiosError } from 'axios';
import { UsersRequests } from '@/features/users/api';
import type { UpdateProjectMemberRoleRequest } from '@/features/profile/model/profile.types.ts';
import type { RootState } from '@/store/types.ts';

export const getProjectUsers = createAsyncThunk<
  UserProfileWithRole[],
  number,
  { rejectValue: string }
>(
  'getProjectUsers',
  async (projectId, { rejectWithValue }) => {
    try {
      return await UsersRequests.getProjectUsers(projectId);
    } catch (e) {
      if (e instanceof AxiosError) {
        return rejectWithValue(e.response?.data?.message || 'Error happened');
      }

      return rejectWithValue('Error happened');
    }
  },
  {
    condition: (projectId, { getState }) => {
      const { users } = getState() as RootState;

      if (users.loading === 'pending' && users.projectId === projectId) {
        return false;
      }

      return !(users.loading === 'succeeded' && users.projectId === projectId);
    },
  }
);

export const updateProjectUserRole = createAsyncThunk<
  UserProfileWithRole,
  UpdateProjectMemberRoleRequest,
  { rejectValue: string }
>('users/updateRole', async (request, { rejectWithValue }) => {
  try {
    return await UsersRequests.updateProjectUserRole(request);
  } catch (e) {
    if (e instanceof AxiosError) {
      return rejectWithValue(e.response?.data?.message || 'Error happened');
    }

    return rejectWithValue('Error happened');
  }
});

export const removeProjectUser = createAsyncThunk<
  { projectId: number; userId: number },
  { projectId: number; userId: number },
  { rejectValue: string }
>('users/remove', async (request, { rejectWithValue }) => {
  try {
    await UsersRequests.removeProjectUser(request.projectId, request.userId);
    return request;
  } catch (e) {
    if (e instanceof AxiosError) {
      return rejectWithValue(e.response?.data?.message || 'Error happened');
    }

    return rejectWithValue('Error happened');
  }
});
