import { createSlice } from '@reduxjs/toolkit';
import type { ProjectConfig } from '@/features/project-config/model/project-config.types.ts';
import {
  applyProjectTemplate,
  exportProjectTemplate,
  fetchCurrentProjectRole,
  fetchProjectConfig,
  saveProjectConfig,
} from '@/features/project-config/model/project-config.actions.ts';
import type { ProjectTemplate } from '@/features/project-config/model/project-config.types.ts';
import { getNormalizedFieldOrder } from '@/features/project-config/model/project-config.utils.ts';
import type { CustomRole } from '@/features/profile';

interface ProjectConfigState {
  config: ProjectConfig | null;
  configProjectId: number | null;
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  saving: 'idle' | 'pending' | 'succeeded' | 'failed';
  templateLoading: 'idle' | 'pending' | 'succeeded' | 'failed';
  currentRole: CustomRole | null;
  currentRoleProjectId: number | null;
  currentRoleLoading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
  saveError: string | null;
  templateError: string | null;
  exportedTemplate: ProjectTemplate | null;
  currentRoleError: string | null;
}

const initialState: ProjectConfigState = {
  config: null,
  configProjectId: null,
  loading: 'idle',
  saving: 'idle',
  templateLoading: 'idle',
  currentRole: null,
  currentRoleProjectId: null,
  currentRoleLoading: 'idle',
  error: null,
  saveError: null,
  templateError: null,
  exportedTemplate: null,
  currentRoleError: null,
};

const normalizeConfig = (config: ProjectConfig): ProjectConfig => ({
  ...config,
  lifecycle: {
    ...config.lifecycle,
    transitionRulesEnabled: config.lifecycle.transitionRulesEnabled !== false,
  },
  fieldOrder: getNormalizedFieldOrder(config),
});

const projectConfigSlice = createSlice({
  name: 'projectConfig',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjectConfig.pending, (state, action) => {
        state.loading = 'pending';
        state.configProjectId = action.meta.arg;
        state.error = null;
      })
      .addCase(fetchProjectConfig.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.config = normalizeConfig(action.payload);
        state.configProjectId = action.payload.projectId;
      })
      .addCase(fetchProjectConfig.rejected, (state, action) => {
        state.loading = 'failed';
        state.configProjectId = action.meta.arg;
        state.error = action.payload ?? 'Failed to load project config';
      })
      .addCase(fetchCurrentProjectRole.pending, (state, action) => {
        state.currentRoleLoading = 'pending';
        state.currentRoleProjectId = action.meta.arg;
        state.currentRoleError = null;
      })
      .addCase(fetchCurrentProjectRole.fulfilled, (state, action) => {
        state.currentRoleLoading = 'succeeded';
        state.currentRole = action.payload;
        state.currentRoleProjectId = action.meta.arg;
      })
      .addCase(fetchCurrentProjectRole.rejected, (state, action) => {
        state.currentRoleLoading = 'failed';
        state.currentRole = null;
        state.currentRoleProjectId = action.meta.arg;
        state.currentRoleError =
          action.payload ?? 'Failed to load project role';
      })
      .addCase(saveProjectConfig.pending, (state) => {
        state.saving = 'pending';
        state.saveError = null;
      })
      .addCase(saveProjectConfig.fulfilled, (state, action) => {
        state.saving = 'succeeded';
        state.config = normalizeConfig(action.payload);
        state.configProjectId = action.payload.projectId;
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
        state.config = normalizeConfig(action.payload);
        state.configProjectId = action.payload.projectId;
      })
      .addCase(applyProjectTemplate.rejected, (state, action) => {
        state.templateLoading = 'failed';
        state.templateError =
          action.payload ?? 'Failed to apply project template';
      });
  },
});

export const projectConfigReducer = projectConfigSlice.reducer;
