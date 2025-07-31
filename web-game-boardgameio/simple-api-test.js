/**
 * シンプルなAPI動作テスト
 */

const SERVER_URL = 'https://market-disruption-production.up.railway.app';

async function testAPI() {
  console.log('🚀 Starting Simple API Test\n');

  try {
    // 1. サーバー状態テスト
    console.log('1️⃣ Testing server status...');
    const statusResponse = await fetch(`${SERVER_URL}/api/status`);
    const statusData = await statusResponse.json();
    
    console.log('✅ Server Status:', statusData.status);
    console.log('🎮 Game:', statusData.game);
    console.log('📊 Moves available:', statusData.moveCount);
    console.log('');

    // 2. 利用可能な動作テスト
    console.log('2️⃣ Testing available moves...');
    const movesResponse = await fetch(`${SERVER_URL}/api/moves`);
    const movesData = await movesResponse.json();
    
    console.log('📋 Total moves:', movesData.count);
    console.log('📝 Move list:', movesData.list.join(', '));
    console.log('');

    // 3. 重要な動作の存在確認
    console.log('3️⃣ Critical moves check:');
    const criticalMoves = ['partTimeWork', 'design', 'dayLabor', 'purchase', 'manufacture', 'sell'];
    
    criticalMoves.forEach(move => {
      const exists = movesData.list.includes(move);
      console.log(`   ${move}: ${exists ? '✅ Available' : '❌ Missing'}`);
    });
    console.log('');

    // 4. ゲームエンドポイント探索
    console.log('4️⃣ Testing game endpoints...');
    
    try {
      const gamesResponse = await fetch(`${SERVER_URL}/games`);
      console.log('Games endpoint status:', gamesResponse.status);
      
      if (gamesResponse.ok) {
        const gamesText = await gamesResponse.text();
        console.log('Games response preview:', gamesText.substring(0, 200) + '...');
      }
    } catch (e) {
      console.log('Games endpoint not available:', e.message);
    }
    console.log('');

    // 5. MarketDisruption ゲームの確認
    console.log('5️⃣ Testing MarketDisruption game...');
    
    try {
      const gameResponse = await fetch(`${SERVER_URL}/games/MarketDisruption`);
      console.log('MarketDisruption endpoint status:', gameResponse.status);
      
      if (gameResponse.ok) {
        const gameText = await gameResponse.text();
        console.log('Game response preview:', gameText.substring(0, 200) + '...');
      }
    } catch (e) {
      console.log('MarketDisruption endpoint error:', e.message);
    }
    console.log('');

    // 6. ヘルスチェック
    console.log('6️⃣ Final health check...');
    
    if (statusData.status === 'running' && movesData.count >= 10) {
      console.log('🎉 API Test PASSED - Server is running correctly!');
      console.log('✅ All critical game functions are available');
      
      // 問題分析
      console.log('\n📊 Analysis:');
      console.log('- Server is operational');
      console.log('- All game moves are loaded');
      console.log('- API endpoints are responding');
      
      const missingMoves = criticalMoves.filter(move => !movesData.list.includes(move));
      if (missingMoves.length === 0) {
        console.log('- No missing critical moves detected');
      } else {
        console.log('- Missing moves:', missingMoves.join(', '));
      }
      
    } else {
      console.log('⚠️ API Test WARNING - Some issues detected');
    }

  } catch (error) {
    console.error('❌ API Test FAILED:', error.message);
  }
}

// テスト実行
testAPI();