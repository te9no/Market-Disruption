import { GameState } from './game/GameState.js';
import { Player } from './game/Player.js';

console.log('🧪 === ターン管理込みアクションテスト開始 ===');

// ゲーム状態とプレイヤーを作成
const gameState = new GameState('test-game');
const player1 = new Player('player1', 'テストプレイヤー1');
const player2 = new Player('player2', 'テストプレイヤー2');

gameState.addPlayer(player1);
gameState.addPlayer(player2);
gameState.startGame();

console.log(`\n現在のプレイヤー: ${gameState.getCurrentPlayer().name}`);

console.log('\n📋 1. プレイヤー1 - 製造 → 販売');
try {
  // 製造
  let result = gameState.processAction('player1', {
    type: 'manufacture',
    designSlot: 1
  });
  console.log(`✅ 製造: ${result.success ? '成功' : '失敗'} (AP: ${player1.actionPoints})`);
  
  // 販売
  if (result.success && player1.inventory.length > 0) {
    const productId = player1.inventory[0].id;
    result = gameState.processAction('player1', {
      type: 'sell',
      productId: productId,
      price: 6
    });
    console.log(`✅ 販売: ${result.success ? '成功' : '失敗'} (AP: ${player1.actionPoints})`);
  }
  
  // アルバイト（残り1AP）
  result = gameState.processAction('player1', {
    type: 'part_time_job'
  });
  console.log(`✅ アルバイト: ${result.success ? '成功' : '失敗'} (AP: ${player1.actionPoints})`);
  console.log(`💰 資金: ${player1.funds}`);
  
} catch (error) {
  console.log('❌ プレイヤー1アクションエラー:', error.message);
}

console.log(`\n現在のプレイヤー: ${gameState.getCurrentPlayer().name}`);

console.log('\n📋 2. プレイヤー2 - 転売テスト');
try {
  // 転売（他プレイヤーの商品を購入して転売）
  const player1Products = player1.getAllMarketProducts();
  if (player1Products.length > 0) {
    const targetProduct = player1Products[0];
    console.log(`🎯 転売対象: ${targetProduct.category} (価格${targetProduct.price})`);
    
    const result = gameState.processAction('player2', {
      type: 'resale',
      sellerId: 'player1',
      productId: targetProduct.id,
      price: targetProduct.price,
      popularity: targetProduct.popularity
    });
    
    if (result.success) {
      console.log('✅ 転売アクション成功');
      console.log(`🔄 転売履歴: ${player2.resaleHistory}, 威厳: ${player2.prestige}`);
      console.log(`💰 資金: プレイヤー1=${player1.funds}, プレイヤー2=${player2.funds}`);
      console.log(`🏭 汚染レベル: ${JSON.stringify(gameState.pollution)}`);
      console.log(`⚡ AP: ${player2.actionPoints}`);
    } else {
      console.log('❌ 転売アクション失敗:', result.error);
    }
  } else {
    console.log('⚠️ 転売テストスキップ: 販売商品なし');
  }
  
} catch (error) {
  console.log('❌ プレイヤー2転売エラー:', error.message);
}

console.log('\n📋 3. 威厳購入テスト（プレイヤー2継続）');
try {
  const beforePrestige = player2.prestige;
  const beforeFunds = player2.funds;
  
  const result = gameState.processAction('player2', {
    type: 'buy_dignity'
  });
  
  if (result.success) {
    console.log('✅ 威厳購入成功');
    console.log(`👑 威厳: ${beforePrestige} → ${player2.prestige}`);
    console.log(`💰 資金: ${beforeFunds} → ${player2.funds}`);
    console.log(`⚡ AP: ${player2.actionPoints}`);
  } else {
    console.log('❌ 威厳購入失敗:', result.error);
  }
  
} catch (error) {
  console.log('❌ 威厳購入エラー:', error.message);
}

console.log('\n📋 4. オートマフェーズテスト');
try {
  // 残りAPを消費してフェーズ進行
  while (gameState.getCurrentPlayer().actionPoints > 0) {
    const result = gameState.processAction(gameState.getCurrentPlayer().id, {
      type: 'end_turn'
    });
    console.log(`🔄 ターン終了: ${result.success}`);
  }
  
  console.log('\n🤖 オートマフェーズ実行後の状態:');
  console.log(`📊 ゲーム状態: ${gameState.state}, フェーズ: ${gameState.currentPhase}, ラウンド: ${gameState.currentRound}`);
  console.log(`🏪 メーカーオートマ商品数: ${Object.values(gameState.manufacturerAutomata.personalMarket).flat().filter(p => p).length}`);
  console.log(`💰 転売オートマ資金: ${gameState.resaleAutomata.funds}`);
  
} catch (error) {
  console.log('❌ オートマフェーズエラー:', error.message);
}

console.log('\n📋 5. 最終状態確認');
console.log(`🎮 ゲーム状態: ${gameState.state}`);
console.log(`📊 プレイヤー1: 資金${player1.funds}, 威厳${player1.prestige}, 転売履歴${player1.resaleHistory}`);
console.log(`📊 プレイヤー2: 資金${player2.funds}, 威厳${player2.prestige}, 転売履歴${player2.resaleHistory}`);
console.log(`🏭 汚染状況: ${JSON.stringify(gameState.pollution)}`);
console.log(`📜 プレイログ数: ${gameState.playLog.length}`);

console.log('\n🧪 === ターン管理込みアクションテスト完了 ===');