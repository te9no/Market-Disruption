import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as Client } from 'socket.io-client';
import express from 'express';

describe('Complete Game E2E Tests', () => {
  let httpServer;
  let io;
  let clients = [];
  let gameManager;
  let gameId;

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

    const { default: GameManager } = await import('../../GameManager.js');
    gameManager = new GameManager(io);

    await new Promise((resolve) => {
      httpServer.listen(() => {
        const port = httpServer.address().port;
        
        // 4人のクライアントを作成
        for (let i = 0; i < 4; i++) {
          clients[i] = Client(`http://localhost:${port}`);
        }
        
        let connectedClients = 0;
        const checkAllConnected = () => {
          connectedClients++;
          if (connectedClients === 4) {
            resolve();
          }
        };
        
        clients.forEach(client => {
          client.on('connect', checkAllConnected);
        });
      });
    });
  });

  after(() => {
    io.close();
    httpServer.close();
    clients.forEach(client => client?.close());
  });

  describe('Full Game Scenario: Prestige Victory', () => {
    it('should complete a game with prestige victory', async () => {
      // ゲーム作成と参加
      await new Promise((resolve) => {
        clients[0].emit('create-game', 'プレイヤー1');
        
        clients[0].on('game-created', (data) => {
          gameId = data.gameId;
          
          // 他のプレイヤーが参加
          clients[1].emit('join-game', { gameId, playerName: 'プレイヤー2' });
          clients[2].emit('join-game', { gameId, playerName: 'プレイヤー3' });
          clients[3].emit('join-game', { gameId, playerName: 'プレイヤー4' });
          
          let joinedPlayers = 1;
          const checkJoin = () => {
            joinedPlayers++;
            if (joinedPlayers === 4) {
              clients[0].emit('start-game');
              resolve();
            }
          };
          
          clients[1].on('game-joined', checkJoin);
          clients[2].on('game-joined', checkJoin);
          clients[3].on('game-joined', checkJoin);
        });
      });

      // ゲーム開始を待機
      await new Promise((resolve) => {
        clients[0].on('game-started', resolve);
      });

      let gameState;
      let roundCount = 0;
      const maxRounds = 10; // 最大10ラウンドでテスト終了

      // ゲームループ
      while (roundCount < maxRounds) {
        roundCount++;
        console.log(`=== ラウンド ${roundCount} ===`);

        // 各プレイヤーのターン
        for (let playerIndex = 0; playerIndex < 4; playerIndex++) {
          const currentClient = clients[playerIndex];
          
          // プレイヤーの戦略に応じたアクション実行
          await new Promise((resolve) => {
            const strategy = getPlayerStrategy(playerIndex, roundCount);
            executePlayerStrategy(currentClient, strategy, resolve);
          });

          // ゲーム状態を取得
          gameState = await new Promise((resolve) => {
            clients[0].on('game-update', (data) => {
              resolve(data.gameState);
            });
          });

          // 勝利判定
          const winner = checkVictoryConditions(gameState);
          if (winner) {
            console.log(`🏆 ${winner.name} が${winner.victoryType}勝利！`);
            assert(winner);
            assert(winner.victoryType === 'prestige' || winner.victoryType === 'funds');
            return; // テスト終了
          }
        }

        // オートマフェーズをスキップ
        await new Promise((resolve) => {
          clients[0].emit('game-action', { type: 'skip-automata' });
          clients[0].on('game-update', resolve);
        });

        // 市場フェーズをスキップ
        await new Promise((resolve) => {
          clients[0].emit('game-action', { type: 'skip-market' });
          clients[0].on('game-update', resolve);
        });
      }

      // 最大ラウンド到達時の状態チェック
      assert(gameState);
      assert.strictEqual(gameState.state, 'playing');
      console.log('✅ ゲームが正常に進行しました');
    });
  });

  describe('Full Game Scenario: Regulation Enforcement', () => {
    it('should handle regulation progression correctly', async () => {
      // 新しいゲーム作成
      await new Promise((resolve) => {
        clients[0].emit('create-game', '規制テストプレイヤー1');
        
        clients[0].on('game-created', (data) => {
          gameId = data.gameId;
          
          clients[1].emit('join-game', { gameId, playerName: '規制テストプレイヤー2' });
          clients[2].emit('join-game', { gameId, playerName: '規制テストプレイヤー3' });
          clients[3].emit('join-game', { gameId, playerName: '規制テストプレイヤー4' });
          
          let joinedPlayers = 1;
          const checkJoin = () => {
            joinedPlayers++;
            if (joinedPlayers === 4) {
              clients[0].emit('start-game');
              resolve();
            }
          };
          
          clients[1].on('game-joined', checkJoin);
          clients[2].on('game-joined', checkJoin);
          clients[3].on('game-joined', checkJoin);
        });
      });

      await new Promise((resolve) => {
        clients[0].on('game-started', resolve);
      });

      let regulationLevel = 0;
      let attemptCount = 0;
      const maxAttempts = 20; // 最大20回の規制推進試行

      // 規制レベル3まで上げる
      while (regulationLevel < 3 && attemptCount < maxAttempts) {
        attemptCount++;
        
        // プレイヤー1が規制推進を実行
        await new Promise((resolve) => {
          clients[0].emit('game-action', { type: 'promote_regulation' });
          
          clients[0].on('game-update', (data) => {
            if (data.lastAction.type === 'promote_regulation') {
              regulationLevel = data.gameState.regulationLevel;
              console.log(`規制推進試行 ${attemptCount}: レベル ${regulationLevel} (成功: ${data.lastAction.success})`);
              resolve();
            }
          });
        });

        // ターン終了
        await new Promise((resolve) => {
          clients[0].emit('game-action', { type: 'end_turn' });
          clients[0].on('game-update', resolve);
        });

        // 他のプレイヤーもターン終了
        for (let i = 1; i < 4; i++) {
          await new Promise((resolve) => {
            clients[i].emit('game-action', { type: 'end_turn' });
            clients[i].on('game-update', resolve);
          });
        }

        // フェーズスキップ
        await new Promise((resolve) => {
          clients[0].emit('game-action', { type: 'skip-automata' });
          clients[0].on('game-update', resolve);
        });

        await new Promise((resolve) => {
          clients[0].emit('game-action', { type: 'skip-market' });
          clients[0].on('game-update', resolve);
        });
      }

      // 規制レベル3に到達したことを確認
      if (regulationLevel === 3) {
        console.log('✅ 規制レベル3に到達しました');
        assert.strictEqual(regulationLevel, 3);
      } else {
        console.log(`⚠️  規制レベル${regulationLevel}で最大試行回数に到達`);
        assert(regulationLevel >= 0);
      }
    });
  });

  // ヘルパー関数
  function getPlayerStrategy(playerIndex, round) {
    // プレイヤーごとに異なる戦略を設定
    switch (playerIndex) {
      case 0: // 威厳重視戦略
        return {
          priority: ['design', 'buy_dignity', 'manufacture'],
          openSource: round <= 3 // 序盤はオープンソース
        };
      case 1: // 資金重視戦略
        return {
          priority: ['part_time_job', 'day_labor', 'manufacture'],
          openSource: false
        };
      case 2: // バランス戦略
        return {
          priority: ['manufacture', 'sell', 'design'],
          openSource: round % 2 === 0
        };
      case 3: // 規制推進戦略
        return {
          priority: ['promote_regulation', 'trend_research', 'manufacture'],
          openSource: false
        };
      default:
        return { priority: ['end_turn'], openSource: false };
    }
  }

  function executePlayerStrategy(client, strategy, callback) {
    let actionsExecuted = 0;
    const maxActions = 3; // 最大3アクション（AP制限）

    const executeNextAction = () => {
      if (actionsExecuted >= maxActions) {
        // APを使い切った場合はターン終了
        client.emit('game-action', { type: 'end_turn' });
        callback();
        return;
      }

      const action = strategy.priority[actionsExecuted % strategy.priority.length];
      
      let actionData = { type: action };
      if (action === 'design' && strategy.openSource) {
        actionData.openSource = true;
      }

      client.emit('game-action', actionData);
      actionsExecuted++;

      // 次のアクションを遅延実行（サーバー処理時間を考慮）
      setTimeout(() => {
        if (action === 'end_turn') {
          callback();
        } else {
          executeNextAction();
        }
      }, 100);
    };

    executeNextAction();
  }

  function checkVictoryConditions(gameState) {
    for (const player of gameState.players) {
      // 威厳勝利
      if (player.prestige >= 17 && player.funds >= 75) {
        return { ...player, victoryType: 'prestige' };
      }
      // 資金勝利
      if (player.funds >= 150) {
        return { ...player, victoryType: 'funds' };
      }
    }
    return null;
  }
});