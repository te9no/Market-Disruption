import { GameState } from './game/GameState.js';
import { Player } from './game/Player.js';

console.log('🧪 === アクション機能テスト開始 ===');

// ゲーム状態とプレイヤーを作成
const gameState = new GameState('test-game');
const player1 = new Player('player1', 'テストプレイヤー1');
const player2 = new Player('player2', 'テストプレイヤー2');

gameState.addPlayer(player1);
gameState.addPlayer(player2);
gameState.startGame();

console.log('\n📋 1. 製造アクションテスト');
try {
  // プレイヤー1が設計スロット1で製造
  const result = gameState.processAction('player1', {
    type: 'manufacture',
    designSlot: 1
  });
  
  if (result.success) {
    console.log('✅ 製造アクション成功:', result.action);
    console.log(`📦 在庫数: ${player1.inventory.length}, 資金: ${player1.funds}, AP: ${player1.actionPoints}`);
  } else {
    console.log('❌ 製造アクション失敗:', result.error);
  }
} catch (error) {
  console.log('❌ 製造アクションエラー:', error.message);
}

console.log('\n📋 2. 販売アクションテスト');
try {
  if (player1.inventory.length > 0) {
    const productId = player1.inventory[0].id;
    const result = gameState.processAction('player1', {
      type: 'sell',
      productId: productId,
      price: 5
    });
    
    if (result.success) {
      console.log('✅ 販売アクション成功:', result.action);
      console.log(`🏪 マーケット商品数: ${player1.getAllMarketProducts().length}`);
    } else {
      console.log('❌ 販売アクション失敗:', result.error);
    }
  } else {
    console.log('⚠️ 販売テストスキップ: 在庫なし');
  }
} catch (error) {
  console.log('❌ 販売アクションエラー:', error.message);
}

console.log('\n📋 3. アルバイトアクションテスト');
try {
  const beforeFunds = player2.funds;
  const result = gameState.processAction('player2', {
    type: 'part_time_job'
  });
  
  if (result.success) {
    console.log('✅ アルバイトアクション成功:', result.action);
    console.log(`💰 資金変化: ${beforeFunds} → ${player2.funds} (+${player2.funds - beforeFunds})`);
    console.log(`⚡ AP: ${player2.actionPoints}`);
  } else {
    console.log('❌ アルバイトアクション失敗:', result.error);
  }
} catch (error) {
  console.log('❌ アルバイトアクションエラー:', error.message);
}

console.log('\n📋 4. 威厳購入アクションテスト');
try {
  const beforePrestige = player2.prestige;
  const beforeFunds = player2.funds;
  const result = gameState.processAction('player2', {
    type: 'buy_dignity'
  });
  
  if (result.success) {
    console.log('✅ 威厳購入アクション成功:', result.action);
    console.log(`👑 威厳変化: ${beforePrestige} → ${player2.prestige} (+${player2.prestige - beforePrestige})`);
    console.log(`💰 資金変化: ${beforeFunds} → ${player2.funds} (${player2.funds - beforeFunds})`);
  } else {
    console.log('❌ 威厳購入アクション失敗:', result.error);
  }
} catch (error) {
  console.log('❌ 威厳購入アクションエラー:', error.message);
}

console.log('\n📋 5. 転売アクションテスト');
try {
  // まず商品を用意
  if (player1.getAllMarketProducts().length > 0) {
    const marketProducts = player1.getAllMarketProducts();
    const targetProduct = marketProducts[0];
    
    const result = gameState.processAction('player2', {
      type: 'resale',
      sellerId: 'player1',
      productId: targetProduct.id,
      price: targetProduct.price,
      popularity: targetProduct.popularity
    });
    
    if (result.success) {
      console.log('✅ 転売アクション成功:', result.action);
      console.log(`🔄 転売履歴: ${player2.resaleHistory}, 威厳: ${player2.prestige}`);
      console.log(`💰 資金: プレイヤー1=${player1.funds}, プレイヤー2=${player2.funds}`);
    } else {
      console.log('❌ 転売アクション失敗:', result.error);
    }
  } else {
    console.log('⚠️ 転売テストスキップ: 販売商品なし');
  }
} catch (error) {
  console.log('❌ 転売アクションエラー:', error.message);
}

console.log('\n📋 6. 勝利条件テスト');
try {
  // プレイヤー1の威厳を17に、資金を75に設定
  player1.prestige = 17;
  player1.funds = 75;
  
  const victoryCheck = gameState.checkVictory(player1);
  console.log(`🏆 プレイヤー1勝利判定 (威厳${player1.prestige}, 資金${player1.funds}): ${victoryCheck ? '勝利' : '継続'}`);
  
  // プレイヤー2の資金を150に設定
  player2.funds = 150;
  const victoryCheck2 = gameState.checkVictory(player2);
  console.log(`🏆 プレイヤー2勝利判定 (威厳${player2.prestige}, 資金${player2.funds}): ${victoryCheck2 ? '勝利' : '継続'}`);
  
} catch (error) {
  console.log('❌ 勝利条件テストエラー:', error.message);
}

console.log('\n📋 7. 汚染ペナルティテスト');
try {
  // 汚染レベルを設定
  gameState.pollution['figure'] = 2;
  const penalty = gameState.getPollutionPenalty('figure');
  console.log(`🏭 フィギュア汚染レベル2のペナルティ: ${penalty}`);
  
  gameState.pollution['figure'] = 4;
  const penalty2 = gameState.getPollutionPenalty('figure');
  console.log(`🏭 フィギュア汚染レベル4のペナルティ: ${penalty2}`);
  
} catch (error) {
  console.log('❌ 汚染ペナルティテストエラー:', error.message);
}

console.log('\n🧪 === アクション機能テスト完了 ===');