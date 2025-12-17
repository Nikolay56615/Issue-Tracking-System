import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
} from '@/features/auth/model/auth.types.ts';
import { AuthRequests } from '../api';

export const login = createAsyncThunk<
  string,
  LoginRequest,
  { rejectValue: string }
>('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    return await AuthRequests.login(credentials);
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Login failed');
  }
});

export const register = createAsyncThunk<
  RegisterResponse,
  RegisterRequest,
  { rejectValue: string }
>('auth/register', async (credentials, { rejectWithValue }) => {
  try {
    return await AuthRequests.register(credentials);
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Registration failed');
  }
});
