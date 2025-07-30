import { v4 as uuidv4 } from 'uuid';
import { GameState } from './game/GameState.js';
import { Player } from './game/Player.js';

/**
 * GameManager - マーケット・ディスラプションゲームのゲーム管理クラス
 * 
 * ゲームの作成、参加、実行を管理し、Socket.IOイベントを処理します。
 */
export default class GameManager {
  constructor(io) {
    this.io = io;
    this.games = new Map();
    this.players = new Map();
    
    console.log('🎮 GameManager initialized');
    this.setupSocketHandlers();
  }

  /**
   * Socket.IOイベントハンドラーのセットアップ
   */
  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('✅ Player connected:', socket.id, 'from', socket.handshake.address);

      // ゲーム作成
      socket.on('create-game', (playerName) => {
        this.handleCreateGame(socket, playerName);
      });

      // ゲーム参加
      socket.on('join-game', ({ gameId, playerName }) => {
        this.handleJoinGame(socket, gameId, playerName);
      });

      // ゲーム開始
      socket.on('start-game', () => {
        this.handleStartGame(socket);
      });

      // ゲームアクション
      socket.on('game-action', (actionData) => {
        this.handleGameAction(socket, actionData);
      });

      // 切断処理
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  /**
   * ゲーム作成処理
   */
  handleCreateGame(socket, playerName) {
    console.log('Create game request:', { playerName, socketId: socket.id });
    
    try {
      // 既存ゲーム参加チェック
      const existingPlayerData = this.players.get(socket.id);
      if (existingPlayerData) {
        console.log('⚠️ Player already in a game:', existingPlayerData.gameId);
        socket.emit('error', { message: 'You are already in a game. Leave first.' });
        return;
      }
      
      const gameId = uuidv4().substring(0, 8);
      const game = new GameState(gameId);
      const player = new Player(socket.id, playerName, 'host');
      
      game.addPlayer(player);
      this.games.set(gameId, game);
      this.players.set(socket.id, { gameId, player });
      
      socket.join(gameId);
      console.log(`🏠 Host ${socket.id} joined socket room: ${gameId}`);
      
      socket.emit('game-created', { 
        gameId, 
        player: player.toJSON(),
        gameState: game.toJSON()
      });
      
      console.log(`✅ Game created - ID: ${gameId}, Host: ${playerName}, Total games: ${this.games.size}`);
    } catch (error) {
      console.error('❌ Error creating game:', error);
      socket.emit('error', { message: 'Failed to create game' });
    }
  }

  /**
   * ゲーム参加処理
   */
  handleJoinGame(socket, gameId, playerName) {
    console.log('📥 Join game request:', { 
      gameId, 
      playerName, 
      socketId: socket.id, 
      availableGames: Array.from(this.games.keys()),
      totalGames: this.games.size
    });
    
    try {
      // 入力検証
      if (!gameId || !playerName) {
        console.log('❌ Invalid input:', { gameId, playerName });
        socket.emit('error', { message: 'Game ID and player name are required' });
        return;
      }
      
      // 既存ゲーム参加チェック
      const existingPlayerData = this.players.get(socket.id);
      if (existingPlayerData) {
        console.log('⚠️ Player already in another game:', existingPlayerData.gameId);
        socket.emit('error', { message: 'You are already in a game. Leave first.' });
        return;
      }
      
      // ゲーム存在チェック
      const game = this.games.get(gameId);
      if (!game) {
        console.log('❌ Game not found:', gameId);
        socket.emit('error', { message: 'Game not found' });
        return;
      }
      
      // ゲーム状態チェック
      if (game.state !== 'waiting') {
        console.log('❌ Game already started:', gameId);
        socket.emit('error', { message: 'Game has already started' });
        return;
      }
      
      // プレイヤー数制限チェック
      if (game.players.length >= 4) {
        console.log('❌ Game is full:', gameId);
        socket.emit('error', { message: 'Game is full' });
        return;
      }
      
      const player = new Player(socket.id, playerName, 'player');
      game.addPlayer(player);
      this.players.set(socket.id, { gameId, player });
      
      socket.join(gameId);
      console.log(`👥 Player ${socket.id} joined socket room: ${gameId}`);
      
      // プレイヤーにゲーム参加を通知
      socket.emit('game-joined', { 
        gameId, 
        player: player.toJSON(),
        gameState: game.toJSON()
      });
      
      // 他のプレイヤーにゲーム状態更新を通知
      socket.to(gameId).emit('game-update', { 
        gameState: game.toJSON(),
        message: `${playerName}がゲームに参加しました`
      });
      
      console.log(`✅ Player joined - Game: ${gameId}, Player: ${playerName}, Total players: ${game.players.length}`);
    } catch (error) {
      console.error('❌ Error joining game:', error);
      socket.emit('error', { message: 'Failed to join game' });
    }
  }

  /**
   * ゲーム開始処理
   */
  handleStartGame(socket) {
    try {
      const playerData = this.players.get(socket.id);
      if (!playerData) {
        socket.emit('error', { message: 'You are not in a game' });
        return;
      }
      
      const { gameId, player } = playerData;
      const game = this.games.get(gameId);
      
      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }
      
      if (player.role !== 'host') {
        socket.emit('error', { message: 'Only the host can start the game' });
        return;
      }
      
      if (game.players.length < 1) {
        socket.emit('error', { message: 'Need at least 1 player to start' });
        return;
      }
      
      game.startGame();
      
      this.io.to(gameId).emit('game-update', { 
        gameState: game.toJSON(),
        message: 'ゲームが開始されました！'
      });
      
      console.log(`🚀 Game started - ID: ${gameId}, Players: ${game.players.length}`);
    } catch (error) {
      console.error('❌ Error starting game:', error);
      socket.emit('error', { message: 'Failed to start game' });
    }
  }

  /**
   * ゲームアクション処理
   */
  handleGameAction(socket, actionData) {
    try {
      const playerData = this.players.get(socket.id);
      if (!playerData) {
        socket.emit('error', { message: 'You are not in a game' });
        return;
      }
      
      const { gameId } = playerData;
      const game = this.games.get(gameId);
      
      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }
      
      console.log(`🎯 Processing action: ${actionData.type} from player ${socket.id}`);
      
      const result = game.processAction(socket.id, actionData);
      
      if (result.success) {
        // 全プレイヤーにゲーム状態更新を送信
        this.io.to(gameId).emit('game-update', { 
          gameState: game.toJSON(),
          lastAction: result.action
        });
        
        // ゲーム終了チェック
        if (game.isGameOver()) {
          this.io.to(gameId).emit('game-over', {
            winner: game.getWinner(),
            finalState: game.toJSON()
          });
          
          // ゲーム終了後のクリーンアップ
          setTimeout(() => {
            this.cleanupGame(gameId);
          }, 10000); // 10秒後にクリーンアップ
        }
      } else {
        socket.emit('error', { message: result.error });
      }
    } catch (error) {
      console.error('❌ Error processing game action:', error);
      socket.emit('error', { message: 'Failed to process action' });
    }
  }

  /**
   * プレイヤー切断処理
   */
  handleDisconnect(socket) {
    console.log('🔌 Player disconnected:', socket.id);
    
    const playerData = this.players.get(socket.id);
    if (playerData) {
      const { gameId, player } = playerData;
      const game = this.games.get(gameId);
      
      if (game) {
        game.removePlayer(socket.id);
        
        // 他のプレイヤーに通知
        socket.to(gameId).emit('game-update', { 
          gameState: game.toJSON(),
          message: `${player.name}が切断しました`
        });
        
        // ゲームが空になった場合は削除
        if (game.players.length === 0) {
          this.cleanupGame(gameId);
        }
      }
      
      this.players.delete(socket.id);
    }
  }

  /**
   * ゲームクリーンアップ
   */
  cleanupGame(gameId) {
    const game = this.games.get(gameId);
    if (game) {
      // ゲームに参加している全プレイヤーを削除
      game.players.forEach(player => {
        this.players.delete(player.id);
      });
      
      this.games.delete(gameId);
      console.log(`🗑️ Game cleaned up - ID: ${gameId}, Remaining games: ${this.games.size}`);
    }
  }

  /**
   * 統計情報取得
   */
  getStats() {
    return {
      games: this.games.size,
      players: this.players.size,
      activeGames: Array.from(this.games.values()).map(game => ({
        id: game.id,
        state: game.state,
        playerCount: game.players.length,
        currentRound: game.currentRound
      }))
    };
  }

  /**
   * 特定のゲームを取得
   */
  getGame(gameId) {
    return this.games.get(gameId);
  }

  /**
   * 特定のプレイヤー情報を取得
   */
  getPlayer(socketId) {
    return this.players.get(socketId);
  }
}