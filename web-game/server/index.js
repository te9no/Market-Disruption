import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

// Environment configuration
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Memory optimization
if (NODE_ENV === 'production') {
  // Set memory limits for production
  process.env.NODE_OPTIONS = '--max-old-space-size=512';
}

const app = express();
const server = createServer(app);

// Process optimization for Railway
process.on('SIGTERM', () => {
  console.log('💤 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('🛑 Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('💤 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('🛑 Server closed');
    process.exit(0);
  });
});
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];

const io = new Server(server, {
  cors: {
    origin: NODE_ENV === 'development' ? "*" : ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: NODE_ENV === 'development' ? "*" : ALLOWED_ORIGINS,
  credentials: true
}));
app.use(express.json());

// Game state storage
const games = new Map();
const players = new Map();

// Game logic imports (to be implemented)
import { GameState } from './game/GameState.js';
import { Player } from './game/Player.js';

// Health check endpoints
app.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Market Disruption Game Server',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    memory: process.memoryUsage(),
    activeGames: games.size,
    activePlayers: players.size
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/stats', (req, res) => {
  res.json({
    games: games.size,
    players: players.size,
    memory: process.memoryUsage(),
    uptime: process.uptime()
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('✅ Player connected:', socket.id, 'from', socket.handshake.address);

  // Create new game room
  socket.on('create-game', (playerName) => {
    console.log('Create game request:', { playerName, socketId: socket.id });
    
    // Check if player is already in a game
    const existingPlayerData = players.get(socket.id);
    if (existingPlayerData) {
      console.log('⚠️ Player already in a game:', existingPlayerData.gameId);
      socket.emit('error', { message: 'You are already in a game. Leave first.' });
      return;
    }
    
    const gameId = uuidv4().substring(0, 8);
    const game = new GameState(gameId);
    const player = new Player(socket.id, playerName, 'host');
    
    game.addPlayer(player);
    games.set(gameId, game);
    players.set(socket.id, { gameId, player });
    
    socket.join(gameId);
    console.log(`🏠 Host ${socket.id} joined socket room: ${gameId}`);
    
    socket.emit('game-created', { 
      gameId, 
      player: player.toJSON(),
      gameState: game.toJSON()
    });
    
    console.log(`✅ Game created - ID: ${gameId}, Host: ${playerName}, Total games: ${games.size}`);
  });

  // Join existing game
  socket.on('join-game', ({ gameId, playerName }) => {
    console.log('📥 Join game request:', { 
      gameId, 
      playerName, 
      socketId: socket.id, 
      availableGames: Array.from(games.keys()),
      totalGames: games.size
    });
    
    // Validate input
    if (!gameId || !playerName) {
      console.log('❌ Invalid input:', { gameId, playerName });
      socket.emit('error', { message: 'Game ID and player name are required' });
      return;
    }
    
    // Check if player is already in another game
    const existingPlayerData = players.get(socket.id);
    if (existingPlayerData) {
      console.log('⚠️ Player already in another game:', existingPlayerData.gameId);
      // Remove from existing game first
      const existingGame = games.get(existingPlayerData.gameId);
      if (existingGame) {
        existingGame.removePlayer(socket.id);
        socket.leave(existingPlayerData.gameId);
      }
      players.delete(socket.id);
      console.log('🔄 Removed player from existing game');
    }
    
    // Try exact match first, then case-insensitive
    let game = games.get(gameId);
    let actualGameId = gameId;
    
    if (!game) {
      // Case-insensitive search
      const gameIdLower = gameId.toLowerCase();
      console.log('🔍 Searching for game (case-insensitive):', gameIdLower);
      
      for (const [key, value] of games.entries()) {
        if (key.toLowerCase() === gameIdLower) {
          game = value;
          actualGameId = key;
          console.log('✅ Found game with key:', key);
          break;
        }
      }
    }
    
    if (!game) {
      console.log('❌ Game not found:', gameId, 'Available games:', Array.from(games.keys()));
      socket.emit('error', { message: `Game not found: ${gameId}` });
      return;
    }
    
    console.log(`🎮 Game status - ID: ${gameId}, Players: ${game.players.length}/4, State: ${game.state}`);
    console.log('Current players:', game.players.map(p => ({ id: p.id, name: p.name })));
    
    // Check if player is already in the game
    const existingPlayer = game.players.find(p => p.id === socket.id);
    if (existingPlayer) {
      console.log('⚠️ Player already in game:', socket.id);
      socket.emit('error', { message: 'You are already in this game' });
      return;
    }
    
    if (game.players.length >= 4) {
      console.log('❌ Game is full:', game.players.length, '>=', 4);
      socket.emit('error', { message: 'Game is full' });
      return;
    }
    
    // Allow joining games in progress if there's space
    if (game.state === 'finished') {
      console.log('❌ Game already finished:', game.state);
      socket.emit('error', { message: 'Game has finished' });
      return;
    }
    
    try {
      const player = new Player(socket.id, playerName, 'player');
      const isJoiningOngoingGame = game.state === 'playing';
      
      game.addPlayer(player);
      players.set(socket.id, { gameId: actualGameId, player });
      
      socket.join(actualGameId);
      console.log(`👥 Player ${socket.id} joined socket room: ${actualGameId}`);
      
      const gameStateJSON = game.toJSON();
      
      // Send confirmation to the joining player
      socket.emit('game-joined', { 
        gameId: actualGameId, 
        player: player.toJSON(),
        gameState: gameStateJSON
      });
      
      const joinMessage = isJoiningOngoingGame ? 
        `🎮 Player ${playerName} joined ongoing game (Round ${game.currentRound})` : 
        `✅ Player ${playerName} joined waiting room`;
      
      console.log(`${joinMessage} - Game: ${actualGameId}, Total players: ${game.players.length}`);
      console.log(`📢 Sending updates to room ${actualGameId} with ${io.sockets.adapter.rooms.get(actualGameId)?.size || 0} sockets`);
      
      // Notify all OTHER players in the room about the new player
      socket.to(actualGameId).emit('player-joined', {
        player: player.toJSON(),
        gameState: gameStateJSON,
        isOngoingGame: isJoiningOngoingGame
      });
      
      // Also send updated game state to ALL players (including the joiner and host)
      io.to(actualGameId).emit('game-state-updated', {
        gameState: gameStateJSON
      });
      
      if (isJoiningOngoingGame) {
        // Send welcome message to the game room
        io.to(actualGameId).emit('game-notification', {
          type: 'player-joined-ongoing',
          message: `🎉 ${playerName}さんがゲームに途中参加しました！`
        });
      }
      
      console.log(`🎉 ${playerName} successfully joined game ${actualGameId}`);
      
    } catch (error) {
      console.error('❌ Error adding player to game:', error);
      socket.emit('error', { message: 'Failed to join game' });
      return;
    }
  });

  // Request current game state
  socket.on('request-game-state', ({ gameId }) => {
    console.log('Game state requested for:', gameId);
    const playerData = players.get(socket.id);
    if (!playerData) return;
    
    const game = games.get(playerData.gameId);
    if (!game) return;
    
    // Send current game state to requester
    socket.emit('game-state-updated', {
      gameState: game.toJSON()
    });
    
    console.log(`Game state sent to ${socket.id} for game ${playerData.gameId}`);
  });

  // Start game
  socket.on('start-game', () => {
    const playerData = players.get(socket.id);
    if (!playerData) {
      console.log('❌ Start game: No player data found');
      return;
    }
    
    const game = games.get(playerData.gameId);
    if (!game) {
      console.log('❌ Start game: Game not found');
      return;
    }
    
    if (playerData.player.role !== 'host') {
      console.log('❌ Start game: Player is not host');
      return;
    }
    
    if (game.players.length < 1) {
      console.log('❌ Start game: Not enough players');
      socket.emit('error', { message: 'Need at least 1 player to start' });
      return;
    }
    
    console.log(`🎮 Starting game ${playerData.gameId} with ${game.players.length} players (vs Automata only)`);
    
    try {
      game.startGame();
      
      const gameStateJSON = game.toJSON();
      console.log(`📤 Sending game-started event to room ${playerData.gameId}`);
      console.log(`🔍 Game state: ${gameStateJSON.state}, Players: ${gameStateJSON.players.length}`);
      
      // Debug: Check if players have designs after game start
      gameStateJSON.players.forEach(player => {
        console.log(`🎨 Player ${player.name} designs after game start:`, Object.keys(player.designs || {}));
        console.log(`🎨 Player ${player.name} design details:`, player.designs);
      });
      
      // Send to all players in the room
      io.to(playerData.gameId).emit('game-started', {
        gameState: gameStateJSON
      });
      
      // Also send game-state-updated to ensure all clients update
      io.to(playerData.gameId).emit('game-state-updated', {
        gameState: gameStateJSON
      });
      
      console.log(`✅ Game ${playerData.gameId} started successfully`);
    } catch (error) {
      console.error('❌ Error starting game:', error);
      socket.emit('error', { message: 'Failed to start game' });
    }
  });

  // Game actions
  socket.on('game-action', (actionData) => {
    console.log('🎯 Game action received:', { 
      actionType: actionData.type, 
      playerId: socket.id,
      actionData 
    });
    
    const playerData = players.get(socket.id);
    if (!playerData) {
      console.log('❌ Game action: No player data found');
      return;
    }
    
    const game = games.get(playerData.gameId);
    if (!game) {
      console.log('❌ Game action: Game not found');
      return;
    }
    
    try {
      console.log(`🔄 Processing ${actionData.type} action for player ${playerData.player.name}`);
      const result = game.processAction(playerData.player.id, actionData);
      
      if (result.success) {
        console.log(`✅ Action ${actionData.type} successful:`, result.action);
        
        try {
          const gameStateJSON = game.toJSON();
          console.log(`🔄 Game state serialized successfully`);
          
          // Debug: Log inventory data for all players
          if (result.action.type === 'manufacture') {
            console.log('🏭 Manufacturing action - checking inventory data:');
            gameStateJSON.players.forEach(player => {
              console.log(`  Player ${player.name}: ${player.inventory.length} items in inventory`);
              console.log(`  Inventory details:`, player.inventory);
            });
          }
          
          // Broadcast game state update to all players
          io.to(playerData.gameId).emit('game-update', {
            gameState: gameStateJSON,
            lastAction: result.action
          });
          
          // Also send game-state-updated to ensure synchronization
          io.to(playerData.gameId).emit('game-state-updated', {
            gameState: gameStateJSON
          });
          
          console.log(`📤 Game state updated and broadcast to room ${playerData.gameId}`);
        } catch (stateError) {
          console.error('❌ Error serializing game state:', stateError);
          socket.emit('action-error', { 
            message: 'ゲーム状態の更新中にエラーが発生しました' 
          });
          return;
        }
        
        // Check for manual game end
        if (result.action.gameEnded) {
          console.log(`🏁 Game manually ended by ${result.action.initiatedBy}`);
          io.to(playerData.gameId).emit('game-over', {
            winner: result.action.winner,
            finalState: gameStateJSON,
            endReason: 'manual',
            initiatedBy: result.action.initiatedBy,
            finalScores: result.action.finalScores
          });
          return;
        }
        
        // Check for natural game end
        if (game.isGameOver()) {
          io.to(playerData.gameId).emit('game-over', {
            winner: game.getWinner(),
            finalState: gameStateJSON,
            endReason: 'victory'
          });
        }
      } else {
        console.log(`❌ Action ${actionData.type} failed:`, result.error);
        socket.emit('action-error', { message: result.error });
      }
    } catch (error) {
      console.error(`❌ Game action error (${actionData.type}):`, error);
      socket.emit('action-error', { message: 'Invalid action' });
    }
  });

  // Player disconnect
  socket.on('disconnect', () => {
    const playerData = players.get(socket.id);
    if (playerData) {
      const game = games.get(playerData.gameId);
      if (game) {
        game.removePlayer(socket.id);
        
        // Notify remaining players
        io.to(playerData.gameId).emit('player-left', {
          playerId: socket.id,
          players: game.players.map(p => p.toJSON())
        });
        
        // Clean up empty games
        if (game.players.length === 0) {
          games.delete(playerData.gameId);
          console.log(`Game ${playerData.gameId} deleted (empty)`);
        }
      }
      
      players.delete(socket.id);
    }
    
    console.log('Player disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Market Disruption server running on port ${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
  if (NODE_ENV === 'production') {
    console.log(`Allowed Origins: ${ALLOWED_ORIGINS.join(', ')}`);
  }
});