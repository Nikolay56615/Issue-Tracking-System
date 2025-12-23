import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Issue, IssueStatus } from './board.types.ts';
import {
  changeIssueStatus,
  createIssue,
  deleteIssue,
  getBoard,
} from '@/features/board/model/board.actions.ts';

interface IssuesState {
  issues: Issue[];
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
  boardLoading: 'idle' | 'pending' | 'succeeded' | 'failed';
  boardError: string | null;
  statusChangeLoading: Record<number, boolean>;
  deleteIssueStatus: {
    loading: boolean;
    error: string | null;
  };
}

const initialState: IssuesState = {
  issues: [],
  loading: 'idle',
  error: null,
  boardLoading: 'idle',
  boardError: null,
  statusChangeLoading: {},
  deleteIssueStatus: {
    loading: false,
    error: null,
  },
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
      })
      .addCase(deleteIssue.pending, (state) => {
        state.deleteIssueStatus.loading = true;
        state.deleteIssueStatus.error = null;
      })
      .addCase(deleteIssue.fulfilled, (state, action) => {
        state.deleteIssueStatus.loading = false;

        const deletedId = action.meta.arg;
        state.issues = state.issues.filter((issue) => issue.id !== deletedId);
      })
      .addCase(deleteIssue.rejected, (state, action) => {
        state.deleteIssueStatus.loading = false;
        state.deleteIssueStatus.error =
          action.payload || action.error.message || 'Error happened';
      })
      .addCase(getBoard.pending, (state) => {
        state.boardLoading = 'pending';
        state.boardError = null;
      })
      .addCase(getBoard.fulfilled, (state, action: PayloadAction<Issue[]>) => {
        state.boardLoading = 'succeeded';
        state.issues = action.payload;
      })
      .addCase(getBoard.rejected, (state, action) => {
        state.boardLoading = 'failed';
        state.boardError = action.payload ?? 'Failed to load board';
      })
      .addCase(changeIssueStatus.pending, (state, action) => {
        const { id, newStatus } = action.meta.arg;
        const issue = state.issues.find((i) => i.id === id);
        if (issue) {
          issue.status = newStatus;
        }
        state.statusChangeLoading[id] = true;
      })
      .addCase(changeIssueStatus.fulfilled, (state, action) => {
        const { id } = action.meta.arg;
        state.statusChangeLoading[id] = false;
      })
      .addCase(changeIssueStatus.rejected, (state, action) => {
        const { id } = action.meta.arg;
        const issue = state.issues.find((i) => i.id === id);
        if (issue && action.payload?.previousStatus) {
          issue.status = action.payload.previousStatus;
        }
        state.statusChangeLoading[id] = false;
      });
  },
});

export const { updateIssueStatus } = boardSlice.actions;
export const boardReducer = boardSlice.reducer;
