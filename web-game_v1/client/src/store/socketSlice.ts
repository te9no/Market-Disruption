import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Socket } from 'socket.io-client';

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  lastMessage: any;
}

const initialState: SocketState = {
  socket: null,
  isConnected: false,
  lastMessage: null,
};

const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    setSocket: (state, action: PayloadAction<Socket>) => {
      return {
        ...state,
        socket: action.payload
      };
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    setLastMessage: (state, action: PayloadAction<any>) => {
      state.lastMessage = action.payload;
    },
    clearSocket: (state) => {
      state.socket = null;
      state.isConnected = false;
      state.lastMessage = null;
    },
  },
});

export const { setSocket, setConnected, setLastMessage, clearSocket } = socketSlice.actions;
export default socketSlice.reducer;