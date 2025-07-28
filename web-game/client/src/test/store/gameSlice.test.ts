import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import gameSlice, {
  setGameState,
  setCurrentPlayer,
  setGameId,
  setError,
  addPlayLogEntry,
  removePlayerFromGame,
  type GameState,
  type Player
} from '../../store/gameSlice';

describe('Game Slice', () => {
  let store: any;
  let initialGameState: GameState;
  let testPlayer: Player;

  beforeEach(() => {
    testPlayer = {
      id: 'player1',
      name: 'テストプレイヤー',
      funds: 30,
      prestige: 5,
      actionPoints: 3,
      designs: {},
      inventory: [],
      personalMarket: {},
      resaleHistory: 0
    };

    initialGameState = {
      state: 'waiting',
      phase: 'action',
      currentRound: 1,
      currentPlayerIndex: 0,
      regulationLevel: 0,
      pollution: {
        'game-console': 0,
        'diy-gadget': 0,
        'figure': 0,
        'accessory': 0,
        'toy': 0
      },
      players: [testPlayer],
      manufacturerAutomata: {
        inventory: [],
        personalMarket: {}
      },
      resaleAutomata: {
        funds: 20,
        inventory: [],
        personalMarket: {},
        pauseRounds: 0
      },
      openSourceDesigns: [],
      automataActions: [],
      trendEffects: [],
      winner: null,
      playLog: []
    };

    store = configureStore({
      reducer: {
        game: gameSlice
      }
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = store.getState().game;
      
      expect(state.gameState).toBeNull();
      expect(state.currentPlayer).toBeNull();
      expect(state.gameId).toBeNull();
      expect(state.error).toBeNull();
    });
  });

  describe('setGameState', () => {
    it('should set game state correctly', () => {
      store.dispatch(setGameState(initialGameState));
      
      const state = store.getState().game;
      expect(state.gameState).toEqual(initialGameState);
    });

    it('should update existing game state', () => {
      store.dispatch(setGameState(initialGameState));
      
      const updatedGameState = {
        ...initialGameState,
        currentRound: 2,
        phase: 'automata' as const
      };
      
      store.dispatch(setGameState(updatedGameState));
      
      const state = store.getState().game;
      expect(state.gameState?.currentRound).toBe(2);
      expect(state.gameState?.phase).toBe('automata');
    });
  });

  describe('setCurrentPlayer', () => {
    it('should set current player correctly', () => {
      store.dispatch(setCurrentPlayer(testPlayer));
      
      const state = store.getState().game;
      expect(state.currentPlayer).toEqual(testPlayer);
    });

    it('should update current player properties', () => {
      store.dispatch(setCurrentPlayer(testPlayer));
      
      const updatedPlayer = {
        ...testPlayer,
        funds: 40,
        prestige: 7
      };
      
      store.dispatch(setCurrentPlayer(updatedPlayer));
      
      const state = store.getState().game;
      expect(state.currentPlayer?.funds).toBe(40);
      expect(state.currentPlayer?.prestige).toBe(7);
    });
  });

  describe('setGameId', () => {
    it('should set game ID correctly', () => {
      const gameId = 'test-game-123';
      store.dispatch(setGameId(gameId));
      
      const state = store.getState().game;
      expect(state.gameId).toBe(gameId);
    });
  });

  describe('setError', () => {
    it('should set error message correctly', () => {
      const errorMessage = 'テストエラーメッセージ';
      store.dispatch(setError(errorMessage));
      
      const state = store.getState().game;
      expect(state.error).toBe(errorMessage);
    });

    it('should clear error when set to null', () => {
      store.dispatch(setError('エラー'));
      store.dispatch(setError(null));
      
      const state = store.getState().game;
      expect(state.error).toBeNull();
    });
  });

  describe('addPlayLogEntry', () => {
    it('should add play log entry to game state', () => {
      store.dispatch(setGameState(initialGameState));
      
      const logEntry = {
        id: 'log1',
        timestamp: Date.now(),
        type: 'manufacture' as const,
        message: 'テスト製造ログ',
        playerId: 'player1',
        playerName: 'テストプレイヤー',
        details: { cost: 5 }
      };
      
      store.dispatch(addPlayLogEntry(logEntry));
      
      const state = store.getState().game;
      expect(state.gameState?.playLog).toHaveLength(1);
      expect(state.gameState?.playLog[0]).toEqual(logEntry);
    });

    it('should handle adding multiple log entries', () => {
      store.dispatch(setGameState(initialGameState));
      
      const logEntry1 = {
        id: 'log1',
        timestamp: Date.now(),
        type: 'manufacture' as const,
        message: 'ログ1',
        playerId: 'player1',
        playerName: 'プレイヤー1'
      };
      
      const logEntry2 = {
        id: 'log2',
        timestamp: Date.now() + 1000,
        type: 'sell' as const,
        message: 'ログ2',
        playerId: 'player2',
        playerName: 'プレイヤー2'
      };
      
      store.dispatch(addPlayLogEntry(logEntry1));
      store.dispatch(addPlayLogEntry(logEntry2));
      
      const state = store.getState().game;
      expect(state.gameState?.playLog).toHaveLength(2);
      expect(state.gameState?.playLog[0]).toEqual(logEntry1);
      expect(state.gameState?.playLog[1]).toEqual(logEntry2);
    });

    it('should not add log entry when game state is null', () => {
      const logEntry = {
        id: 'log1',
        timestamp: Date.now(),
        type: 'manufacture' as const,
        message: 'テストログ',
        playerId: 'player1',
        playerName: 'プレイヤー1'
      };
      
      store.dispatch(addPlayLogEntry(logEntry));
      
      const state = store.getState().game;
      expect(state.gameState).toBeNull();
    });
  });

  describe('removePlayerFromGame', () => {
    it('should remove player from game state', () => {
      const gameStateWithMultiplePlayers = {
        ...initialGameState,
        players: [
          testPlayer,
          { ...testPlayer, id: 'player2', name: 'プレイヤー2' },
          { ...testPlayer, id: 'player3', name: 'プレイヤー3' }
        ]
      };
      
      store.dispatch(setGameState(gameStateWithMultiplePlayers));
      store.dispatch(removePlayerFromGame('player2'));
      
      const state = store.getState().game;
      expect(state.gameState?.players).toHaveLength(2);
      expect(state.gameState?.players.find(p => p.id === 'player2')).toBeUndefined();
    });

    it('should not affect game state when player not found', () => {
      store.dispatch(setGameState(initialGameState));
      store.dispatch(removePlayerFromGame('non-existent-player'));
      
      const state = store.getState().game;
      expect(state.gameState?.players).toHaveLength(1);
      expect(state.gameState?.players[0]).toEqual(testPlayer);
    });

    it('should not remove player when game state is null', () => {
      store.dispatch(removePlayerFromGame('player1'));
      
      const state = store.getState().game;
      expect(state.gameState).toBeNull();
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle complete game flow state changes', () => {
      // ゲーム作成
      store.dispatch(setGameId('test-game'));
      store.dispatch(setCurrentPlayer(testPlayer));
      
      // ゲーム開始
      const startedGameState = {
        ...initialGameState,
        state: 'playing' as const
      };
      store.dispatch(setGameState(startedGameState));
      
      // プレイヤーアクション実行
      const actionLogEntry = {
        id: 'action1',
        timestamp: Date.now(),
        type: 'manufacture' as const,
        message: '商品を製造しました',
        playerId: testPlayer.id,
        playerName: testPlayer.name,
        details: { designSlot: 1, cost: 3 }
      };
      store.dispatch(addPlayLogEntry(actionLogEntry));
      
      // ゲーム状態更新
      const updatedPlayer = {
        ...testPlayer,
        funds: 27, // 製造コスト支払い
        actionPoints: 2, // AP消費
        inventory: [{ id: 'product1', category: 'toy', value: 4, cost: 3, popularity: 1 }]
      };
      
      const updatedGameState = {
        ...startedGameState,
        players: [updatedPlayer]
      };
      store.dispatch(setGameState(updatedGameState));
      store.dispatch(setCurrentPlayer(updatedPlayer));
      
      // 状態検証
      const finalState = store.getState().game;
      expect(finalState.gameId).toBe('test-game');
      expect(finalState.gameState?.state).toBe('playing');
      expect(finalState.currentPlayer?.funds).toBe(27);
      expect(finalState.currentPlayer?.actionPoints).toBe(2);
      expect(finalState.gameState?.playLog).toHaveLength(1);
    });

    it('should handle error scenarios correctly', () => {
      store.dispatch(setGameId('test-game'));
      store.dispatch(setCurrentPlayer(testPlayer));
      store.dispatch(setGameState(initialGameState));
      
      // エラー発生
      store.dispatch(setError('資金不足です'));
      
      const state = store.getState().game;
      expect(state.error).toBe('資金不足です');
      expect(state.gameState).toEqual(initialGameState); // ゲーム状態は保持
      expect(state.currentPlayer).toEqual(testPlayer); // プレイヤー情報も保持
    });
  });
});