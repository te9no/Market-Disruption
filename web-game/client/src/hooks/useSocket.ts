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
  addPlayLogEntry,
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
  const currentPlayer = useSelector((state: RootState) => state.game.currentPlayer);

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
      
      // Check for saved game but don't auto-reconnect
      const savedGame = localStorage.getItem('market-disruption-game');
      if (savedGame) {
        try {
          const gameInfo = JSON.parse(savedGame);
          const timeDiff = Date.now() - gameInfo.timestamp;
          
          // Clean up old saved games (older than 30 minutes)
          if (timeDiff >= 30 * 60 * 1000) {
            console.log('⏰ Saved game too old, clearing...');
            localStorage.removeItem('market-disruption-game');
          } else {
            console.log('💾 Found saved game, but auto-reconnect disabled. Player can choose to rejoin:', gameInfo.gameId);
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
      
      // Check for saved game after reconnection but don't auto-rejoin
      const savedGame = localStorage.getItem('market-disruption-game');
      if (savedGame) {
        try {
          const gameInfo = JSON.parse(savedGame);
          console.log('💾 Reconnected with saved game available, but auto-rejoin disabled:', gameInfo.gameId);
        } catch (e) {
          console.error('❌ Error checking saved game after reconnection:', e);
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
      console.log('🎮 Game started event received');
      console.log('🎨 Players and their designs:', gameState.players.map((p: any) => ({
        name: p.name,
        designCount: Object.keys(p.designs || {}).length,
        designs: p.designs
      })));
      dispatch(setGameState(gameState));
    });

    newSocket.on('game-update', ({ gameState, lastAction }) => {
      console.log('🎯 Game updated:', lastAction);
      try {
        dispatch(setGameState(gameState));
        console.log('✅ Game state dispatched successfully after action');
        
        // Log the action details for better user experience
        if (lastAction) {
          console.log('📝 Action details logged:', {
            type: lastAction.type,
            player: lastAction.playerName || lastAction.playerId,
            details: lastAction
          });
          
          // すべてのアクション型をログ出力（デバッグ用）
          console.log('🔍 All action types received:', lastAction.type);
          
          // 威厳購入の特別なデバッグ
          if (lastAction.type === 'buy_dignity' || 
              lastAction.type === 'prestige_purchase' || 
              lastAction.type === 'purchase_prestige' ||
              lastAction.type?.includes('dignity') ||
              lastAction.type?.includes('prestige')) {
            console.log('👑 威厳関連アクション受信:', {
              type: lastAction.type,
              player: lastAction.playerName,
              details: lastAction,
              timestamp: new Date().toISOString()
            });
          }
          
          // 規制推進の結果表示
          if (lastAction.type === 'promote_regulation') {
            console.log('⚖️ 規制推進結果:', {
              dice: lastAction.dice,
              total: lastAction.total,
              success: lastAction.success,
              newLevel: lastAction.newRegulationLevel
            });
            
            const dice1 = lastAction.dice?.[0] || '?';
            const dice2 = lastAction.dice?.[1] || '?';
            const total = lastAction.total || 0;
            const success = lastAction.success;
            const resultText = success ? '成功' : '失敗';
            const message = `規制推進結果: ダイス[${dice1}][${dice2}] 合計${total} → ${resultText}`;
            
            alert(message);
          }
          
          // Log phase transitions
          if (lastAction.type === 'phase_change') {
            console.log('🔄 Phase change detected:', {
              from: lastAction.fromPhase,
              to: lastAction.toPhase,
              round: lastAction.round
            });
          }
          
          // Log round progression
          if (lastAction.type === 'round_change') {
            console.log('📅 Round change detected:', {
              newRound: lastAction.newRound,
              phase: lastAction.phase
            });
          }
        }
      } catch (error) {
        console.error('❌ Error updating state after action:', error);
      }
    });

    newSocket.on('game-over', ({ winner, finalState }) => {
      console.log('Game over, winner:', winner);
      dispatch(setGameState(finalState));
      
      // Clear saved game data when game ends
      console.log('🧹 Clearing saved game data after game end');
      localStorage.removeItem('market-disruption-game');
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
      // クライアント側でアクション実行ログを生成
      const actionMessage = getActionMessage(actionData);
      console.log('🎯 Sending action:', actionData, 'Message:', actionMessage);
      
      // すべてのアクションでクライアント側ログを生成
      const logEntry = {
        id: `client-${actionData.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        type: actionData.type as any,
        message: actionMessage,
        playerId: currentPlayer?.id,
        playerName: currentPlayer?.name,
        details: getActionDetails(actionData, currentPlayer)
      };
      
      dispatch(addPlayLogEntry(logEntry));
      console.log('📝 クライアント側ログエントリを追加:', logEntry);
      
      socket.emit('game-action', actionData);
    }
  };

  // アクションタイプに応じた詳細情報を生成
  const getActionDetails = (actionData: any, player: any) => {
    const { type, ...params } = actionData;
    
    switch (type) {
      case 'buy_dignity':
        return {
          cost: 10,
          prestigeGain: 1,
          remainingFunds: (player?.funds || 10) - 10
        };
      case 'purchase':
        return {
          price: params.price,
          popularity: params.popularity,
          sellerId: params.sellerId
        };
      case 'sell':
      case 'resale':
        return {
          price: params.price,
          productId: params.productId
        };
      case 'manufacture':
        return {
          cost: params.cost,
          design: params.selectedDesign || params.designSlot
        };
      case 'review':
        return {
          reviewType: params.reviewType,
          useOutsourcing: params.useOutsourcing,
          targetProductId: params.targetProductId
        };
      case 'design':
        return {
          dice: params.selectedDice,
          designSlot: params.designSlot
        };
      default:
        return params;
    }
  };

  // アクションタイプに応じたログメッセージを生成
  const getActionMessage = (actionData: any) => {
    const { type, ...params } = actionData;
    
    switch (type) {
      case 'manufacture':
        return `${params.selectedDesign || params.designSlot || '商品'}を製造しました（コスト: ¥${params.cost || '不明'}）`;
      case 'sell':
        if (params.previousOwner) {
          return `商品を転売しました（価格: ¥${params.price}）`;
        } else {
          return `商品を販売しました（価格: ¥${params.price}）`;
        }
      case 'purchase':
        const sellerName = params.sellerId === 'manufacturer-automata' ? 'メーカーオートマ' : 
                          params.sellerId === 'resale-automata' ? '転売オートマ' : 
                          '他プレイヤー';
        return `${sellerName}から商品を購入しました（価格: ¥${params.price}, 人気度: ${params.popularity}）`;
      case 'review':
        const reviewText = params.reviewType === 'positive' ? 'ポジティブ' : 'ネガティブ';
        const outsourcing = params.useOutsourcing ? '（外注）' : '';
        return `商品に${reviewText}レビューを付けました${outsourcing}`;
      case 'design':
        if (params.selectedDice?.length) {
          return `設計を実行しました（ダイス: ${params.selectedDice.join(', ')}）`;
        } else {
          return '設計を実行しました';
        }
      case 'trend_research':
        return 'トレンド調査を実行しました';
      case 'labor':
      case 'part_time_job':
        return 'アルバイトを実行しました（+¥5, -2AP）';
      case 'day_labor':
        return '日雇い労働を実行しました（+¥12, -3AP）';
      case 'regulate':
      case 'promote_regulation':
        return '規制推進を実行しました（2AP, 2d6で9+成功）';
      case 'skip-automata':
        return 'オートマフェーズをスキップしました';
      case 'skip-market':
        return 'マーケットフェーズをスキップしました';
      case 'buyback':
        return `商品を買い戻しました（価格: ¥${params.price}）`;
      case 'resale':
        return `商品を転売しました（価格: ¥${params.price}）`;
      case 'buy_dignity':
      case 'prestige_purchase':
      case 'purchase_prestige':
        return '威厳を購入しました（-¥10, +威厳1）';
      case 'end_game':
        return 'ゲーム終了を宣言しました';
      default:
        return `${type}アクションを実行しました`;
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