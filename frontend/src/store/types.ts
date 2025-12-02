import { store } from './index.ts';
import type { AsyncThunkAction } from '@reduxjs/toolkit';

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type DispatchPromise = ReturnType<
  AsyncThunkAction<unknown, unknown, NonNullable<unknown>>
>;
