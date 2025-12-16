import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Issue, IssueStatus } from './board.types.ts';
import {createIssue} from "@/features/board/model/board.actions.ts";

interface IssuesState {
  issues: Issue[];
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: IssuesState = {
  issues: [],
  loading: 'idle',
  error: null,
};

const boardSlice = createSlice({
  name: 'board',
  initialState,
  reducers: {
    updateIssueStatus: (
      state,
      action: PayloadAction<{ id: number; status: IssueStatus }>
    ) => {
      const { id, status } = action.payload;
      const issue = state.issues.find((issue) => issue.id === id);
      if (issue) {
        issue.status = status;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createIssue.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(createIssue.fulfilled, (state, action: PayloadAction<Issue>) => {
        state.loading = 'succeeded';
        state.issues.push(action.payload);
      })
      .addCase(createIssue.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload ?? 'Failed to create issue';
      });
  },
});

export const { updateIssueStatus } = boardSlice.actions;
export const boardReducer = boardSlice.reducer;
