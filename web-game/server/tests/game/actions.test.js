import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import GameState from '../../game/GameState.js';
import Player from '../../game/Player.js';

describe('Player Actions Tests', () => {
  let gameState;
  let player1, player2;

  beforeEach(() => {
    gameState = new GameState();
    player1 = new Player('1', 'プレイヤー1');
    player2 = new Player('2', 'プレイヤー2');
    
    gameState.addPlayer(player1);
    gameState.addPlayer(player2);
    gameState.startGame();
  });

  describe('1AP Actions', () => {
    describe('Manufacture Action', () => {
      it('should manufacture product correctly', () => {
        // 設計を手動で追加
        player1.designs[1] = {
          category: 'game-console',
          value: 5,
          cost: 3
        };
        
        const initialFunds = player1.funds;
        const initialInventory = player1.inventory.length;
        
        const result = gameState.actionManufacture(player1, { designSlot: 1 });
        
        assert.strictEqual(player1.funds, initialFunds - 3);
        assert.strictEqual(player1.inventory.length, initialInventory + 1);
        assert.strictEqual(result.success, true);
      });

      it('should fail when insufficient funds', () => {
        player1.designs[1] = {
          category: 'game-console',
          value: 5,
          cost: 100 // プレイヤーの資金を超過
        };
        
        assert.throws(() => {
          gameState.actionManufacture(player1, { designSlot: 1 });
        }, /Not enough funds/);
      });

      it('should fail when design slot is empty', () => {
        assert.throws(() => {
          gameState.actionManufacture(player1, { designSlot: 5 });
        }, /No design found/);
      });
    });

    describe('Sell Action', () => {
      it('should sell product correctly', () => {
        // 商品を手動で追加
        const product = {
          id: 'test-product',
          category: 'game-console',
          value: 5,
          cost: 3,
          popularity: 1
        };
        player1.inventory.push(product);
        
        const initialFunds = player1.funds;
        const result = gameState.actionSell(player1, { 
          productId: 'test-product', 
          price: 8 
        });
        
        assert.strictEqual(result.success, true);
        assert.strictEqual(player1.inventory.length, 0);
        assert(player1.personalMarket[8][1]); // 価格8、人気度1に配置
      });

      it('should fail when product not found', () => {
        assert.throws(() => {
          gameState.actionSell(player1, { 
            productId: 'non-existent', 
            price: 8 
          });
        }, /Product not found/);
      });
    });

    describe('Purchase Action', () => {
      it('should purchase from other player correctly', () => {
        // player2の商品を設定
        const product = {
          id: 'test-product',
          category: 'game-console',
          value: 5,
          cost: 3,
          popularity: 1,
          ownerId: player2.id
        };
        player2.personalMarket[8] = { 1: product };
        
        const initialFunds1 = player1.funds;
        const initialFunds2 = player2.funds;
        
        const result = gameState.actionPurchase(player1, {
          sellerId: player2.id,
          price: 8,
          popularity: 1
        });
        
        assert.strictEqual(result.success, true);
        assert.strictEqual(player1.funds, initialFunds1 - 8);
        assert.strictEqual(player2.funds, initialFunds2 + 8);
        assert.strictEqual(player1.inventory.length, 1);
        assert.strictEqual(player2.personalMarket[8][1], null);
      });

      it('should purchase from manufacturer automata', () => {
        // メーカーオートマの商品を設定
        const product = {
          id: 'automata-product',
          category: 'toy',
          value: 4,
          cost: 2,
          popularity: 1,
          ownerId: 'manufacturer-automata'
        };
        gameState.manufacturerAutomata.personalMarket[6] = { 1: product };
        
        const initialFunds = player1.funds;
        
        const result = gameState.actionPurchase(player1, {
          sellerId: 'manufacturer-automata',
          price: 6,
          popularity: 1
        });
        
        assert.strictEqual(result.success, true);
        assert.strictEqual(player1.funds, initialFunds - 6);
        assert.strictEqual(player1.inventory.length, 1);
      });
    });

    describe('Review Action', () => {
      it('should add positive review correctly', () => {
        // player2の商品を設定
        const product = {
          id: 'test-product',
          category: 'game-console',
          value: 5,
          cost: 3,
          popularity: 2,
          ownerId: player2.id
        };
        player2.personalMarket[8] = { 2: product };
        
        const initialPrestige = player1.prestige;
        
        const result = gameState.actionReview(player1, {
          targetPlayerId: player2.id,
          price: 8,
          popularity: 2,
          reviewType: 'positive'
        });
        
        assert.strictEqual(result.success, true);
        assert.strictEqual(player1.prestige, initialPrestige - 1);
        assert.strictEqual(player2.personalMarket[8][3].popularity, 3); // 人気度+1
      });

      it('should add negative review correctly', () => {
        const product = {
          id: 'test-product',
          category: 'game-console',
          value: 5,
          cost: 3,
          popularity: 3,
          ownerId: player2.id
        };
        player2.personalMarket[8] = { 3: product };
        
        const result = gameState.actionReview(player1, {
          targetPlayerId: player2.id,
          price: 8,
          popularity: 3,
          reviewType: 'negative'
        });
        
        assert.strictEqual(result.success, true);
        assert.strictEqual(player2.personalMarket[8][2].popularity, 2); // 人気度-1
      });
    });

    describe('Buy Dignity Action', () => {
      it('should buy dignity correctly', () => {
        const initialFunds = player1.funds;
        const initialPrestige = player1.prestige;
        
        const result = gameState.actionBuyDignity(player1);
        
        assert.strictEqual(result.success, true);
        assert.strictEqual(player1.funds, initialFunds - 10);
        assert.strictEqual(player1.prestige, initialPrestige + 1);
      });

      it('should fail when insufficient funds', () => {
        player1.funds = 5; // 10未満
        
        assert.throws(() => {
          gameState.actionBuyDignity(player1);
        }, /Not enough funds/);
      });
    });
  });

  describe('2AP Actions', () => {
    describe('Design Action', () => {
      it('should create new design correctly', () => {
        const selectedDice = {
          category: 'toy',
          value: 4,
          cost: 3
        };
        
        const result = gameState.actionDesign(player1, {
          selectedDice,
          designSlot: 3
        });
        
        assert.strictEqual(result.success, true);
        assert(player1.designs[3]);
        assert.strictEqual(player1.designs[3].category, 'toy');
        assert.strictEqual(player1.designs[3].value, 4);
        assert.strictEqual(player1.designs[3].cost, 3);
      });

      it('should handle open source design correctly', () => {
        const selectedDice = {
          category: 'toy',
          value: 4,
          cost: 3
        };
        
        const initialPrestige = player1.prestige;
        
        const result = gameState.actionDesign(player1, {
          selectedDice,
          designSlot: 3,
          openSource: true
        });
        
        assert.strictEqual(result.success, true);
        assert.strictEqual(player1.prestige, initialPrestige + 2);
        assert(gameState.openSourceDesigns.includes(player1.designs[3].id));
      });
    });

    describe('Part Time Job Action', () => {
      it('should give funds correctly', () => {
        const initialFunds = player1.funds;
        
        const result = gameState.actionPartTimeJob(player1);
        
        assert.strictEqual(result.success, true);
        assert.strictEqual(player1.funds, initialFunds + 5);
      });
    });

    describe('Promote Regulation Action', () => {
      it('should increase regulation level on success', () => {
        // ダイスロールをモック（成功パターン）
        const originalRandom = Math.random;
        Math.random = () => 0.8; // 高い値で成功を保証
        
        const initialLevel = gameState.regulationLevel;
        
        const result = gameState.actionPromoteRegulation(player1);
        
        assert.strictEqual(result.success, true);
        assert.strictEqual(gameState.regulationLevel, initialLevel + 1);
        assert(result.total >= 9); // 成功条件
        
        Math.random = originalRandom;
      });

      it('should not increase regulation level on failure', () => {
        // ダイスロールをモック（失敗パターン）
        const originalRandom = Math.random;
        Math.random = () => 0.1; // 低い値で失敗を保証
        
        const initialLevel = gameState.regulationLevel;
        
        const result = gameState.actionPromoteRegulation(player1);
        
        assert.strictEqual(result.success, false);
        assert.strictEqual(gameState.regulationLevel, initialLevel);
        assert(result.total < 9); // 失敗条件
        
        Math.random = originalRandom;
      });
    });
  });

  describe('3AP Actions', () => {
    describe('Day Labor Action', () => {
      it('should give funds when under 100', () => {
        player1.funds = 50;
        const initialFunds = player1.funds;
        
        const result = gameState.actionDayLabor(player1);
        
        assert.strictEqual(result.success, true);
        assert.strictEqual(player1.funds, initialFunds + 18);
      });

      it('should fail when funds over 100', () => {
        player1.funds = 150;
        
        assert.throws(() => {
          gameState.actionDayLabor(player1);
        }, /funds.*100/);
      });
    });
  });
});