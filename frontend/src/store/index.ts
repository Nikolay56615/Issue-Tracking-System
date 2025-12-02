import { configureStore } from '@reduxjs/toolkit';
import type { AppDispatch, RootState } from './types.ts';
import {
  type TypedUseSelectorHook,
  useDispatch,
  useSelector,
} from 'react-redux';
import { boardReducer } from '../features/board/store/board.reducer.ts';
import { profileReducer } from '../features/profile/store/profile.reducer.ts';

export const store = configureStore({
  reducer: { boardReducer, profileReducer },
});

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
