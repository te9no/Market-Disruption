import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import PlayerBoard from './PlayerBoard';
import GameStatus from './GameStatus';
import ActionPanel from './ActionPanel';
import AutomataLog from './AutomataLog';
import PlayerMarketView from './PlayerMarketView';
import AutomataMarketView from './AutomataMarketView';
import PlayLog from './PlayLog';
import TrendResultDialog from './TrendResultDialog';
import { useSocket } from '../hooks/useSocket';

const GameBoard: React.FC = () => {
  const { gameState, gameId } = useSelector((state: RootState) => state.game);
  const { socket, socketId } = useSocket();
  const [refreshing, setRefreshing] = useState(false);
  const [activeView, setActiveView] = useState<string>('game');
  const [trendResult, setTrendResult] = useState<any>(null);
  const [showTrendDialog, setShowTrendDialog] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  console.log('🔥 NEW GameBoard rendering with sidebar!', { activeView });

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Listen for game update events to catch trend research results
  useEffect(() => {
    if (!socket) return;

    const handleGameUpdate = ({ lastAction }: any) => {
      console.log('🎯 GameBoard received game update:', lastAction);
      
      // Check if the last action was a trend research
      if (lastAction && lastAction.type === 'trend_research') {
        console.log('📈 Trend research result received:', lastAction);
        setTrendResult(lastAction);
        setShowTrendDialog(true);
      }
    };

    socket.on('game-update', handleGameUpdate);

    return () => {
      socket.off('game-update', handleGameUpdate);
    };
  }, [socket]);

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
  
  // Debug: Log inventory data
  if (currentPlayer) {
    console.log('🎮 Current player inventory debug:', {
      playerName: currentPlayer.name,
      inventoryLength: currentPlayer.inventory?.length || 0,
      inventory: currentPlayer.inventory
    });
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

  // Create menu items
  const menuItems = [
    { key: 'game', icon: '🎮', label: 'ゲーム画面' },
    ...gameState.players.map((player) => ({
      key: `player-${player.id}`,
      icon: '🏪',
      label: `${player.name}のマーケット`
    })),
    { key: 'manufacturer-automata', icon: '🏭', label: 'メーカーオートマ' },
    { key: 'resale-automata', icon: '💰', label: '転売オートマ' },
    { key: 'details', icon: '🤖', label: '詳細情報' }
  ];

  // Use actual play logs from game state
  const playLogs = gameState.playLog || [];

  const renderMainContent = () => {
    if (activeView === 'game') {
      return (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-full">
          {/* Main Game Area */}
          <div className="xl:col-span-3">
            <PlayerBoard player={currentPlayer} />
          </div>
          {/* Action Panel */}
          <div className="xl:col-span-1">
            <ActionPanel 
              player={currentPlayer}
              isMyTurn={isCurrentPlayerTurn}
              gamePhase={currentPhase}
              gameState={gameState}
            />
          </div>
        </div>
      );
    }

    if (activeView === 'manufacturer-automata') {
      return (
        <AutomataMarketView
          automata={gameState.manufacturerAutomata}
          type="manufacturer"
          currentPlayerId={currentPlayer.id}
          isMyTurn={isCurrentPlayerTurn}
        />
      );
    }

    if (activeView === 'resale-automata') {
      return (
        <AutomataMarketView
          automata={gameState.resaleAutomata}
          type="resale"
          currentPlayerId={currentPlayer.id}
          isMyTurn={isCurrentPlayerTurn}
        />
      );
    }

    if (activeView === 'details') {
      return (
        <div className="space-y-6">
          <GameStatus 
            round={gameState.currentRound}
            phase={currentPhase}
            currentPlayerIndex={gameState.currentPlayerIndex}
            players={gameState.players}
            pollution={gameState.pollution}
            regulationLevel={gameState.regulationLevel}
          />
          <AutomataLog 
            automataActions={gameState.automataActions || []} 
            currentRound={gameState.currentRound}
            gamePhase={gameState.currentPhase}
          />
        </div>
      );
    }

    // Player market view
    const playerMatch = activeView.match(/^player-(.+)$/);
    if (playerMatch) {
      const playerId = playerMatch[1];
      const targetPlayer = gameState.players.find(p => p.id === playerId);
      if (targetPlayer) {
        return (
          <PlayerMarketView
            player={targetPlayer}
            currentPlayerId={currentPlayer.id}
            isMyTurn={isCurrentPlayerTurn}
          />
        );
      }
    }

    return <div>未知のビューです</div>;
  };

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
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  padding: '12px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontWeight: '500',
                  backdropFilter: 'blur(10px)',
                  display: 'block'
                }}
                className="md:hidden"
              >
                {showSidebar ? '✕' : '☰'}
              </button>
              
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
          </div>
          
          {/* Compact Stats Bar */}
          <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {[
              { icon: '👥', value: `${gameState.players.length}人`, label: 'プレイヤー', color: '#4ade80', priority: 3 },
              { icon: '💰', value: `¥${currentPlayer.funds.toLocaleString()}`, label: '資金', color: '#fbbf24', priority: 1 },
              { icon: '👑', value: currentPlayer.prestige, label: '威厳', color: '#a855f7', priority: 2 },
              { icon: '⚡', value: `${currentPlayer.actionPoints}/3`, label: 'AP', color: '#3b82f6', priority: 1 },
              { icon: '🔄', value: currentPlayer.resaleHistory, label: '転売回数', color: '#ef4444', priority: 3 }
            ].filter(stat => !isMobile || stat.priority <= 2).map((stat, index) => (
              <div key={index} style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: isMobile ? '8px 12px' : '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '6px' : '10px',
                border: '1px solid rgba(255,255,255,0.2)',
                minWidth: isMobile ? '80px' : '120px',
                transition: 'all 0.3s ease'
              }}>
                <span style={{ fontSize: isMobile ? '16px' : '20px' }}>{stat.icon}</span>
                <div>
                  <div style={{ fontSize: isMobile ? '12px' : '14px', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: isMobile ? '9px' : '11px', opacity: 0.8 }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Layout with Sidebar and Content */}
      <div style={{ display: 'flex', height: 'calc(100vh - 200px)', position: 'relative' }}>
        {/* Left Sidebar Menu */}
        <div style={{
          width: '280px',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          borderRight: '1px solid rgba(0,0,0,0.1)',
          boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
          overflowY: 'auto',
          position: showSidebar ? 'fixed' : 'sticky',
          top: showSidebar ? '0' : '0',
          left: showSidebar ? '0' : 'auto',
          height: showSidebar ? '100vh' : '100%',
          zIndex: showSidebar ? 1000 : 'auto',
          transform: showSidebar ? 'translateX(0)' : isMobile ? 'translateX(-100%)' : 'translateX(0)',
          transition: 'transform 0.3s ease'
        }}
        className="md:relative md:transform-none md:translate-x-0"
        >
          <div style={{ padding: '24px 16px' }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              marginBottom: '16px',
              color: '#374151'
            }}>
              📋 メニュー
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {menuItems.map((item) => {
                const isActive = activeView === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveView(item.key)}
                    style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      textAlign: 'left',
                      border: 'none',
                      borderRadius: '8px',
                      background: isActive ? '#667eea' : 'transparent',
                      color: isActive ? 'white' : '#6b7280',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
                        e.currentTarget.style.color = '#374151';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#6b7280';
                      }
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile Overlay */}
        {isMobile && showSidebar && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 999
            }}
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* Main Content Area */}
        <div style={{ 
          flex: '1', 
          padding: isMobile ? '12px' : '24px',
          overflowY: 'auto',
          height: '100%',
          width: isMobile ? '100%' : 'auto'
        }}>
          {renderMainContent()}
        </div>

        {/* Right Sidebar - Play Log */}
        <div style={{
          width: '320px',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          borderLeft: '1px solid rgba(0,0,0,0.1)',
          boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
          overflowY: 'auto',
          position: 'sticky',
          top: 0,
          height: '100%',
          display: isMobile ? 'none' : 'block'
        }}
        className="hidden md:block"
        >
          <div style={{ padding: '24px 16px', height: '100%' }}>
            <PlayLog 
              logs={playLogs}
              currentRound={gameState.currentRound}
              currentPhase={currentPhase}
            />
          </div>
        </div>
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

      {/* Trend Result Dialog */}
      {trendResult && (
        <TrendResultDialog
          isOpen={showTrendDialog}
          onClose={() => {
            setShowTrendDialog(false);
            setTrendResult(null);
          }}
          dice={trendResult.dice || []}
          total={trendResult.total || 0}
          trendEffect={trendResult.trendEffect || { name: '', effect: '', cost: 0 }}
        />
      )}
    </div>
  );
};

export default GameBoard;