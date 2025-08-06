import { GameState, Player, Design, Product } from './GameState';

// AI用のゲーム状態分析インターフェース
export interface GameAnalysis {
  currentPlayer: Player;
  availableActions: ActionInfo[];
  gameStatus: GameStatus;
  marketSituation: MarketAnalysis;
  playerRankings: PlayerRanking[];
  recommendations: AIRecommendation[];
}

export interface ActionInfo {
  actionName: string;
  apCost: number;
  requirements: string[];
  expectedOutcome: string;
  parameters?: ActionParameter[];
  isRecommended: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ActionParameter {
  name: string;
  type: 'string' | 'number' | 'boolean';
  description: string;
  possibleValues?: (string | number)[];
  required: boolean;
}

export interface GameStatus {
  round: number;
  phase: string;
  marketPollution: number;
  regulationLevel: number;
  regulationStage: string;
  isGameEnding: boolean;
  remainingTurns: number;
}

export interface MarketAnalysis {
  hotProducts: ProductInfo[];
  profitableOpportunities: Opportunity[];
  competitionLevel: 'low' | 'medium' | 'high';
  marketTrends: string[];
}

export interface ProductInfo {
  productId: string;
  ownerId: string;
  ownerName: string;
  popularity: number;
  price: number;
  profitMargin: number;
  demandProbability: number;
}

export interface Opportunity {
  type: 'resale' | 'manufacture' | 'design' | 'regulation';
  description: string;
  expectedProfit: number;
  riskLevel: 'low' | 'medium' | 'high';
  actionRequired: string;
}

export interface PlayerRanking {
  playerId: string;
  playerName: string;
  money: number;
  prestige: number;
  score: number;
  position: number;
  isWinning: boolean;
}

export interface AIRecommendation {
  priority: 'high' | 'medium' | 'low';
  actionName: string;
  reasoning: string;
  expectedBenefit: string;
  parameters?: { [key: string]: any };
}

// AI用のゲーム分析クラス
export class AIGameAnalyzer {
  constructor(private gameState: GameState, private currentPlayerId: string) {}

  // メインの分析メソッド
  analyzeGame(): GameAnalysis {
    const currentPlayer = this.gameState.players[this.currentPlayerId];
    if (!currentPlayer) {
      throw new Error(`Player ${this.currentPlayerId} not found`);
    }

    return {
      currentPlayer,
      availableActions: this.getAvailableActions(),
      gameStatus: this.getGameStatus(),
      marketSituation: this.analyzeMarket(),
      playerRankings: this.getPlayerRankings(),
      recommendations: this.generateRecommendations()
    };
  }

  // 実行可能なアクションの分析
  private getAvailableActions(): ActionInfo[] {
    const player = this.gameState.players[this.currentPlayerId];
    const actions: ActionInfo[] = [];

    // 製造アクション
    if (player.actionPoints >= 1) {
      player.designs.forEach(design => {
        if (player.money >= design.cost) {
          actions.push({
            actionName: 'manufacture',
            apCost: 1,
            requirements: [`${design.cost}資金`, '設計'],
            expectedOutcome: `商品製造 (コスト: ${design.cost})`,
            parameters: [{
              name: 'designId',
              type: 'string',
              description: '設計ID',
              possibleValues: [design.id],
              required: true
            }],
            isRecommended: this.isManufactureRecommended(design),
            riskLevel: 'low'
          });
        }
      });
    }

    // 販売アクション
    if (player.actionPoints >= 1) {
      player.personalMarket.filter(p => p.price === 0).forEach(product => {
        actions.push({
          actionName: 'sell',
          apCost: 1,
          requirements: ['未販売商品'],
          expectedOutcome: '商品を市場に出品',
          parameters: [
            {
              name: 'productId',
              type: 'string',
              description: '商品ID',
              possibleValues: [product.id],
              required: true
            },
            {
              name: 'price',
              type: 'number',
              description: '販売価格',
              possibleValues: this.generatePriceOptions(product),
              required: true
            }
          ],
          isRecommended: this.isSellRecommended(product),
          riskLevel: 'low'
        });
      });
    }

    // 購入アクション
    if (player.actionPoints >= 1) {
      const availableProducts = this.getAvailableProductsForPurchase();
      availableProducts.forEach(product => {
        if (player.money >= product.price) {
          actions.push({
            actionName: 'purchase',
            apCost: 1,
            requirements: [`${product.price}資金`],
            expectedOutcome: `商品購入 (価格: ${product.price})`,
            parameters: [
              {
                name: 'targetPlayerId',
                type: 'string',
                description: '販売者ID',
                possibleValues: [product.playerId],
                required: true
              },
              {
                name: 'productId',
                type: 'string',
                description: '商品ID',
                possibleValues: [product.id],
                required: true
              }
            ],
            isRecommended: this.isPurchaseRecommended(product),
            riskLevel: 'medium'
          });
        }
      });
    }

    // 転売アクション
    if (player.actionPoints >= 2) {
      const resaleProducts = this.getResaleOpportunities();
      resaleProducts.forEach(product => {
        if (player.money >= product.price) {
          actions.push({
            actionName: 'resale',
            apCost: 2,
            requirements: [`${product.price}資金`, '威厳-1'],
            expectedOutcome: '商品転売 (威厳低下)',
            parameters: [
              {
                name: 'targetPlayerId',
                type: 'string',
                description: '販売者ID',
                possibleValues: [product.playerId],
                required: true
              },
              {
                name: 'productId',
                type: 'string',
                description: '商品ID',
                possibleValues: [product.id],
                required: true
              },
              {
                name: 'resalePrice',
                type: 'number',
                description: '転売価格',
                possibleValues: this.generateResalePriceOptions(product),
                required: true
              }
            ],
            isRecommended: this.isResaleRecommended(product),
            riskLevel: 'high'
          });
        }
      });
    }

    // 設計アクション
    if (player.actionPoints >= 2 && player.money >= 5) {
      actions.push({
        actionName: 'design',
        apCost: 2,
        requirements: ['5資金'],
        expectedOutcome: '新しい設計を取得',
        parameters: [{
          name: 'isOpenSource',
          type: 'boolean',
          description: 'オープンソース設計',
          possibleValues: ['false', 'true'],
          required: false
        }],
        isRecommended: this.isDesignRecommended(),
        riskLevel: 'low'
      });
    }

    // リサーチアクション
    if (player.actionPoints >= 1 && player.money >= 3) {
      actions.push({
        actionName: 'research',
        apCost: 1,
        requirements: ['3資金'],
        expectedOutcome: 'トレンド効果を取得',
        isRecommended: this.isResearchRecommended(),
        riskLevel: 'low'
      });
    }

    // 労働アクション
    if (player.actionPoints >= 2) {
      actions.push({
        actionName: 'partTimeWork',
        apCost: 2,
        requirements: [],
        expectedOutcome: '5資金を獲得',
        isRecommended: this.isPartTimeWorkRecommended(),
        riskLevel: 'low'
      });
    }

    // 日雇い労働アクション
    if (player.actionPoints >= 3 && player.money <= 100) {
      actions.push({
        actionName: 'dayLabor',
        apCost: 3,
        requirements: ['資金100以下'],
        expectedOutcome: '18資金を獲得',
        isRecommended: this.isDayLaborRecommended(),
        riskLevel: 'low'
      });
    }

    // 規制推進アクション
    if (player.actionPoints >= 2) {
      actions.push({
        actionName: 'promoteRegulation',
        apCost: 2,
        requirements: [],
        expectedOutcome: '規制を推進 (2d6で10+で成功)',
        isRecommended: this.isRegulationRecommended(),
        riskLevel: 'medium'
      });
    }

    return actions;
  }

  // ゲーム状況の分析
  private getGameStatus(): GameStatus {
    return {
      round: this.gameState.round,
      phase: this.gameState.phase,
      marketPollution: this.gameState.marketPollution,
      regulationLevel: this.gameState.regulationLevel,
      regulationStage: this.gameState.regulationStage,
      isGameEnding: this.isGameEndingPhase(),
      remainingTurns: this.estimateRemainingTurns()
    };
  }

  // 市場分析
  private analyzeMarket(): MarketAnalysis {
    const allProducts = this.getAllMarketProducts();
    
    return {
      hotProducts: this.getHotProducts(allProducts),
      profitableOpportunities: this.findProfitableOpportunities(),
      competitionLevel: this.assessCompetitionLevel(),
      marketTrends: this.identifyMarketTrends()
    };
  }

  // プレイヤーランキング
  private getPlayerRankings(): PlayerRanking[] {
    const rankings = Object.values(this.gameState.players).map(player => ({
      playerId: player.id,
      playerName: player.name,
      money: player.money,
      prestige: player.prestige,
      score: this.calculatePlayerScore(player),
      position: 0,
      isWinning: this.checkVictoryConditions(player)
    }));

    rankings.sort((a, b) => b.score - a.score);
    rankings.forEach((ranking, index) => {
      ranking.position = index + 1;
    });

    return rankings;
  }

  // AI推奨アクション生成
  private generateRecommendations(): AIRecommendation[] {
    const player = this.gameState.players[this.currentPlayerId];
    const recommendations: AIRecommendation[] = [];

    // 勝利条件に近い場合の推奨
    if (player.prestige >= 15 && player.money >= 60) {
      recommendations.push({
        priority: 'high',
        actionName: 'partTimeWork',
        reasoning: '勝利条件に近いため資金を確保',
        expectedBenefit: '勝利条件達成',
      });
    }

    // 資金不足の場合
    if (player.money < 10 && player.actionPoints >= 2) {
      recommendations.push({
        priority: 'high',
        actionName: 'partTimeWork',
        reasoning: '資金不足のため労働で資金確保',
        expectedBenefit: '5資金獲得',
      });
    }

    // 転売機会がある場合
    const profitableResales = this.getResaleOpportunities().filter(p => 
      p.price < p.cost * 1.5 && player.money >= p.price
    );
    if (profitableResales.length > 0) {
      recommendations.push({
        priority: 'medium',
        actionName: 'resale',
        reasoning: '高利益の転売機会あり',
        expectedBenefit: '短期間で高利益',
        parameters: {
          targetPlayerId: profitableResales[0].playerId,
          productId: profitableResales[0].id,
          resalePrice: Math.floor(profitableResales[0].price * 1.8)
        }
      });
    }

    return recommendations;
  }

  // ヘルパーメソッド
  private isManufactureRecommended(design: Design): boolean {
    const player = this.gameState.players[this.currentPlayerId];
    return player.money >= design.cost * 2; // 十分な資金があるか
  }

  private isSellRecommended(product: Product): boolean {
    return product.popularity >= 3; // 人気度が十分高いか
  }

  private isPurchaseRecommended(product: Product): boolean {
    return product.popularity >= 4 && product.price <= product.cost * 1.2;
  }

  private isResaleRecommended(product: Product): boolean {
    return product.popularity >= 4 && product.price < product.cost * 1.3;
  }

  private isDesignRecommended(): boolean {
    const player = this.gameState.players[this.currentPlayerId];
    return player.designs.length < 3 && player.money >= 15;
  }

  private isResearchRecommended(): boolean {
    const player = this.gameState.players[this.currentPlayerId];
    return player.money >= 10;
  }

  private isPartTimeWorkRecommended(): boolean {
    const player = this.gameState.players[this.currentPlayerId];
    return player.money < 15;
  }

  private isDayLaborRecommended(): boolean {
    const player = this.gameState.players[this.currentPlayerId];
    return player.money < 5;
  }

  private isRegulationRecommended(): boolean {
    return this.gameState.marketPollution >= 8;
  }

  private generatePriceOptions(product: Product): number[] {
    const baseCost = product.originalCost || product.cost;
    return [
      Math.floor(baseCost * 1.2),
      Math.floor(baseCost * 1.5),
      Math.floor(baseCost * 2.0)
    ];
  }

  private generateResalePriceOptions(product: Product): number[] {
    return [
      Math.floor(product.price * 1.3),
      Math.floor(product.price * 1.5),
      Math.floor(product.price * 1.8)
    ];
  }

  private getAvailableProductsForPurchase(): Product[] {
    const allProducts: Product[] = [];
    
    // 他のプレイヤーの商品
    Object.values(this.gameState.players).forEach(player => {
      if (player.id !== this.currentPlayerId) {
        allProducts.push(...player.personalMarket.filter(p => p.price > 0));
      }
    });
    
    // オートマの商品
    allProducts.push(...this.gameState.automata.market.filter(p => p.price > 0));
    
    return allProducts;
  }

  private getResaleOpportunities(): Product[] {
    return this.getAvailableProductsForPurchase().filter(p => p.popularity >= 4);
  }

  private getAllMarketProducts(): ProductInfo[] {
    const allProducts = this.getAvailableProductsForPurchase();
    return allProducts.map(product => ({
      productId: product.id,
      ownerId: product.playerId,
      ownerName: product.playerId === 'automata' ? 'オートマ' : 
                 this.gameState.players[product.playerId]?.name || 'Unknown',
      popularity: product.popularity,
      price: product.price,
      profitMargin: product.price - (product.originalCost || product.cost),
      demandProbability: this.calculateDemandProbability(product.cost)
    }));
  }

  private getHotProducts(products: ProductInfo[]): ProductInfo[] {
    return products
      .filter(p => p.popularity >= 4)
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 5);
  }

  private findProfitableOpportunities(): Opportunity[] {
    const opportunities: Opportunity[] = [];
    
    // 転売機会
    const resaleProducts = this.getResaleOpportunities();
    resaleProducts.forEach(product => {
      const expectedProfit = Math.floor(product.price * 0.6);
      opportunities.push({
        type: 'resale',
        description: `${product.id}を転売`,
        expectedProfit,
        riskLevel: expectedProfit > 20 ? 'high' : 'medium',
        actionRequired: 'resale'
      });
    });

    return opportunities.sort((a, b) => b.expectedProfit - a.expectedProfit);
  }

  private assessCompetitionLevel(): 'low' | 'medium' | 'high' {
    const playerCount = Object.keys(this.gameState.players).length;
    if (playerCount <= 2) return 'low';
    if (playerCount === 3) return 'medium';
    return 'high';
  }

  private identifyMarketTrends(): string[] {
    const trends: string[] = [];
    
    if (this.gameState.marketPollution >= 8) {
      trends.push('市場汚染が深刻');
    }
    
    if (this.gameState.regulationLevel >= 3) {
      trends.push('規制が強化');
    }
    
    return trends;
  }

  private calculatePlayerScore(player: Player): number {
    return player.money + (player.prestige * 5);
  }

  private checkVictoryConditions(player: Player): boolean {
    return (player.prestige >= 17 && player.money >= 75) || player.money >= 150;
  }

  private isGameEndingPhase(): boolean {
    return Object.values(this.gameState.players).some(player => 
      this.checkVictoryConditions(player)
    ) || this.gameState.round >= 20;
  }

  private estimateRemainingTurns(): number {
    if (this.isGameEndingPhase()) return 1;
    return Math.max(1, 25 - this.gameState.round);
  }

  private calculateDemandProbability(cost: number): number {
    // コストに基づく需要確率の計算
    if (cost <= 3) return 0.7;
    if (cost <= 6) return 0.5;
    if (cost <= 9) return 0.3;
    return 0.1;
  }
}

// AI用のムーブ実行インターフェース
export interface AIMove {
  actionName: string;
  parameters?: { [key: string]: any };
  confidence: number; // 0-1の信頼度
  reasoning: string;
}

// AIムーブ生成器
export class AIMoveGenerator {
  constructor(private analyzer: AIGameAnalyzer) {}

  // 最適なムーブを生成
  generateOptimalMove(): AIMove | null {
    const analysis = this.analyzer.analyzeGame();
    
    // 高優先度の推奨アクションがある場合
    const highPriorityRec = analysis.recommendations.find(r => r.priority === 'high');
    if (highPriorityRec) {
      return {
        actionName: highPriorityRec.actionName,
        parameters: highPriorityRec.parameters || {},
        confidence: 0.9,
        reasoning: highPriorityRec.reasoning
      };
    }

    // 利用可能な推奨アクションから選択
    const recommendedActions = analysis.availableActions.filter(a => a.isRecommended);
    if (recommendedActions.length > 0) {
      const bestAction = recommendedActions[0]; // 最初の推奨アクション
      return {
        actionName: bestAction.actionName,
        parameters: this.generateParameters(bestAction),
        confidence: 0.7,
        reasoning: `推奨アクション: ${bestAction.expectedOutcome}`
      };
    }

    // フォールバック: APを消費する安全なアクション
    const safeActions = analysis.availableActions.filter(a => 
      a.riskLevel === 'low' && a.apCost <= analysis.currentPlayer.actionPoints
    );
    
    if (safeActions.length > 0) {
      const action = safeActions[0];
      return {
        actionName: action.actionName,
        parameters: this.generateParameters(action),
        confidence: 0.5,
        reasoning: '安全なアクションを実行'
      };
    }

    return null; // 実行可能なアクションなし
  }

  private generateParameters(action: ActionInfo): { [key: string]: any } {
    const params: { [key: string]: any } = {};
    
    if (!action.parameters) return params;

    action.parameters.forEach(param => {
      if (param.possibleValues && param.possibleValues.length > 0) {
        // 最初の可能な値を選択（より洗練されたロジックも可能）
        params[param.name] = param.possibleValues[0];
      } else if (param.type === 'boolean') {
        params[param.name] = false; // デフォルト値
      }
    });

    return params;
  }
}