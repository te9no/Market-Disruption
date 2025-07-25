import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { useSocket } from '../hooks/useSocket';

const LobbyScreen: React.FC = () => {
  const [playerName, setPlayerName] = useState('');
  const [joinGameId, setJoinGameId] = useState('');
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [forceRefresh, setForceRefresh] = useState(0);
  
  const { gameState, currentPlayer, gameId } = useSelector((state: RootState) => state.game);
  const { socket, createGame, joinGame, startGame } = useSocket();
  
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
  const canStartGame = playerCount >= 2 && isHost;
  
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
      <div className="max-w-2xl mx-auto">
        <div className="bg-green-100 border border-green-400 rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold mb-4 text-green-800">ゲーム開始済み</h2>
          <p className="text-green-700 mb-4">ゲームが開始されています。画面が切り替わらない場合は、ページを更新してください。</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium"
          >
            🔄 ページを更新
          </button>
          <div className="mt-4 text-sm text-gray-600">
            ゲーム状態: {gameState.state} | プレイヤー: {currentPlayer.name}
          </div>
        </div>
      </div>
    );
  }

  // If we're in a game lobby, show waiting room
  if (gameState && currentPlayer) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">ゲームロビー</h2>
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">ゲームID: {gameId}</h3>
              <div className="text-sm text-gray-600">
                プレイヤー数: {playerCount}/4
              </div>
            </div>
            
            <div className="space-y-2">
              {gameState.players.map((player, index) => (
                <div 
                  key={player.id} 
                  className={`flex items-center justify-between p-3 rounded ${
                    player.id === currentPlayer.id ? 'bg-blue-100' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <span className="font-medium">{player.name}</span>
                    {player.role === 'host' && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                        ホスト
                      </span>
                    )}
                    {player.id === currentPlayer.id && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                        あなた
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {isHost ? (
            <div className="flex flex-col space-y-4">
              <button
                onClick={handleStartGame}
                disabled={!canStartGame}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                  canStartGame
                    ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                key={`start-button-${forceRefresh}`}
              >
                ゲーム開始 {!canStartGame && '(最低2人必要)'}
              </button>
              
              <button
                onClick={handleRefreshGameState}
                className="w-full py-2 px-4 rounded-lg font-medium bg-blue-500 hover:bg-blue-600 text-white transition-all duration-200"
              >
                🔄 参加者状況を更新
              </button>
              
              <p className="text-sm text-gray-600 text-center">
                {canStartGame
                  ? 'ゲーム開始の準備ができました！' 
                  : '他のプレイヤーの参加を待っています...'
                }
              </p>
              <div className="text-xs text-gray-400 text-center">
                現在のプレイヤー数: {playerCount} | ホスト: {isHost ? 'Yes' : 'No'}
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-gray-600">ホストがゲームを開始するのを待っています...</p>
              
              <button
                onClick={handleRefreshGameState}
                className="px-4 py-2 rounded-lg font-medium bg-blue-500 hover:bg-blue-600 text-white transition-all duration-200"
              >
                🔄 ゲーム状態を確認
              </button>
              
              <div className="text-xs text-gray-400">
                現在のプレイヤー数: {playerCount} | ホスト: {isHost ? 'Yes' : 'No'}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show create/join game screen
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === 'create'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ゲーム作成
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === 'join'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ゲーム参加
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-2">
              プレイヤー名
            </label>
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="あなたの名前を入力"
              maxLength={20}
            />
          </div>

          {/* 保存されたゲーム情報の表示と再接続ボタン */}
          {getSavedGameInfo() && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">📱 前回のゲーム</h4>
              <div className="text-xs text-yellow-700 mb-2">
                ゲームID: {getSavedGameInfo()?.gameId}<br/>
                プレイヤー名: {getSavedGameInfo()?.playerName}
              </div>
              <button
                onClick={handleReconnectToSavedGame}
                className="w-full py-2 px-3 text-sm bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition-colors"
              >
                🔄 前回のゲームに再接続
              </button>
            </div>
          )}

          {/* 進行中のゲームへの参加に関する注意事項 */}
          {activeTab === 'join' && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="text-sm font-medium text-blue-800 mb-2">ℹ️ 進行中のゲーム参加について</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <div>• 進行中のゲームにも途中参加可能です</div>
                <div>• 参加時に初期設定が自動で行われます</div>
                <div>• 定員に空きがあれば参加できます (最大4人)</div>
              </div>
            </div>
          )}

          {activeTab === 'join' && (
            <div className="mb-4">
              <label htmlFor="gameId" className="block text-sm font-medium text-gray-700 mb-2">
                ゲームID
              </label>
              <input
                type="text"
                id="gameId"
                value={joinGameId}
                onChange={(e) => setJoinGameId(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="8文字のゲームID"
                maxLength={8}
              />
            </div>
          )}

          <button
            onClick={activeTab === 'create' ? handleCreateGame : handleJoinGame}
            disabled={
              !playerName.trim() || 
              (activeTab === 'join' && !joinGameId.trim())
            }
            className={`w-full py-3 px-6 rounded-lg font-medium ${
              playerName.trim() && (activeTab === 'create' || joinGameId.trim())
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {activeTab === 'create' ? 'ゲームを作成' : 'ゲームに参加'}
          </button>
        </div>
      </div>

      <div className="mt-6 text-center text-sm text-gray-600">
        <p>マーケット・ディスラプション</p>
        <p>2-4人でプレイできます</p>
      </div>
    </div>
  );
};

export default LobbyScreen;