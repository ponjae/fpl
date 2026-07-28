import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { useDispatch, useSelector } from 'react-redux';
import { api } from '../features/api';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

// Enables refetchOnFocus / refetchOnReconnect behaviour.
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

/**
 * Typed dispatch hook.
 *
 * @returns the store dispatch function.
 */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

/**
 * Typed selector hook.
 */
export const useAppSelector = useSelector.withTypes<RootState>();
