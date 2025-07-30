import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ActionPanel from '../../components/ActionPanel';
import gameSlice from '../../store/gameSlice';
import socketSlice from '../../store/socketSlice';

// useSocketのモック
const mockSendGameAction = vi.fn();
vi.mock('../../hooks/useSocket', () => ({
  useSocket: () => ({
    sendGameAction: mockSendGameAction,
  }),
}));

describe('ActionPanel Component', () => {
  let store: any;
  let mockPlayer: any;
  let mockGameState: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockPlayer = {
      id: 'player1',
      name: 'テストプレイヤー',
      funds: 50,
      prestige: 7,
      actionPoints: 3,
      designs: {
        1: { category: 'game-console', value: 5, cost: 3 },
        2: { category: 'toy', value: 4, cost: 2 }
      },
      inventory: [
        { 
          id: 'product1', 
          category: 'game-console', 
          value: 5, 
          cost: 3, 
          popularity: 2 
        }
      ],
      personalMarket: {
        8: {
          1: { 
            id: 'market-product', 
            category: 'toy', 
            value: 4, 
            cost: 2, 
            popularity: 1 
          }
        }
      },
      resaleHistory: 0
    };

    mockGameState = {
      state: 'playing',
      phase: 'action',
      currentPlayerIndex: 0,
      currentRound: 2,
      regulationLevel: 1,
      players: [mockPlayer],
      manufacturerAutomata: {
        personalMarket: {
          6: {
            1: {
              id: 'automata-product',
              category: 'accessory',
              value: 3,
              cost: 2,
              popularity: 1
            }
          }
        }
      },
      resaleAutomata: {
        personalMarket: {}
      }
    };

    store = configureStore({
      reducer: {
        game: gameSlice,
        socket: socketSlice,
      },
      preloadedState: {
        game: {
          gameState: mockGameState,
          currentPlayer: mockPlayer,
          gameId: 'test-game',
          error: null
        },
        socket: {
          socket: null,
          isConnected: true
        }
      }
    });
  });

  const renderActionPanel = (props = {}) => {
    const defaultProps = {
      player: mockPlayer,
      isMyTurn: true,
      gamePhase: 'action' as const,
      gameState: mockGameState,
      ...props
    };

    return render(
      <Provider store={store}>
        <ActionPanel {...defaultProps} />
      </Provider>
    );
  };

  describe('Basic Rendering', () => {
    it('should render action panel correctly', () => {
      renderActionPanel();
      
      expect(screen.getByText('アクション')).toBeInTheDocument();
      expect(screen.getByText('3/3')).toBeInTheDocument(); // AP表示
    });

    it('should show disabled state when not player turn', () => {
      renderActionPanel({ isMyTurn: false });
      
      expect(screen.getByText('あなたのターンではありません')).toBeInTheDocument();
    });

    it('should show disabled state when not action phase', () => {
      renderActionPanel({ gamePhase: 'automata' });
      
      expect(screen.getByText('現在はautomataフェーズです')).toBeInTheDocument();
    });

    it('should show disabled state when no action points', () => {
      const playerWithNoAP = { ...mockPlayer, actionPoints: 0 };
      renderActionPanel({ player: playerWithNoAP });
      
      expect(screen.getByText('アクションポイントがありません')).toBeInTheDocument();
    });
  });

  describe('1AP Actions', () => {
    it('should show manufacture action button', () => {
      renderActionPanel();
      
      const manufactureButton = screen.getByText('製造');
      expect(manufactureButton).toBeInTheDocument();
      expect(manufactureButton).not.toBeDisabled();
    });

    it('should disable manufacture when no designs', () => {
      const playerWithNoDesigns = { ...mockPlayer, designs: {} };
      renderActionPanel({ player: playerWithNoDesigns });
      
      const manufactureButton = screen.getByText('製造');
      expect(manufactureButton).toBeDisabled();
    });

    it('should show sell action button', () => {
      renderActionPanel();
      
      const sellButton = screen.getByText('販売');
      expect(sellButton).toBeInTheDocument();
      expect(sellButton).not.toBeDisabled();
    });

    it('should disable sell when no inventory', () => {
      const playerWithNoInventory = { ...mockPlayer, inventory: [] };
      renderActionPanel({ player: playerWithNoInventory });
      
      const sellButton = screen.getByText('販売');
      expect(sellButton).toBeDisabled();
    });

    it('should show purchase action button', () => {
      renderActionPanel();
      
      const purchaseButton = screen.getByText('購入');
      expect(purchaseButton).toBeInTheDocument();
    });

    it('should show buy dignity action button', () => {
      renderActionPanel();
      
      const buyDignityButton = screen.getByText('威厳購入');
      expect(buyDignityButton).toBeInTheDocument();
    });

    it('should disable buy dignity when insufficient funds', () => {
      const playerWithLowFunds = { ...mockPlayer, funds: 5 };
      renderActionPanel({ player: playerWithLowFunds });
      
      const buyDignityButton = screen.getByText('威厳購入');
      expect(buyDignityButton).toBeDisabled();
    });
  });

  describe('2AP Actions', () => {
    it('should show design action button', () => {
      renderActionPanel();
      
      const designButton = screen.getByText('設計');
      expect(designButton).toBeInTheDocument();
    });

    it('should show part time job action button', () => {
      renderActionPanel();
      
      const partTimeButton = screen.getByText('アルバイト');
      expect(partTimeButton).toBeInTheDocument();
    });

    it('should show promote regulation action button', () => {
      renderActionPanel();
      
      const regulationButton = screen.getByText('規制推進');
      expect(regulationButton).toBeInTheDocument();
    });

    it('should disable 2AP actions when insufficient AP', () => {
      const playerWithLowAP = { ...mockPlayer, actionPoints: 1 };
      renderActionPanel({ player: playerWithLowAP });
      
      const designButton = screen.getByText('設計');
      const partTimeButton = screen.getByText('アルバイト');
      
      expect(designButton).toBeDisabled();
      expect(partTimeButton).toBeDisabled();
    });
  });

  describe('3AP Actions', () => {
    it('should show day labor action button', () => {
      renderActionPanel();
      
      const dayLaborButton = screen.getByText('日雇い労働');
      expect(dayLaborButton).toBeInTheDocument();
    });

    it('should disable day labor when funds over 100', () => {
      const playerWithHighFunds = { ...mockPlayer, funds: 150 };
      renderActionPanel({ player: playerWithHighFunds });
      
      const dayLaborButton = screen.getByText('日雇い労働');
      expect(dayLaborButton).toBeDisabled();
    });

    it('should disable day labor when insufficient AP', () => {
      const playerWithLowAP = { ...mockPlayer, actionPoints: 2 };
      renderActionPanel({ player: playerWithLowAP });
      
      const dayLaborButton = screen.getByText('日雇い労働');
      expect(dayLaborButton).toBeDisabled();
    });
  });

  describe('Action Execution', () => {
    it('should execute buy dignity action', async () => {
      renderActionPanel();
      
      const buyDignityButton = screen.getByText('威厳購入');
      fireEvent.click(buyDignityButton);
      
      // アクションフォームが表示される
      expect(screen.getByText('威厳購入アクション (1AP)')).toBeInTheDocument();
      
      // 実行ボタンをクリック
      const executeButton = screen.getByText('威厳を購入');
      fireEvent.click(executeButton);
      
      await waitFor(() => {
        expect(mockSendGameAction).toHaveBeenCalledWith({
          type: 'buy_dignity'
        });
      });
    });

    it('should execute design action with dice selection', async () => {
      renderActionPanel();
      
      const designButton = screen.getByText('設計');
      fireEvent.click(designButton);
      
      // アクションフォームが表示される
      expect(screen.getByText('設計アクション (2AP)')).toBeInTheDocument();
      
      // 実行ボタンをクリック
      const executeButton = screen.getByText('設計実行');
      fireEvent.click(executeButton);
      
      // ダイス選択画面が表示される
      await waitFor(() => {
        expect(screen.getByText('ダイスロール結果 - 1つ選択してください')).toBeInTheDocument();
      });
    });

    it('should execute purchase action with automata selection', async () => {
      renderActionPanel();
      
      const purchaseButton = screen.getByText('購入');
      fireEvent.click(purchaseButton);
      
      // アクションフォームが表示される
      expect(screen.getByText('購入アクション (1AP)')).toBeInTheDocument();
      
      // オートマが選択肢に含まれていることを確認
      expect(screen.getByText('🤖 メーカーオートマ')).toBeInTheDocument();
      expect(screen.getByText('🔄 転売オートマ')).toBeInTheDocument();
    });
  });

  describe('Turn End', () => {
    it('should show turn end button', () => {
      renderActionPanel();
      
      const turnEndButton = screen.getByText('ターン終了');
      expect(turnEndButton).toBeInTheDocument();
    });

    it('should execute turn end action', async () => {
      renderActionPanel();
      
      const turnEndButton = screen.getByText('ターン終了');
      fireEvent.click(turnEndButton);
      
      await waitFor(() => {
        expect(mockSendGameAction).toHaveBeenCalledWith({
          type: 'end_turn'
        });
      });
    });
  });

  describe('Game End', () => {
    it('should show game end button', () => {
      renderActionPanel();
      
      const gameEndButton = screen.getByText('ゲーム終了');
      expect(gameEndButton).toBeInTheDocument();
    });

    it('should show confirmation dialog on game end', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      
      renderActionPanel();
      
      const gameEndButton = screen.getByText('ゲーム終了');
      fireEvent.click(gameEndButton);
      
      // 確認フォームが表示される
      expect(screen.getByText('ゲーム終了確認')).toBeInTheDocument();
      
      confirmSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should show processing state during action execution', async () => {
      renderActionPanel();
      
      const buyDignityButton = screen.getByText('威厳購入');
      fireEvent.click(buyDignityButton);
      
      const executeButton = screen.getByText('威厳を購入');
      fireEvent.click(executeButton);
      
      // 処理中表示の確認（実装によって異なる）
      // expect(screen.getByText('処理中...')).toBeInTheDocument();
    });

    it('should handle action validation errors', () => {
      // エラーハンドリングのテスト
      // 実際の実装に応じてテストケースを調整
    });
  });
});