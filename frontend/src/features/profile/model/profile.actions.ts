import { ProfileRequests } from '@/features/profile/api';
import { getApiErrorMessage } from '@/api/get-error-message.ts';
import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  CreateProjectRequest,
  PermissionKey,
  Project,
  ProjectPermissionsById,
  UserProfile,
} from '@/features/profile/model/profile.types.ts';
import { AxiosError } from 'axios';
import type { RootState } from '@/store/types.ts';

const fetchProjectPermissions = async (
  projects: Project[]
): Promise<{
  projects: Project[];
  projectPermissions: ProjectPermissionsById;
}> => {
  const results = await Promise.all(
    projects.map(async (project) => {
      try {
        const { role } = await ProfileRequests.getMyRole(project.id);
        return { project, permissions: role.permissions };
      } catch (error: unknown) {
        if (
          error instanceof AxiosError &&
          (error.response?.status === 401 || error.response?.status === 403)
        ) {
          return null;
        }

        throw error;
      }
    })
  );
  const accessible = results.filter(
    (result): result is { project: Project; permissions: PermissionKey[] } =>
      result !== null
  );

  return {
    projects: accessible.map((result) => result.project),
    projectPermissions: Object.fromEntries(
      accessible.map((result) => [result.project.id, result.permissions])
    ),
  };
};

export const fetchProjects = createAsyncThunk<
  { projects: Project[]; projectPermissions: ProjectPermissionsById },
  void,
  { rejectValue: string }
>('projects', async (_, { rejectWithValue }) => {
  try {
    const projects = await ProfileRequests.fetchProjects();
    return await fetchProjectPermissions(projects);
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error));
  }
});

export const getCurrentUser = createAsyncThunk<
  UserProfile,
  void,
  { rejectValue: string }
>(
  'currentUser',
  async (_, { rejectWithValue }) => {
    try {
      return await ProfileRequests.getCurrentUser();
    } catch (error: unknown) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  },
  {
    condition: (_, { getState }) => {
      const { profile } = getState() as RootState;
      return profile.profileLoading !== 'pending';
    },
  }
);

export const createProject = createAsyncThunk<
  { project: Project; permissions: PermissionKey[] },
  CreateProjectRequest,
  { rejectValue: string }
>('createProject', async (createProjectRequest, { rejectWithValue }) => {
  try {
    const project = await ProfileRequests.createProject(createProjectRequest);
    const { role } = await ProfileRequests.getMyRole(project.id);

    return { project, permissions: role.permissions };
  } catch (e) {
    if (e instanceof AxiosError) {
      return rejectWithValue(e.response?.data?.message || 'Error happened');
    }

    return rejectWithValue('Error happened');
  }
});

export const archiveProject = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>('profile/archiveProject', async (id, { rejectWithValue }) => {
  try {
    await ProfileRequests.archiveProject(id);
    return id;
  } catch (e) {
    if (e instanceof AxiosError) {
      return rejectWithValue(e.response?.data?.message || 'Error happened');
    }
    return rejectWithValue('Error happened');
  }
});

export const restoreProject = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>('profile/restoreProject', async (id, { rejectWithValue }) => {
  try {
    await ProfileRequests.restoreProject(id);
    return id;
  } catch (e) {
    if (e instanceof AxiosError) {
      return rejectWithValue(e.response?.data?.message || 'Error happened');
    }
    return rejectWithValue('Error happened');
  }
});
