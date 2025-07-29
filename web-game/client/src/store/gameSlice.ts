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
  isResale?: boolean;
  originalOwner?: string;
  reseller?: string;
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
  sharedMarket: { [price: number]: { [popularity: number]: Product[] } };
  pollution: {
    'game-console': number;
    'diy-gadget': number;
    'figure': number;
    'accessory': number;
    'toy': number;
  };
  globalPollution?: number;
  regulationLevel: number;
  manufacturerAutomata: any;
  resaleAutomata: any;
  activeTrends: any[];
  automataActions?: any[];
  playLog?: Array<{
    id: string;
    timestamp: number;
    type: 'action' | 'phase' | 'round' | 'game' | 'automata' | 'trend' | 'purchase' | 'sell' | 'manufacture' | 'design' | 'review' | 'labor' | 'regulate' | 'skip' | 'buy_dignity' | 'buyback' | 'resale' | 'promote_regulation' | 'end_game' | 'prestige_purchase' | 'purchase_prestige';
    message: string;
    playerId?: string;
    playerName?: string;
    details?: any;
  }>;
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
      
      // クライアント側で追加したプレイログエントリを保持
      const existingClientLogs = state.gameState?.playLog?.filter(log => 
        log.id.startsWith('dignity-') || 
        log.id.startsWith('client-')
      ) || [];
      
      // 古いクライアント側ログを除去（5分以上前のもの）
      const now = Date.now();
      const recentClientLogs = existingClientLogs.filter(log => 
        now - log.timestamp < 5 * 60 * 1000
      );
      
      const newGameState = { ...action.payload };
      
      // サーバーのプレイログとクライアントログをマージ
      if (recentClientLogs.length > 0) {
        const serverLogs = newGameState.playLog || [];
        const mergedLogs = [...serverLogs, ...recentClientLogs]
          .sort((a, b) => a.timestamp - b.timestamp);
        
        // 重複除去（同じIDのログは1つだけ）
        const uniqueLogs = mergedLogs.filter((log, index, self) => 
          index === self.findIndex(l => l.id === log.id)
        );
        
        newGameState.playLog = uniqueLogs;
        console.log('📝 Merged client logs with server logs:', {
          serverLogsCount: serverLogs.length,
          clientLogsCount: recentClientLogs.length,
          mergedLogsCount: uniqueLogs.length,
          expiredClientLogs: existingClientLogs.length - recentClientLogs.length
        });
      }
      
      state.gameState = newGameState;
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
    addPlayLogEntry: (state, action: PayloadAction<{
      id: string;
      timestamp: number;
      type: 'action' | 'phase' | 'round' | 'game' | 'automata' | 'trend' | 'purchase' | 'sell' | 'manufacture' | 'design' | 'review' | 'labor' | 'regulate' | 'skip' | 'buy_dignity' | 'buyback' | 'resale' | 'promote_regulation' | 'end_game' | 'prestige_purchase' | 'purchase_prestige';
      message: string;
      playerId?: string;
      playerName?: string;
      details?: any;
    }>) => {
      if (state.gameState) {
        if (!state.gameState.playLog) {
          state.gameState.playLog = [];
        }
        state.gameState.playLog.push(action.payload);
        console.log('📝 Play log entry added:', action.payload);
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
  addPlayLogEntry,
  resetGame,
} = gameSlice.actions;

export default gameSlice.reducer;