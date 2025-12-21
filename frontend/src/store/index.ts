import { configureStore } from '@reduxjs/toolkit';
import type { AppDispatch, RootState } from './types.ts';
import {
  type TypedUseSelectorHook,
  useDispatch,
  useSelector,
} from 'react-redux';
import { boardReducer } from '@/features/board/model/board.reducer.ts';
import { profileReducer } from '@/features/profile/model/profile.reducer.ts';
import { authReducer } from '@/features/auth/model/auth.reducer.ts';

export const store = configureStore({
  reducer: { boardReducer, profileReducer, authReducer },
});

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
