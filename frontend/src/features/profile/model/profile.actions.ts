import {ProfileRequests} from "@/features/profile/api";
import {createAsyncThunk} from "@reduxjs/toolkit";
import type {Project} from "@/features/profile/model/profile.types.ts";

export const fetchProjects = createAsyncThunk<
  Project[],
  void,
  { rejectValue: string }
>(
  'projects',
  async (_, { rejectWithValue }) => {
    try {
      return await ProfileRequests.fetchProjects();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);