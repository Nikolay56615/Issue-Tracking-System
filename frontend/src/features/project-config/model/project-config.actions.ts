import { createAsyncThunk } from '@reduxjs/toolkit';
import { getApiErrorMessage } from '@/api/get-error-message.ts';
import type {
  ProjectConfig,
  ProjectTemplate,
} from '@/features/project-config/model/project-config.types.ts';
import { ProjectConfigRequests } from '@/features/project-config/api';
import { getMyRole } from '@/features/board/api/api.board.ts';
import type { CustomRole } from '@/features/profile';
import type { RootState } from '@/store/types.ts';

export const fetchProjectConfig = createAsyncThunk<
  ProjectConfig,
  number,
  { rejectValue: string }
>(
  'project-config/fetch',
  async (projectId, { rejectWithValue }) => {
    try {
      return await ProjectConfigRequests.getProjectConfig(projectId);
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, 'Failed to load project config')
      );
    }
  },
  {
    condition: (projectId, { getState }) => {
      const { projectConfig } = getState() as RootState;
      const currentProjectId =
        projectConfig.config?.projectId ?? projectConfig.configProjectId;

      if (
        projectConfig.loading === 'pending' &&
        currentProjectId === projectId
      ) {
        return false;
      }

      return !(
        projectConfig.loading === 'succeeded' &&
        projectConfig.config?.projectId === projectId
      );
    },
  }
);

export const fetchCurrentProjectRole = createAsyncThunk<
  CustomRole,
  number,
  { rejectValue: string }
>(
  'project-config/fetch-current-role',
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await getMyRole(projectId);
      return response.role;
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, 'Failed to load project role')
      );
    }
  },
  {
    condition: (projectId, { getState }) => {
      const { projectConfig } = getState() as RootState;
      const currentProjectId = projectConfig.currentRoleProjectId;

      if (
        projectConfig.currentRoleLoading === 'pending' &&
        currentProjectId === projectId
      ) {
        return false;
      }

      return true;
    },
  }
);

export const saveProjectConfig = createAsyncThunk<
  ProjectConfig,
  { projectId: number; config: ProjectConfig },
  { rejectValue: string }
>('project-config/save', async ({ projectId, config }, { rejectWithValue }) => {
  try {
    return await ProjectConfigRequests.updateProjectConfig(projectId, config);
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, 'Failed to save project config')
    );
  }
});

export const exportProjectTemplate = createAsyncThunk<
  ProjectTemplate,
  number,
  { rejectValue: string }
>('project-config/export-template', async (projectId, { rejectWithValue }) => {
  try {
    return await ProjectConfigRequests.exportProjectTemplate(projectId);
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, 'Failed to export project template')
    );
  }
});

export const applyProjectTemplate = createAsyncThunk<
  ProjectConfig,
  { projectId: number; sourceProjectId: number },
  { rejectValue: string }
>(
  'project-config/apply-template',
  async ({ projectId, sourceProjectId }, { rejectWithValue }) => {
    try {
      return await ProjectConfigRequests.applyProjectTemplate(
        projectId,
        sourceProjectId
      );
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, 'Failed to apply project template')
      );
    }
  }
);

export const importProjectTemplate = createAsyncThunk<
  ProjectConfig,
  { projectId: number; config: ProjectTemplate['config'] },
  { rejectValue: string }
>(
  'project-config/import-template',
  async ({ projectId, config }, { rejectWithValue }) => {
    try {
      return await ProjectConfigRequests.importProjectTemplate(
        projectId,
        config
      );
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, 'Failed to import project template')
      );
    }
  }
);
