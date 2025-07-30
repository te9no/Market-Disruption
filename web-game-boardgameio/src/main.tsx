import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import MarketDisruption from './game/MarketDisruption';
import { GameBoard } from './components/GameBoard';
import { Lobby } from './components/Lobby';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<{
    gameID: string;
    playerID: string;
    playerName: string;
  } | null>(null);

  const handleJoinGame = (gameID: string, playerID: string, playerName: string) => {
    // boardgame.ioは自動的にゲームを作成するため、直接ゲーム状態を設定
    setGameState({ gameID, playerID, playerName });
  };

  const handleLeaveGame = () => {
    setGameState(null);
  };

  if (!gameState) {
    return <Lobby onJoinGame={handleJoinGame} />;
  }

  // サーバーURLを環境変数から取得（本番ではRailway URL）
  const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000';
  
  // Create the client component with fallback
  const MarketDisruptionClient = Client({
    game: MarketDisruption,
    board: GameBoard,
    multiplayer: SocketIO({ server: serverUrl }),
    debug: process.env.NODE_ENV === 'development',
  });

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <div style={{ 
        padding: '10px', 
        backgroundColor: '#f5f5f5', 
        borderBottom: '1px solid #ccc',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <strong>{gameState.playerName}</strong> (プレイヤー {parseInt(gameState.playerID) + 1})
          <br />
          <small>ゲームID: {gameState.gameID}</small>
        </div>
        <button 
          onClick={handleLeaveGame}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ゲームを離れる
        </button>
      </div>
      
      <MarketDisruptionClient 
        playerID={gameState.playerID}
        matchID={gameState.gameID}
      />
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}