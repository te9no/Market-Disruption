export interface Product {
  id: string;
  cost: number;
  price: number;
  popularity: number;
  playerId: string;
  isResale: boolean;
  originalCost?: number;
  originalPlayerId?: string;
}

export interface Design {
  id: string;
  cost: number;
  isOpenSource: boolean;
}

export interface Player {
  id: string;
  name: string;
  money: number;
  prestige: number;
  resaleHistory: number;
  actionPoints: number;
  designs: Design[];
  personalMarket: Product[];
}

export interface AutomataState {
  manufacturerMoney: number;
  resaleOrganizationMoney: number;
  market: Product[];
}

export interface GameState {
  players: { [key: string]: Player };
  currentPlayer: string | null;
  phase: 'lobby' | 'setup' | 'action' | 'automata' | 'market' | 'victory';
  round: number;
  marketPollution: number;
  regulationLevel: number;
  regulationStage: 'none' | 'public_comment' | 'consideration' | 'enforcement';
  regulationStageRounds: number; // 規制段階が続いているラウンド数
  automata: AutomataState;
  trendEffects: TrendEffect[];
  shortVideoBonus: boolean; // ショート動画ブーム効果フラグ
  availableTrends?: { [playerId: string]: AvailableTrend };
  prestigePurchasePerRound?: { [key: string]: boolean };
  pendingManufacturingOrders?: ManufacturingOrder[];
  playLog: PlayLogEntry[];
  gameEnded: boolean;
  winner: string | null;
  gameStarted: boolean;
}

export interface TrendEffect {
  id: string;
  name: string;
  description: string;
  cost: number;
  activated: boolean;
  permanent: boolean;
}

export interface AvailableTrend {
  sum: number;
  effect: {
    name: string;
    description: string;
    cost: { prestige?: number } | null;
  };
  playerId: string;
}

export interface ManufacturingOrder {
  id: string;
  clientId: string; // 依頼者のプレイヤーID
  contractorId: string; // 受注者のプレイヤーID
  designId: string;
  cost: number;
  round: number; // 依頼されたラウンド
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
}

export interface PlayLogEntry {
  id: string;
  round: number;
  phase: string;
  actor: string; // プレイヤーID or 'manufacturer-automata' or 'resale-automata'
  action: string;
  details: string;
  timestamp: number;
}

export const initialGameState: GameState = {
  players: {},
  currentPlayer: null,
  phase: 'lobby',
  round: 1,
  marketPollution: 0,
  regulationLevel: 0,
  regulationStage: 'none',
  regulationStageRounds: 0,
  automata: {
    manufacturerMoney: Infinity,
    resaleOrganizationMoney: 20,
    market: []
  },
  trendEffects: [],
  shortVideoBonus: false,
  playLog: [],
  gameEnded: false,
  winner: null,
  gameStarted: false
};

export const createInitialPlayer = (id: string, name: string): Player => ({
  id,
  name,
  money: 30,
  prestige: 5,
  resaleHistory: 0,
  actionPoints: 3,
  designs: [],
  personalMarket: []
});