import { createAsyncThunk } from '@reduxjs/toolkit';
import { getApiErrorMessage } from '@/api/get-error-message.ts';
import type { ProjectConfig } from '@/features/project-config/model/project-config.types.ts';
import { ProjectConfigRequests } from '@/features/project-config/api';

export const fetchProjectConfig = createAsyncThunk<
  ProjectConfig,
  number,
  { rejectValue: string }
>('project-config/fetch', async (projectId, { rejectWithValue }) => {
  try {
    return await ProjectConfigRequests.getProjectConfig(projectId);
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, 'Failed to load project config')
    );
  }
});

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
