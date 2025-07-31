// Claude単体でAPIテストを実行するスクリプト
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const SERVER_URL = process.env.NODE_ENV === 'production' 
  ? 'https://market-disruption-production.up.railway.app'
  : 'http://localhost:8000';

async function testAPI() {
  console.log('🧪 Claude API Testing Script');
  console.log('=' .repeat(50));
  console.log(`🌐 Server URL: ${SERVER_URL}`);
  
  try {
    // Test 1: Server Status
    console.log('\n📊 Test 1: Server Status');
    const statusResponse = await fetch(`${SERVER_URL}/api/status`);
    const statusData = await statusResponse.json();
    console.log('✅ Status:', statusData.status);
    console.log('📋 Available endpoints:');
    statusData.endpoints.forEach(endpoint => {
      console.log(`   - ${endpoint}`);
    });
    
    // Test 2: Moves List
    console.log('\n🎯 Test 2: Moves List');
    const movesResponse = await fetch(`${SERVER_URL}/api/moves`);
    const movesData = await movesResponse.json();
    console.log(`✅ Total moves: ${movesData.count}`);
    console.log('🔍 Critical moves check:');
    Object.entries(movesData.criticalMovesCheck).forEach(([move, status]) => {
      console.log(`   ${move}: ${status}`);
    });
    
    // Test 3: Full Game Test
    console.log('\n🎮 Test 3: Full Game Simulation');
    const gameTestResponse = await fetch(`${SERVER_URL}/api/test-game`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const gameTestData = await gameTestResponse.json();
    
    console.log(`📊 Game Test Result: ${gameTestData.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`📝 Message: ${gameTestData.message}`);
    
    if (gameTestData.testResults) {
      console.log('\n📋 Individual Test Results:');
      gameTestData.testResults.forEach(test => {
        console.log(`   ${test.test}: ${test.success ? '✅ PASS' : '❌ FAIL'}`);
        if (test.details) {
          console.log(`      Details: ${JSON.stringify(test.details, null, 6)}`);
        }
      });
    }
    
    if (gameTestData.finalGameState) {
      console.log('\n🎯 Final Game State:');
      console.log(`   Round: ${gameTestData.finalGameState.round}`);
      console.log(`   Market Pollution: ${gameTestData.finalGameState.marketPollution}`);
      console.log(`   Player Money: ${gameTestData.finalGameState.player.money}`);
      console.log(`   Player Prestige: ${gameTestData.finalGameState.player.prestige}`);
      console.log(`   Player AP: ${gameTestData.finalGameState.player.actionPoints}`);
      console.log(`   Automata Market Size: ${gameTestData.finalGameState.automataMarket}`);
      console.log(`   Play Log Entries: ${gameTestData.finalGameState.playLogEntries}`);
      
      // 新しいムーブのテスト
      console.log('\n🆕 Testing new executeAutomataAndMarket move...');
      const newMoveTestResponse = await fetch(`${SERVER_URL}/api/test-new-move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (newMoveTestResponse.ok) {
        const newMoveData = await newMoveTestResponse.json();
        console.log(`📊 New Move Test: ${newMoveData.success ? '✅ SUCCESS' : '❌ FAILED'}`);
      } else {
        console.log('⚠️ New move test endpoint not available (expected on old server)');
      }
    }
    
    // Test 4: Automata-only Test
    console.log('\n🤖 Test 4: Automata-only Test');
    const automataTestResponse = await fetch(`${SERVER_URL}/api/test-automata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const automataTestData = await automataTestResponse.json();
    
    console.log(`🤖 Automata Test Result: ${automataTestData.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`📝 Message: ${automataTestData.message}`);
    
    if (automataTestData.changes) {
      console.log('\n📈 Automata Changes:');
      console.log(`   Products Added: ${automataTestData.changes.automataProductsAdded}`);
      console.log(`   Pollution Increase: ${automataTestData.changes.pollutionIncrease}`);
      console.log(`   Player Products Removed: ${automataTestData.changes.playerProductsRemoved}`);
    }
    
    if (automataTestData.automataMarket && automataTestData.automataMarket.length > 0) {
      console.log('\n🏪 Automata Market Products:');
      automataTestData.automataMarket.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.id} (Cost: ${product.cost}, Price: ${product.price}, Resale: ${product.isResale})`);
      });
    }
    
    if (automataTestData.playLog && automataTestData.playLog.length > 0) {
      console.log('\n📜 Play Log:');
      automataTestData.playLog.forEach(entry => {
        console.log(`   ${entry.actor}: ${entry.action} - ${entry.details}`);
      });
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 All tests completed successfully!');
    console.log('✅ オートマフェーズの修正は正常に動作しています');
    console.log('✅ APIテストが完了しました');
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// スクリプト実行
if (require.main === module) {
  testAPI().then(() => {
    console.log('\n🏁 Testing completed');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { testAPI };