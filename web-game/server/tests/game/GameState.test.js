import { describe, it, before, beforeEach, after } from 'node:test';
import assert from 'node:assert';
import GameState from '../../game/GameState.js';
import Player from '../../game/Player.js';

describe('GameState Tests', () => {
  let gameState;
  let player1, player2, player3, player4;

  beforeEach(() => {
    gameState = new GameState();
    player1 = new Player('1', 'プレイヤー1');
    player2 = new Player('2', 'プレイヤー2');
    player3 = new Player('3', 'プレイヤー3');
    player4 = new Player('4', 'プレイヤー4');
    
    gameState.addPlayer(player1);
    gameState.addPlayer(player2);
    gameState.addPlayer(player3);
    gameState.addPlayer(player4);
  });

  describe('Basic Game Flow', () => {
    it('should initialize with correct default values', () => {
      assert.strictEqual(gameState.state, 'waiting');
      assert.strictEqual(gameState.currentRound, 1);
      assert.strictEqual(gameState.phase, 'action');
      assert.strictEqual(gameState.currentPlayerIndex, 0);
      assert.strictEqual(gameState.regulationLevel, 0);
    });

    it('should start game correctly', () => {
      gameState.startGame();
      
      assert.strictEqual(gameState.state, 'playing');
      assert.strictEqual(gameState.players.length, 4);
      
      // Check initial resources
      gameState.players.forEach(player => {
        assert.strictEqual(player.funds, 30);
        assert.strictEqual(player.prestige, 5);
        assert.strictEqual(player.actionPoints, 3);
        assert.strictEqual(Object.keys(player.designs).length, 2); // 初期設計2個
      });
    });

    it('should handle player turns correctly', () => {
      gameState.startGame();
      
      // 最初のプレイヤーのターンであることを確認
      assert.strictEqual(gameState.getCurrentPlayer().id, player1.id);
      
      // ターン終了
      gameState.actionEndTurn(player1);
      
      // 次のプレイヤーのターンに移る
      assert.strictEqual(gameState.getCurrentPlayer().id, player2.id);
    });

    it('should progress phases correctly', () => {
      gameState.startGame();
      
      // 全プレイヤーがターン終了
      gameState.players.forEach(player => {
        gameState.actionEndTurn(player);
      });
      
      // オートマフェーズに移行
      assert.strictEqual(gameState.phase, 'automata');
    });
  });

  describe('Victory Conditions', () => {
    it('should detect prestige victory correctly', () => {
      gameState.startGame();
      
      // 威厳勝利条件を設定
      player1.prestige = 17;
      player1.funds = 75;
      
      const winner = gameState.checkVictory();
      assert.strictEqual(winner.id, player1.id);
      assert.strictEqual(winner.victoryType, 'prestige');
    });

    it('should detect funds victory correctly', () => {
      gameState.startGame();
      
      // 資金勝利条件を設定
      player2.funds = 150;
      
      const winner = gameState.checkVictory();
      assert.strictEqual(winner.id, player2.id);
      assert.strictEqual(winner.victoryType, 'funds');
    });

    it('should not detect victory with insufficient conditions', () => {
      gameState.startGame();
      
      // 不十分な条件
      player1.prestige = 17;
      player1.funds = 50; // 75未満
      
      const winner = gameState.checkVictory();
      assert.strictEqual(winner, null);
    });
  });

  describe('Action Point System', () => {
    it('should consume action points correctly', () => {
      gameState.startGame();
      
      // 1APアクション実行
      player1.spendActionPoints(1);
      assert.strictEqual(player1.actionPoints, 2);
      
      // 2APアクション実行
      player1.spendActionPoints(2);
      assert.strictEqual(player1.actionPoints, 0);
    });

    it('should prevent actions when insufficient AP', () => {
      gameState.startGame();
      player1.actionPoints = 1;
      
      assert.throws(() => {
        player1.spendActionPoints(2);
      }, /Not enough action points/);
    });

    it('should reset AP at round start', () => {
      gameState.startGame();
      player1.actionPoints = 0;
      
      gameState.startNewRound();
      
      assert.strictEqual(player1.actionPoints, 3);
    });
  });

  describe('Resource Management', () => {
    it('should handle funds correctly', () => {
      gameState.startGame();
      const initialFunds = player1.funds;
      
      player1.spendFunds(10);
      assert.strictEqual(player1.funds, initialFunds - 10);
      
      player1.addFunds(5);
      assert.strictEqual(player1.funds, initialFunds - 5);
    });

    it('should prevent spending more funds than available', () => {
      gameState.startGame();
      
      assert.throws(() => {
        player1.spendFunds(player1.funds + 1);
      }, /Not enough funds/);
    });

    it('should handle prestige correctly', () => {
      gameState.startGame();
      const initialPrestige = player1.prestige;
      
      player1.addPrestige(2);
      assert.strictEqual(player1.prestige, initialPrestige + 2);
      
      player1.spendPrestige(1);
      assert.strictEqual(player1.prestige, initialPrestige + 1);
    });
  });
});