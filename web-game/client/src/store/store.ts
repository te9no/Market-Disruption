import { configureStore } from '@reduxjs/toolkit';
import gameReducer from './gameSlice';
import socketReducer from './socketSlice';

export const store = configureStore({
  reducer: {
    game: gameReducer,
    socket: socketReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['socket/setSocket'],
        ignoredPaths: ['socket.socket'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;