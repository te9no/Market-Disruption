import { Client } from 'boardgame.io/react';
import { Game } from 'boardgame.io';

// 最小限のテストゲーム
const SimpleTestGame: Game = {
  name: 'SimpleTest',
  
  setup: () => ({
    players: {
      '0': { name: 'Player 1', money: 30, actionPoints: 3 }
    }
  }),
  
  moves: {
    testMove: ({ G }) => {
      G.players['0'].money += 5;
      G.players['0'].actionPoints -= 1;
      console.log('Test move executed!', G);
    }
  },
  
  minPlayers: 1,
  maxPlayers: 1,
};

const SimpleBoard = ({ G, moves }: any) => {
  const player = G.players['0'];
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>簡単なテストゲーム</h1>
      <div>資金: {player.money}</div>
      <div>AP: {player.actionPoints}</div>
      <button 
        onClick={() => moves.testMove()}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#4CAF50', 
          color: 'white', 
          border: 'none',
          cursor: 'pointer'
        }}
      >
        テストアクション (+5資金, -1AP)
      </button>
    </div>
  );
};

export const SimpleTestClient = Client({
  game: SimpleTestGame,
  board: SimpleBoard,
  debug: true,
});