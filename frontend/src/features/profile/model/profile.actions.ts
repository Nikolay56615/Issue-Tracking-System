import { ProfileRequests } from '@/features/profile/api';
import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  CreateProjectRequest,
  Project,
  UserProfile,
} from '@/features/profile/model/profile.types.ts';
import { AxiosError } from 'axios';

export const fetchProjects = createAsyncThunk<
  Project[],
  void,
  { rejectValue: string }
>('projects', async (_, { rejectWithValue }) => {
  try {
    return await ProfileRequests.fetchProjects();
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const getCurrentUser = createAsyncThunk<
  UserProfile,
  void,
  { rejectValue: string }
>('currentUser', async (_, { rejectWithValue }) => {
  try {
    return await ProfileRequests.getCurrentUser();
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const createProject = createAsyncThunk<
  Project,
  CreateProjectRequest,
  { rejectValue: string }
>('createProject', async (createProjectRequest, { rejectWithValue }) => {
  try {
    return await ProfileRequests.createProject(createProjectRequest);
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
