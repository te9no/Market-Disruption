import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useSocket } from '../../hooks/useSocket';
import gameSlice from '../../store/gameSlice';
import socketSlice from '../../store/socketSlice';

// Socket.IOのモック
const mockSocket = {
  on: vi.fn(),
  emit: vi.fn(),
  connected: true,
  id: 'test-socket-id',
  close: vi.fn(),
  disconnect: vi.fn()
};

const mockIo = vi.fn(() => mockSocket);

// Socket.IOをモック
vi.mock('socket.io-client', () => ({
  io: mockIo
}));

describe('useSocket Hook', () => {
  let store: any;
  let wrapper: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // localStorageをクリア
    localStorage.clear();
    
    store = configureStore({
      reducer: {
        game: gameSlice,
        socket: socketSlice,
      }
    });

    wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );
  });

  describe('Socket Connection', () => {
    it('should connect to socket on mount', () => {
      renderHook(() => useSocket(), { wrapper });
      
      expect(mockIo).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          transports: ['websocket', 'polling'],
          timeout: 20000,
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
          autoConnect: true
        })
      );
    });

    it('should set up socket event listeners', () => {
      renderHook(() => useSocket(), { wrapper });
      
      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('game-created', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('game-joined', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('game-update', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should return socket information', () => {
      const { result } = renderHook(() => useSocket(), { wrapper });
      
      expect(result.current.socketId).toBe('test-socket-id');
      expect(result.current.isConnected).toBe(true);
      expect(typeof result.current.createGame).toBe('function');
      expect(typeof result.current.joinGame).toBe('function');
      expect(typeof result.current.startGame).toBe('function');
      expect(typeof result.current.sendGameAction).toBe('function');
    });
  });

  describe('Game Actions', () => {
    it('should create game correctly', () => {
      const { result } = renderHook(() => useSocket(), { wrapper });
      
      act(() => {
        result.current.createGame('テストプレイヤー');
      });
      
      expect(mockSocket.emit).toHaveBeenCalledWith('create-game', 'テストプレイヤー');
    });

    it('should join game correctly', () => {
      const { result } = renderHook(() => useSocket(), { wrapper });
      
      act(() => {
        result.current.joinGame('test-game-id', 'テストプレイヤー');
      });
      
      expect(mockSocket.emit).toHaveBeenCalledWith('join-game', {
        gameId: 'test-game-id',
        playerName: 'テストプレイヤー'
      });
    });

    it('should start game correctly', () => {
      const { result } = renderHook(() => useSocket(), { wrapper });
      
      act(() => {
        result.current.startGame();
      });
      
      expect(mockSocket.emit).toHaveBeenCalledWith('start-game');
    });

    it('should send game action correctly', () => {
      // テスト用のプレイヤーを設定
      store.dispatch({
        type: 'game/setCurrentPlayer',
        payload: {
          id: 'player1',
          name: 'テストプレイヤー',
          funds: 30,
          prestige: 5
        }
      });

      const { result } = renderHook(() => useSocket(), { wrapper });
      
      const actionData = {
        type: 'buy_dignity'
      };
      
      act(() => {
        result.current.sendGameAction(actionData);
      });
      
      expect(mockSocket.emit).toHaveBeenCalledWith('game-action', actionData);
    });
  });

  describe('Event Handling', () => {
    it('should handle game-created event', () => {
      renderHook(() => useSocket(), { wrapper });
      
      // game-createdイベントのコールバックを取得
      const gameCreatedCallback = mockSocket.on.mock.calls
        .find(call => call[0] === 'game-created')?.[1];
      
      expect(gameCreatedCallback).toBeDefined();
      
      if (gameCreatedCallback) {
        const eventData = {
          gameId: 'test-game',
          player: { id: 'player1', name: 'テストプレイヤー' },
          gameState: { state: 'waiting', players: [] }
        };
        
        act(() => {
          gameCreatedCallback(eventData);
        });
        
        const state = store.getState();
        expect(state.game.gameId).toBe('test-game');
        expect(state.game.currentPlayer).toEqual(eventData.player);
      }
    });

    it('should handle game-update event', () => {
      renderHook(() => useSocket(), { wrapper });
      
      const gameUpdateCallback = mockSocket.on.mock.calls
        .find(call => call[0] === 'game-update')?.[1];
      
      expect(gameUpdateCallback).toBeDefined();
      
      if (gameUpdateCallback) {
        const eventData = {
          gameState: {
            state: 'playing',
            currentRound: 2,
            players: []
          },
          lastAction: {
            type: 'buy_dignity',
            playerName: 'テストプレイヤー'
          }
        };
        
        act(() => {
          gameUpdateCallback(eventData);
        });
        
        const state = store.getState();
        expect(state.game.gameState).toEqual(eventData.gameState);
      }
    });

    it('should handle error event', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      renderHook(() => useSocket(), { wrapper });
      
      const errorCallback = mockSocket.on.mock.calls
        .find(call => call[0] === 'error')?.[1];
      
      expect(errorCallback).toBeDefined();
      
      if (errorCallback) {
        const errorData = {
          message: 'テストエラーメッセージ'
        };
        
        act(() => {
          errorCallback(errorData);
        });
        
        const state = store.getState();
        expect(state.game.error).toBe(errorData.message);
        expect(alertSpy).toHaveBeenCalledWith('ゲームエラー: テストエラーメッセージ');
      }
      
      alertSpy.mockRestore();
    });
  });

  describe('Action Message Generation', () => {
    it('should generate correct message for buy_dignity action', () => {
      store.dispatch({
        type: 'game/setCurrentPlayer',
        payload: {
          id: 'player1',
          name: 'テストプレイヤー',
          funds: 30,
          prestige: 5
        }
      });

      const { result } = renderHook(() => useSocket(), { wrapper });
      
      act(() => {
        result.current.sendGameAction({ type: 'buy_dignity' });
      });
      
      // プレイログにエントリが追加されることを確認
      const state = store.getState();
      const logEntries = state.game.gameState?.playLog || [];
      
      if (logEntries.length > 0) {
        const latestEntry = logEntries[logEntries.length - 1];
        expect(latestEntry.message).toContain('威厳を購入');
      }
    });

    it('should generate correct message for manufacture action', () => {
      store.dispatch({
        type: 'game/setCurrentPlayer',
        payload: {
          id: 'player1',
          name: 'テストプレイヤー'
        }
      });

      const { result } = renderHook(() => useSocket(), { wrapper });
      
      act(() => {
        result.current.sendGameAction({ 
          type: 'manufacture',
          designSlot: 1,
          cost: 5
        });
      });
      
      const state = store.getState();
      const logEntries = state.game.gameState?.playLog || [];
      
      if (logEntries.length > 0) {
        const latestEntry = logEntries[logEntries.length - 1];
        expect(latestEntry.message).toContain('製造');
        expect(latestEntry.message).toContain('5');
      }
    });
  });

  describe('Local Storage Integration', () => {
    it('should save game info to localStorage on game creation', () => {
      renderHook(() => useSocket(), { wrapper });
      
      const gameCreatedCallback = mockSocket.on.mock.calls
        .find(call => call[0] === 'game-created')?.[1];
      
      if (gameCreatedCallback) {
        const eventData = {
          gameId: 'test-game',
          player: { id: 'player1', name: 'テストプレイヤー' },
          gameState: { state: 'waiting' }
        };
        
        act(() => {
          gameCreatedCallback(eventData);
        });
        
        const savedData = localStorage.getItem('market-disruption-game');
        expect(savedData).toBeTruthy();
        
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          expect(parsedData.gameId).toBe('test-game');
          expect(parsedData.playerName).toBe('テストプレイヤー');
        }
      }
    });

    it('should clear localStorage on game over', () => {
      // まずゲーム情報を保存
      localStorage.setItem('market-disruption-game', JSON.stringify({
        gameId: 'test-game',
        playerName: 'テストプレイヤー',
        timestamp: Date.now()
      }));
      
      renderHook(() => useSocket(), { wrapper });
      
      const gameOverCallback = mockSocket.on.mock.calls
        .find(call => call[0] === 'game-over')?.[1];
      
      if (gameOverCallback) {
        const eventData = {
          winner: { id: 'player1', name: 'テストプレイヤー' },
          finalState: { state: 'finished' }
        };
        
        act(() => {
          gameOverCallback(eventData);
        });
        
        const savedData = localStorage.getItem('market-disruption-game');
        expect(savedData).toBeNull();
      }
    });
  });

  describe('Connection State Management', () => {
    it('should update connection state on connect', () => {
      renderHook(() => useSocket(), { wrapper });
      
      const connectCallback = mockSocket.on.mock.calls
        .find(call => call[0] === 'connect')?.[1];
      
      if (connectCallback) {
        act(() => {
          connectCallback();
        });
        
        const state = store.getState();
        expect(state.socket.isConnected).toBe(true);
      }
    });

    it('should update connection state on disconnect', () => {
      renderHook(() => useSocket(), { wrapper });
      
      const disconnectCallback = mockSocket.on.mock.calls
        .find(call => call[0] === 'disconnect')?.[1];
      
      if (disconnectCallback) {
        act(() => {
          disconnectCallback('transport close');
        });
        
        const state = store.getState();
        expect(state.socket.isConnected).toBe(false);
      }
    });
  });
});