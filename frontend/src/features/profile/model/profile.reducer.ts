import { createSlice } from '@reduxjs/toolkit';
import type {Project} from "@/features/profile/model/profile.types.ts";
import { fetchProjects } from './profile.actions.ts';

interface ProfileState {
  projects: Project[];
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: ProfileState = {
  projects: [],
  loading: 'idle',
  error: null,
};

const profileSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload ?? 'Failed to fetch projects';
      });
  },
});

export const profileReducer = profileSlice.reducer;