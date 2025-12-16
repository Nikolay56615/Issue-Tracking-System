import { createSlice } from '@reduxjs/toolkit';
import type { Project, UserProfile } from '@/features/profile/model/profile.types';
import { fetchProjects, getCurrentUser } from './profile.actions';

interface ProfileState {
  profile: UserProfile;
  projects: Project[];
  profileLoading: 'idle' | 'pending' | 'succeeded' | 'failed';
  projectsLoading: 'idle' | 'pending' | 'succeeded' | 'failed';
  profileError: string | null;
  projectsError: string | null;
}

const initialState: ProfileState = {
  profile: {id: -1, username: 'No User', email: ''},
  projects: [],
  profileLoading: 'idle',
  projectsLoading: 'idle',
  profileError: null,
  projectsError: null,
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
      });
  },
});

export const profileReducer = profileSlice.reducer;
