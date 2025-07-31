#!/usr/bin/env node

// デバッグAPI テストスクリプト
const baseUrl = process.env.NODE_ENV === 'production' 
  ? 'https://market-disruption-production.up.railway.app'
  : 'http://localhost:8000';

console.log(`🔧 Market Disruption Debug API Test`);
console.log(`🌐 Target: ${baseUrl}`);
console.log('');

// サーバー状態確認
async function testServerStatus() {
  try {
    console.log('📊 Testing server status...');
    const response = await fetch(`${baseUrl}/api/status`);
    const data = await response.json();
    
    console.log('✅ Server Status:', data.status);
    console.log('📝 Version:', data.version);
    console.log('🎮 Available moves:', data.moveCount);
    console.log('🕒 Timestamp:', data.timestamp);
    console.log('');
    
    return data;
  } catch (error) {
    console.error('❌ Server status test failed:', error.message);
    return null;
  }
}

// Move一覧確認
async function testMovesList() {
  try {
    console.log('🎯 Testing moves list...');
    const response = await fetch(`${baseUrl}/api/moves`);
    const data = await response.json();
    
    console.log('✅ Total moves:', data.count);
    console.log('📋 Move names:', data.list.join(', '));
    
    // 重要なmovesの確認
    const criticalMoves = ['partTimeWork', 'design', 'dayLabor', 'purchase'];
    console.log('🔍 Critical moves check:');
    criticalMoves.forEach(move => {
      const exists = data.list.includes(move);
      console.log(`  - ${move}: ${exists ? '✅ FOUND' : '❌ MISSING'}`);
    });
    console.log('');
    
    return data;
  } catch (error) {
    console.error('❌ Moves list test failed:', error.message);
    return null;
  }
}

// ゲーム状態取得テスト（サンプルゲームID）
async function testGameState(gameId = 'solo-1722334567890') {
  try {
    console.log(`🎮 Testing game state for: ${gameId}`);
    const response = await fetch(`${baseUrl}/api/game/${gameId}`);
    
    if (response.status === 404) {
      console.log('ℹ️ Game not found (expected for test)');
      return null;
    }
    
    const data = await response.json();
    console.log('✅ Game found:', data.gameId);
    console.log('📊 Phase:', data.metadata.phase);
    console.log('👤 Current Player:', data.metadata.currentPlayer);
    console.log('🔄 Round:', data.metadata.round);
    console.log('');
    
    return data;
  } catch (error) {
    console.error('❌ Game state test failed:', error.message);
    return null;
  }
}

// アクション実行テスト
async function testActionExecution(gameId = 'solo-1722334567890') {
  try {
    console.log(`⚡ Testing action execution for: ${gameId}`);
    
    const actionData = {
      playerId: '0',
      action: 'partTimeWork',
      args: []
    };
    
    const response = await fetch(`${baseUrl}/api/game/${gameId}/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(actionData)
    });
    
    if (response.status === 404) {
      console.log('ℹ️ Game not found (expected for test)');
      return null;
    }
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Action executed successfully:', data.action);
      console.log('📊 Result:', data.message);
    } else {
      console.log('⚠️ Action failed:', data.error);
    }
    console.log('');
    
    return data;
  } catch (error) {
    console.error('❌ Action execution test failed:', error.message);
    return null;
  }
}

// メイン実行関数
async function main() {
  console.log('🚀 Starting Debug API Tests...\n');
  
  // 順次テスト実行
  await testServerStatus();
  await testMovesList();
  await testGameState();
  await testActionExecution();
  
  console.log('🏁 All tests completed!');
  console.log('');
  console.log('📖 Usage Examples:');
  console.log(`curl "${baseUrl}/api/status"`);
  console.log(`curl "${baseUrl}/api/moves"`);
  console.log(`curl "${baseUrl}/api/game/YOUR_GAME_ID"`);
  console.log(`curl -X POST "${baseUrl}/api/game/YOUR_GAME_ID/action" \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"playerId":"0","action":"partTimeWork","args":[]}'`);
}

// スクリプト実行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testServerStatus,
  testMovesList,
  testGameState,
  testActionExecution
};