import React, { useEffect, useState } from 'react';
import { GameAnalysis, AIGameAnalyzer } from '../game/AIInterface';

interface AIPlayerProps {
  G: any; // GameState
  ctx: any; // BoardGame.io Context
  moves: any; // BoardGame.io Moves
  playerID: string;
  isActive: boolean;
  autoPlay: boolean;
}

export const AIPlayer: React.FC<AIPlayerProps> = ({ 
  G, ctx, moves, playerID, isActive, autoPlay 
}) => {
  const [aiAnalysis, setAiAnalysis] = useState<GameAnalysis | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  // AI分析の更新（ローカルで実行）
  useEffect(() => {
    if (isActive && G && ctx && ctx.currentPlayer) {
      try {
        // ローカルでAI分析を実行
        const analyzer = new AIGameAnalyzer(G, ctx.currentPlayer);
        const analysis = analyzer.analyzeGame();
        setAiAnalysis(analysis);
      } catch (error) {
        console.error('Failed to get AI analysis:', error);
      }
    }
  }, [G, ctx, isActive]);

  // 自動プレイの実行
  useEffect(() => {
    if (autoPlay && isActive && !isThinking && moves.executeAIMove) {
      const player = G.players[playerID];
      if (player && player.actionPoints > 0) {
        setIsThinking(true);
        
        // 少し待ってからAIを実行（ユーザーが確認できるように）
        setTimeout(() => {
          try {
            moves.executeAIMove();
            console.log(`🤖 AI Player ${playerID} executed move`);
          } catch (error) {
            console.error('AI move execution failed:', error);
          } finally {
            setIsThinking(false);
          }
        }, 1500);
      }
    }
  }, [autoPlay, isActive, G, playerID, moves, isThinking]);

  // 手動AI実行
  const handleExecuteAI = () => {
    if (moves.executeAIMove && !isThinking) {
      setIsThinking(true);
      try {
        moves.executeAIMove();
      } catch (error) {
        console.error('Manual AI move failed:', error);
      } finally {
        setIsThinking(false);
      }
    }
  };

  // AI分析の表示
  const handleShowAnalysis = () => {
    try {
      // ローカルでAI分析を実行
      const analyzer = new AIGameAnalyzer(G, playerID);
      const analysis = analyzer.analyzeGame();
      setAiAnalysis(analysis);
      console.log('AI Analysis:', analysis);
    } catch (error) {
      console.error('Failed to get AI analysis:', error);
    }
  };

  if (!G.players[playerID]) {
    return null;
  }

  const player = G.players[playerID];
  const isAITurn = isActive && ctx.currentPlayer === playerID;

  return (
    <div style={{
      padding: '10px',
      margin: '10px 0',
      border: `2px solid ${isAITurn ? '#4CAF50' : '#ddd'}`,
      borderRadius: '8px',
      backgroundColor: isAITurn ? '#f0fff0' : '#f9f9f9'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4>🤖 AI Player {parseInt(playerID) + 1}</h4>
          <div style={{ fontSize: '12px', color: '#666' }}>
            資金: {player.money} | 威厳: {player.prestige} | AP: {player.actionPoints}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isThinking && (
            <span style={{ color: '#FF9800', fontSize: '12px' }}>
              🧠 思考中...
            </span>
          )}
          
          {isAITurn && (
            <button
              onClick={handleExecuteAI}
              disabled={isThinking || player.actionPoints <= 0}
              style={{
                padding: '6px 12px',
                backgroundColor: isThinking ? '#ccc' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isThinking ? 'not-allowed' : 'pointer',
                fontSize: '12px'
              }}
            >
              {isThinking ? '実行中...' : 'AI実行'}
            </button>
          )}
          
          <button
            onClick={handleShowAnalysis}
            style={{
              padding: '6px 12px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            分析表示
          </button>
        </div>
      </div>

      {/* AI分析結果の表示 */}
      {aiAnalysis && (
        <div style={{
          marginTop: '10px',
          padding: '8px',
          backgroundColor: '#e3f2fd',
          borderRadius: '4px',
          fontSize: '11px'
        }}>
          <div><strong>ゲーム状況:</strong> ラウンド{aiAnalysis.gameStatus.round}, {aiAnalysis.gameStatus.phase}</div>
          <div><strong>利用可能アクション:</strong> {aiAnalysis.availableActions.length}個</div>
          <div><strong>推奨アクション:</strong></div>
          {aiAnalysis.recommendations.slice(0, 2).map((rec, index) => (
            <div key={index} style={{ marginLeft: '10px', color: rec.priority === 'high' ? '#f44336' : '#666' }}>
              • {rec.actionName}: {rec.reasoning}
            </div>
          ))}
        </div>
      )}
      
      {/* 勝利条件の進捗表示 */}
      <div style={{
        marginTop: '8px',
        fontSize: '11px',
        color: '#666'
      }}>
        勝利まで: 資金{Math.max(0, 150 - player.money)} または 威厳{Math.max(0, 17 - player.prestige)}+資金{Math.max(0, 75 - player.money)}
      </div>
    </div>
  );
};