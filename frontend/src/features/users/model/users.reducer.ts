import type { UserProfile } from '@/features/profile';
import { createSlice } from '@reduxjs/toolkit';
import { getProjectUsers } from '@/features/users/model/users.actions.ts';

interface UsersState {
  users: UserProfile[];
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: UsersState = {
  users: [],
  loading: 'idle',
  error: null,
};

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getProjectUsers.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(getProjectUsers.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.users = action.payload;
      })
      .addCase(getProjectUsers.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload ?? 'Failed to fetch users';
      });
  },
});

export const usersReducer = usersSlice.reducer;
