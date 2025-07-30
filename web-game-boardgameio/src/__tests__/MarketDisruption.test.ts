import MarketDisruption from '../game/MarketDisruption';
import { GameState } from '../game/GameState';

describe('MarketDisruption Game', () => {
  test('game setup creates proper initial state', () => {
    const ctx = {
      numPlayers: 2,
      playOrder: ['0', '1'],
      playOrderPos: 0,
      activePlayers: null,
      currentPlayer: '0',
      turn: 1,
      phase: 'action',
      gameover: null
    };
    
    const G = MarketDisruption.setup!({ ctx } as any);
    
    expect(G.players).toBeDefined();
    expect(Object.keys(G.players)).toHaveLength(2);
    expect(G.players['0'].money).toBe(30);
    expect(G.players['0'].prestige).toBe(5);
    expect(G.players['0'].actionPoints).toBe(3);
    expect(G.players['0'].designs).toHaveLength(2);
  });

  test('manufacture action works correctly', () => {
    const G: GameState = {
      players: {
        '0': {
          id: '0',
          name: 'Player 1',
          money: 30,
          prestige: 5,
          resaleHistory: 0,
          actionPoints: 3,
          designs: [{
            id: 'design-1',
            cost: 2,
            isOpenSource: false
          }],
          personalMarket: []
        }
      },
      currentPlayer: '0',
      phase: 'action',
      round: 1,
      marketPollution: 0,
      regulationLevel: 0,
      automata: {
        manufacturerMoney: Infinity,
        resaleOrganizationMoney: 20,
        market: []
      },
      trendEffects: [],
      gameEnded: false,
      winner: null
    };

    const ctx = {
      currentPlayer: '0',
      numPlayers: 1,
      playOrder: ['0'],
      playOrderPos: 0,
      activePlayers: null,
      turn: 1,
      phase: 'action',
      gameover: null
    };

    // Test valid manufacture
    const manufacture = MarketDisruption.moves!.manufacture as any;
    const result = manufacture({ G, ctx }, 'design-1');
    
    expect(result).not.toBe('INVALID_MOVE');
    expect(G.players['0'].money).toBe(28); // 30 - 2 (cost)
    expect(G.players['0'].actionPoints).toBe(2); // 3 - 1
    expect(G.players['0'].personalMarket).toHaveLength(1);
  });

  test('invalid manufacture with insufficient funds returns INVALID_MOVE', () => {
    const G: GameState = {
      players: {
        '0': {
          id: '0',
          name: 'Player 1',
          money: 1, // Insufficient money
          prestige: 5,
          resaleHistory: 0,
          actionPoints: 3,
          designs: [{
            id: 'design-1',
            cost: 5, // Cost more than available money
            isOpenSource: false
          }],
          personalMarket: []
        }
      },
      currentPlayer: '0',
      phase: 'action',
      round: 1,
      marketPollution: 0,
      regulationLevel: 0,
      automata: {
        manufacturerMoney: Infinity,
        resaleOrganizationMoney: 20,
        market: []
      },
      trendEffects: [],
      gameEnded: false,
      winner: null
    };

    const ctx = {
      currentPlayer: '0',
      numPlayers: 1,
      playOrder: ['0'],
      playOrderPos: 0,
      activePlayers: null,
      turn: 1,
      phase: 'action',
      gameover: null
    };

    const manufacture = MarketDisruption.moves!.manufacture as any;
    const result = manufacture({ G, ctx }, 'design-1');
    
    expect(result).toBe('INVALID_MOVE');
  });
});