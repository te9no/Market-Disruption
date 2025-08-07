import React, { useState } from 'react';
import { AIGameAnalyzer } from '../game/AIInterface';

interface CompactAIPanelProps {
  G: any; // GameState
  ctx: any; // BoardGame.io Context
  moves: any; // BoardGame.io Moves
}

export const CompactAIPanel: React.FC<CompactAIPanelProps> = ({ G, ctx, moves }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'control' | 'debug' | 'strategy'>('control');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-10), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const executeAI = () => {
    if (moves.executeAIMove && ctx.currentPlayer) {
      // actionフェーズでのみAI実行を許可
      if (ctx.phase !== 'action') {
        addLog(`❌ AI実行不可: 現在のフェーズ (${ctx.phase}) ではAIが実行できません`);
        return;
      }
      addLog(`🤖 AI実行: Player ${parseInt(ctx.currentPlayer) + 1}`);
      moves.executeAIMove();
    }
  };

  const endTurn = () => {
    if (!ctx.currentPlayer) {
      addLog('❌ 現在のプレイヤーが存在しません');
      return;
    }

    addLog(`⏭️ ターン終了: Player ${parseInt(ctx.currentPlayer) + 1}`);
    
    try {
      if (ctx.numPlayers === 1) {
        if (moves.executeAutomataAndMarket) {
          addLog('🤖 1人プレイ：オートマ&マーケット実行');
          moves.executeAutomataAndMarket();
        } else {
          addLog('❌ executeAutomataAndMarket が利用できません');
        }
      } else {
        if (ctx.events && typeof ctx.events.endTurn === 'function') {
          addLog('👥 複数人プレイ：ターン終了実行');
          ctx.events.endTurn();
        } else {
          addLog(`❌ ctx.events.endTurn が利用できません - events: ${!!ctx.events}, type: ${typeof ctx.events?.endTurn}`);
        }
      }
    } catch (error) {
      addLog(`❌ ターン終了処理でエラー: ${error}`);
      console.error('Turn end error:', error);
    }
  };

  const analyzeCurrentPlayer = () => {
    if (!ctx.currentPlayer) return null;
    
    try {
      const analyzer = new AIGameAnalyzer(G, ctx.currentPlayer);
      const analysis = analyzer.analyzeGame();
      addLog(`🔍 分析完了: ${analysis.availableActions.length}アクション`);
      return analysis;
    } catch (error) {
      addLog(`❌ 分析エラー: ${error}`);
      return null;
    }
  };

  const currentPlayer = ctx.currentPlayer ? G.players[ctx.currentPlayer] : null;
  const isMobile = window.innerWidth <= 768;

  return (
    <div style={{
      position: 'fixed',
      bottom: isMobile ? '10px' : '20px',
      right: isMobile ? '10px' : '20px',
      width: isExpanded ? (isMobile ? '300px' : '400px') : (isMobile ? '150px' : '200px'),
      maxHeight: isExpanded ? '500px' : '60px',
      backgroundColor: 'white',
      border: '2px solid #2196F3',
      borderRadius: '10px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 1000,
      transition: 'all 0.3s ease'
    }}>
      {/* ヘッダー */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '10px 15px',
          backgroundColor: '#2196F3',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderRadius: isExpanded ? '8px 8px 0 0' : '8px'
        }}
      >
        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
          🤖 AI Panel {currentPlayer ? `(P${parseInt(ctx.currentPlayer) + 1})` : ''}
        </span>
        <span style={{ fontSize: '12px' }}>
          {isExpanded ? '▼' : '▲'}
        </span>
      </div>

      {isExpanded && (
        <>
          {/* タブメニュー */}
          <div style={{ display: 'flex', borderBottom: '1px solid #ddd' }}>
            {[
              { id: 'control', label: '🎮 制御', color: '#4CAF50' },
              { id: 'debug', label: '🔧 分析', color: '#FF9800' },
              { id: 'strategy', label: '📊 戦略', color: '#9C27B0' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  fontSize: '11px',
                  backgroundColor: activeTab === tab.id ? tab.color : 'transparent',
                  color: activeTab === tab.id ? 'white' : '#666',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* コンテンツエリア */}
          <div style={{ padding: '15px', fontSize: '12px' }}>
            {activeTab === 'control' && (
              <div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <button
                    onClick={executeAI}
                    disabled={!currentPlayer || currentPlayer.actionPoints <= 0}
                    style={{
                      flex: 1,
                      padding: '8px',
                      fontSize: '11px',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    🤖 AI実行
                  </button>
                  <button
                    onClick={endTurn}
                    disabled={!currentPlayer}
                    style={{
                      flex: 1,
                      padding: '8px',
                      fontSize: '11px',
                      backgroundColor: '#FF5722',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    ⏭️ ターン終了
                  </button>
                </div>

                {currentPlayer && (
                  <div style={{ 
                    padding: '8px', 
                    backgroundColor: '#f5f5f5', 
                    borderRadius: '4px',
                    fontSize: '10px'
                  }}>
                    <div>💰 {currentPlayer.money} | ⭐ {currentPlayer.prestige} | ⚡ {currentPlayer.actionPoints}</div>
                    <div>🏪 商品: {currentPlayer.personalMarket.length} | 📋 設計: {currentPlayer.designs.length}</div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'debug' && (
              <div>
                <button
                  onClick={analyzeCurrentPlayer}
                  style={{
                    width: '100%',
                    padding: '8px',
                    fontSize: '11px',
                    backgroundColor: '#FF9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginBottom: '10px'
                  }}
                >
                  🔍 AI分析実行
                </button>

                <div style={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                  padding: '8px',
                  backgroundColor: '#1a1a2e',
                  color: '#00ff00',
                  fontFamily: 'monospace',
                  fontSize: '9px',
                  borderRadius: '4px'
                }}>
                  {logs.length > 0 ? (
                    logs.map((log, index) => (
                      <div key={index}>{log}</div>
                    ))
                  ) : (
                    <div style={{ color: '#666' }}>ログなし</div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'strategy' && (
              <div>
                <div style={{ marginBottom: '10px', fontSize: '10px' }}>
                  <strong>📈 ゲーム状況</strong>
                  <div>ラウンド: {G.round} | 汚染: {G.marketPollution}</div>
                </div>

                {Object.values(G.players).map((player: any, index) => {
                  const score = player.money + (player.prestige * 5);
                  const isWinning = (player.prestige >= 17 && player.money >= 75) || player.money >= 150;
                  
                  return (
                    <div 
                      key={player.id}
                      style={{
                        padding: '4px 8px',
                        margin: '2px 0',
                        backgroundColor: ctx.currentPlayer === player.id ? '#e3f2fd' : '#f9f9f9',
                        borderRadius: '3px',
                        fontSize: '9px',
                        border: isWinning ? '1px solid #4CAF50' : '1px solid #ddd'
                      }}
                    >
                      <div style={{ fontWeight: 'bold' }}>
                        P{index + 1} {isWinning && '🏆'}
                      </div>
                      <div>💰{player.money} ⭐{player.prestige} 📊{score}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};