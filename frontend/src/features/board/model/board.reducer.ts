import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Issue, IssueStatus } from './board.types.ts';
import { createIssue, getBoard } from '@/features/board/model/board.actions.ts';

interface IssuesState {
  issues: Issue[];
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
  boardLoading: 'idle' | 'pending' | 'succeeded' | 'failed';
  boardError: string | null;
}

const initialState: IssuesState = {
  issues: [],
  loading: 'idle',
  error: null,
  boardLoading: 'idle',
  boardError: null,
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
      });
  },
});

export const { updateIssueStatus } = boardSlice.actions;
export const boardReducer = boardSlice.reducer;
