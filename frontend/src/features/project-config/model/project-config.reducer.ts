import { createSlice } from '@reduxjs/toolkit';
import type { ProjectConfig } from '@/features/project-config/model/project-config.types.ts';
import {
  applyProjectTemplate,
  exportProjectTemplate,
  fetchProjectConfig,
  saveProjectConfig,
} from '@/features/project-config/model/project-config.actions.ts';
import type { ProjectTemplate } from '@/features/project-config/model/project-config.types.ts';

interface ProjectConfigState {
  config: ProjectConfig | null;
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  saving: 'idle' | 'pending' | 'succeeded' | 'failed';
  templateLoading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
  saveError: string | null;
  templateError: string | null;
  exportedTemplate: ProjectTemplate | null;
}

const initialState: ProjectConfigState = {
  config: null,
  loading: 'idle',
  saving: 'idle',
  templateLoading: 'idle',
  error: null,
  saveError: null,
  templateError: null,
  exportedTemplate: null,
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
      })
      .addCase(exportProjectTemplate.pending, (state) => {
        state.templateLoading = 'pending';
        state.templateError = null;
      })
      .addCase(exportProjectTemplate.fulfilled, (state, action) => {
        state.templateLoading = 'succeeded';
        state.exportedTemplate = action.payload;
      })
      .addCase(exportProjectTemplate.rejected, (state, action) => {
        state.templateLoading = 'failed';
        state.templateError =
          action.payload ?? 'Failed to export project template';
      })
      .addCase(applyProjectTemplate.pending, (state) => {
        state.templateLoading = 'pending';
        state.templateError = null;
      })
      .addCase(applyProjectTemplate.fulfilled, (state, action) => {
        state.templateLoading = 'succeeded';
        state.config = action.payload;
      })
      .addCase(applyProjectTemplate.rejected, (state, action) => {
        state.templateLoading = 'failed';
        state.templateError =
          action.payload ?? 'Failed to apply project template';
      });
  },
});

export const projectConfigReducer = projectConfigSlice.reducer;
