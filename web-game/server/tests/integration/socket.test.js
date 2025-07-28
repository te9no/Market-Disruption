import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as Client } from 'socket.io-client';
import express from 'express';

describe('Socket.IO Integration Tests', () => {
  let httpServer;
  let io;
  let serverSocket;
  let clientSocket1, clientSocket2, clientSocket3, clientSocket4;
  let gameManager;

  before(async () => {
    // テスト用サーバーセットアップ
    const app = express();
    httpServer = createServer(app);
    io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    // GameManagerをインポート（実際のファイルパスに合わせて調整）
    const { default: GameManager } = await import('../../GameManager.js');
    gameManager = new GameManager(io);

    await new Promise((resolve) => {
      httpServer.listen(() => {
        const port = httpServer.address().port;
        
        // テスト用クライアント作成
        clientSocket1 = Client(`http://localhost:${port}`);
        clientSocket2 = Client(`http://localhost:${port}`);
        clientSocket3 = Client(`http://localhost:${port}`);
        clientSocket4 = Client(`http://localhost:${port}`);
        
        let connectedClients = 0;
        const checkAllConnected = () => {
          connectedClients++;
          if (connectedClients === 4) {
            resolve();
          }
        };
        
        clientSocket1.on('connect', checkAllConnected);
        clientSocket2.on('connect', checkAllConnected);
        clientSocket3.on('connect', checkAllConnected);
        clientSocket4.on('connect', checkAllConnected);
      });
    });
  });

  after(() => {
    io.close();
    httpServer.close();
    clientSocket1?.close();
    clientSocket2?.close();
    clientSocket3?.close();
    clientSocket4?.close();
  });

  describe('Game Creation and Joining', () => {
    it('should create game successfully', (done) => {
      clientSocket1.emit('create-game', 'テストプレイヤー1');
      
      clientSocket1.on('game-created', (data) => {
        assert(data.gameId);
        assert.strictEqual(data.player.name, 'テストプレイヤー1');
        assert(data.gameState);
        done();
      });
    });

    it('should join existing game successfully', (done) => {
      // まずゲームを作成
      clientSocket1.emit('create-game', 'ホスト');
      
      clientSocket1.on('game-created', (data) => {
        const gameId = data.gameId;
        
        // 他のプレイヤーが参加
        clientSocket2.emit('join-game', { gameId, playerName: 'プレイヤー2' });
        
        clientSocket2.on('game-joined', (joinData) => {
          assert.strictEqual(joinData.gameId, gameId);
          assert.strictEqual(joinData.player.name, 'プレイヤー2');
          done();
        });
      });
    });

    it('should handle full game correctly', (done) => {
      // 4人のゲームを作成
      clientSocket1.emit('create-game', 'プレイヤー1');
      
      clientSocket1.on('game-created', (data) => {
        const gameId = data.gameId;
        
        // 3人が追加で参加
        clientSocket2.emit('join-game', { gameId, playerName: 'プレイヤー2' });
        clientSocket3.emit('join-game', { gameId, playerName: 'プレイヤー3' });
        clientSocket4.emit('join-game', { gameId, playerName: 'プレイヤー4' });
        
        let joinedPlayers = 1; // ホストを含む
        
        const checkJoin = () => {
          joinedPlayers++;
          if (joinedPlayers === 4) {
            // 5人目の参加を試行（失敗するはず）
            const clientSocket5 = Client(`http://localhost:${httpServer.address().port}`);
            
            clientSocket5.on('connect', () => {
              clientSocket5.emit('join-game', { gameId, playerName: 'プレイヤー5' });
              
              clientSocket5.on('error', (error) => {
                assert(error.message.includes('full') || error.message.includes('満席'));
                clientSocket5.close();
                done();
              });
            });
          }
        };
        
        clientSocket2.on('game-joined', checkJoin);
        clientSocket3.on('game-joined', checkJoin);
        clientSocket4.on('game-joined', checkJoin);
      });
    });
  });

  describe('Game Flow Integration', () => {
    let gameId;
    
    beforeEach((done) => {
      // 4人ゲームをセットアップ
      clientSocket1.emit('create-game', 'プレイヤー1');
      
      clientSocket1.on('game-created', (data) => {
        gameId = data.gameId;
        
        clientSocket2.emit('join-game', { gameId, playerName: 'プレイヤー2' });
        clientSocket3.emit('join-game', { gameId, playerName: 'プレイヤー3' });
        clientSocket4.emit('join-game', { gameId, playerName: 'プレイヤー4' });
        
        let joinedPlayers = 1;
        const checkJoin = () => {
          joinedPlayers++;
          if (joinedPlayers === 4) {
            // ゲーム開始
            clientSocket1.emit('start-game');
            done();
          }
        };
        
        clientSocket2.on('game-joined', checkJoin);
        clientSocket3.on('game-joined', checkJoin);
        clientSocket4.on('game-joined', checkJoin);
      });
    });

    it('should start game and handle first player turn', (done) => {
      clientSocket1.on('game-started', (data) => {
        assert.strictEqual(data.gameState.state, 'playing');
        assert.strictEqual(data.gameState.phase, 'action');
        assert.strictEqual(data.gameState.currentPlayerIndex, 0);
        
        // 初期リソースチェック
        const player1 = data.gameState.players[0];
        assert.strictEqual(player1.funds, 30);
        assert.strictEqual(player1.prestige, 5);
        assert.strictEqual(player1.actionPoints, 3);
        
        done();
      });
    });

    it('should handle player actions correctly', (done) => {
      clientSocket1.on('game-started', () => {
        // プレイヤー1がアクション実行
        clientSocket1.emit('game-action', {
          type: 'buy_dignity'
        });
        
        clientSocket1.on('game-update', (data) => {
          const player1 = data.gameState.players.find(p => p.name === 'プレイヤー1');
          
          if (data.lastAction.type === 'buy_dignity') {
            assert.strictEqual(player1.funds, 20); // 30 - 10
            assert.strictEqual(player1.prestige, 6); // 5 + 1
            assert.strictEqual(player1.actionPoints, 2); // 3 - 1
            done();
          }
        });
      });
    });

    it('should handle turn progression correctly', (done) => {
      clientSocket1.on('game-started', () => {
        // プレイヤー1がターン終了
        clientSocket1.emit('game-action', { type: 'end_turn' });
        
        clientSocket2.on('game-update', (data) => {
          if (data.gameState.currentPlayerIndex === 1) {
            // プレイヤー2のターンに移った
            assert.strictEqual(data.gameState.phase, 'action');
            done();
          }
        });
      });
    });

    it('should handle phase transitions correctly', (done) => {
      let turnEnded = 0;
      
      clientSocket1.on('game-started', () => {
        // 全プレイヤーがターン終了
        clientSocket1.emit('game-action', { type: 'end_turn' });
        clientSocket2.emit('game-action', { type: 'end_turn' });
        clientSocket3.emit('game-action', { type: 'end_turn' });
        clientSocket4.emit('game-action', { type: 'end_turn' });
      });
      
      const checkPhaseTransition = (data) => {
        if (data.gameState.phase === 'automata') {
          done();
        }
      };
      
      clientSocket1.on('game-update', checkPhaseTransition);
      clientSocket2.on('game-update', checkPhaseTransition);
      clientSocket3.on('game-update', checkPhaseTransition);
      clientSocket4.on('game-update', checkPhaseTransition);
    });
  });

  describe('Action Validation', () => {
    let gameId;
    
    beforeEach((done) => {
      clientSocket1.emit('create-game', 'テストプレイヤー');
      
      clientSocket1.on('game-created', (data) => {
        gameId = data.gameId;
        clientSocket1.emit('start-game');
        
        clientSocket1.on('game-started', () => {
          done();
        });
      });
    });

    it('should reject invalid actions', (done) => {
      // 存在しないアクション
      clientSocket1.emit('game-action', { type: 'invalid_action' });
      
      clientSocket1.on('action-error', (error) => {
        assert(error.message.includes('Unknown action'));
        done();
      });
    });

    it('should reject actions with insufficient resources', (done) => {
      // 日雇い労働（3AP必要だが、1APしか消費しない状態で試行）
      clientSocket1.emit('game-action', { type: 'buy_dignity' }); // 1AP消費
      clientSocket1.emit('game-action', { type: 'buy_dignity' }); // 1AP消費
      clientSocket1.emit('game-action', { type: 'buy_dignity' }); // 1AP消費（これで0AP）
      
      // 0APの状態でさらにアクション試行
      clientSocket1.emit('game-action', { type: 'buy_dignity' });
      
      clientSocket1.on('action-error', (error) => {
        assert(error.message.includes('action points') || error.message.includes('AP'));
        done();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle disconnection gracefully', (done) => {
      clientSocket1.emit('create-game', 'プレイヤー1');
      
      clientSocket1.on('game-created', (data) => {
        const gameId = data.gameId;
        
        clientSocket2.emit('join-game', { gameId, playerName: 'プレイヤー2' });
        
        clientSocket2.on('game-joined', () => {
          // プレイヤー2が切断
          clientSocket2.disconnect();
          
          // プレイヤー1に切断通知が来るはず
          clientSocket1.on('player-left', (leftData) => {
            assert(leftData.playerId);
            done();
          });
        });
      });
    });

    it('should handle invalid game ID', (done) => {
      clientSocket1.emit('join-game', { 
        gameId: 'invalid-game-id', 
        playerName: 'テストプレイヤー' 
      });
      
      clientSocket1.on('error', (error) => {
        assert(error.message.includes('not found') || error.message.includes('見つかりません'));
        done();
      });
    });
  });
});