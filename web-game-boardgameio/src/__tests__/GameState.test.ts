import { createInitialPlayer, initialGameState } from '../game/GameState';

describe('GameState', () => {
  test('createInitialPlayer creates a player with correct initial values', () => {
    const player = createInitialPlayer('0', 'Test Player');
    
    expect(player.id).toBe('0');
    expect(player.name).toBe('Test Player');
    expect(player.money).toBe(30);
    expect(player.prestige).toBe(5);
    expect(player.resaleHistory).toBe(0);
    expect(player.actionPoints).toBe(3);
    expect(player.designs).toEqual([]);
    expect(player.personalMarket).toEqual([]);
  });

  test('initialGameState has correct structure', () => {
    expect(initialGameState.players).toEqual({});
    expect(initialGameState.currentPlayer).toBeNull();
    expect(initialGameState.phase).toBe('setup');
    expect(initialGameState.round).toBe(1);
    expect(initialGameState.marketPollution).toBe(0);
    expect(initialGameState.regulationLevel).toBe(0);
    expect(initialGameState.gameEnded).toBe(false);
    expect(initialGameState.winner).toBeNull();
    expect(initialGameState.automata.resaleOrganizationMoney).toBe(20);
    expect(initialGameState.automata.market).toEqual([]);
  });
});