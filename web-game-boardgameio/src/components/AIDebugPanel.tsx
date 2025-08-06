import React, { useState } from 'react';
import { AIGameAnalyzer, AIMoveGenerator } from '../game/AIInterface';

interface AIDebugPanelProps {
  G: any; // GameState
  ctx: any; // BoardGame.io Context
  moves: any; // BoardGame.io Moves
}

export const AIDebugPanel: React.FC<AIDebugPanelProps> = ({ G, ctx, moves }) => {
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [isDebugging, setIsDebugging] = useState(false);

  const addToLog = (message: string) => {
    setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearLog = () => {
    setDebugLog([]);
  };

  const testAIAnalysis = () => {
    const currentPlayer = ctx.currentPlayer;
    if (!currentPlayer || !G.players[currentPlayer]) {
      addToLog('❌ 現在のプレイヤーが見つかりません');
      return;
    }

    try {
      addToLog(`🔍 AI分析開始 - Player ${parseInt(currentPlayer) + 1}`);
      
      const analyzer = new AIGameAnalyzer(G, currentPlayer);
      const analysis = analyzer.analyzeGame();
      
      addToLog(`✅ AI分析完了`);
      addToLog(`📊 利用可能アクション: ${analysis.availableActions.length}個`);
      addToLog(`💡 推奨アクション: ${analysis.recommendations.length}個`);
      
      if (analysis.recommendations.length > 0) {
        const topRec = analysis.recommendations[0];
        addToLog(`🎯 最優先: ${topRec.actionName} - ${topRec.reasoning}`);
      }
      
      console.log('Full AI Analysis:', analysis);
      
    } catch (error) {
      addToLog(`❌ AI分析エラー: ${error}`);
      console.error('AI Analysis Error:', error);
    }
  };

  const testAIMoveGeneration = () => {
    const currentPlayer = ctx.currentPlayer;
    if (!currentPlayer || !G.players[currentPlayer]) {
      addToLog('❌ 現在のプレイヤーが見つかりません');
      return;
    }

    try {
      addToLog(`🧠 AIムーブ生成開始 - Player ${parseInt(currentPlayer) + 1}`);
      
      const analyzer = new AIGameAnalyzer(G, currentPlayer);
      const moveGenerator = new AIMoveGenerator(analyzer);
      const aiMove = moveGenerator.generateOptimalMove();
      
      if (aiMove) {
        addToLog(`✅ AIムーブ生成完了`);
        addToLog(`🎯 推奨アクション: ${aiMove.actionName}`);
        addToLog(`🤔 理由: ${aiMove.reasoning}`);
        addToLog(`📈 信頼度: ${aiMove.confidence}`);
        console.log('Generated AI Move:', aiMove);
      } else {
        addToLog(`⚠️ 実行可能なムーブがありません`);
      }
      
    } catch (error) {
      addToLog(`❌ AIムーブ生成エラー: ${error}`);
      console.error('AI Move Generation Error:', error);
    }
  };

  const executeAIMove = () => {
    const currentPlayer = ctx.currentPlayer;
    if (!currentPlayer || !G.players[currentPlayer]) {
      addToLog('❌ 現在のプレイヤーが見つかりません');
      return;
    }

    if (G.players[currentPlayer].actionPoints <= 0) {
      addToLog('❌ APが不足しています');
      return;
    }

    try {
      addToLog(`🚀 AIムーブ実行開始 - Player ${parseInt(currentPlayer) + 1}`);
      
      if (moves.executeAIMove) {
        moves.executeAIMove();
        addToLog(`✅ AIムーブ実行完了`);
      } else {
        addToLog(`❌ executeAIMove関数が利用できません`);
      }
      
    } catch (error) {
      addToLog(`❌ AIムーブ実行エラー: ${error}`);
      console.error('AI Move Execution Error:', error);
    }
  };

  const runSimpleDemo = () => {
    setIsDebugging(true);
    addToLog('🎮 簡単なAIデモを開始します...');
    
    setTimeout(() => {
      testAIAnalysis();
      setTimeout(() => {
        testAIMoveGeneration();
        setTimeout(() => {
          executeAIMove();
          setIsDebugging(false);
          addToLog('🏁 デモ完了');
        }, 1000);
      }, 1000);
    }, 500);
  };

  return (
    <div style={{
      padding: '15px',
      margin: '10px 0',
      border: '2px solid #FF5722',
      borderRadius: '8px',
      backgroundColor: '#fff3e0'
    }}>
      <h3>🔧 AI Debug Panel</h3>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
        <button
          onClick={testAIAnalysis}
          disabled={isDebugging}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isDebugging ? 'not-allowed' : 'pointer'
          }}
        >
          🔍 AI分析テスト
        </button>
        
        <button
          onClick={testAIMoveGeneration}
          disabled={isDebugging}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isDebugging ? 'not-allowed' : 'pointer'
          }}
        >
          🧠 ムーブ生成テスト
        </button>
        
        <button
          onClick={executeAIMove}
          disabled={isDebugging || !ctx.currentPlayer || G.players[ctx.currentPlayer]?.actionPoints <= 0}
          style={{
            padding: '8px 16px',
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: (isDebugging || !ctx.currentPlayer || G.players[ctx.currentPlayer]?.actionPoints <= 0) ? 'not-allowed' : 'pointer'
          }}
        >
          🚀 AIムーブ実行
        </button>
        
        <button
          onClick={runSimpleDemo}
          disabled={isDebugging}
          style={{
            padding: '8px 16px',
            backgroundColor: '#9C27B0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isDebugging ? 'not-allowed' : 'pointer'
          }}
        >
          🎮 簡単デモ
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
        maxHeight: '200px',
        overflowY: 'auto',
        padding: '10px',
        backgroundColor: '#000',
        color: '#00ff00',
        fontFamily: 'monospace',
        fontSize: '12px',
        borderRadius: '4px'
      }}>
        {debugLog.length > 0 ? (
          debugLog.map((log, index) => (
            <div key={index}>{log}</div>
          ))
        ) : (
          <div style={{ color: '#666' }}>デバッグログは表示されていません...</div>
        )}
      </div>
      
      {isDebugging && (
        <div style={{
          marginTop: '10px',
          padding: '10px',
          backgroundColor: '#ffeb3b',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          ⏳ デバッグ実行中... しばらくお待ちください
        </div>
      )}
    </div>
  );
};