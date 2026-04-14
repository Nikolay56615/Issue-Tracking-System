import { configureStore } from '@reduxjs/toolkit';
import type { AppDispatch, RootState } from './types.ts';
import {
  type TypedUseSelectorHook,
  useDispatch,
  useSelector,
} from 'react-redux';
import { authReducer } from '@/features/auth';
import { boardReducer } from '@/features/board';
import { profileReducer } from '@/features/profile';
import { trashReducer } from '@/features/trash';
import { usersReducer } from '@/features/users';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    board: boardReducer,
    profile: profileReducer,
    trash: trashReducer,
    users: usersReducer,
  },
});

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
