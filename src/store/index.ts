import { configureStore } from '@reduxjs/toolkit';
import settingsReducer from './slices/settingsSlice';
import cotsReducer from './slices/cotsSlice';
import usersReducer from './slices/usersSlice';
import productsReducer from './slices/productsSlice';

export const store = configureStore({
  reducer: {
    settings: settingsReducer,
    cots: cotsReducer,
    users: usersReducer,
    products: productsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


