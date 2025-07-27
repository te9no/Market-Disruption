import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import LobbyScreen from './LobbyScreen';
import GameBoard from './GameBoard';

const GameContainer: React.FC = () => {
  const { gameState, currentPlayer } = useSelector((state: RootState) => state.game);
  const { isConnected } = useSelector((state: RootState) => state.socket);
  
  console.log('GameContainer render:', { 
    isConnected, 
    gameState: gameState?.state,
    currentPlayer: currentPlayer?.name,
    hasGameState: !!gameState,
    gameStateKeys: gameState ? Object.keys(gameState) : [],
    playersCount: gameState?.players?.length || 0,
    currentRound: gameState?.currentRound || 0,
    currentPhase: gameState?.currentPhase || 'none'
  });
  
  const renderContent = () => {
    if (!isConnected) {
      console.log('❌ Not connected - showing connection screen');
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">サーバーに接続中...</p>
          </div>
        </div>
      );
    }

    // Show lobby if no game state or still waiting
    if (!gameState || gameState.state === 'waiting') {
      console.log('🏢 Showing lobby - gameState:', gameState?.state || 'null');
      return <LobbyScreen />;
    }

    // Show game board if game is playing or finished
    if (gameState.state === 'playing' || gameState.state === 'finished') {
      console.log('🎮 Rendering GameBoard with state:', gameState.state);
      return <GameBoard />;
    }

    // Fallback
    console.log('❓ GameContainer fallback - unknown game state:', gameState.state);
    return <LobbyScreen />;
  };

  return (
    <div className="container mx-auto p-4">
      {renderContent()}
    </div>
  );
};

export default GameContainer;