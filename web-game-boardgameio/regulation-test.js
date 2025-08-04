// 規制推進アクションのテスト
const { MarketDisruption } = require('./src/game/MarketDisruption.ts');

// テスト用のゲーム状態を作成
function createTestGameState() {
  return {
    players: {
      '0': {
        id: '0',
        name: 'TestPlayer',
        money: 20,
        prestige: 5,
        actionPoints: 3,
        designs: [],
        personalMarket: [],
        resaleHistory: 0
      }
    },
    round: 1,
    phase: 'action',
    regulationStage: 'none',
    regulationStageRounds: 0,
    regulationLevel: 0,
    playLog: [],
    automata: {
      market: [],
      resaleOrganizationMoney: 50
    }
  };
}

// テスト用のコンテキスト
const testCtx = {
  currentPlayer: '0',
  numPlayers: 1,
  phase: 'action'
};

console.log('=== 規制推進アクションテスト ===');

// 成功パターンのテスト（ダイス強制設定）
const testGame = createTestGameState();

console.log('\n--- テスト前の状態 ---');
console.log('規制段階:', testGame.regulationStage);
console.log('プレイヤーAP:', testGame.players['0'].actionPoints);

// 規制推進アクションを実行（内部でダイスロールが発生）
try {
  // MarketDisruptionゲームの規制推進ムーブを実行
  const result = MarketDisruption.moves.promoteRegulation(testGame, testCtx);
  
  console.log('\n--- テスト後の状態 ---');
  console.log('規制段階:', testGame.regulationStage);
  console.log('プレイヤーAP:', testGame.players['0'].actionPoints);
  console.log('\n--- プレイログ ---');
  testGame.playLog.forEach(log => {
    console.log(`${log.actor}: ${log.action} - ${log.details}`);
  });
  
} catch (error) {
  console.error('テスト実行エラー:', error.message);
}