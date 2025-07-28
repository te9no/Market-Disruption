import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import GameStatus from './GameStatus';
import ActionPanel from './ActionPanel';
import AutomataLog from './AutomataLog';
import PlayerMarketView from './PlayerMarketView';
import AutomataMarketView from './AutomataMarketView';
import PlayLog from './PlayLog';
import TrendResultDialog from './TrendResultDialog';
import VictoryDialog from './VictoryDialog';
import PersonalMarket from './PersonalMarket';
import Inventory from './Inventory';
import DesignBoard from './DesignBoard';
import { useSocket } from '../hooks/useSocket';

const GameBoard: React.FC = () => {
  const { gameState, gameId } = useSelector((state: RootState) => state.game);
  const { isConnected } = useSelector((state: RootState) => state.socket);
  const { socket, socketId } = useSocket();
  const [refreshing, setRefreshing] = useState(false);
  const [activeView, setActiveView] = useState<string>('game');
  const [trendResult, setTrendResult] = useState<any>(null);
  const [showTrendDialog, setShowTrendDialog] = useState(false);
  const [showVictoryDialog, setShowVictoryDialog] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [bottomView, setBottomView] = useState<'design' | 'log'>('design');
  
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

  // Listen for game update events to catch trend research results and victory conditions
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

  // Check for victory conditions when game state changes
  useEffect(() => {
    if (gameState?.state === 'finished' && gameState.winner) {
      console.log('🏆 Game finished, showing victory dialog:', gameState.winner);
      setShowVictoryDialog(true);
    }
  }, [gameState?.state, gameState?.winner]);

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
  
  // プレイログのデバッグ出力
  useEffect(() => {
    if (playLogs.length > 0) {
      const dignityLogs = playLogs.filter(log => 
        log.type === 'buy_dignity' || 
        log.type === 'prestige_purchase' ||
        log.type === 'purchase_prestige' ||
        log.type?.includes('dignity') ||
        log.type?.includes('prestige') ||
        log.message?.includes('威厳')
      );
      
      if (dignityLogs.length > 0) {
        console.log('👑 威厳関連ログ found in GameBoard:', dignityLogs);
      }
      
      console.log('📋 GameBoard playLogs total:', playLogs.length);
      console.log('📋 Latest 5 logs:', playLogs.slice(-5));
    }
  }, [playLogs]);

  const renderMainContent = () => {
    if (activeView === 'game') {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
          {/* Main Game Area - Personal Market only */}
          <div className="lg:col-span-3">
            <PersonalMarket 
              personalMarket={currentPlayer.personalMarket} 
              playerId={currentPlayer.id}
            />
          </div>
          {/* Right Panel - Action + Inventory */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <ActionPanel 
              player={currentPlayer}
              isMyTurn={isCurrentPlayerTurn}
              gamePhase={currentPhase}
              gameState={gameState}
            />
            <Inventory inventory={currentPlayer.inventory} />
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
              <div>
                <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>🎮 Market Disruption</h1>
                <div style={{ 
                  fontSize: '14px', 
                  color: 'rgba(255,255,255,0.9)',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                  marginTop: '4px'
                }}>
                  転売ヤーをテーマにしたストラテジーボードゲーム
                </div>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.25)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                padding: '12px 18px',
                border: '1px solid rgba(255,255,255,0.4)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: '600',
                  color: 'white',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                }}>
                  ラウンド {gameState.currentRound} | {currentPhase === 'action' ? '🎯 アクション' : currentPhase === 'automata' ? '🤖 オートマ' : '🏪 市場'}フェーズ
                </div>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.25)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                padding: '8px 16px',
                border: '1px solid rgba(255,255,255,0.4)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: isConnected ? '#10b981' : '#ef4444',
                      boxShadow: isConnected ? '0 0 6px rgba(16, 185, 129, 0.6)' : '0 0 6px rgba(239, 68, 68, 0.6)'
                    }}
                  />
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: '600',
                    color: 'white',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                  }}>
                    {isConnected ? '接続済み' : '切断'}
                  </span>
                </div>
                {gameId && (
                  <>
                    <div style={{ 
                      width: '1px', 
                      height: '16px', 
                      background: 'rgba(255,255,255,0.3)' 
                    }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ 
                        fontSize: '12px', 
                        color: 'rgba(255,255,255,0.8)',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                      }}>
                        ID:
                      </span>
                      <code style={{
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        background: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                      }}>
                        {gameId}
                      </code>
                    </div>
                  </>
                )}
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
              { icon: '👥', value: `${gameState.players.length}人`, label: 'プレイヤー', priority: 3 },
              { icon: '💰', value: `¥${currentPlayer.funds.toLocaleString()}`, label: '資金', priority: 1 },
              { icon: '👑', value: currentPlayer.prestige, label: '威厳', priority: 2 },
              { icon: '🔄', value: currentPlayer.resaleHistory, label: '転売回数', priority: 3 }
            ].filter(stat => !isMobile || stat.priority <= 2).map((stat, index) => (
              <div key={index} style={{
                background: 'rgba(255,255,255,0.25)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: isMobile ? '8px 12px' : '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '6px' : '10px',
                border: '1px solid rgba(255,255,255,0.3)',
                minWidth: isMobile ? '80px' : '120px',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <span style={{ fontSize: isMobile ? '16px' : '20px' }}>{stat.icon}</span>
                <div>
                  <div style={{ 
                    fontSize: isMobile ? '12px' : '14px', 
                    fontWeight: 'bold', 
                    color: 'white',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                  }}>{stat.value}</div>
                  <div style={{ 
                    fontSize: isMobile ? '9px' : '11px', 
                    color: 'rgba(255,255,255,0.9)',
                    fontWeight: '500'
                  }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Layout with Top Area and Bottom Play Log */}
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)', position: 'relative' }}>
        {/* Upper Section: Sidebar + Main Content */}
        <div style={{ display: 'flex', flex: '1', minHeight: '0' }}>
          {/* Left Sidebar Menu - Hidden on mobile unless toggled */}
          <div style={{
            width: isMobile ? (showSidebar ? '280px' : '0') : '280px',
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            borderRight: '1px solid rgba(0,0,0,0.1)',
            boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
            overflowY: 'auto',
            overflowX: 'hidden',
            position: isMobile ? 'fixed' : 'relative',
            top: isMobile ? '0' : 'auto',
            left: isMobile ? (showSidebar ? '0' : '-280px') : 'auto',
            height: isMobile ? '100vh' : '100%',
            zIndex: isMobile ? 1000 : 'auto',
            transition: 'all 0.3s ease'
          }}
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

          {/* Main Content Area - Now takes full width */}
          <div style={{ 
            flex: '1',
            width: isMobile ? '100%' : 'auto',
            minWidth: isMobile ? '100%' : 'auto',
            padding: isMobile ? '12px' : '24px',
            overflowY: 'auto',
            height: '100%'
          }}>
            {renderMainContent()}
          </div>
        </div>

        {/* Bottom Section: Design Board + Play Log */}
        <div style={{
          height: isMobile ? '240px' : '280px',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(0,0,0,0.1)',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Mobile Tab Bar */}
          {isMobile && (
            <div style={{
              display: 'flex',
              borderBottom: '1px solid rgba(0,0,0,0.1)',
              background: 'rgba(255,255,255,0.95)'
            }}>
              <button
                onClick={() => setBottomView('design')}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: bottomView === 'design' ? '#667eea' : 'transparent',
                  color: bottomView === 'design' ? 'white' : '#6b7280',
                  border: 'none',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                📋 設計図
              </button>
              <button
                onClick={() => setBottomView('log')}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: bottomView === 'log' ? '#667eea' : 'transparent',
                  color: bottomView === 'log' ? 'white' : '#6b7280',
                  border: 'none',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                📜 ログ
              </button>
            </div>
          )}
          
          {/* Content Area */}
          <div style={{ 
            flex: 1,
            display: 'flex',
            gap: isMobile ? '0' : '16px',
            overflow: 'hidden'
          }}>
            {/* Design Board */}
            <div style={{ 
              width: isMobile ? '100%' : '400px',
              padding: isMobile ? '12px' : '16px',
              overflowY: 'auto',
              display: isMobile ? (bottomView === 'design' ? 'block' : 'none') : 'block'
            }}>
              <DesignBoard 
                designs={currentPlayer.designs} 
                openSourceDesigns={currentPlayer.openSourceDesigns}
              />
            </div>
            
            {/* Play Log */}
            <div style={{ 
              flex: isMobile ? 'none' : '1',
              width: isMobile ? '100%' : 'auto',
              padding: isMobile ? '12px' : '16px',
              height: '100%',
              minWidth: '0',
              display: isMobile ? (bottomView === 'log' ? 'block' : 'none') : 'block'
            }}>
              <PlayLog 
                logs={playLogs}
                currentRound={gameState.currentRound}
                currentPhase={currentPhase}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Victory Dialog */}
      {showVictoryDialog && gameState.winner && (
        <VictoryDialog
          winner={gameState.winner}
          players={gameState.players}
          onClose={() => setShowVictoryDialog(false)}
        />
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