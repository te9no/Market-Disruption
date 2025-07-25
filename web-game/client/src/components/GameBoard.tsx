import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import PlayerBoard from './PlayerBoard';
import GameStatus from './GameStatus';
import ActionPanel from './ActionPanel';
import AutomataLog from './AutomataLog';
import AllPlayersMarkets from './AllPlayersMarkets';
import { useSocket } from '../hooks/useSocket';

const GameBoard: React.FC = () => {
  const { gameState, gameId } = useSelector((state: RootState) => state.game);
  const { socket, socketId } = useSocket();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'game' | 'markets' | 'automata'>('game');
  
  console.log('🔥 NEW GameBoard rendering with tabs!', { activeTab });

  const handleRefreshGameState = async () => {
    setRefreshing(true);
    console.log('🔄 Refreshing game state...');
    
    if (socket && gameId) {
      socket.emit('request-game-state', { gameId });
    }
    
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (!gameState) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600 text-lg">ゲームデータを読み込み中...</p>
          <p className="text-gray-500 text-sm mt-2">Socket ID: {socketId || 'なし'}</p>
          <button
            onClick={handleRefreshGameState}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  // Find current player by socket ID or fallback methods
  let currentPlayer = null;
  
  if (socketId) {
    currentPlayer = gameState.players.find(p => p.id === socketId);
  }
  
  // Fallback: use the first player if socketId matching fails
  if (!currentPlayer && gameState.players.length > 0) {
    console.warn('⚠️ Socket ID matching failed, using first player as fallback');
    currentPlayer = gameState.players[0];
  }
  
  if (!currentPlayer) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-gray-600 text-lg">プレイヤー情報が見つかりません</p>
          <p className="text-gray-500 text-sm mt-2">Socket ID: {socketId || 'なし'}</p>
          <button
            onClick={handleRefreshGameState}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  const isCurrentPlayerTurn = gameState.players[gameState.currentPlayerIndex]?.id === currentPlayer.id;
  const currentPhase = gameState.currentPhase;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      {/* Modern Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        borderRadius: '0 0 24px 24px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>🎮 Market Disruption</h1>
              <div style={{
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                padding: '12px 18px',
                border: '1px solid rgba(255,255,255,0.3)'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>
                  ラウンド {gameState.currentRound} | {currentPhase === 'action' ? '🎯 アクション' : currentPhase === 'automata' ? '🤖 オートマ' : '🏪 市場'}フェーズ
                </div>
              </div>
            </div>
            <button
              onClick={handleRefreshGameState}
              disabled={refreshing}
              style={{
                background: refreshing ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '12px 18px',
                borderRadius: '12px',
                cursor: refreshing ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                fontWeight: '500',
                backdropFilter: 'blur(10px)',
                opacity: refreshing ? 0.6 : 1
              }}
              onMouseEnter={(e) => !refreshing && (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
              onMouseLeave={(e) => !refreshing && (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
            >
              {refreshing ? '🔄 更新中...' : '🔄 更新'}
            </button>
          </div>
          
          {/* Compact Stats Bar */}
          <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {[
              { icon: '👥', value: `${gameState.players.length}人`, label: 'プレイヤー', color: '#4ade80' },
              { icon: '💰', value: `¥${currentPlayer.funds.toLocaleString()}`, label: '資金', color: '#fbbf24' },
              { icon: '👑', value: currentPlayer.prestige, label: '威厳', color: '#a855f7' },
              { icon: '⚡', value: `${currentPlayer.actionPoints}/3`, label: 'AP', color: '#3b82f6' },
              { icon: '🔄', value: currentPlayer.resaleHistory, label: '転売回数', color: '#ef4444' }
            ].map((stat, index) => (
              <div key={index} style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                border: '1px solid rgba(255,255,255,0.2)',
                minWidth: '120px',
                transition: 'all 0.3s ease'
              }}>
                <span style={{ fontSize: '20px' }}>{stat.icon}</span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: '11px', opacity: 0.8 }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        borderBottom: '1px solid rgba(0,0,0,0.1)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', gap: '0' }}>
            {[
              { key: 'game', icon: '🎮', label: 'ゲーム画面' },
              { key: 'markets', icon: '🏪', label: '全マーケット' },
              { key: 'automata', icon: '🤖', label: '詳細情報' }
            ].map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as 'game' | 'markets' | 'automata')}
                  style={{
                    padding: '16px 24px',
                    fontWeight: '600',
                    borderBottom: `3px solid ${isActive ? '#667eea' : 'transparent'}`,
                    color: isActive ? '#667eea' : '#6b7280',
                    background: isActive ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                    transition: 'all 0.3s ease',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    borderRadius: '12px 12px 0 0',
                    marginBottom: '-1px'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#374151';
                      e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#6b7280';
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {activeTab === 'game' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Main Game Area */}
            <div className="xl:col-span-9">
              <PlayerBoard player={currentPlayer} />
            </div>

            {/* Sidebar */}
            <div className="xl:col-span-3 space-y-4">
              {/* Action Panel */}
              <ActionPanel 
                player={currentPlayer}
                isMyTurn={isCurrentPlayerTurn}
                gamePhase={currentPhase}
                gameState={gameState}
              />

              {/* Other Players - Compact View */}
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <h3 className="font-bold text-lg mb-3 flex items-center space-x-2">
                  <span>👥</span>
                  <span>プレイヤー</span>
                </h3>
                <div className="space-y-2">
                  {gameState.players.map((player) => (
                    <div key={player.id} className={`rounded-lg p-3 transition-all ${
                      player.id === currentPlayer.id 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">{player.name}</span>
                          {player.id === currentPlayer.id && (
                            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">YOU</span>
                          )}
                          {gameState.players[gameState.currentPlayerIndex]?.id === player.id && (
                            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                              ▶️
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <div className="flex items-center space-x-1">
                          <span>💰</span>
                          <span className="font-medium">¥{player.funds}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>👑</span>
                          <span className="font-medium">{player.prestige}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>🔄</span>
                          <span className="font-medium">{player.resaleHistory}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>⚡</span>
                          <span className="font-medium">{player.actionPoints}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'markets' && (
          <AllPlayersMarkets 
            players={gameState.players}
            currentPlayerId={currentPlayer.id}
            isMyTurn={isCurrentPlayerTurn}
            manufacturerAutomata={gameState.manufacturerAutomata}
            resaleAutomata={gameState.resaleAutomata}
          />
        )}

        {activeTab === 'automata' && (
          <div className="space-y-6">
            <GameStatus 
              round={gameState.currentRound}
              phase={currentPhase}
              currentPlayerIndex={gameState.currentPlayerIndex}
              players={gameState.players}
              pollution={gameState.pollution}
              regulationLevel={gameState.regulationLevel}
            />
            <AutomataLog automataActions={gameState.automataActions || []} />
          </div>
        )}
      </div>

      {/* Game Over Modal */}
      {gameState.state === 'finished' && gameState.winner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-center mb-4">🎉 ゲーム終了 🎉</h2>
            <div className="text-center">
              <p className="text-lg mb-2">勝者:</p>
              <p className="text-2xl font-bold text-blue-600 mb-4">{gameState.winner.name}</p>
              <div className="bg-gray-100 rounded p-4 mb-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">最終資金:</span>
                    <span className="font-medium ml-1">¥{gameState.winner.funds}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">最終威厳:</span>
                    <span className="font-medium ml-1">{gameState.winner.prestige}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
              >
                新しいゲームを開始
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;