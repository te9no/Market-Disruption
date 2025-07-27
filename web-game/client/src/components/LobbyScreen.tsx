import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { useSocket } from '../hooks/useSocket';
import ModernButton from './ModernButton';

const LobbyScreen: React.FC = () => {
  const [playerName, setPlayerName] = useState('');
  const [joinGameId, setJoinGameId] = useState('');
  const [activeTab, setActiveTab] = useState<'create' | 'join' | 'browse'>('browse');
  const [forceRefresh, setForceRefresh] = useState(0);
  const [availableGames, setAvailableGames] = useState<any[]>([]);
  
  const { gameState, currentPlayer, gameId } = useSelector((state: RootState) => state.game);
  const { socket, createGame, joinGame, startGame } = useSocket();
  
  // Fetch available games
  useEffect(() => {
    if (socket && activeTab === 'browse') {
      socket.emit('list-games');
      socket.on('games-list', (games) => {
        setAvailableGames(games);
      });
      
      const interval = setInterval(() => {
        socket.emit('list-games');
      }, 5000); // Refresh every 5 seconds
      
      return () => {
        clearInterval(interval);
        socket.off('games-list');
      };
    }
  }, [socket, activeTab]);
  
  // Force component refresh when game state changes
  useEffect(() => {
    setForceRefresh(prev => prev + 1);
  }, [gameState?.players?.length]);

  // Check if game has started but we're still in lobby
  useEffect(() => {
    if (gameState?.state === 'playing' && currentPlayer) {
      console.log('🎮 Game has started! State:', gameState.state);
      // Force a refresh to trigger GameContainer to show GameBoard
      setForceRefresh(prev => prev + 1);
    }
  }, [gameState?.state, currentPlayer]);

  const playerCount = gameState?.players?.length || 0;
  const isHost = currentPlayer?.role === 'host';
  const canStartGame = playerCount >= 1 && isHost;
  
  console.log('LobbyScreen render:', { 
    gameState, 
    currentPlayer, 
    gameId,
    playerCount,
    canStart: canStartGame,
    isHost,
    playerNames: gameState?.players?.map(p => p.name) || [],
    gameStateNull: gameState === null,
    currentPlayerNull: currentPlayer === null,
    playersArray: gameState?.players || 'no players array',
    forceRefresh
  });

  const handleCreateGame = () => {
    if (playerName.trim()) {
      createGame(playerName.trim());
    }
  };

  const handleJoinGame = () => {
    console.log('🔘 Join game button clicked:', { 
      playerName: playerName.trim(), 
      joinGameId: joinGameId.trim(),
      hasPlayerName: !!playerName.trim(),
      hasGameId: !!joinGameId.trim(),
      currentGameState: gameState,
      currentPlayer: currentPlayer
    });
    
    if (playerName.trim() && joinGameId.trim()) {
      console.log('✅ Calling joinGame function...');
      joinGame(joinGameId.trim(), playerName.trim());
    } else {
      console.log('❌ Missing playerName or gameId');
    }
  };

  const handleStartGame = () => {
    console.log('🎯 Start game button clicked:', {
      canStart: canStartGame,
      playerCount,
      isHost
    });
    if (canStartGame) {
      startGame();
    } else {
      console.log('❌ Cannot start game:', { playerCount, isHost, canStartGame });
    }
  };

  const handleRefreshGameState = () => {
    console.log('🔄 Refresh game state button clicked');
    // Force refresh by requesting game state from server
    if (socket) {
      socket.emit('request-game-state', { gameId });
    }
    setForceRefresh(prev => prev + 1);
  };

  const handleReconnectToSavedGame = () => {
    const savedGame = localStorage.getItem('market-disruption-game');
    if (savedGame) {
      try {
        const gameInfo = JSON.parse(savedGame);
        console.log('🔄 Manual reconnection to saved game:', gameInfo.gameId);
        setJoinGameId(gameInfo.gameId);
        setPlayerName(gameInfo.playerName);
        joinGame(gameInfo.gameId, gameInfo.playerName);
      } catch (e) {
        console.error('❌ Error parsing saved game:', e);
        localStorage.removeItem('market-disruption-game');
        alert('保存されたゲーム情報が破損しています。');
      }
    } else {
      alert('保存されたゲーム情報がありません。');
    }
  };

  const getSavedGameInfo = () => {
    const savedGame = localStorage.getItem('market-disruption-game');
    if (savedGame) {
      try {
        return JSON.parse(savedGame);
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  // If game has started, don't show lobby
  if (gameState?.state === 'playing' && currentPlayer) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          maxWidth: '500px',
          width: '100%',
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎮</div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            marginBottom: '16px',
            color: '#10b981'
          }}>
            ゲーム開始済み
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            marginBottom: '24px',
            lineHeight: '1.6'
          }}>
            ゲームが開始されています。<br/>
            画面が切り替わらない場合は、ページを更新してください。
          </p>
          <ModernButton
            onClick={() => window.location.reload()}
            variant="success"
            size="lg"
            fullWidth
          >
            🔄 ページを更新
          </ModernButton>
          <div style={{
            marginTop: '20px',
            fontSize: '14px',
            color: '#9ca3af',
            padding: '12px',
            background: 'rgba(0,0,0,0.05)',
            borderRadius: '8px'
          }}>
            ゲーム状態: {gameState.state} | プレイヤー: {currentPlayer.name}
          </div>
        </div>
      </div>
    );
  }

  // If we're in a game lobby, show waiting room
  if (gameState && currentPlayer) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: 'white',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
              marginBottom: '16px'
            }}>
              🎮 Market Disruption
            </h1>
            <p style={{
              fontSize: '18px',
              color: 'rgba(255,255,255,0.9)',
              textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
            }}>
              ゲーム待機室
            </p>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <div className="mb-8">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div>
                  <h3 style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    🎯 ゲームID: {gameId}
                  </h3>
                  <div style={{
                    fontSize: '16px',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    flexWrap: 'wrap'
                  }}>
                    <span>👥 {playerCount}/4人参加中</span>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: playerCount >= 1 ? '#dcfce7' : '#fef3c7',
                      color: playerCount >= 1 ? '#166534' : '#92400e'
                    }}>
                      {canStartGame ? '✅ 開始可能' : '⏳ 待機中'}
                    </span>
                  </div>
                </div>
              </div>
            
            <div style={{ display: 'grid', gap: '12px' }}>
              <h4 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                👥 参加プレイヤー
              </h4>
              {gameState.players.map((player, index) => (
                <div 
                  key={player.id} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderRadius: '12px',
                    background: player.id === currentPlayer.id 
                      ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
                      : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    border: player.id === currentPlayer.id 
                      ? '2px solid #3b82f6' 
                      : '2px solid #e2e8f0',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: player.id === currentPlayer.id 
                        ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                        : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '16px'
                    }}>
                      {index + 1}
                    </div>
                    <div>
                      <span style={{ 
                        fontWeight: '600', 
                        fontSize: '16px',
                        color: '#374151'
                      }}>
                        {player.name}
                      </span>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        {player.role === 'host' && (
                          <span style={{
                            background: '#fef3c7',
                            color: '#92400e',
                            fontSize: '12px',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontWeight: '600'
                          }}>
                            👑 ホスト
                          </span>
                        )}
                        {player.role === 'ai' && (
                          <span style={{
                            background: '#dbeafe',
                            color: '#1e40af',
                            fontSize: '12px',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontWeight: '600'
                          }}>
                            🤖 AI
                          </span>
                        )}
                        {player.id === currentPlayer.id && (
                          <span style={{
                            background: '#dcfce7',
                            color: '#166534',
                            fontSize: '12px',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontWeight: '600'
                          }}>
                            ✨ あなた
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </div>

          {isHost ? (
            <div style={{
              marginTop: '32px',
              padding: '24px',
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              borderRadius: '16px',
              border: '2px solid #cbd5e1'
            }}>
              <h4 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                👑 ホストコントロール
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <ModernButton
                  onClick={handleStartGame}
                  disabled={!canStartGame}
                  variant={canStartGame ? "success" : "secondary"}
                  size="lg"
                  fullWidth
                  key={`start-button-${forceRefresh}`}
                >
                  {canStartGame ? '🚀 ゲーム開始' : '⏳ ゲーム開始 (1人以上必要)'}
                </ModernButton>
                
                <ModernButton
                  onClick={handleRefreshGameState}
                  variant="primary"
                  size="md"
                  fullWidth
                >
                  🔄 参加者状況を更新
                </ModernButton>
                
                <div style={{
                  textAlign: 'center',
                  padding: '16px',
                  background: canStartGame ? '#dcfce7' : '#fef3c7',
                  color: canStartGame ? '#166534' : '#92400e',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {canStartGame
                    ? '✅ ゲーム開始の準備ができました！' 
                    : '⏳ 他のプレイヤーの参加を待っています...'
                  }
                </div>
                
                <div style={{
                  fontSize: '12px',
                  color: '#9ca3af',
                  textAlign: 'center',
                  padding: '8px',
                  background: 'rgba(0,0,0,0.05)',
                  borderRadius: '8px'
                }}>
                  現在のプレイヤー数: {playerCount}/4 | ホスト権限: 有効
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              marginTop: '32px',
              textAlign: 'center',
              padding: '24px',
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
              borderRadius: '16px',
              border: '2px solid #93c5fd'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
              <h4 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1e40af',
                marginBottom: '16px'
              }}>
                ホストの判断を待っています
              </h4>
              <p style={{
                color: '#3730a3',
                marginBottom: '20px',
                fontSize: '14px'
              }}>
                ホストがゲームを開始するまでお待ちください
              </p>
              
              <ModernButton
                onClick={handleRefreshGameState}
                variant="primary"
                size="md"
                fullWidth
              >
                🔄 ゲーム状態を確認
              </ModernButton>
              
              <div style={{
                fontSize: '12px',
                color: '#6b7280',
                marginTop: '16px',
                padding: '8px',
                background: 'rgba(0,0,0,0.05)',
                borderRadius: '8px'
              }}>
                現在のプレイヤー数: {playerCount}/4 | ホスト権限: なし
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    );
  }

  // Show modern lobby screen
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: 'white',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            marginBottom: '16px'
          }}>
            🎮 Market Disruption
          </h1>
          <p style={{
            fontSize: '18px',
            color: 'rgba(255,255,255,0.9)',
            textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
          }}>
            転売ヤーをテーマにしたストラテジーボードゲーム
          </p>
        </div>

        {/* Modern Tab Navigation */}
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '20px',
          padding: '8px',
          marginBottom: '24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="flex space-x-2">
            {[
              { key: 'browse', icon: '🔍', label: 'ゲーム一覧' },
              { key: 'create', icon: '➕', label: 'ゲーム作成' },
              { key: 'join', icon: '🎯', label: 'ID参加' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  flex: 1,
                  padding: '16px',
                  borderRadius: '16px',
                  border: 'none',
                  background: activeTab === tab.key 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'transparent',
                  color: activeTab === tab.key ? 'white' : '#666',
                  fontWeight: '600',
                  fontSize: '16px',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '20px' }}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          {/* Player Name Input - Always visible */}
          <div className="mb-6">
            <label style={{
              display: 'block',
              fontSize: '16px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              👤 プレイヤー名
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              style={{
                width: '100%',
                padding: '16px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '16px',
                background: 'white',
                transition: 'all 0.3s ease'
              }}
              placeholder="あなたの名前を入力してください"
              maxLength={20}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Browse Games Tab */}
          {activeTab === 'browse' && (
            <div>
              <h3 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#374151',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                🔍 進行中のゲーム一覧
              </h3>
              
              {availableGames.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                  borderRadius: '16px',
                  border: '2px dashed #9ca3af'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎲</div>
                  <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '8px' }}>
                    現在進行中のゲームはありません
                  </p>
                  <p style={{ fontSize: '14px', color: '#9ca3af' }}>
                    新しいゲームを作成するか、しばらく待ってから再確認してください
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {availableGames.map((game) => (
                    <div
                      key={game.id}
                      style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                        border: '2px solid #e5e7eb',
                        borderRadius: '16px',
                        padding: '20px',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#667eea';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '8px'
                          }}>
                            <span style={{ fontSize: '20px' }}>
                              {game.state === 'waiting' ? '⏳' : '🎮'}
                            </span>
                            <span style={{
                              fontSize: '18px',
                              fontWeight: 'bold',
                              color: '#374151'
                            }}>
                              ゲーム {game.id}
                            </span>
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: '600',
                              background: game.state === 'waiting' ? '#fef3c7' : '#dbeafe',
                              color: game.state === 'waiting' ? '#92400e' : '#1e40af'
                            }}>
                              {game.state === 'waiting' ? '待機中' : '進行中'}
                            </span>
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            fontSize: '14px',
                            color: '#6b7280'
                          }}>
                            <span>👥 {game.playerCount}/4人</span>
                            <span>🎯 ラウンド {game.currentRound || 1}</span>
                            <span>⏰ {game.createdAt ? new Date(game.createdAt).toLocaleTimeString() : ''}</span>
                          </div>
                        </div>
                        <ModernButton
                          onClick={() => {
                            if (playerName.trim()) {
                              setJoinGameId(game.id);
                              joinGame(game.id, playerName.trim());
                            } else {
                              alert('プレイヤー名を入力してください');
                            }
                          }}
                          variant="primary"
                          size="md"
                          disabled={!playerName.trim() || game.playerCount >= 4}
                        >
                          {game.playerCount >= 4 ? '満員' : '参加'}
                        </ModernButton>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Create Game Tab */}
          {activeTab === 'create' && (
            <div>
              <h3 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#374151',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                ➕ 新しいゲームを作成
              </h3>
              
              <div style={{
                background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                border: '2px solid #10b981',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '24px'
              }}>
                <h4 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#065f46',
                  marginBottom: '12px'
                }}>
                  🎯 ゲームについて
                </h4>
                <ul style={{
                  color: '#047857',
                  fontSize: '14px',
                  lineHeight: '1.6'
                }}>
                  <li>• プレイ人数: 2-4人</li>
                  <li>• プレイ時間: 30-45分</li>
                  <li>• ゲーム中の途中参加も可能です</li>
                  <li>• あなたがホストとしてゲームを管理します</li>
                </ul>
              </div>
              
              <ModernButton
                onClick={handleCreateGame}
                disabled={!playerName.trim()}
                variant="primary"
                size="lg"
                fullWidth
              >
                🎮 ゲームを作成してホストになる
              </ModernButton>
            </div>
          )}

          {/* Join by ID Tab */}
          {activeTab === 'join' && (
            <div>
              <h3 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#374151',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                🎯 ゲームIDで参加
              </h3>
              
              <div style={{
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                border: '2px solid #3b82f6',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '24px'
              }}>
                <p style={{
                  color: '#1e40af',
                  fontSize: '14px',
                  lineHeight: '1.6'
                }}>
                  ℹ️ 友達から教えてもらった8文字のゲームIDを入力してゲームに参加できます。
                  進行中のゲームにも途中参加可能です。
                </p>
              </div>
              
              <div className="mb-6">
                <label style={{
                  display: 'block',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  🎯 ゲームID
                </label>
                <input
                  type="text"
                  value={joinGameId}
                  onChange={(e) => setJoinGameId(e.target.value.toUpperCase())}
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '18px',
                    fontFamily: 'monospace',
                    letterSpacing: '2px',
                    textAlign: 'center',
                    background: 'white',
                    transition: 'all 0.3s ease'
                  }}
                  placeholder="ABCD1234"
                  maxLength={8}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
              
              <ModernButton
                onClick={handleJoinGame}
                disabled={!playerName.trim() || !joinGameId.trim()}
                variant="primary"
                size="lg"
                fullWidth
              >
                🚀 ゲームに参加
              </ModernButton>
            </div>
          )}

          {/* Saved Game Section */}
          {getSavedGameInfo() && (
            <div style={{
              marginTop: '32px',
              padding: '20px',
              background: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)',
              border: '2px solid #f59e0b',
              borderRadius: '16px'
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#92400e',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📱 前回のゲーム
              </h4>
              <div style={{
                fontSize: '14px',
                color: '#a16207',
                marginBottom: '16px'
              }}>
                ゲームID: {getSavedGameInfo()?.gameId}<br/>
                プレイヤー名: {getSavedGameInfo()?.playerName}
              </div>
              <div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <ModernButton
                    onClick={handleReconnectToSavedGame}
                    variant="secondary"
                    size="sm"
                    fullWidth
                  >
                    🔄 再接続
                  </ModernButton>
                  <ModernButton
                    onClick={() => {
                      if (confirm('保存されたゲーム情報を削除しますか？')) {
                        localStorage.removeItem('market-disruption-game');
                        setForceRefresh(prev => prev + 1);
                      }
                    }}
                    variant="ghost"
                    size="sm"
                    fullWidth
                  >
                    🗑️ 削除
                  </ModernButton>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LobbyScreen;