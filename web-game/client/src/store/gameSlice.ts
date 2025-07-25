import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

// Types based on server-side game logic
export interface Product {
  id: string;
  category: 'game-console' | 'diy-gadget' | 'figure' | 'accessory' | 'toy';
  value: number;
  cost: number;
  popularity: number;
  ownerId: string;
  designSlot?: number;
  price?: number;
  previousOwner?: string;
  purchasePrice?: number;
}

export interface Design {
  category: string;
  value: number;
  cost: number;
  id: string;
}

export interface Player {
  id: string;
  name: string;
  role: 'host' | 'player' | 'ai';
  funds: number;
  prestige: number;
  resaleHistory: number;
  actionPoints: number;
  personalMarket: { [price: number]: { [popularity: number]: Product | null } };
  designs: { [slot: number]: Design };
  inventory: Product[];
  openSourceDesigns: string[];
}

export interface GameState {
  id: string;
  state: 'waiting' | 'playing' | 'finished';
  players: Player[];
  currentPlayerIndex: number;
  currentRound: number;
  currentPhase: 'action' | 'automata' | 'market';
  pollution: {
    'game-console': number;
    'diy-gadget': number;
    'figure': number;
    'accessory': number;
    'toy': number;
  };
  regulationLevel: number;
  manufacturerAutomata: any;
  resaleAutomata: any;
  activeTrends: any[];
  automataActions?: any[];
  winner: Player | null;
}

interface GameSliceState {
  gameState: GameState | null;
  currentPlayer: Player | null;
  isConnected: boolean;
  error: string | null;
  gameId: string | null;
}

const initialState: GameSliceState = {
  gameState: null,
  currentPlayer: null,
  isConnected: false,
  error: null,
  gameId: null,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setGameState: (state, action: PayloadAction<GameState>) => {
      console.log('🔄 setGameState reducer called:', {
        oldPlayerCount: state.gameState?.players?.length || 0,
        newPlayerCount: action.payload?.players?.length || 0,
        newGameState: action.payload
      });
      state.gameState = action.payload;
    },
    setCurrentPlayer: (state, action: PayloadAction<Player>) => {
      state.currentPlayer = action.payload;
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setGameId: (state, action: PayloadAction<string>) => {
      state.gameId = action.payload;
    },
    updatePlayer: (state, action: PayloadAction<Partial<Player>>) => {
      if (state.currentPlayer) {
        state.currentPlayer = { ...state.currentPlayer, ...action.payload };
      }
    },
    addPlayerToGame: (state, action: PayloadAction<Player>) => {
      if (state.gameState) {
        state.gameState.players.push(action.payload);
      }
    },
    removePlayerFromGame: (state, action: PayloadAction<string>) => {
      if (state.gameState) {
        state.gameState.players = state.gameState.players.filter(
          p => p.id !== action.payload
        );
      }
    },
    updateGamePhase: (state, action: PayloadAction<{ 
      currentPlayerIndex: number; 
      currentPhase: 'action' | 'automata' | 'market';
      currentRound: number;
    }>) => {
      if (state.gameState) {
        state.gameState.currentPlayerIndex = action.payload.currentPlayerIndex;
        state.gameState.currentPhase = action.payload.currentPhase;
        state.gameState.currentRound = action.payload.currentRound;
      }
    },
    resetGame: (state) => {
      state.gameState = null;
      state.currentPlayer = null;
      state.gameId = null;
      state.error = null;
    },
  },
});

export const {
  setGameState,
  setCurrentPlayer,
  setConnected,
  setError,
  setGameId,
  updatePlayer,
  addPlayerToGame,
  removePlayerFromGame,
  updateGamePhase,
  resetGame,
} = gameSlice.actions;

export default gameSlice.reducer;