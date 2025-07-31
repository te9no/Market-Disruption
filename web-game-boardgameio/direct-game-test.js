/**
 * 直接的なゲーム機能テスト
 * フロントエンドを介さずにサーバーAPIを直接テスト
 */

const SERVER_URL = 'https://market-disruption-production.up.railway.app';

async function testDirectGameFunctions() {
  console.log('🎯 Direct Game Function Test\n');

  try {
    // 1. 新しいマッチを作成してテスト
    console.log('1️⃣ Creating new game match...');
    
    const createResponse = await fetch(`${SERVER_URL}/games/MarketDisruption/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        numPlayers: 1
      })
    });

    let matchData;
    if (createResponse.ok) {
      matchData = await createResponse.json();
      console.log('✅ Game created:', matchData.matchID || 'ID not returned');
    } else {
      console.log('⚠️ Game creation failed, using existing match');
      matchData = { matchID: 'DGQMOjSypES' };
    }

    const matchID = matchData.matchID || 'DGQMOjSypES';
    console.log('Using match ID:', matchID);
    console.log('');

    // 2. プレイヤーとして参加
    console.log('2️⃣ Joining as player...');
    
    const joinResponse = await fetch(`${SERVER_URL}/games/MarketDisruption/${matchID}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playerID: '0',
        playerName: 'API Tester'
      })
    });

    let credentials = null;
    if (joinResponse.ok) {
      const joinData = await joinResponse.json();
      credentials = joinData.playerCredentials;
      console.log('✅ Joined successfully');
    } else {
      console.log('⚠️ Join failed, proceeding without credentials');
    }
    console.log('');

    // 3. ゲーム状態を取得（認証付き）
    console.log('3️⃣ Getting authenticated game state...');
    
    let stateUrl = `${SERVER_URL}/games/MarketDisruption/${matchID}`;
    if (credentials) {
      stateUrl += `?playerID=0&credentials=${credentials}`;
    }

    const stateResponse = await fetch(stateUrl);
    
    if (stateResponse.ok) {
      const gameState = await stateResponse.json();
      console.log('✅ Game state retrieved');
      
      // 状態の詳細分析
      if (gameState.G && gameState.ctx) {
        const G = gameState.G;
        const ctx = gameState.ctx;
        
        console.log('\n📊 Current Game State:');
        console.log('Phase:', ctx.phase);
        console.log('Current Player:', ctx.currentPlayer);
        console.log('Round:', G.round);
        console.log('Active Player:', ctx.currentPlayer === '0' ? 'Yes' : 'No');
        
        if (G.players && G.players['0']) {
          const player = G.players['0'];
          console.log('\n👤 Player 0 Stats:');
          console.log('Money:', player.money);
          console.log('Prestige:', player.prestige);
          console.log('Action Points:', player.actionPoints);
          console.log('Designs:', player.designs?.length);
          console.log('Products:', player.personalMarket?.length);
          
          // アクション可能性の判定
          console.log('\n🎯 Action Possibility Analysis:');
          const canAct = ctx.currentPlayer === '0' && ctx.phase === 'action' && player.actionPoints > 0;
          console.log('Can perform actions:', canAct ? '✅ Yes' : '❌ No');
          
          if (!canAct) {
            console.log('Reasons:');
            if (ctx.currentPlayer !== '0') console.log('- Not player turn');
            if (ctx.phase !== 'action') console.log(`- Wrong phase: ${ctx.phase}`);
            if (player.actionPoints === 0) console.log('- No action points');
          }
          
          // 具体的なアクション可能性
          console.log('\n🎮 Specific Action Tests:');
          console.log('partTimeWork possible:', player.actionPoints >= 2 ? '✅' : '❌ (need 2 AP)');
          console.log('design possible:', (player.actionPoints >= 2 && player.designs.length < 6) ? '✅' : '❌');
          console.log('dayLabor possible:', (player.actionPoints >= 3 && player.money <= 100) ? '✅' : '❌');
          
          if (player.designs && player.designs.length > 0) {
            const design = player.designs[0];
            console.log('manufacture possible:', (player.actionPoints >= 1 && player.money >= design.cost) ? '✅' : '❌');
          }
        }
      }
    } else {
      console.log('❌ Failed to get game state:', stateResponse.status);
    }

    console.log('\n');

    // 4. 実際のアクション実行テスト（partTimeWork）
    if (credentials) {
      console.log('4️⃣ Testing actual move execution...');
      
      const moveResponse = await fetch(`${SERVER_URL}/games/MarketDisruption/${matchID}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerID: '0',
          credentials: credentials,
          type: 'partTimeWork'
        })
      });

      if (moveResponse.ok) {
        console.log('✅ partTimeWork move executed successfully');
        
        // 実行後の状態確認
        const afterStateResponse = await fetch(stateUrl);
        if (afterStateResponse.ok) {
          const afterState = await afterStateResponse.json();
          const afterPlayer = afterState.G.players['0'];
          console.log('After move - Money:', afterPlayer.money, 'AP:', afterPlayer.actionPoints);
        }
      } else {
        const errorText = await moveResponse.text();
        console.log('❌ partTimeWork move failed:', moveResponse.status, errorText);
      }
    }

    console.log('\n🎉 Direct Game Function Test Completed');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// テスト実行
testDirectGameFunctions();