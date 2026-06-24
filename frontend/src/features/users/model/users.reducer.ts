import { createSlice } from '@reduxjs/toolkit';
import {
  getProjectUsers,
  removeProjectUser,
  updateProjectUserRole,
} from '@/features/users/model/users.actions.ts';
import type { UserProfileWithRole } from '@/features/profile';

interface UsersState {
  users: UserProfileWithRole[];
  projectId: number | null;
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  roleUpdateLoadingByUserId: Record<number, boolean>;
  removingByUserId: Record<number, boolean>;
  error: string | null;
}

const initialState: UsersState = {
  users: [],
  projectId: null,
  loading: 'idle',
  roleUpdateLoadingByUserId: {},
  removingByUserId: {},
  error: null,
};

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getProjectUsers.pending, (state, action) => {
        state.loading = 'pending';
        state.projectId = action.meta.arg;
        state.error = null;
      })
      .addCase(getProjectUsers.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.projectId = action.meta.arg;
        state.users = action.payload;
      })
      .addCase(getProjectUsers.rejected, (state, action) => {
        state.loading = 'failed';
        state.projectId = action.meta.arg;
        state.error = action.payload ?? 'Failed to fetch users';
      })
      .addCase(updateProjectUserRole.pending, (state, action) => {
        state.roleUpdateLoadingByUserId[action.meta.arg.userId] = true;
      })
      .addCase(updateProjectUserRole.fulfilled, (state, action) => {
        state.roleUpdateLoadingByUserId[action.payload.id] = false;
        const index = state.users.findIndex((user) => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      .addCase(updateProjectUserRole.rejected, (state, action) => {
        state.roleUpdateLoadingByUserId[action.meta.arg.userId] = false;
      })
      .addCase(removeProjectUser.pending, (state, action) => {
        state.removingByUserId[action.meta.arg.userId] = true;
      })
      .addCase(removeProjectUser.fulfilled, (state, action) => {
        state.removingByUserId[action.payload.userId] = false;
        state.users = state.users.filter((user) => user.id !== action.payload.userId);
      })
      .addCase(removeProjectUser.rejected, (state, action) => {
        state.removingByUserId[action.meta.arg.userId] = false;
      });
  },
});

export const usersReducer = usersSlice.reducer;
