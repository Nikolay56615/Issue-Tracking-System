import { createSlice } from '@reduxjs/toolkit';
import type { Issue } from '@/features/board/model';
import { getTrash, restoreIssue } from './trash.actions';

interface TrashState {
  items: Issue[];
  loading: boolean;
  error: string | null;
  restoreLoadingIds: number[];
  restoreErrors: Record<number, string | null>;
}

const initialState: TrashState = {
  items: [],
  loading: false,
  error: null,
  restoreLoadingIds: [],
  restoreErrors: {},
};

export const trashSlice = createSlice({
  name: 'trash',
  initialState,
  reducers: {
    resetTrash(state) {
      state.items = [];
      state.loading = false;
      state.error = null;
      state.restoreLoadingIds = [];
      state.restoreErrors = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getTrash.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTrash.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(getTrash.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || action.error.message || 'Error happened';
      })
      .addCase(restoreIssue.pending, (state, action) => {
        const id = action.meta.arg;
        if (!state.restoreLoadingIds.includes(id)) {
          state.restoreLoadingIds.push(id);
        }
        state.restoreErrors[id] = null;
      })
      .addCase(restoreIssue.fulfilled, (state, action) => {
        const restoredId = action.payload;
        state.items = state.items.filter((i) => i.id !== restoredId);
        state.restoreLoadingIds = state.restoreLoadingIds.filter(
          (id) => id !== restoredId
        );
        delete state.restoreErrors[restoredId];
      })
      .addCase(restoreIssue.rejected, (state, action) => {
        const id = action.meta.arg;
        state.restoreLoadingIds = state.restoreLoadingIds.filter(
          (loadingId) => loadingId !== id
        );
        state.restoreErrors[id] =
          (action.payload as string) ||
          action.error.message ||
          'Error happened';
      });
  },
});

export const { resetTrash } = trashSlice.actions;
export const trashReducer = trashSlice.reducer;
