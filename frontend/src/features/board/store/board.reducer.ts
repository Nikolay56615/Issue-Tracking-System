import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Issue, IssueStatus } from '../types.ts';

const initialState: { issues: Issue[] } = {
  issues: [
    { id: 1, title: 'Issue 1', status: 'backlog' },
    { id: 2, title: 'Issue 2', status: 'inProgress' },
    { id: 3, title: 'Issue 3', status: 'backlog' },
    { id: 4, title: 'Issue 4', status: 'done' },
  ],
};

const boardSlice = createSlice({
  name: 'board',
  initialState,
  reducers: {
    createIssue: (state, action: PayloadAction<Issue>) => {
      state.issues.push(action.payload);
    },
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
});

export const { createIssue, updateIssueStatus } = boardSlice.actions;
export const boardReducer = boardSlice.reducer;
