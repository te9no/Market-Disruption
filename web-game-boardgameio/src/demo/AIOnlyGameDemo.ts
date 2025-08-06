// AI APIのみを使用したゲームプレイのデモンストレーション

import { GameState, createInitialPlayer } from '../game/GameState';
import { AIGameAnalyzer, AIMoveGenerator } from '../game/AIInterface';

// シミュレートされたゲーム状態を作成
const createDemoGameState = (): GameState => {
  const gameState: GameState = {
    players: {},
    phase: 'action',
    round: 1,
    marketPollution: 0,
    regulationLevel: 0,
    regulationStage: 'none',
    regulationStageRounds: 0,
    automata: {
      manufacturerMoney: 50,
      resaleOrganizationMoney: 50,
      market: []
    },
    trendEffects: [],
    shortVideoBonus: false,
    gameEnded: false,
    winner: null,
    playLog: [],
    currentPlayer: null,
    gameStarted: true
  };

  // 4人のプレイヤーを作成
  for (let i = 0; i < 4; i++) {
    const playerId = String(i);
    gameState.players[playerId] = createInitialPlayer(playerId, `AI Player ${i + 1}`);
    
    // 初期設計を追加（ランダムコスト）
    gameState.players[playerId].designs = [
      { id: `design-${playerId}-0`, cost: Math.floor(Math.random() * 3) + 2, isOpenSource: false },
      { id: `design-${playerId}-1`, cost: Math.floor(Math.random() * 3) + 3, isOpenSource: false }
    ];
  }

  return gameState;
};

// AIプレイヤーがターンを実行するデモ
const simulateAITurn = (gameState: GameState, playerId: string): void => {
  console.log(`\n🤖 AI Player ${parseInt(playerId) + 1} のターン開始`);
  
  const player = gameState.players[playerId];
  console.log(`💰 資金: ${player.money} | ⭐ 威厳: ${player.prestige} | ⚡ AP: ${player.actionPoints}`);

  // AI分析を実行
  const analyzer = new AIGameAnalyzer(gameState, playerId);
  const analysis = analyzer.analyzeGame();

  console.log(`📊 利用可能アクション: ${analysis.availableActions.length}個`);
  
  // 推奨アクションを表示
  if (analysis.recommendations.length > 0) {
    console.log(`💡 AI推奨:`);
    analysis.recommendations.slice(0, 3).forEach((rec, index) => {
      console.log(`  ${index + 1}. [${rec.priority}] ${rec.actionName}: ${rec.reasoning}`);
    });
  }

  // AI move generator で最適なムーブを生成
  const moveGenerator = new AIMoveGenerator(analyzer);
  
  // プレイヤーがAPを持っている限り続行
  while (player.actionPoints > 0) {
    const aiMove = moveGenerator.generateOptimalMove();
    
    if (!aiMove) {
      console.log(`   ❌ 実行可能なアクションがありません（AP: ${player.actionPoints}）`);
      break;
    }

    console.log(`   🎯 AI実行: ${aiMove.actionName} (信頼度: ${aiMove.confidence})`);
    console.log(`   🧠 理由: ${aiMove.reasoning}`);

    // 実際のアクション実行はここでシミュレート
    simulateAIAction(gameState, playerId, aiMove);
    
    console.log(`   ✅ 実行完了 (残りAP: ${player.actionPoints})`);
  }

  console.log(`🏁 Player ${parseInt(playerId) + 1} ターン終了\n`);
};

// AIアクションをシミュレート（実際のgame logicは使わず、状態変更のみ）
const simulateAIAction = (gameState: GameState, playerId: string, aiMove: any): void => {
  const player = gameState.players[playerId];
  
  switch (aiMove.actionName) {
    case 'manufacture':
      player.actionPoints -= 1;
      player.money -= 3; // 仮のコスト
      // 商品を追加（シンプルなシミュレーション）
      player.personalMarket.push({
        id: `product-${Date.now()}`,
        playerId: playerId,
        cost: 3,
        price: 0,
        popularity: Math.floor(Math.random() * 3) + 2,
        isResale: false
      });
      break;
      
    case 'sell':
      player.actionPoints -= 1;
      // 商品に価格を設定
      const productToSell = player.personalMarket.find(p => p.price === 0);
      if (productToSell) {
        productToSell.price = aiMove.parameters?.price || productToSell.cost * 1.5;
      }
      break;
      
    case 'partTimeWork':
      player.actionPoints -= 2;
      player.money += 5;
      break;
      
    case 'dayLabor':
      player.actionPoints -= 3;
      player.money += 18;
      break;
      
    case 'design':
      player.actionPoints -= 2;
      player.money -= 5;
      player.designs.push({
        id: `design-${playerId}-${Date.now()}`,
        cost: Math.floor(Math.random() * 3) + 2,
        isOpenSource: aiMove.parameters?.isOpenSource || false
      });
      break;
      
    case 'research':
      player.actionPoints -= 1;
      player.money -= 3;
      // トレンド効果（シミュレーション）
      break;
      
    default:
      player.actionPoints -= 1; // デフォルトでAP消費
      break;
  }
};

// 勝利条件チェック
const checkWinCondition = (gameState: GameState): string | null => {
  for (const [playerId, player] of Object.entries(gameState.players)) {
    if ((player.prestige >= 17 && player.money >= 75) || player.money >= 150) {
      return `🏆 AI Player ${parseInt(playerId) + 1} が勝利！ (資金: ${player.money}, 威厳: ${player.prestige})`;
    }
  }
  return null;
};

// メインのAIオンリーゲームデモ
export const runAIOnlyGameDemo = (): void => {
  console.log('🎮 AI ONLY GAME DEMO - Market Disruption');
  console.log('=====================================');
  
  const gameState = createDemoGameState();
  let round = 1;
  const maxRounds = 15;

  while (round <= maxRounds) {
    console.log(`\n🎲 ========== ラウンド ${round} ==========`);
    
    // 各プレイヤーのターン
    for (let i = 0; i < 4; i++) {
      const playerId = String(i);
      
      // APをリセット
      gameState.players[playerId].actionPoints = 3;
      
      // AI ターンを実行
      simulateAITurn(gameState, playerId);
      
      // 勝利条件チェック
      const winner = checkWinCondition(gameState);
      if (winner) {
        console.log(winner);
        console.log('🎉 ゲーム終了！');
        return;
      }
    }
    
    // ラウンド終了処理（簡単なシミュレーション）
    console.log(`📊 ラウンド ${round} 終了 - プレイヤー状況:`);
    Object.values(gameState.players).forEach((player, index) => {
      console.log(`   P${index + 1}: 資金${player.money} 威厳${player.prestige} 商品${player.personalMarket.length}個`);
    });
    
    round++;
  }
  
  console.log('⏰ 最大ラウンド数に達しました。');
  
  // 最終スコア
  const finalScores = Object.values(gameState.players).map((player, index) => ({
    player: index + 1,
    score: player.money + (player.prestige * 5),
    money: player.money,
    prestige: player.prestige
  })).sort((a, b) => b.score - a.score);
  
  console.log('\n🏆 最終結果:');
  finalScores.forEach((result, index) => {
    console.log(`${index + 1}位: AI Player ${result.player} - スコア${result.score} (資金${result.money} 威厳${result.prestige})`);
  });
};

// ブラウザ環境でも実行可能
if (typeof window !== 'undefined') {
  (window as any).runAIOnlyGameDemo = runAIOnlyGameDemo;
}