import React, { useState } from 'react';

interface LobbyProps {
  onJoinGame: (gameID: string, playerID: string, playerName: string, numPlayers?: number) => void;
  onStartAIDemo?: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onJoinGame, onStartAIDemo }) => {
  const [gameID, setGameID] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerID, setPlayerID] = useState('0');
  const [selectedPlayerCount, setSelectedPlayerCount] = useState(2);

  const createSinglePlayerGame = () => {
    const newGameID = `solo-${Date.now()}`;
    onJoinGame(newGameID, '0', playerName || 'プレイヤー1', 1);
  };

  const createMultiPlayerGame = () => {
    const newGameID = `multi-${Date.now()}`;
    onJoinGame(newGameID, '0', playerName || 'プレイヤー1', selectedPlayerCount);
  };

  const createAIOnlyGame = () => {
    const newGameID = `ai-demo-${Date.now()}`;
    onJoinGame(newGameID, '0', 'Observer', 4);
  };

  const startAIDemo = () => {
    if (onStartAIDemo) {
      onStartAIDemo();
    }
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
        
        {/* プレイヤー数選択 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
            プレイヤー数選択:
          </label>
          <select
            value={selectedPlayerCount}
            onChange={(e) => setSelectedPlayerCount(Number(e.target.value))}
            style={{
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ccc',
              borderRadius: '5px',
              width: '270px',
              backgroundColor: 'white'
            }}
          >
            <option value={2}>2人プレイ</option>
            <option value={3}>3人プレイ</option>
            <option value={4}>4人プレイ</option>
          </select>
          <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
            💡 事前に人数を決めてからゲームを作成します
          </div>
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
            <small>({selectedPlayerCount}人)</small>
          </button>
        </div>
      </div>

      {/* AI専用ゲームモード */}
      <div style={{ 
        border: '2px solid #9C27B0', 
        borderRadius: '10px', 
        padding: '30px',
        margin: '20px 0',
        backgroundColor: '#f3e5f5'
      }}>
        <h2>🤖 AI専用ゲーム</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          AIだけがプレイするゲームを観戦して、API動作を確認できます
        </p>
        
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={createAIOnlyGame}
            style={{
              padding: '12px 25px',
              fontSize: '16px',
              backgroundColor: '#9C27B0',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🤖 AI観戦ゲーム<br />
            <small>(4人全員AI)</small>
          </button>
          
          <button
            onClick={startAIDemo}
            style={{
              padding: '12px 25px',
              fontSize: '16px',
              backgroundColor: '#FF5722',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🚀 APIデモ<br />
            <small>(コンソールログ)</small>
          </button>
        </div>
        
        <div style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: '#fff',
          borderRadius: '5px',
          fontSize: '14px',
          color: '#666'
        }}>
          <strong>🔍 API機能テスト:</strong>
          <ul style={{ textAlign: 'left', margin: '10px 0 0 20px' }}>
            <li>リアルタイムAI分析表示</li>
            <li>自動ムーブ生成と実行</li>
            <li>戦略的判断プロセス確認</li>
            <li>全アクション対応テスト</li>
          </ul>
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