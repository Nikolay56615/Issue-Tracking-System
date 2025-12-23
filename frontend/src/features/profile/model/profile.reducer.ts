import { createSlice } from '@reduxjs/toolkit';
import type {
  Project,
  UserProfile,
} from '@/features/profile/model/profile.types';
import {
  archiveProject,
  createProject,
  fetchProjects,
  getCurrentUser,
  restoreProject,
} from './profile.actions';

interface ProfileState {
  profile: UserProfile;
  projects: Project[];
  profileLoading: 'idle' | 'pending' | 'succeeded' | 'failed';
  projectsLoading: 'idle' | 'pending' | 'succeeded' | 'failed';
  createProjectLoading: 'idle' | 'pending' | 'succeeded' | 'failed';
  archiveProjectLoadingIds: number[];
  restoreProjectLoadingIds: number[];
  profileError: string | null;
  projectsError: string | null;
  createProjectError: string | null;
  archiveProjectError: string | null;
  restoreProjectError: string | null;
}

const initialState: ProfileState = {
  profile: { id: -1, username: 'No User', email: '' },
  projects: [],
  profileLoading: 'idle',
  projectsLoading: 'idle',
  createProjectLoading: 'idle',
  archiveProjectLoadingIds: [],
  restoreProjectLoadingIds: [],
  profileError: null,
  projectsError: null,
  createProjectError: null,
  archiveProjectError: null,
  restoreProjectError: null,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.projectsLoading = 'pending';
        state.projectsError = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.projectsLoading = 'succeeded';
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.projectsLoading = 'failed';
        state.projectsError = action.payload ?? 'Failed to fetch projects';
      })
      .addCase(getCurrentUser.pending, (state) => {
        state.profileLoading = 'pending';
        state.profileError = null;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.profileLoading = 'succeeded';
        state.profile = action.payload;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.profileLoading = 'failed';
        state.profileError = action.payload ?? 'Failed to fetch current user';
      })
      .addCase(createProject.pending, (state) => {
        state.createProjectLoading = 'pending';
        state.createProjectError = null;
      })
      .addCase(createProject.fulfilled, (state) => {
        state.createProjectLoading = 'succeeded';
      })
      .addCase(createProject.rejected, (state, action) => {
        state.createProjectLoading = 'failed';
        state.profileError = action.payload ?? 'Failed to fetch current user';
      })
      .addCase(archiveProject.pending, (state, action) => {
        const id = action.meta.arg;
        if (!state.archiveProjectLoadingIds.includes(id)) {
          state.archiveProjectLoadingIds.push(id);
        }
        state.archiveProjectError = null;
      })
      .addCase(archiveProject.fulfilled, (state, action) => {
        const archivedId = action.payload;
        state.archiveProjectLoadingIds = state.archiveProjectLoadingIds.filter(
          (id) => id !== archivedId
        );
        const project = state.projects.find((p) => p.id === archivedId);
        if (project) {
          project.archived = true;
        }
      })
      .addCase(archiveProject.rejected, (state, action) => {
        const id = action.meta.arg;
        state.archiveProjectLoadingIds = state.archiveProjectLoadingIds.filter(
          (loadingId) => loadingId !== id
        );
        state.archiveProjectError =
          action.payload || action.error.message || 'Error happened';
      })
      .addCase(restoreProject.pending, (state, action) => {
        const id = action.meta.arg;
        if (!state.restoreProjectLoadingIds.includes(id)) {
          state.restoreProjectLoadingIds.push(id);
        }
        state.restoreProjectError = null;
      })
      .addCase(restoreProject.fulfilled, (state, action) => {
        const restoredId = action.payload;
        state.restoreProjectLoadingIds = state.restoreProjectLoadingIds.filter(
          (id) => id !== restoredId
        );
        const project = state.projects.find((p) => p.id === restoredId);
        if (project) {
          project.archived = false;
        }
      })
      .addCase(restoreProject.rejected, (state, action) => {
        const id = action.meta.arg;
        state.restoreProjectLoadingIds = state.restoreProjectLoadingIds.filter(
          (loadingId) => loadingId !== id
        );
        state.restoreProjectError =
          action.payload || action.error.message || 'Error happened';
      });
  },
});

export const profileReducer = profileSlice.reducer;
