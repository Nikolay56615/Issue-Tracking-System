import { createSlice } from '@reduxjs/toolkit';
import type { ProjectConfig } from '@/features/project-config/model/project-config.types.ts';
import {
  fetchProjectConfig,
  saveProjectConfig,
} from '@/features/project-config/model/project-config.actions.ts';

interface ProjectConfigState {
  config: ProjectConfig | null;
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  saving: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
  saveError: string | null;
}

const initialState: ProjectConfigState = {
  config: null,
  loading: 'idle',
  saving: 'idle',
  error: null,
  saveError: null,
};

const projectConfigSlice = createSlice({
  name: 'projectConfig',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjectConfig.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(fetchProjectConfig.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.config = action.payload;
      })
      .addCase(fetchProjectConfig.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload ?? 'Failed to load project config';
      })
      .addCase(saveProjectConfig.pending, (state) => {
        state.saving = 'pending';
        state.saveError = null;
      })
      .addCase(saveProjectConfig.fulfilled, (state, action) => {
        state.saving = 'succeeded';
        state.config = action.payload;
      })
      .addCase(saveProjectConfig.rejected, (state, action) => {
        state.saving = 'failed';
        state.saveError = action.payload ?? 'Failed to save project config';
      });
  },
});

export const projectConfigReducer = projectConfigSlice.reducer;
