import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  Issue,
  IssueFilters,
  IssueStatus,
  LifecycleGraph,
} from './board.types.ts';
import {
  changeIssueStatus,
  createIssue,
  deleteAttachment,
  deleteIssue,
  downloadAttachment,
  getBoard,
  getLifecycleGraph,
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
  lifecycleGraph: LifecycleGraph | null;
  lifecycleGraphStatus: {
    loading: boolean;
    error: string | null;
  };
  filters: IssueFilters;
  downloading: Record<string, boolean>;
  downloadingError: Record<string, string | null>;
  deleting: Record<string, boolean>;
  deletingError: Record<string, string | null>;
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
  lifecycleGraph: null,
  lifecycleGraphStatus: {
    loading: false,
    error: null,
  },
  filters: {
    types: [],
    priorities: [],
    assigneeId: undefined,
    nameQuery: '',
    dateFrom: undefined,
    dateTo: undefined,
  },
  downloading: {},
  downloadingError: {},
  deleting: {},
  deletingError: {},
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
    setFilters(state, action: PayloadAction<IssueFilters>) {
      state.filters = action.payload;
    },
    resetFilters(state) {
      state.filters = {
        types: [],
        priorities: [],
        assigneeId: undefined,
        nameQuery: '',
        dateFrom: undefined,
        dateTo: undefined,
      };
    },
    setNameQuery(state, action: PayloadAction<string>) {
      state.filters.nameQuery = action.payload;
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
      })
      .addCase(getLifecycleGraph.pending, (state) => {
        state.lifecycleGraphStatus.loading = true;
        state.lifecycleGraphStatus.error = null;
      })
      .addCase(getLifecycleGraph.fulfilled, (state, action) => {
        state.lifecycleGraphStatus.loading = false;
        state.lifecycleGraph = action.payload;
      })
      .addCase(getLifecycleGraph.rejected, (state, action) => {
        state.lifecycleGraphStatus.loading = false;
        state.lifecycleGraphStatus.error =
          action.payload || action.error.message || 'Error happened';
      })
      .addCase(downloadAttachment.pending, (state, action) => {
        const filename = action.meta.arg;
        state.downloading[filename] = true;
        state.downloadingError[filename] = null;
      })
      .addCase(downloadAttachment.fulfilled, (state, action) => {
        const filename = action.meta.arg;
        state.downloading[filename] = false;
      })
      .addCase(downloadAttachment.rejected, (state, action) => {
        const filename = action.meta.arg;
        state.downloading[filename] = false;
        state.downloadingError[filename] =
          (action.payload as string) ||
          action.error.message ||
          'Error happened';
      })
      .addCase(deleteAttachment.pending, (state, action) => {
        const filename = action.meta.arg;
        state.deleting[filename] = true;
        state.deletingError[filename] = null;
      })
      .addCase(deleteAttachment.fulfilled, (state, action) => {
        const filename = action.payload;
        state.deleting[filename] = false;
        delete state.deletingError[filename];
      })
      .addCase(deleteAttachment.rejected, (state, action) => {
        const filename = action.meta.arg;
        state.deleting[filename] = false;
        state.deletingError[filename] =
          (action.payload as string) ||
          action.error.message ||
          'Error happened';
      });
  },
});

export const { updateIssueStatus, setFilters, resetFilters, setNameQuery } =
  boardSlice.actions;
export const boardReducer = boardSlice.reducer;
