import { createSlice } from '@reduxjs/toolkit';
import type { UserProfile } from '../types.ts';

const initialState: UserProfile = {
  id: '1',
  name: 'test user',
  projects: [
    { id: '1', name: 'project 1', description: 'some description', users: [] },
    { id: '2', name: 'project 2', description: 'some description', users: [] },
  ],
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {},
});

export const profileReducer = profileSlice.reducer;
