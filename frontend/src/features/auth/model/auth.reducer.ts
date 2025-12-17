import { createSlice } from '@reduxjs/toolkit';
import { login, register } from '@/features/auth/model/auth.actions.ts';

interface AuthState {
  isAuthenticated: boolean;
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: !!localStorage.getItem('authToken'),
  loading: 'idle',
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(login.fulfilled, (state) => {
        state.loading = 'succeeded';
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload ?? 'Login failed';
        state.isAuthenticated = false;
      })
      .addCase(register.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = 'succeeded';
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload ?? 'Registration failed';
      });
  },
});

export const authReducer = authSlice.reducer;
