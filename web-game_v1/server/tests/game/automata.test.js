import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { GameState } from '../../game/GameState.js';
import { Player } from '../../game/Player.js';

describe('Automata System Tests', () => {
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

  describe('Manufacturer Automata', () => {
    it('should manufacture products correctly', () => {
      // ダイスロールをモック（製造アクション）
      const originalRandom = Math.random;
      Math.random = () => 0.3; // ダイス合計6-7で製造
      
      const initialMarketSize = Object.keys(gameState.manufacturerAutomata.personalMarket).length;
      
      const result = gameState.processManufacturerAutomata();
      
      assert.strictEqual(result.action, 'manufacture');
      assert(result.product); // 製造された商品が存在
      assert(result.price); // 価格が設定されている
      
      Math.random = originalRandom;
    });

    it('should perform clearance sale correctly', () => {
      // 商品を事前に配置
      const product = {
        id: 'test-product',
        category: 'toy',
        value: 5,
        cost: 3,
        popularity: 1,
        price: 10
      };
      gameState.manufacturerAutomata.personalMarket[10] = { 1: product };
      
      // ダイスロールをモック（在庫一掃セール）
      const originalRandom = Math.random;
      Math.random = () => 0.9; // ダイス合計11-12で在庫一掃
      
      const result = gameState.processManufacturerAutomata();
      
      assert.strictEqual(result.action, 'clearance_sale');
      
      Math.random = originalRandom;
    });

    it('should rest when appropriate dice roll', () => {
      // ダイスロールをモック（休息）
      const originalRandom = Math.random;
      Math.random = () => 0.1; // ダイス合計2-5で休息
      
      const result = gameState.processManufacturerAutomata();
      
      assert.strictEqual(result.action, 'rest');
      
      Math.random = originalRandom;
    });
  });

  describe('Resale Automata', () => {
    it('should perform mass purchase correctly', () => {
      // プレイヤーの商品を設定
      const product = {
        id: 'player-product',
        category: 'game-console',
        value: 6,
        cost: 4,
        popularity: 2,
        ownerId: player1.id
      };
      player1.personalMarket[8] = { 2: product };
      
      // ダイスロールをモック（大量購入）
      const originalRandom = Math.random;
      Math.random = () => 0.2; // ダイス合計2-4で大量購入
      
      const initialFunds = gameState.resaleAutomata.funds;
      
      const result = gameState.processResaleAutomata();
      
      assert.strictEqual(result.action, 'mass_purchase');
      assert(result.purchased); // 購入した商品リスト
      
      Math.random = originalRandom;
    });

    it('should perform resale correctly', () => {
      // 転売オートマに商品を追加
      const product = {
        id: 'resale-product',
        category: 'toy',
        value: 4,
        cost: 3,
        popularity: 1,
        previousOwner: player1.id,
        purchasePrice: 6
      };
      gameState.resaleAutomata.inventory.push(product);
      
      // ダイスロールをモック（転売）
      const originalRandom = Math.random;
      Math.random = () => 0.7; // ダイス合計8-12で転売
      
      const result = gameState.processResaleAutomata();
      
      assert.strictEqual(result.action, 'resale');
      
      Math.random = originalRandom;
    });

    it('should be paused when regulation level 3', () => {
      gameState.regulationLevel = 3;
      gameState.resaleAutomata.pauseRounds = 2;
      
      const result = gameState.processResaleAutomata();
      
      assert.strictEqual(result.action, 'paused');
      assert.strictEqual(result.reason, 'regulation');
      assert.strictEqual(gameState.resaleAutomata.pauseRounds, 1); // 減少
    });

    it('should handle insufficient funds correctly', () => {
      gameState.resaleAutomata.funds = 0;
      
      // プレイヤーの高額商品を設定
      const expensiveProduct = {
        id: 'expensive-product',
        category: 'game-console',
        value: 10,
        cost: 8,
        popularity: 3,
        ownerId: player1.id
      };
      player1.personalMarket[20] = { 3: expensiveProduct };
      
      // ダイスロールをモック（大量購入を試行）
      const originalRandom = Math.random;
      Math.random = () => 0.2;
      
      const result = gameState.processResaleAutomata();
      
      // 資金不足でも正常に処理される
      assert.strictEqual(result.action, 'mass_purchase');
      assert.strictEqual(result.purchased.length, 0); // 購入できなかった
      
      Math.random = originalRandom;
    });
  });

  describe('Automata Integration', () => {
    it('should run both automata in sequence', () => {
      const results = gameState.processAutomataPhase();
      
      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0].automata, 'manufacturer');
      assert.strictEqual(results[1].automata, 'resale');
    });

    it('should handle market interactions correctly', () => {
      // メーカーオートマの商品を設定
      const manufacturerProduct = {
        id: 'manufacturer-product',
        category: 'accessory',
        value: 3,
        cost: 2,
        popularity: 1,
        ownerId: 'manufacturer-automata'
      };
      gameState.manufacturerAutomata.personalMarket[5] = { 1: manufacturerProduct };
      
      // 転売オートマが購入を試行
      const originalRandom = Math.random;
      Math.random = () => 0.2; // 大量購入モード
      
      const manufacturerResult = gameState.processManufacturerAutomata();
      const resaleResult = gameState.processResaleAutomata();
      
      // 転売オートマがメーカーオートマの商品を購入する可能性がある
      assert(resaleResult.action);
      
      Math.random = originalRandom;
    });

    it('should respect regulation effects on resale automata', () => {
      // 規制レベル1（制限付き）
      gameState.regulationLevel = 1;
      
      // プレイヤーの商品を複数設定
      for (let i = 1; i <= 5; i++) {
        const product = {
          id: `product-${i}`,
          category: 'toy',
          value: 3,
          cost: 2,
          popularity: 1,
          ownerId: player1.id
        };
        player1.personalMarket[5] = player1.personalMarket[5] || {};
        player1.personalMarket[5][i] = product;
      }
      
      const originalRandom = Math.random;
      Math.random = () => 0.2; // 大量購入
      
      const result = gameState.processResaleAutomata();
      
      if (result.action === 'mass_purchase') {
        // 規制レベル1では購入制限がある
        assert(result.purchased.length <= 2);
      }
      
      Math.random = originalRandom;
    });
  });

  describe('Market Phase Integration', () => {
    it('should handle demand dice correctly', () => {
      // 各カテゴリーの商品を配置
      const products = [
        { category: 'game-console', price: 8, popularity: 3, ownerId: player1.id },
        { category: 'toy', price: 6, popularity: 2, ownerId: player2.id },
        { category: 'figure', price: 10, popularity: 1, ownerId: 'manufacturer-automata' }
      ];
      
      products.forEach((product, index) => {
        const owner = product.ownerId === player1.id ? player1 : 
                     product.ownerId === player2.id ? player2 : 
                     gameState.manufacturerAutomata;
        
        owner.personalMarket[product.price] = owner.personalMarket[product.price] || {};
        owner.personalMarket[product.price][product.popularity] = {
          id: `product-${index}`,
          ...product
        };
      });
      
      // 需要ダイスをモック
      const originalRandom = Math.random;
      Math.random = () => 0.5; // ダイス合計7（おもちゃカテゴリー）
      
      const result = gameState.processMarketPhase();
      
      assert(result.demandDice);
      assert.strictEqual(result.demandDice.length, 2);
      assert(result.purchasedProducts);
      
      Math.random = originalRandom;
    });
  });
});