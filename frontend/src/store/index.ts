import { configureStore } from '@reduxjs/toolkit';
import type { AppDispatch, RootState } from './types.ts';
import {
  type TypedUseSelectorHook,
  useDispatch,
  useSelector,
} from 'react-redux';
import { authReducer } from '@/features/auth/model/auth.reducer.ts';
import { boardReducer } from '@/features/board/model/board.reducer.ts';
import { profileReducer } from '@/features/profile/model/profile.reducer.ts';
import { projectConfigReducer } from '@/features/project-config/model/project-config.reducer.ts';
import { trashReducer } from '@/features/trash/model/trash.reducer.ts';
import { usersReducer } from '@/features/users/model/users.reducer.ts';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    board: boardReducer,
    profile: profileReducer,
    projectConfig: projectConfigReducer,
    trash: trashReducer,
    users: usersReducer,
  },
});

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
