import React, { useState } from 'react';

interface LobbyProps {
  onJoinGame: (gameID: string, playerID: string, playerName: string, numPlayers?: number) => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onJoinGame }) => {
  const [gameID, setGameID] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerID, setPlayerID] = useState('0');

  const createSinglePlayerGame = () => {
    const newGameID = `solo-${Date.now()}`;
    onJoinGame(newGameID, '0', playerName || 'プレイヤー1', 1);
  };

  const createMultiPlayerGame = () => {
    const newGameID = `multi-${Date.now()}`;
    onJoinGame(newGameID, '0', playerName || 'プレイヤー1', 4);
  };

  const joinExistingGame = () => {
    if (gameID && playerName) {
      onJoinGame(gameID, playerID, playerName);
    }
  };

  return (
    <div style={{ 
      padding: '40px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '600px',
      margin: '0 auto',
      textAlign: 'center'
    }}>
      <h1>🎯 マーケット・ディスラプション</h1>
      <p>転売ヤーをテーマにしたボードゲーム</p>
      
      <div style={{ 
        border: '2px solid #ddd', 
        borderRadius: '10px', 
        padding: '30px',
        margin: '20px 0',
        backgroundColor: '#f9f9f9'
      }}>
        <h2>新しいゲームを作成</h2>
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="あなたの名前"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            style={{
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ccc',
              borderRadius: '5px',
              width: '250px',
              marginRight: '10px'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={createSinglePlayerGame}
            disabled={!playerName}
            style={{
              padding: '12px 25px',
              fontSize: '16px',
              backgroundColor: playerName ? '#FF9800' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: playerName ? 'pointer' : 'not-allowed'
            }}
          >
            🤖 1人プレイ<br />
            <small>(オートマ対戦)</small>
          </button>
          
          <button
            onClick={createMultiPlayerGame}
            disabled={!playerName}
            style={{
              padding: '12px 25px',
              fontSize: '16px',
              backgroundColor: playerName ? '#4CAF50' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: playerName ? 'pointer' : 'not-allowed'
            }}
          >
            👥 複数人プレイ<br />
            <small>(最大4人)</small>
          </button>
        </div>
      </div>

      <div style={{ 
        border: '2px solid #ddd', 
        borderRadius: '10px', 
        padding: '30px',
        backgroundColor: '#f0f8ff'
      }}>
        <h2>既存のゲームに参加</h2>
        <div style={{ marginBottom: '15px' }}>
          <input
            type="text"
            placeholder="ゲームID"
            value={gameID}
            onChange={(e) => setGameID(e.target.value)}
            style={{
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ccc',
              borderRadius: '5px',
              width: '250px',
              marginRight: '10px'
            }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <input
            type="text"
            placeholder="あなたの名前"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            style={{
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ccc',
              borderRadius: '5px',
              width: '250px',
              marginRight: '10px'
            }}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <select
            value={playerID}
            onChange={(e) => setPlayerID(e.target.value)}
            style={{
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ccc',
              borderRadius: '5px',
              width: '270px'
            }}
          >
            <option value="0">プレイヤー 1</option>
            <option value="1">プレイヤー 2</option>
            <option value="2">プレイヤー 3</option>
            <option value="3">プレイヤー 4</option>
          </select>
        </div>
        <button
          onClick={joinExistingGame}
          disabled={!gameID || !playerName}
          style={{
            padding: '12px 30px',
            fontSize: '18px',
            backgroundColor: (gameID && playerName) ? '#2196F3' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: (gameID && playerName) ? 'pointer' : 'not-allowed'
          }}
        >
          ゲームに参加
        </button>
      </div>

      <div style={{ 
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '5px'
      }}>
        <h3>📋 遊び方</h3>
        <ul style={{ textAlign: 'left', maxWidth: '500px', margin: '0 auto' }}>
          <li><strong>1人プレイ:</strong> オートマとの戦略的対戦</li>
          <li><strong>複数人プレイ:</strong> 2-4人のプレイヤーで対戦</li>
          <li>威厳17+資金75 または 資金150で勝利</li>
          <li>アクション→オートマ→市場の3フェーズを繰り返し</li>
          <li>製造・販売・転売・設計などのアクションを駆使</li>
          <li>ゲーム時間：30-45分</li>
        </ul>
      </div>
    </div>
  );
};