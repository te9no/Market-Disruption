import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import type { RootState } from '../store/store';
import { setSocket, setConnected, clearSocket } from '../store/socketSlice';
import { 
  setGameState, 
  setCurrentPlayer, 
  setGameId, 
  setError,
  removePlayerFromGame,
} from '../store/gameSlice';

const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Debug information
console.log('🔗 Environment details:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  SERVER_URL,
  NODE_ENV: import.meta.env.NODE_ENV,
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
  timestamp: new Date().toISOString()
});

// Alert if using incorrect URL
if (SERVER_URL.includes('railway.internal')) {
  console.error('🚨 CRITICAL: Using internal Railway URL! This will fail in production.');
  console.error('🔧 Fix: Update VITE_API_URL to use public Railway domain (.up.railway.app)');
}

export const useSocket = () => {
  const dispatch = useDispatch();
  const socket = useSelector((state: RootState) => state.socket.socket);
  const isConnected = useSelector((state: RootState) => state.socket.isConnected);

  useEffect(() => {
    // 既に接続済みの場合は何もしない
    if (socket && socket.connected) {
      console.log('Socket already connected, skipping...');
      return;
    }

    console.log('Attempting to connect to:', SERVER_URL);
    const newSocket = io(SERVER_URL, {
      // 接続の安定性向上のためのオプション
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      autoConnect: true
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ Successfully connected to server:', SERVER_URL);
      dispatch(setConnected(true));
      
      // Try to reconnect to saved game
      const savedGame = localStorage.getItem('market-disruption-game');
      if (savedGame) {
        try {
          const gameInfo = JSON.parse(savedGame);
          const timeDiff = Date.now() - gameInfo.timestamp;
          
          // Auto-rejoin if saved within last 30 minutes
          if (timeDiff < 30 * 60 * 1000) {
            console.log('🔄 Auto-reconnecting to saved game:', gameInfo.gameId);
            setTimeout(() => {
              newSocket.emit('join-game', { 
                gameId: gameInfo.gameId, 
                playerName: gameInfo.playerName 
              });
            }, 1000);
          } else {
            console.log('⏰ Saved game too old, clearing...');
            localStorage.removeItem('market-disruption-game');
          }
        } catch (e) {
          console.error('❌ Error parsing saved game:', e);
          localStorage.removeItem('market-disruption-game');
        }
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from server, reason:', reason);
      dispatch(setConnected(false));
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconnected to server after', attemptNumber, 'attempts');
      dispatch(setConnected(true));
      
      // Try to rejoin saved game after reconnection
      const savedGame = localStorage.getItem('market-disruption-game');
      if (savedGame) {
        try {
          const gameInfo = JSON.parse(savedGame);
          console.log('🔄 Auto-rejoining after reconnection:', gameInfo.gameId);
          newSocket.emit('join-game', { 
            gameId: gameInfo.gameId, 
            playerName: gameInfo.playerName 
          });
        } catch (e) {
          console.error('❌ Error rejoining after reconnection:', e);
        }
      }
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('❌ Reconnection error:', error);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      dispatch(setConnected(false));
    });

    // Game events
    newSocket.on('game-created', ({ gameId, player, gameState }) => {
      console.log('Game created:', gameId, gameState);
      dispatch(setGameId(gameId));
      dispatch(setCurrentPlayer(player));
      dispatch(setGameState(gameState));
      
      // Save game info to localStorage for persistence
      localStorage.setItem('market-disruption-game', JSON.stringify({
        gameId,
        playerName: player.name,
        timestamp: Date.now()
      }));
    });

    newSocket.on('game-joined', ({ gameId, player, gameState }) => {
      console.log('Joined game:', gameId, gameState);
      dispatch(setGameId(gameId));
      dispatch(setCurrentPlayer(player));
      dispatch(setGameState(gameState));
      
      // Save game info to localStorage for persistence
      localStorage.setItem('market-disruption-game', JSON.stringify({
        gameId,
        playerName: player.name,
        timestamp: Date.now()
      }));
      
      // Automatically request fresh game state after joining
      setTimeout(() => {
        console.log('🔄 Requesting fresh game state after join...');
        newSocket.emit('request-game-state', { gameId });
      }, 500);
    });

    newSocket.on('player-joined', ({ player, gameState }) => {
      console.log('🚀 Player joined event received:', { 
        playerName: player.name, 
        totalPlayers: gameState.players.length,
        allPlayers: gameState.players.map((p: any) => p.name),
        gameState 
      });
      console.log('🔄 About to dispatch setGameState with:', gameState);
      dispatch(setGameState(gameState));
      console.log('✅ setGameState dispatched successfully');
    });

    newSocket.on('game-state-updated', ({ gameState }) => {
      console.log('🔄 Game state updated event received:', { 
        totalPlayers: gameState.players.length,
        allPlayers: gameState.players.map((p: any) => p.name),
        gameState 
      });
      dispatch(setGameState(gameState));
      console.log('✅ Game state updated and dispatched');
    });

    newSocket.on('player-left', ({ playerId }) => {
      console.log('Player left:', playerId);
      dispatch(removePlayerFromGame(playerId));
    });

    newSocket.on('game-started', ({ gameState }) => {
      console.log('Game started');
      dispatch(setGameState(gameState));
    });

    newSocket.on('game-update', ({ gameState, lastAction }) => {
      console.log('🎯 Game updated:', lastAction);
      try {
        dispatch(setGameState(gameState));
        console.log('✅ Game state dispatched successfully after action');
      } catch (error) {
        console.error('❌ Error updating state after action:', error);
      }
    });

    newSocket.on('game-over', ({ winner, finalState }) => {
      console.log('Game over, winner:', winner);
      dispatch(setGameState(finalState));
    });

    newSocket.on('error', ({ message }) => {
      console.error('🚨 Game error:', message);
      dispatch(setError(message));
      
      // Provide more helpful error messages
      let userMessage = message;
      if (message === 'Game already started') {
        userMessage = 'このゲームは既に開始されていますが、定員に空きがあれば途中参加可能です。';
      } else if (message === 'Game is full') {
        userMessage = 'ゲームが満席です（最大4人）。別のゲームを作成するか、他のゲームに参加してください。';
      } else if (message === 'Game has finished') {
        userMessage = 'このゲームは既に終了しています。新しいゲームを作成してください。';
      }
      
      alert(`ゲームエラー: ${userMessage}`);
    });

    newSocket.on('action-error', ({ message }) => {
      console.error('🚨 Action error:', message);
      dispatch(setError(message));
      alert(`アクションエラー: ${message}`);
    });

    newSocket.on('game-notification', ({ type, message }) => {
      console.log('🔔 Game notification:', type, message);
      
      // Show notification to user
      if (type === 'player-joined-ongoing') {
        // Create a temporary notification element
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 5000);
      }
    });

    dispatch(setSocket(newSocket));

    return () => {
      console.log('Cleaning up socket connection...');
      newSocket.close();
      dispatch(clearSocket());
    };
  }, []); // 依存配列を空にして、初回のみ実行

  // Socket action functions
  const createGame = (playerName: string) => {
    if (socket) {
      socket.emit('create-game', playerName);
    }
  };

  const joinGame = (gameId: string, playerName: string) => {
    console.log('🎮 Attempting to join game:', { gameId, playerName, socketConnected: !!socket });
    if (socket) {
      socket.emit('join-game', { gameId, playerName });
      console.log('📤 join-game event sent to server');
    } else {
      console.error('❌ Socket not connected, cannot join game');
    }
  };

  const startGame = () => {
    if (socket) {
      socket.emit('start-game');
    }
  };

  const sendGameAction = (actionData: any) => {
    if (socket) {
      socket.emit('game-action', actionData);
    }
  };

  return {
    socket,
    socketId: socket?.id,
    isConnected,
    createGame,
    joinGame,
    startGame,
    sendGameAction,
  };
};