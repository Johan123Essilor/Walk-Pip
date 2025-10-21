import { configureStore } from '@reduxjs/toolkit';
import { logger } from 'redux-logger';
import { trailsReducer } from '../features/trails/trailsSlice';

export const store = configureStore({
  reducer: {
    trails: trailsReducer
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat([logger])
});
