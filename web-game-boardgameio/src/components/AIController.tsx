import React, { useState } from 'react';

interface AIControllerProps {
  G: any; // GameState
  ctx: any; // BoardGame.io Context
  moves: any; // BoardGame.io Moves
}

export const AIController: React.FC<AIControllerProps> = ({ G, ctx, moves }) => {
  const [autoPlayEnabled, setAutoPlayEnabled] = useState<{[key: string]: boolean}>({});
  const [aiSpeed, setAiSpeed] = useState(2000); // AI実行間隔（ミリ秒）
  const [isAutoGameRunning, setIsAutoGameRunning] = useState(false);

  const toggleAutoPlay = (playerID: string) => {
    setAutoPlayEnabled(prev => ({
      ...prev,
      [playerID]: !prev[playerID]
    }));
  };

  const enableAllAI = () => {
    const allPlayers: {[key: string]: boolean} = {};
    Object.keys(G.players).forEach(playerId => {
      allPlayers[playerId] = true;
    });
    setAutoPlayEnabled(allPlayers);
  };

  const disableAllAI = () => {
    setAutoPlayEnabled({});
  };

  const executeAIForCurrentPlayer = () => {
    const currentPlayer = ctx.currentPlayer;
    if (currentPlayer && G.players[currentPlayer] && moves.executeAIMove) {
      moves.executeAIMove();
    }
  };

  // 全自動ゲームプレイ（デモ用）
  const startFullAutoGame = () => {
    if (isAutoGameRunning) {
      setIsAutoGameRunning(false);
      return;
    }

    setIsAutoGameRunning(true);
    enableAllAI();
    console.log('🚀 フル自動ゲーム開始！');
    
    const autoGameLoop = () => {
      if (G.gameEnded || !isAutoGameRunning) {
        console.log('🏁 自動ゲーム終了');
        setIsAutoGameRunning(false);
        return;
      }

      const currentPlayer = ctx.currentPlayer;
      if (currentPlayer && G.players[currentPlayer]) {
        console.log(`🤖 Player ${parseInt(currentPlayer) + 1} のターン (AP: ${G.players[currentPlayer].actionPoints})`);
        
        if (G.players[currentPlayer].actionPoints > 0) {
          try {
            moves.executeAIMove();
          } catch (error) {
            console.error('AI Move failed:', error);
          }
        } else {
          // APが0の場合、次のフェーズに移行
          console.log('⏭️ APが0のため次のフェーズへ');
          if (moves.executeAutomataAndMarket) {
            moves.executeAutomataAndMarket();
          }
        }
      }
      
      // 次のAI実行をスケジュール
      if (isAutoGameRunning) {
        setTimeout(autoGameLoop, aiSpeed);
      }
    };

    setTimeout(autoGameLoop, 1000);
  };

  return (
    <div style={{
      padding: '15px',
      margin: '10px 0',
      border: '2px solid #2196F3',
      borderRadius: '8px',
      backgroundColor: '#f8f9fa'
    }}>
      <h3>🎮 AI Game Controller</h3>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
        <button
          onClick={executeAIForCurrentPlayer}
          disabled={!ctx.currentPlayer || G.players[ctx.currentPlayer]?.actionPoints <= 0}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🤖 現在プレイヤーでAI実行
        </button>
        
        <button
          onClick={enableAllAI}
          style={{
            padding: '8px 16px',
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔄 全員AI ON
        </button>
        
        <button
          onClick={disableAllAI}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ⏹️ 全員AI OFF
        </button>
        
        <button
          onClick={startFullAutoGame}
          style={{
            padding: '8px 16px',
            backgroundColor: isAutoGameRunning ? '#f44336' : '#9C27B0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {isAutoGameRunning ? '⏹️ 停止' : '🚀 フル自動デモ'}
        </button>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <label htmlFor="ai-speed">AI実行間隔: </label>
        <select
          id="ai-speed"
          value={aiSpeed}
          onChange={(e) => setAiSpeed(Number(e.target.value))}
          style={{ marginLeft: '5px' }}
        >
          <option value={500}>高速 (0.5秒)</option>
          <option value={1000}>普通 (1秒)</option>
          <option value={2000}>ゆっくり (2秒)</option>
          <option value={5000}>とてもゆっくり (5秒)</option>
        </select>
      </div>
      
      <div style={{ fontSize: '12px', color: '#666' }}>
        <div><strong>現在のターン:</strong> プレイヤー {ctx.currentPlayer ? parseInt(ctx.currentPlayer) + 1 : '?'}</div>
        <div><strong>ゲーム状況:</strong> ラウンド {G.round}, フェーズ {G.phase}</div>
        <div><strong>自動プレイ:</strong> {Object.values(autoPlayEnabled).filter(Boolean).length}/{Object.keys(G.players).length} 人が有効</div>
        {isAutoGameRunning && (
          <div style={{ color: '#4CAF50', fontWeight: 'bold' }}>
            🔄 フル自動プレイ実行中... (間隔: {aiSpeed}ms)
          </div>
        )}
      </div>
      
      {/* リアルタイムAPI状況表示 */}
      <div style={{
        marginTop: '10px',
        padding: '10px',
        backgroundColor: '#e8f5e8',
        borderRadius: '5px',
        fontSize: '11px'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>📊 APIリアルタイム状況:</div>
        {ctx.currentPlayer && G.players[ctx.currentPlayer] && (
          <>
            <div>現在のプレイヤー: {G.players[ctx.currentPlayer].name}</div>
            <div>💰 資金: {G.players[ctx.currentPlayer].money} | ⭐ 威厳: {G.players[ctx.currentPlayer].prestige} | ⚡ AP: {G.players[ctx.currentPlayer].actionPoints}</div>
            <div>🏪 保有商品: {G.players[ctx.currentPlayer].personalMarket.length}個</div>
            <div>📋 設計図: {G.players[ctx.currentPlayer].designs.length}個</div>
          </>
        )}
        <div style={{ marginTop: '5px', color: '#666' }}>
          💡 コンソール（F12 &gt; Console）で詳細なAI判断プロセスを確認できます
        </div>
      </div>
      
      {/* 個別プレイヤーのAI制御 */}
      <div style={{ marginTop: '10px' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>個別AI制御:</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {Object.values(G.players).map((player: any) => (
            <button
              key={player.id}
              onClick={() => toggleAutoPlay(player.id)}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                backgroundColor: autoPlayEnabled[player.id] ? '#4CAF50' : '#ccc',
                color: autoPlayEnabled[player.id] ? 'white' : '#666',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              {autoPlayEnabled[player.id] ? '🤖' : '👤'} P{parseInt(player.id) + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};