/**
 * 既存ゲームの状態テスト
 */

const SERVER_URL = 'https://market-disruption-production.up.railway.app';
const MATCH_ID = 'DGQMOjSypES'; // APIから見つかったマッチID

async function testGameState() {
  console.log('🎮 Testing Game State\n');

  try {
    // 1. ゲーム状態を取得
    console.log('1️⃣ Fetching game state...');
    const stateResponse = await fetch(`${SERVER_URL}/games/MarketDisruption/${MATCH_ID}`);
    
    if (!stateResponse.ok) {
      throw new Error(`Failed to get game state: ${stateResponse.status}`);
    }
    
    const gameData = await stateResponse.json();
    
    // 2. ゲーム状態の分析
    console.log('📊 Game State Analysis:');
    console.log('Match ID:', gameData.matchID);
    console.log('Game Name:', gameData.gameName);
    console.log('Players:', gameData.players?.length || 'Unknown');
    console.log('Created:', new Date(gameData.createdAt).toLocaleString());
    console.log('Updated:', new Date(gameData.updatedAt).toLocaleString());
    console.log('');

    // 3. 詳細な状態情報（もし利用可能なら）
    if (gameData.state) {
      console.log('🔍 Detailed State Information:');
      const G = gameData.state.G;
      const ctx = gameData.state.ctx;
      
      if (G && ctx) {
        console.log('Current Phase:', ctx.phase);
        console.log('Current Player:', ctx.currentPlayer);
        console.log('Round:', G.round);
        console.log('Game Ended:', G.gameEnded || false);
        
        if (G.players) {
          console.log('\n👥 Player Information:');
          Object.entries(G.players).forEach(([id, player]) => {
            console.log(`Player ${id}:`);
            console.log(`  Name: ${player.name || 'Unknown'}`);
            console.log(`  Money: ${player.money || 0}`);
            console.log(`  Prestige: ${player.prestige || 0}`);
            console.log(`  Action Points: ${player.actionPoints || 0}`);
            console.log(`  Designs: ${player.designs?.length || 0}`);
            console.log(`  Products: ${player.personalMarket?.length || 0}`);
          });
        }
        
        if (G.automata) {
          console.log('\n🤖 Automata Information:');
          console.log('Market Products:', G.automata.market?.length || 0);
          console.log('Resale Organization Money:', G.automata.resaleOrganizationMoney || 0);
        }
        
        console.log('\n🌍 Market Information:');
        console.log('Market Pollution:', G.marketPollution || 0);
        console.log('Regulation Level:', G.regulationLevel || 0);
      }
    }

    // 4. 問題の特定
    console.log('\n🔍 Problem Analysis:');
    
    if (gameData.state && gameData.state.ctx) {
      const ctx = gameData.state.ctx;
      const G = gameData.state.G;
      
      // フェーズ問題の確認
      if (ctx.phase) {
        console.log(`✅ Current phase: ${ctx.phase}`);
        
        if (ctx.phase === 'action') {
          console.log('✅ Game is in action phase - players should be able to act');
        } else if (ctx.phase === 'automata') {
          console.log('⏰ Game is in automata phase - waiting for auto-progression');
        } else if (ctx.phase === 'market') {
          console.log('⏰ Game is in market phase - waiting for auto-progression');
        }
      }
      
      // プレイヤー状態確認
      if (G.players && G.players['0']) {
        const player = G.players['0'];
        console.log(`✅ Player 0 exists with ${player.actionPoints} AP`);
        
        if (player.actionPoints > 0 && ctx.phase === 'action') {
          console.log('✅ Player should be able to perform actions');
        } else if (player.actionPoints === 0) {
          console.log('⚠️ Player has no action points remaining');
        } else if (ctx.phase !== 'action') {
          console.log(`⚠️ Wrong phase for actions: ${ctx.phase}`);
        }
      }
    }

    return gameData;

  } catch (error) {
    console.error('❌ Game State Test Failed:', error.message);
    return null;
  }
}

// テスト実行
testGameState();