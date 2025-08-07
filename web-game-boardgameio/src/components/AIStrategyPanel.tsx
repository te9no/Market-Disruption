import React, { useState } from 'react';
import { AIGameAnalyzer } from '../game/AIInterface';

interface AIStrategyPanelProps {
  G: any; // GameState
  ctx: any; // BoardGame.io Context
  moves: any; // BoardGame.io Moves
}

export const AIStrategyPanel: React.FC<AIStrategyPanelProps> = ({ G, ctx, moves }) => {
  const [strategyLog, setStrategyLog] = useState<string[]>([]);

  const addToLog = (message: string) => {
    setStrategyLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`].slice(-20));
  };

  const clearLog = () => {
    setStrategyLog([]);
  };

  const analyzeAllPlayersStrategy = () => {
    addToLog('🔍 全プレイヤーの戦略分析開始...');
    
    Object.values(G.players).forEach((player: any, index: number) => {
      try {
        const analyzer = new AIGameAnalyzer(G, player.id);
        const analysis = analyzer.analyzeGame();
        
        // ゲームフェーズ判定
        const totalScore = player.money + (player.prestige * 5);
        let phase = 'early';
        if (totalScore >= 30) phase = 'mid';
        if (totalScore >= 80) phase = 'late';
        
        addToLog(`🤖 Player ${index + 1} [${phase}フェーズ]:`);
        addToLog(`  💰 ${player.money}資金 ⭐ ${player.prestige}威厳 🏪 ${player.personalMarket.length}商品`);
        
        if (analysis.recommendations.length > 0) {
          const topRec = analysis.recommendations[0];
          addToLog(`  🎯 最優先: ${topRec.actionName} (${topRec.reasoning})`);
        }
        
        // 戦略パターンの判定
        const strategy = determinePlayerStrategy(player);
        addToLog(`  📊 戦略: ${strategy}`);
        
      } catch (error) {
        addToLog(`❌ Player ${index + 1} 分析エラー: ${error}`);
      }
    });
    
    addToLog('✅ 全プレイヤー戦略分析完了');
  };

  const determinePlayerStrategy = (player: any): string => {
    const moneyRatio = player.money / Math.max(1, player.prestige + 5);
    const resaleCount = player.resaleHistory || 0;
    
    if (resaleCount >= 3) return '転売特化型';
    if (player.designs.length >= 4) return '設計重視型';
    if (moneyRatio >= 8) return '資金重視型';
    if (player.prestige >= 5) return '威厳重視型';
    if (player.personalMarket.length >= 3) return '製造・販売型';
    return 'バランス型';
  };

  const executeStrategicAI = (playerId: string, strategyType: string) => {
    addToLog(`🎯 Player ${parseInt(playerId) + 1} に${strategyType}戦略を実行...`);
    
    try {
      // 戦略に応じたAI実行ロジック
      switch (strategyType) {
        case 'aggressive':
          // 攻撃的戦略：転売重視
          addToLog('  ⚡ 攻撃的戦略: 転売機会を優先的に探索');
          break;
        case 'conservative':
          // 保守的戦略：安全なアクション重視
          addToLog('  🛡️ 保守的戦略: 安全なアクションを優先');
          break;
        case 'balanced':
          // バランス戦略：総合的判断
          addToLog('  ⚖️ バランス戦略: 状況に応じて最適選択');
          break;
      }
      
      if (moves.executeAIMove) {
        moves.executeAIMove();
        addToLog('✅ 戦略的AI実行完了');
      }
      
    } catch (error) {
      addToLog(`❌ 戦略実行エラー: ${error}`);
    }
  };

  const runCompetitiveAnalysis = () => {
    addToLog('🏁 競合分析開始...');
    
    const players = Object.values(G.players);
    const rankings = players.map((player: any, index) => ({
      id: index,
      name: `Player ${index + 1}`,
      score: player.money + (player.prestige * 5),
      money: player.money,
      prestige: player.prestige,
      threat: calculateThreatLevel(player)
    })).sort((a, b) => b.score - a.score);

    addToLog('📊 現在の順位:');
    rankings.forEach((player, rank) => {
      const position = rank + 1;
      const threatEmoji = player.threat === 'high' ? '🔥' : player.threat === 'medium' ? '⚠️' : '🟢';
      addToLog(`  ${position}位: ${player.name} (スコア:${player.score}) ${threatEmoji}`);
    });

    // 勝利の可能性分析
    const winProbabilities = rankings.map(player => {
      const moneyToWin = Math.max(0, 150 - player.money);
      const prestigeWin = player.prestige >= 17 && player.money >= 75;
      const probability = prestigeWin ? 0.9 : Math.max(0.1, 1 - (moneyToWin / 100));
      return { ...player, winProbability: probability };
    });

    const topThreat = winProbabilities[0];
    addToLog(`🎯 最大脅威: ${topThreat.name} (勝利確率: ${Math.floor(topThreat.winProbability * 100)}%)`);
  };

  const calculateThreatLevel = (player: any): 'low' | 'medium' | 'high' => {
    const score = player.money + (player.prestige * 5);
    const nearVictory = (player.prestige >= 17 && player.money >= 75) || player.money >= 150;
    
    if (nearVictory) return 'high';
    if (score >= 100) return 'medium';
    return 'low';
  };

  return (
    <div style={{
      padding: '15px',
      margin: '10px 0',
      border: '2px solid #673AB7',
      borderRadius: '8px',
      backgroundColor: '#f3e5f5'
    }}>
      <h3>📈 AI Strategy Panel</h3>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
        <button
          onClick={analyzeAllPlayersStrategy}
          style={{
            padding: '8px 16px',
            backgroundColor: '#673AB7',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔍 全員戦略分析
        </button>
        
        <button
          onClick={runCompetitiveAnalysis}
          style={{
            padding: '8px 16px',
            backgroundColor: '#E91E63',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🏁 競合分析
        </button>
        
        <button
          onClick={() => executeStrategicAI(ctx.currentPlayer, 'aggressive')}
          disabled={!ctx.currentPlayer}
          style={{
            padding: '8px 16px',
            backgroundColor: '#FF5722',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ⚡ 攻撃的AI
        </button>
        
        <button
          onClick={() => executeStrategicAI(ctx.currentPlayer, 'conservative')}
          disabled={!ctx.currentPlayer}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🛡️ 保守的AI
        </button>
        
        <button
          onClick={clearLog}
          style={{
            padding: '8px 16px',
            backgroundColor: '#607D8B',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🗑️ ログクリア
        </button>
      </div>

      <div style={{
        maxHeight: '300px',
        overflowY: 'auto',
        padding: '10px',
        backgroundColor: '#1a1a2e',
        color: '#eee',
        fontFamily: 'monospace',
        fontSize: '12px',
        borderRadius: '4px'
      }}>
        {strategyLog.length > 0 ? (
          strategyLog.map((log, index) => (
            <div key={index} style={{ marginBottom: '2px' }}>{log}</div>
          ))
        ) : (
          <div style={{ color: '#666' }}>戦略ログは表示されていません...</div>
        )}
      </div>
      
      <div style={{
        marginTop: '10px',
        fontSize: '12px',
        color: '#666'
      }}>
        💡 AI戦略パネルで複数のAI判断ロジックをテストできます
      </div>
    </div>
  );
};