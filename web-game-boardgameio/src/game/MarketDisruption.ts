import { Game, Ctx } from 'boardgame.io';
import { GameState, initialGameState, Player, Product, Design, ManufacturingOrder } from './GameState';

const rollDice = (sides: number = 6): number => Math.floor(Math.random() * sides) + 1;
const rollMultipleDice = (count: number, sides: number = 6): number[] => 
  Array.from({ length: count }, () => rollDice(sides));

const getDemandValue = (cost: number): number[] => {
  const demandMap: { [key: number]: number[] } = {
    1: [6, 7, 8],
    2: [5, 9], 
    3: [4, 10],
    4: [3, 11],
    5: [2, 12]
  };
  return demandMap[cost] || [];
};

const checkVictoryConditions = (player: Player): boolean => {
  return (player.prestige >= 17 && player.money >= 75) || player.money >= 150;
};

const MarketDisruption: Game<GameState> = {
  name: 'MarketDisruption',
  
  setup: () => {
    const G = { ...initialGameState };
    // ロビー状態で開始（プレイヤーは初期化しない）
    return G;
  },

  moves: {
    manufacture: ({ G, ctx }, designId: string) => manufacture(G, ctx, designId),
    sell: ({ G, ctx }, productId: string, price: number) => sell(G, ctx, productId, price),
    purchase: ({ G, ctx }, targetPlayerId: string, productId: string) => purchase(G, ctx, targetPlayerId, productId),
    review: ({ G, ctx }, targetPlayerId: string, productId: string, isPositive: boolean) => review(G, ctx, targetPlayerId, productId, isPositive),
    research: ({ G, ctx }) => research(G, ctx),
    partTimeWork: ({ G, ctx }) => partTimeWork(G, ctx),
    buyBack: ({ G, ctx }, productId: string) => buyBack(G, ctx, productId),
    discontinue: ({ G, ctx }, designId: string) => discontinue(G, ctx, designId),
    resale: ({ G, ctx }, targetPlayerId: string, productId: string, resalePrice: number) => resale(G, ctx, targetPlayerId, productId, resalePrice),
    design: ({ G, ctx }, isOpenSource: boolean = false) => design(G, ctx, isOpenSource),
    promoteRegulation: ({ G, ctx }) => promoteRegulation(G, ctx),
    dayLabor: ({ G, ctx }) => dayLabor(G, ctx),
    activateTrend: ({ G, ctx }) => activateTrend(G, ctx),
    purchasePrestige: ({ G, ctx }) => purchasePrestige(G, ctx),
    outsourceReview: ({ G, ctx }, targetPlayerId: string, productId: string, isPositive: boolean) => outsourceReview(G, ctx, targetPlayerId, productId, isPositive),
    outsourceManufacturing: ({ G, ctx }, designId: string, quantity: number, targetType: 'automata' | 'player', targetPlayerId?: string) => outsourceManufacturing(G, ctx, designId, quantity, targetType, targetPlayerId),
    respondToManufacturingOrder: ({ G, ctx }, orderId: string, accept: boolean) => respondToManufacturingOrder(G, ctx, orderId, accept),
    
    // ゲーム開始ムーブ
    startGame: ({ G, ctx }) => startGame(G, ctx),

    
    // ゲーム参加ムーブ
    joinGame: ({ G, ctx }, playerName: string) => joinGame(G, ctx, playerName),
    
    // 新しい統合アクション: オートマフェーズ + マーケットフェーズ + 次ラウンド
    executeAutomataAndMarket: ({ G }) => {
      
      // オートマフェーズ実行
      executeManufacturerAutomata(G);
      
      console.log('🔄 Executing Resale Automata...');
      executeResaleAutomata(G);
      
      // マーケットフェーズ実行
      console.log('🏪 Executing Market Phase...');
      executeMarketPhase(G);
      
      // 次ラウンドの準備
      G.round++;
      
      // 規制段階ラウンド数を増加
      if (G.regulationStage !== 'none') {
        G.regulationStageRounds++;
      }
      
            
      // 全プレイヤーのAPをリセット
      for (const playerId in G.players) {
        G.players[playerId].actionPoints = 3;
      }
      
      // 勝利条件チェック
      for (const playerId in G.players) {
        if (checkVictoryConditions(G.players[playerId])) {
          G.gameEnded = true;
          G.winner = playerId;
                    break;
        }
      }
      
    }
  },

  endIf: ({ G }) => {
    if (G.gameEnded) {
      return { winner: G.winner };
    }
  },

  minPlayers: 1,
  maxPlayers: 4,
  
  // シンプルなactionフェーズのみ - オートマは自動処理
  phases: {
    action: {
      start: true,
      turn: {
        order: {
          first: () => 0,
          next: ({ ctx }) => {
            // 1人プレイの場合は常に同じプレイヤー
            if (ctx.numPlayers === 1) {
              return 0;
            }
            // 複数人プレイの場合は通常の順番
            return (ctx.playOrderPos + 1) % ctx.numPlayers;
          },
        },
        onEnd: ({ G, ctx }) => {
          // マルチプレイで最後のプレイヤーのターン終了時にオートマ＆マーケット実行
          if (ctx.numPlayers > 1 && ctx.playOrderPos === ctx.numPlayers - 1) {
            console.log('🤖 Auto-executing Automata and Market phases for multiplayer...');
            
            // オートマフェーズ実行
            executeManufacturerAutomata(G);
            executeResaleAutomata(G);
            
            // 市場フェーズ実行
            executeMarketPhase(G);
            
            // 次ラウンドの準備
      G.round++;
      
      // 規制段階ラウンド数を増加
      if (G.regulationStage !== 'none') {
        G.regulationStageRounds++;
      }
      
                  
            // 全プレイヤーのAPをリセット
            for (const playerId in G.players) {
              G.players[playerId].actionPoints = 3;
            }
            
            // 勝利条件チェック
            for (const playerId in G.players) {
              if (checkVictoryConditions(G.players[playerId])) {
                G.gameEnded = true;
                G.winner = playerId;
                                break;
              }
            }
          }
        }
      },
      endIf: () => false // actionフェーズは終了しない
    }
  },
  
  turn: {
    order: {
      first: () => 0,
      next: ({ ctx }) => (ctx.playOrderPos + 1) % ctx.numPlayers,
    }
  },
  
  // 基本的なイベントのみ
  events: {
    endTurn: true
  }
};

function manufacture(G: GameState, ctx: Ctx, designId: string) {
  const player = G.players[ctx.currentPlayer];
  if (!player || player.actionPoints < 1) return 'INVALID_MOVE';
  
  // actionフェーズでのみ製造可能
  if (ctx.phase !== 'action') return 'INVALID_MOVE';
  
  const design = player.designs.find(d => d.id === designId);
  if (!design) return 'INVALID_MOVE';
  
  if (player.money < design.cost) return 'INVALID_MOVE';
  
  player.money -= design.cost;
  player.actionPoints -= 1;
  
  const product: Product = {
    id: `product-${ctx.currentPlayer}-${Date.now()}`,
    cost: design.cost,
    price: 0, // Price not set yet, will be set when selling
    popularity: 1,
    playerId: ctx.currentPlayer,
    isResale: false
  };
  
  player.personalMarket.push(product);
}

function sell(G: GameState, ctx: Ctx, productId: string, price: number) {
  const player = G.players[ctx.currentPlayer];
  if (!player || player.actionPoints < 1) return 'INVALID_MOVE';
  if (player.prestige < -5) return 'INVALID_MOVE';
  
  // actionフェーズでのみ販売可能
  if (ctx.phase !== 'action') return 'INVALID_MOVE';
  
  const productIndex = player.personalMarket.findIndex(p => p.id === productId && p.price === 0);
  if (productIndex === -1) return 'INVALID_MOVE';
  
  const product = player.personalMarket[productIndex];
  const maxPrice = getMaxPrice(product.cost, player.prestige);
  
  if (price > maxPrice) return 'INVALID_MOVE';
  
  product.price = price;
  player.actionPoints -= 1;
}

function getMaxPrice(cost: number, prestige: number): number {
  if (prestige >= 9) return cost * 4;
  if (prestige >= 3) return cost * 3;
  return cost * 2;
}

function purchase(G: GameState, ctx: Ctx, targetPlayerId: string, productId: string) {
  const player = G.players[ctx.currentPlayer];
  if (!player || player.actionPoints < 1) return 'INVALID_MOVE';
  
  // actionフェーズでのみ購入可能
  if (ctx.phase !== 'action') return 'INVALID_MOVE';
  
  // オートマからの購入の場合
  if (targetPlayerId === 'automata') {
    const productIndex = G.automata.market.findIndex(p => p.id === productId);
    if (productIndex === -1) return 'INVALID_MOVE';
    
    const product = G.automata.market[productIndex];
    if (player.money < product.price) return 'INVALID_MOVE';
    
    player.money -= product.price;
    player.actionPoints -= 1;
    
    // オートマの商品を削除
    G.automata.market.splice(productIndex, 1);
    return;
  }
  
  // プレイヤーからの購入の場合
  const targetPlayer = G.players[targetPlayerId];
  if (!targetPlayer) return 'INVALID_MOVE';
  
  const productIndex = targetPlayer.personalMarket.findIndex(p => p.id === productId);
  if (productIndex === -1) return 'INVALID_MOVE';
  
  const product = targetPlayer.personalMarket[productIndex];
  if (player.money < product.price) return 'INVALID_MOVE';
  
  player.money -= product.price;
  targetPlayer.money += product.price;
  player.actionPoints -= 1;
  
  targetPlayer.personalMarket.splice(productIndex, 1);
}

function executeManufacturerAutomata(G: GameState): void {
  const diceSum = rollDice() + rollDice();
    
  let action: string;
  let targetCost: number;
  let priceMultiplier: number;
  
  if (diceSum <= 4) {
    action = 'high-cost';
    // ダイスを引いてコスト3-5になるまでロール
    do { targetCost = rollDice(); } while (targetCost < 3);
    priceMultiplier = 3;
  } else if (diceSum <= 7) {
    action = 'mid-cost';
    // ダイスを引いてコスト3にする
    targetCost = 3;
    priceMultiplier = 2;
  } else if (diceSum <= 10) {
    action = 'low-cost';
    // ダイスを引いてコスト1-3になるまでロール
    do { targetCost = rollDice(); } while (targetCost > 3);
    priceMultiplier = 2;
  } else {
    action = 'clearance';
    // 在庫一掃販売 - 既存商品の価格を下げる
    for (const product of G.automata.market) {
      product.price = Math.max(1, product.price - 2);
    }
        
    // ログ記録
    if (G.playLog) {
      G.playLog.push({
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        round: G.round,
        phase: G.phase,
        actor: 'manufacturer-automata',
        action: '在庫一掃',
        details: `${G.automata.market.length}個の商品価格を-2資金`,
        timestamp: Date.now()
      });
    }
    return;
  }
  
    
  // 製造アクション
  const product: Product = {
    id: `manufacturer-automata-${Date.now()}`,
    cost: targetCost,
    price: targetCost * priceMultiplier,
    popularity: 1,
    playerId: 'manufacturer-automata',
    isResale: false
  };
  
  G.automata.market.push(product);
    
  // ログ記録
  if (G.playLog) {
    G.playLog.push({
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      round: G.round,
      phase: G.phase,
      actor: 'manufacturer-automata',
      action: '製造',
      details: `コスト${targetCost}、価格${product.price}の商品を製造`,
      timestamp: Date.now()
    });
  }
  
  // 副行動（レビュー）
  if (action === 'high-cost') {
    // 市場最高価格商品に低評価レビュー
    const allProducts: Product[] = [];
    for (const playerId in G.players) {
      allProducts.push(...G.players[playerId].personalMarket.filter(p => p.price > 0));
    }
    allProducts.push(...G.automata.market.filter(p => p.price > 0));
    
    if (allProducts.length > 0) {
      const maxPrice = Math.max(...allProducts.map(p => p.price));
      const targetProducts = allProducts.filter(p => p.price === maxPrice);
      
      for (const targetProduct of targetProducts) {
        targetProduct.popularity = Math.max(1, targetProduct.popularity - 1);
              }
      
      // ログ記録
      if (G.playLog) {
        G.playLog.push({
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          round: G.round,
          phase: G.phase,
          actor: 'manufacturer-automata',
          action: '低評価レビュー',
          details: `最高価格商品${targetProducts.length}個に低評価`,
          timestamp: Date.now()
        });
      }
    }
  } else if (action === 'low-cost') {
    // 自分の最安商品に高評価レビュー
    const ownProducts = G.automata.market.filter(p => p.price > 0);
    if (ownProducts.length > 0) {
      const minPrice = Math.min(...ownProducts.map(p => p.price));
      const targetProducts = ownProducts.filter(p => p.price === minPrice);
      
      for (const targetProduct of targetProducts) {
        targetProduct.popularity = Math.min(6, targetProduct.popularity + 1);
              }
      
      // ログ記録
      if (G.playLog) {
        G.playLog.push({
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          round: G.round,
          phase: G.phase,
          actor: 'manufacturer-automata',
          action: '高評価レビュー',
          details: `自社最安商品${targetProducts.length}個に高評価`,
          timestamp: Date.now()
        });
      }
    }
  }
}

function executeResaleAutomata(G: GameState): void {
  // 規制発動段階では転売ヤー・オートマが2ラウンド行動停止
  if (G.regulationStage === 'enforcement' && G.regulationStageRounds < 2) {
    console.log('🔄 転売ヤー・オートマ: 規制発動により行動停止中');
    // ログ記録
    if (G.playLog) {
      G.playLog.push({
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        round: G.round,
        phase: G.phase,
        actor: 'resale-automata',
        action: '行動停止',
        details: '規制発動により行動停止中',
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // 資金を20まで自動補充
  if (G.automata.resaleOrganizationMoney < 20) {
    G.automata.resaleOrganizationMoney = 20;
  }
  
  const diceSum = rollDice() + rollDice();
    
  // 6,7,8は様子見
  if (diceSum >= 6 && diceSum <= 8) {
    
    // ログ記録
    if (G.playLog) {
      G.playLog.push({
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        round: G.round,
        phase: G.phase,
        actor: 'resale-automata',
        action: '様子見',
        details: '購入を見送り',
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // 購入可能な商品を収集（価格が設定されている商品のみ）
  const allProducts: Product[] = [];
  for (const playerId in G.players) {
    allProducts.push(...G.players[playerId].personalMarket.filter(p => p.price > 0));
  }
  allProducts.push(...G.automata.market.filter(p => p.price > 0 && p.playerId === 'manufacturer-automata'));
  
  if (allProducts.length === 0) {
    console.log('🔄 転売ヤー・オートマ: 購入可能な商品なし');
    return;
  }
  
  let targetProducts: Product[] = [];
  let actionName = '';
  
  if (diceSum <= 4) {
    // 大量買い占め：最安値商品を3個まで（規制段階1では-1個）
    actionName = '大量買い占め';
    let maxPurchase = 3;
    if (G.regulationStage === 'public_comment') {
      maxPurchase = 2; // パブリックコメント段階では大量買い占め-1個
    }
    targetProducts = allProducts
      .filter(p => G.automata.resaleOrganizationMoney >= p.price)
      .sort((a, b) => a.price - b.price || b.popularity - a.popularity)
      .slice(0, maxPurchase);
  } else if (diceSum === 5 || diceSum === 9) {
    // 選別購入：人気度最高の商品を1個
    actionName = '選別購入';
    targetProducts = allProducts
      .filter(p => G.automata.resaleOrganizationMoney >= p.price)
      .sort((a, b) => b.popularity - a.popularity || a.price - b.price)
      .slice(0, 1);
  } else if (diceSum >= 10) {
    // 投機購入：ランダム商品を1個
    actionName = '投機購入';
    const affordableProducts = allProducts.filter(p => G.automata.resaleOrganizationMoney >= p.price);
    if (affordableProducts.length > 0) {
      const randomIndex = Math.floor(Math.random() * affordableProducts.length);
      targetProducts = [affordableProducts[randomIndex]];
    }
  }
  
    
  let purchaseCount = 0;
  for (const product of targetProducts) {
    if (G.automata.resaleOrganizationMoney >= product.price) {
      G.automata.resaleOrganizationMoney -= product.price;
      
      // 転売価格を設定（ダイス結果に応じて）
      const resaleBonus = (diceSum >= 10) ? 8 : 5;
      let resalePrice = product.price + resaleBonus;
      
      // 規制段階による価格制限を適用
      if (G.regulationStage === 'consideration') {
        resalePrice = Math.min(resalePrice, product.price + 3);
      } else if (G.regulationStage === 'enforcement') {
        resalePrice = Math.min(resalePrice, product.price + 1);
      }
      
      const resaleProduct: Product = {
        ...product,
        id: `resale-automata-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        price: resalePrice,
        isResale: true,
        originalCost: product.cost,
        originalPlayerId: product.playerId,
        playerId: 'resale-automata'
      };
      
      G.automata.market.push(resaleProduct);
      
      // ショート動画ブーム効果（オートマは資金増加なし）
      if (G.shortVideoBonus) {
              }
      
      // 元の所有者に支払い
      if (product.playerId === 'manufacturer-automata') {
        // メーカー・オートマから購入した場合、オートマ市場から削除
        const productIndex = G.automata.market.findIndex(p => p.id === product.id);
        if (productIndex !== -1) {
          G.automata.market.splice(productIndex, 1);
        }
      } else {
        // プレイヤーから購入した場合
        const originalPlayer = G.players[product.playerId];
        if (originalPlayer) {
          originalPlayer.money += product.price;
          const productIndex = originalPlayer.personalMarket.findIndex(p => p.id === product.id);
          if (productIndex !== -1) {
            originalPlayer.personalMarket.splice(productIndex, 1);
          }
        }
      }
      
      G.marketPollution++;
      purchaseCount++;
      
          }
  }
  
  // ログ記録
  if (G.playLog) {
    G.playLog.push({
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      round: G.round,
      phase: G.phase,
      actor: 'resale-automata',
      action: actionName,
      details: `${purchaseCount}個の商品を転売購入、市場汚染+${purchaseCount}`,
      timestamp: Date.now()
    });
  }
}

function executeMarketPhase(G: GameState): void {
  const demandDice = rollDice() + rollDice();
    
  // 販売中の商品を収集（価格が設定されている商品のみ）
  const allProducts: Product[] = [];
  for (const playerId in G.players) {
    allProducts.push(...G.players[playerId].personalMarket.filter(p => p.price > 0));
  }
  allProducts.push(...G.automata.market.filter(p => p.price > 0));
  
    
  // 需要値に合致する商品を選択
  const eligibleProducts = allProducts.filter(product => {
    const demandValues = getDemandValue(product.cost);
    return demandValues.includes(demandDice);
  });
  
    
  // 人気度順、価格順でソート
  eligibleProducts.sort((a, b) => b.popularity - a.popularity || a.price - b.price);
  
  // 上位5個を購入
  const purchasedProducts = eligibleProducts.slice(0, 5);
    
  let totalSales = 0;
  for (const product of purchasedProducts) {
    // Rule.mdに従い転売商品は汚染ペナルティの影響を受けない
    const pollutionPenalty = product.isResale ? 0 : getPollutionPenalty(G.marketPollution);
    const actualPrice = Math.max(1, product.price - pollutionPenalty);
    
        
    if (product.playerId === 'manufacturer-automata' || product.playerId === 'resale-automata') {
      // オートマの商品の場合
      const productIndex = G.automata.market.findIndex(p => p.id === product.id);
      if (productIndex !== -1) {
        G.automata.market.splice(productIndex, 1);
      }
    } else {
      // プレイヤーの商品の場合
      const player = G.players[product.playerId];
      if (player) {
        player.money += actualPrice;
        const productIndex = player.personalMarket.findIndex(p => p.id === product.id);
        if (productIndex !== -1) {
          player.personalMarket.splice(productIndex, 1);
        }
              }
    }
    
    totalSales += actualPrice;
  }
  
  // ログ記録
  if (G.playLog) {
    G.playLog.push({
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      round: G.round,
      phase: G.phase,
      actor: 'market',
      action: '需要処理',
      details: `需要値${demandDice}、${purchasedProducts.length}個販売、総売上${totalSales}資金`,
      timestamp: Date.now()
    });
  }
}

function getPollutionPenalty(pollutionLevel: number): number {
  if (pollutionLevel <= 2) return 0;
  if (pollutionLevel <= 5) return 1;
  if (pollutionLevel <= 8) return 2;
  if (pollutionLevel <= 11) return 3;
  return 4;
}

function review(G: GameState, ctx: Ctx, targetPlayerId: string, productId: string, isPositive: boolean) {
  const player = G.players[ctx.currentPlayer];
  if (!player || player.actionPoints < 1) return 'INVALID_MOVE';
  if (player.prestige < 1) return 'INVALID_MOVE';
  
  // actionフェーズでのみ実行可能
  if (ctx.phase !== 'action') return 'INVALID_MOVE';
  
  let product;
  let targetName;
  
  // オートマの商品の場合
  if (targetPlayerId === 'automata') {
    product = G.automata.market.find(p => p.id === productId);
    targetName = 'オートマ';
  } else {
    // プレイヤーの商品の場合
    const targetPlayer = G.players[targetPlayerId];
    if (!targetPlayer) return 'INVALID_MOVE';
    product = targetPlayer.personalMarket.find(p => p.id === productId);
    targetName = targetPlayer.name;
  }
  
  if (!product) return 'INVALID_MOVE';
  
  player.prestige = Math.max(-5, player.prestige - 1);
  player.actionPoints -= 1;
  
  const oldPopularity = product.popularity;
  if (isPositive) {
    product.popularity = Math.min(6, product.popularity + 1);
  } else {
    product.popularity = Math.max(1, product.popularity - 1);
  }
  
    
  // ログ記録
  if (G.playLog) {
    G.playLog.push({
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      round: G.round,
      phase: ctx.phase || G.phase,
      actor: ctx.currentPlayer,
      action: isPositive ? '高評価レビュー' : '低評価レビュー',
      details: `${targetName}の商品に${isPositive ? '高評価' : '低評価'}、人気度${oldPopularity}→${product.popularity}`,
      timestamp: Date.now()
    });
  }
}

function research(G: GameState, ctx: Ctx) {
  const player = G.players[ctx.currentPlayer];
  if (!player || player.actionPoints < 1) return 'INVALID_MOVE';
  
  player.actionPoints -= 1;
  
  const dice = rollMultipleDice(3);
  const sum = dice.reduce((a, b) => a + b, 0);
  
  const trendEffect = getTrendEffect(sum);
  
  // プレイヤーにトレンド情報を提供
  if (!G.availableTrends) {
    G.availableTrends = {};
  }
  
  G.availableTrends[ctx.currentPlayer] = {
    sum,
    effect: trendEffect,
    playerId: ctx.currentPlayer
  };
  
  // ログ記録
  if (G.playLog) {
    G.playLog.push({
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      round: G.round,
      phase: ctx.phase || G.phase,
      actor: ctx.currentPlayer,
      action: 'リサーチ',
      details: `トレンド調査: ${trendEffect.name}`,
      timestamp: Date.now()
    });
  }
}

function partTimeWork(G: GameState, ctx: Ctx) {
  const player = G.players[ctx.currentPlayer];
  if (!player || player.actionPoints < 2) return 'INVALID_MOVE';
  
  // actionフェーズでのみ実行可能
  if (ctx.phase !== 'action') return 'INVALID_MOVE';
  
  player.money += 5;
  player.actionPoints -= 2;
}

function buyBack(G: GameState, ctx: Ctx, productId: string) {
  const player = G.players[ctx.currentPlayer];
  if (!player || player.actionPoints < 1) return 'INVALID_MOVE';
  
  const productIndex = player.personalMarket.findIndex(p => p.id === productId);
  if (productIndex === -1) return 'INVALID_MOVE';
  
  player.personalMarket.splice(productIndex, 1);
  player.actionPoints -= 1;
}

function discontinue(G: GameState, ctx: Ctx, designId: string) {
  const player = G.players[ctx.currentPlayer];
  if (!player || player.actionPoints < 1) return 'INVALID_MOVE';
  
  const designIndex = player.designs.findIndex(d => d.id === designId);
  if (designIndex === -1) return 'INVALID_MOVE';
  
  player.designs.splice(designIndex, 1);
  player.actionPoints -= 1;
}

function resale(G: GameState, ctx: Ctx, targetPlayerId: string, productId: string, resalePrice: number) {
  const player = G.players[ctx.currentPlayer];
  if (!player || player.actionPoints < 2) return 'INVALID_MOVE';
  
  // 転売は悪の所業なので威厳が最低(-5)でも実行可能
  
  let product;
  let targetName;
  
  // オートマの商品の場合
  if (targetPlayerId === 'automata') {
    const productIndex = G.automata.market.findIndex(p => p.id === productId);
    if (productIndex === -1) return 'INVALID_MOVE';
    
    product = G.automata.market[productIndex];
    targetName = 'オートマ';
    
    if (player.money < product.price) return 'INVALID_MOVE';
    
    const resaleBonus = getResaleBonus(player.resaleHistory);
    let maxResalePrice = Math.min(24, product.price + resaleBonus);
    
    // 規制段階による価格制限を適用
    if (G.regulationStage === 'consideration') {
      maxResalePrice = Math.min(maxResalePrice, product.price + 3);
    } else if (G.regulationStage === 'enforcement') {
      maxResalePrice = Math.min(maxResalePrice, product.price + 1);
    }
    
    if (resalePrice > maxResalePrice) return 'INVALID_MOVE';
    
    player.money -= product.price;
    // オートマは資金を受け取らない（無限資金）
    player.actionPoints -= 2;
    player.prestige = Math.max(-5, player.prestige - 1);
    player.resaleHistory += 1;
    
    G.automata.market.splice(productIndex, 1);
  } else {
    // プレイヤーの商品の場合
    const targetPlayer = G.players[targetPlayerId];
    if (!targetPlayer) return 'INVALID_MOVE';
    
    const productIndex = targetPlayer.personalMarket.findIndex(p => p.id === productId);
    if (productIndex === -1) return 'INVALID_MOVE';
    
    product = targetPlayer.personalMarket[productIndex];
    targetName = targetPlayer.name;
    
    if (player.money < product.price) return 'INVALID_MOVE';
    
    const resaleBonus = getResaleBonus(player.resaleHistory);
    let maxResalePrice = Math.min(24, product.price + resaleBonus);
    
    // 規制段階による価格制限を適用
    if (G.regulationStage === 'consideration') {
      maxResalePrice = Math.min(maxResalePrice, product.price + 3);
    } else if (G.regulationStage === 'enforcement') {
      maxResalePrice = Math.min(maxResalePrice, product.price + 1);
    }
    
    if (resalePrice > maxResalePrice) return 'INVALID_MOVE';
    
    player.money -= product.price;
    targetPlayer.money += product.price;
    player.actionPoints -= 2;
    player.prestige = Math.max(-5, player.prestige - 1);
    player.resaleHistory += 1;
    
    targetPlayer.personalMarket.splice(productIndex, 1);
  }
  
  const resaleProduct: Product = {
    ...product,
    id: `resale-${ctx.currentPlayer}-${Date.now()}`,
    price: resalePrice,
    isResale: true,
    originalCost: product.cost,
    originalPlayerId: product.playerId,
    playerId: ctx.currentPlayer
  };
  
  player.personalMarket.push(resaleProduct);
  G.marketPollution++;
  
  // ショート動画ブーム効果
  if (G.shortVideoBonus) {
    player.money += 2;
      }
  
    
  // ログ記録
  if (G.playLog) {
    G.playLog.push({
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      round: G.round,
      phase: ctx.phase || G.phase,
      actor: ctx.currentPlayer,
      action: '転売',
      details: `${targetName}の商品(コスト${product.cost})を${product.price}資金で購入、${resalePrice}資金で転売、威厳-1、転売履歴+1、市場汚染+1`,
      timestamp: Date.now()
    });
  }
}

function getResaleBonus(resaleHistory: number): number {
  if (resaleHistory <= 1) return 5;
  if (resaleHistory <= 4) return 8;
  if (resaleHistory <= 7) return 11;
  return 15;
}

function design(G: GameState, ctx: Ctx, isOpenSource: boolean = false) {
  const player = G.players[ctx.currentPlayer];
  if (!player || player.actionPoints < 2) return 'INVALID_MOVE';
  if (player.designs.length >= 6) return 'INVALID_MOVE';
  
  // actionフェーズでのみ実行可能
  if (ctx.phase !== 'action') return 'INVALID_MOVE';
  
  const designDice = rollMultipleDice(3);
  const selectedCost = designDice[Math.floor(Math.random() * 3)];
  
  const newDesign: Design = {
    id: `design-${ctx.currentPlayer}-${Date.now()}`,
    cost: selectedCost,
    isOpenSource
  };
  
  player.designs.push(newDesign);
  player.actionPoints -= 2;
  
  if (isOpenSource) {
    player.prestige += 2;
  }
}

function promoteRegulation(G: GameState, ctx: Ctx) {
  const player = G.players[ctx.currentPlayer];
  if (!player || player.actionPoints < 2) return 'INVALID_MOVE';
  
  const diceRolls = rollMultipleDice(2); // 2個のダイスを振る
  const regulationDice = diceRolls[0] + diceRolls[1]; // 合計値を計算
  
  // デバッグログ：常にダイス出目を記録
  console.log(`🎲 規制推進ダイス: ${diceRolls[0]} + ${diceRolls[1]} = ${regulationDice}`);
  
  // 規制推進成功（合計9以上）
  if (regulationDice >= 9) {
    console.log(`✅ 規制推進成功: ${regulationDice} >= 9`);
    switch (G.regulationStage) {
      case 'none':
        // 段階1：パブリックコメント開始
        G.regulationStage = 'public_comment';
        G.regulationStageRounds = 0;
        G.regulationLevel = 1;
        console.log(`📢 規制段階1: パブリックコメント開始`);
        addPlayLog(G, ctx.currentPlayer, '規制推進', `規制推進成功（ダイス: ${diceRolls[0]}+${diceRolls[1]}=${regulationDice}）- パブリックコメント募集開始`);
        break;
        
      case 'public_comment':
        // 段階2：検討段階に移行
        G.regulationStage = 'consideration';
        G.regulationStageRounds = 0;
        G.regulationLevel = 2;
        addPlayLog(G, ctx.currentPlayer, '規制推進', `規制推進成功（ダイス: ${diceRolls[0]}+${diceRolls[1]}=${regulationDice}）- 規制検討中、転売価格制限（購入価格+3資金まで）`);
        break;
        
      case 'consideration':
        // 段階3：規制発動
        G.regulationStage = 'enforcement';
        G.regulationStageRounds = 0;
        G.regulationLevel = 3;
        
        // 全転売品没収
        for (const playerId in G.players) {
          const p = G.players[playerId];
          p.personalMarket = p.personalMarket.filter(product => !product.isResale);
          // 転売履歴×2資金没収
          const penalty = Math.min(p.resaleHistory * 2, p.money);
          p.money = Math.max(0, p.money - penalty);
        }
        
        // オートマ市場からも転売品除去
        G.automata.market = G.automata.market.filter(product => !product.isResale);
        
        addPlayLog(G, ctx.currentPlayer, '規制推進', `規制推進成功（ダイス: ${diceRolls[0]}+${diceRolls[1]}=${regulationDice}）- 転売規制発動、全転売品没収、転売価格制限（購入価格+1資金まで）`);
        break;
        
      case 'enforcement':
        // 既に最大段階なので何もしない
        addPlayLog(G, ctx.currentPlayer, '規制推進', `ダイス: ${diceRolls[0]}+${diceRolls[1]}=${regulationDice} - 規制は既に最大レベルです`);
        break;
    }
  } else {
    // デバッグログ：失敗時も確認
    console.log(`❌ 規制推進失敗: ${regulationDice} < 9`);
    addPlayLog(G, ctx.currentPlayer, '規制推進', `規制推進失敗（ダイス: ${diceRolls[0]}+${diceRolls[1]}=${regulationDice}、必要: 9以上）`);
  }
  
  player.actionPoints -= 2;
  
  // デバッグログ：ログ追加確認
  console.log(`📋 プレイログ追加完了。現在のログ数: ${G.playLog?.length || 0}`);
}

function dayLabor(G: GameState, ctx: Ctx) {
  const player = G.players[ctx.currentPlayer];
  if (!player || player.actionPoints < 3) return 'INVALID_MOVE';
  if (player.money > 100) return 'INVALID_MOVE';
  
  // actionフェーズでのみ実行可能
  if (ctx.phase !== 'action') return 'INVALID_MOVE';
  
  player.money += 18;
  player.actionPoints -= 3;
}

function activateTrend(G: GameState, ctx: Ctx) {
  const player = G.players[ctx.currentPlayer];
  if (!player) {
    console.error('ActivateTrend: Player not found');
    return 'INVALID_MOVE';
  }
  if (!G.availableTrends || !G.availableTrends[ctx.currentPlayer]) {
    console.error('ActivateTrend: No available trend for player');
    return 'INVALID_MOVE';
  }
  
  const trendData = G.availableTrends[ctx.currentPlayer];
  const effect = trendData.effect;
  
  // コストチェック
  if (effect.cost && effect.cost.prestige && player.prestige < effect.cost.prestige) {
    console.error('ActivateTrend: Insufficient prestige');
    return 'INVALID_MOVE';
  }
  
  // コスト支払い
  if (effect.cost && effect.cost.prestige) {
    player.prestige = Math.max(-5, player.prestige - effect.cost.prestige);
  }
  
  // 効果実行
  executeTrendEffect(G, effect, ctx.currentPlayer);
  
  // トレンドを消費
  delete G.availableTrends[ctx.currentPlayer];
  
  // ログ記録
  if (G.playLog) {
    G.playLog.push({
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      round: G.round,
      phase: ctx.phase || G.phase,
      actor: ctx.currentPlayer,
      action: 'トレンド発動',
      details: `${effect.name}を発動`,
      timestamp: Date.now()
    });
  }
}

function purchasePrestige(G: GameState, ctx: Ctx) {
  const player = G.players[ctx.currentPlayer];
  if (!player || player.actionPoints < 1) return 'INVALID_MOVE';
  if (player.money < 5) return 'INVALID_MOVE';
  
  // actionフェーズでのみ実行可能
  if (ctx.phase !== 'action') return 'INVALID_MOVE';
  
  // 1ラウンド中に1回のみ実行可能チェック
  if (!G.prestigePurchasePerRound) {
    G.prestigePurchasePerRound = {};
  }
  
  const purchaseKey = `${G.round}-${ctx.currentPlayer}`;
  if (G.prestigePurchasePerRound[purchaseKey]) {
    return 'INVALID_MOVE'; // 既にこのラウンドで威厳購入済み
  }
  
  // 威厳購入実行
  player.money -= 5;
  player.prestige += 1;
  player.actionPoints -= 1;
  
  // このラウンドで威厳購入したことを記録
  G.prestigePurchasePerRound[purchaseKey] = true;
  
    
  // ログ記録
  if (G.playLog) {
    G.playLog.push({
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      round: G.round,
      phase: ctx.phase || G.phase,
      actor: ctx.currentPlayer,
      action: '威厳購入',
      details: `5資金で威厳1ポイント購入 (威厳: ${player.prestige - 1} → ${player.prestige})`,
      timestamp: Date.now()
    });
  }
}

function outsourceReview(G: GameState, ctx: Ctx, targetPlayerId: string, productId: string, isPositive: boolean) {
  const player = G.players[ctx.currentPlayer];
  if (!player || player.actionPoints < 1) return 'INVALID_MOVE';
  
  // actionフェーズでのみ実行可能
  if (ctx.phase !== 'action') return 'INVALID_MOVE';
  
  // 資金チェック（高評価・低評価ともに3資金）
  if (player.money < 3) return 'INVALID_MOVE';
  
  let product;
  let targetName;
  
  // オートマの商品の場合
  if (targetPlayerId === 'automata') {
    product = G.automata.market.find(p => p.id === productId);
    targetName = 'オートマ';
  } else {
    // プレイヤーの商品の場合
    const targetPlayer = G.players[targetPlayerId];
    if (!targetPlayer) return 'INVALID_MOVE';
    product = targetPlayer.personalMarket.find(p => p.id === productId);
    targetName = targetPlayer.name;
  }
  
  if (!product) return 'INVALID_MOVE';
  
  player.money -= 3;
  player.actionPoints -= 1;
  
  const oldPopularity = product.popularity;
  if (isPositive) {
    product.popularity = Math.min(6, product.popularity + 1);
  } else {
    product.popularity = Math.max(1, product.popularity - 1);
  }
  
  // 発覚判定（6面ダイスで1が出ると威厳-2）
  const detectionRoll = rollDice();
  let detected = false;
  if (detectionRoll === 1) {
    player.prestige = Math.max(-5, player.prestige - 2);
    detected = true;
      } else {
      }
  
    
  // ログ記録
  if (G.playLog) {
    G.playLog.push({
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      round: G.round,
      phase: ctx.phase || G.phase,
      actor: ctx.currentPlayer,
      action: 'レビュー外注',
      details: `${targetName}の商品に${isPositive ? '高評価' : '低評価'}外注、人気度${oldPopularity}→${product.popularity}${detected ? '、発覚により威厳-2' : ''}`,
      timestamp: Date.now()
    });
  }
}

function outsourceManufacturing(G: GameState, ctx: Ctx, designId: string, quantity: number, targetType: 'automata' | 'player', targetPlayerId?: string) {
  const player = G.players[ctx.currentPlayer];
  if (!player || player.actionPoints < 1) return 'INVALID_MOVE';
  
  // 威厳制限チェック
  if (player.prestige < -5) return 'INVALID_MOVE';
  
  // actionフェーズでのみ実行可能
  if (ctx.phase !== 'action') return 'INVALID_MOVE';
  
  // 設計が存在するかチェック（自分の設計または他プレイヤーのオープンソース設計）
  let design = player.designs.find(d => d.id === designId);
  let designOwner = ctx.currentPlayer;
  let isOpenSource = false;
  
  // 自分の設計でない場合、オープンソース設計を探す
  if (!design) {
    for (const playerId in G.players) {
      const otherPlayer = G.players[playerId];
      const openSourceDesign = otherPlayer.designs.find(d => d.id === designId && d.isOpenSource);
      if (openSourceDesign) {
        design = openSourceDesign;
        designOwner = playerId;
        isOpenSource = true;
        break;
      }
    }
  }
  
  if (!design) return 'INVALID_MOVE';
  
  if (targetType === 'automata') {
    // オートマ外注：製造依頼数×(製造コスト+2)
    const totalCost = quantity * (design.cost + 2);
    if (player.money < totalCost) return 'INVALID_MOVE';
    
    player.money -= totalCost;
    player.actionPoints -= 1;
    
    // 即座に指定個数製造
    for (let i = 0; i < quantity; i++) {
      const product: Product = {
        id: `product-${ctx.currentPlayer}-${Date.now()}-${i}`,
        cost: design.cost,
        price: 0,
        popularity: 1,
        playerId: ctx.currentPlayer,
        isResale: false
      };
      player.personalMarket.push(product);
    }
    
    // オープンソース外注料
    if (isOpenSource && designOwner !== ctx.currentPlayer) {
      const outsourceFee = Math.min(G.round, 8);
      const designOwnerPlayer = G.players[designOwner];
      if (designOwnerPlayer) {
        designOwnerPlayer.money += outsourceFee * quantity;
              }
    }
    
        
    // ログ記録
    if (G.playLog) {
      G.playLog.push({
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        round: G.round,
        phase: ctx.phase || G.phase,
        actor: ctx.currentPlayer,
        action: 'オートマ外注',
        details: `コスト${design.cost}の商品を${quantity}個製造、総額${totalCost}資金${isOpenSource ? `、外注料${Math.min(G.round, 8) * quantity}資金` : ''}`,
        timestamp: Date.now()
      });
    }
    
  } else if (targetType === 'player' && targetPlayerId) {
    // プレイヤー外注
    const targetPlayer = G.players[targetPlayerId];
    if (!targetPlayer || targetPlayerId === ctx.currentPlayer) return 'INVALID_MOVE';
    
    if (player.money < design.cost) return 'INVALID_MOVE';
    
    // 製造外注オーダーを作成（pending状態）
    if (!G.pendingManufacturingOrders) {
      G.pendingManufacturingOrders = [];
    }
    
    const order: ManufacturingOrder = {
      id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      clientId: ctx.currentPlayer,
      contractorId: targetPlayerId,
      designId: designId,
      cost: design.cost,
      round: G.round,
      status: 'pending'
    };
    
    G.pendingManufacturingOrders.push(order);
    
    // APを消費（拒否された場合は後で返却）
    player.actionPoints -= 1;
    
        
    // ログ記録
    if (G.playLog) {
      G.playLog.push({
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        round: G.round,
        phase: ctx.phase || G.phase,
        actor: ctx.currentPlayer,
        action: 'プレイヤー外注依頼',
        details: `${targetPlayer.name}に製造依頼、コスト${design.cost}`,
        timestamp: Date.now()
      });
    }
  }
}

function respondToManufacturingOrder(G: GameState, ctx: Ctx, orderId: string, accept: boolean) {
  const player = G.players[ctx.currentPlayer];
  if (!player) return 'INVALID_MOVE';
  
  if (!G.pendingManufacturingOrders) return 'INVALID_MOVE';
  
  const orderIndex = G.pendingManufacturingOrders.findIndex(order => 
    order.id === orderId && 
    order.contractorId === ctx.currentPlayer && 
    order.status === 'pending'
  );
  
  if (orderIndex === -1) return 'INVALID_MOVE';
  
  const order = G.pendingManufacturingOrders[orderIndex];
  const client = G.players[order.clientId];
  
  if (!client) return 'INVALID_MOVE';
  
  if (accept) {
    // 外注を受諾
    order.status = 'accepted';
    
    // 依頼者から製造コストを受け取る
    client.money -= order.cost;
    player.money += order.cost;
    
    // 次ラウンドでAPを1消費する予定を記録
    // これは次ラウンド開始時に処理される
    
    // 設計を取得して製造
    let design = null;
    let designOwner = null;
    let isOpenSource = false;
    
    // まず依頼者の設計を探す
    design = client.designs.find(d => d.id === order.designId);
    if (design) {
      designOwner = order.clientId;
    } else {
      // オープンソース設計を探す
      for (const playerId in G.players) {
        const otherPlayer = G.players[playerId];
        const openSourceDesign = otherPlayer.designs.find(d => d.id === order.designId && d.isOpenSource);
        if (openSourceDesign) {
          design = openSourceDesign;
          designOwner = playerId;
          isOpenSource = true;
          break;
        }
      }
    }
    
    if (design) {
      // 商品を製造して依頼者に渡す
      const product: Product = {
        id: `product-${order.clientId}-${Date.now()}`,
        cost: design.cost,
        price: 0,
        popularity: 1,
        playerId: order.clientId,
        isResale: false
      };
      client.personalMarket.push(product);
      
      // オープンソース外注料
      if (isOpenSource && designOwner && designOwner !== order.clientId) {
        const outsourceFee = Math.min(G.round, 8);
        const designOwnerPlayer = G.players[designOwner];
        if (designOwnerPlayer) {
          designOwnerPlayer.money += outsourceFee;
                  }
      }
      
            
      // ログ記録
      if (G.playLog) {
        G.playLog.push({
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          round: G.round,
          phase: ctx.phase || G.phase,
          actor: ctx.currentPlayer,
          action: '外注受諾',
          details: `${client.name}の製造依頼を受諾、コスト${design.cost}の商品を製造${isOpenSource ? `、外注料${Math.min(G.round, 8)}資金` : ''}`,
          timestamp: Date.now()
        });
      }
    }
    
    // オーダーを完了状態に
    order.status = 'completed';
    
  } else {
    // 外注を拒否
    order.status = 'rejected';
    
    // 依頼者のAPを返却
    client.actionPoints += 1;
    
        
    // ログ記録
    if (G.playLog) {
      G.playLog.push({
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        round: G.round,
        phase: ctx.phase || G.phase,
        actor: ctx.currentPlayer,
        action: '外注拒否',
        details: `${client.name}の製造依頼を拒否、依頼者のAPを返還`,
        timestamp: Date.now()
      });
    }
  }
  
  // 処理済みオーダーを削除
  G.pendingManufacturingOrders.splice(orderIndex, 1);
}

function getTrendEffect(sum: number) {
  const effects: { [key: number]: { name: string; description: string; cost: { prestige?: number } | null } } = {
    3: { name: '経済特需', description: '全プレイヤーに+15資金', cost: null },
    4: { name: '技術革新', description: '自身の任意の設計1つのダイス値-1', cost: null },
    5: { name: 'インフルエンサー紹介', description: '自身の全商品の人気度を+1', cost: null },
    6: { name: '汚染改善キャンペーン', description: '市場汚染レベルを-2', cost: null },
    7: { name: 'サステナビリティ', description: '任意の商品の人気度を+3（任意の組み合わせ）', cost: { prestige: 1 } },
    8: { name: 'DIYブーム', description: '全てのプレイヤーの最新設計のダイス値-1', cost: null },
    9: { name: 'インフレ進行', description: '全ての転売ではない商品の価格+2（発動後永続）', cost: null },
    10: { name: 'ショート動画ブーム', description: '転売が成功するたびに+2資金ボーナス（発動後永続）', cost: null },
    11: { name: 'ショート動画ブーム', description: '転売が成功するたびに+2資金ボーナス（発動後永続）', cost: null },
    12: { name: 'テレワーク需要', description: '価格10以下の全商品の人気度を+1', cost: null },
    13: { name: 'ギフト需要', description: '人気度3以下の全商品の人気度を+1', cost: null },
    14: { name: '緑化促進', description: '市場汚染レベルを-3', cost: { prestige: 3 } },
    15: { name: '消費者不信', description: 'あなた以外の全プレイヤーの威厳-1', cost: { prestige: 2 } },
    16: { name: '市場開放', description: 'ダイスを3つ引き、コスト0で設計（オープンソース不可）、製造、販売を行うことができる。使用しなかったダイスはダイスプールに戻す。', cost: null },
    17: { name: '風評操作', description: '任意のプレイヤー1人の威厳-3', cost: { prestige: 2 } },
    18: { name: '市場の寵児', description: 'あなたの威厳+5', cost: null }
  };
  
  return effects[sum] || { name: '無効果', description: '特に変化なし', cost: null };
}

function executeTrendEffect(G: GameState, effect: any, playerId: string) {
    
  switch (effect.name) {
    case '経済特需':
      for (const pid in G.players) {
        G.players[pid].money += 15;
      }
      break;
      
    case '技術革新':
      // 自身の任意の設計1つのダイス値-1（簡易実装：最初の設計のコスト-1）
      const techPlayer = G.players[playerId];
      if (techPlayer && techPlayer.designs.length > 0) {
        const design = techPlayer.designs[0]; // 最初の設計を選択
        if (design.cost > 1) {
          design.cost -= 1;
                  }
      }
      break;
      
    case 'インフルエンサー紹介':
      const player = G.players[playerId];
      if (player) {
        for (const product of player.personalMarket) {
          // 人気度上昇時の位置更新処理
          const oldPopularity = product.popularity;
          product.popularity = Math.min(6, product.popularity + 1);
          
          // パーソナル・マーケット内での位置調整が必要な場合
          if (product.popularity !== oldPopularity && product.price > 0) {
            // 商品の位置を更新（価格は変わらず、人気度のみ変更）
                      }
        }
              }
      break;
      
    case '汚染改善キャンペーン':
      G.marketPollution = Math.max(0, G.marketPollution - 2);
            break;
      
    case 'テレワーク需要':
      // 価格10以下の全商品の人気度+1
      for (const pid in G.players) {
        for (const product of G.players[pid].personalMarket) {
          if (product.price > 0 && product.price <= 10) {
            const oldPopularity = product.popularity;
            product.popularity = Math.min(6, product.popularity + 1);
            if (product.popularity !== oldPopularity) {
                          }
          }
        }
      }
      for (const product of G.automata.market) {
        if (product.price > 0 && product.price <= 10) {
          product.popularity = Math.min(6, product.popularity + 1);
        }
      }
      console.log('💻 All products with price ≤10 gained +1 popularity');
      break;
      
    case 'インフレ進行':
      // 全ての転売ではない商品の価格+2（永続）
      for (const pid in G.players) {
        for (const product of G.players[pid].personalMarket) {
          if (!product.isResale && product.price > 0) {
            product.price += 2;
          }
        }
      }
      for (const product of G.automata.market) {
        if (!product.isResale && product.price > 0) {
          product.price += 2;
        }
      }
      console.log('💰 All non-resale products gained +2 price');
      break;
      
    case 'DIYブーム':
      // 全てのプレイヤーの最新設計のダイス値-1
      for (const pid in G.players) {
        const diyPlayer = G.players[pid];
        if (diyPlayer.designs.length > 0) {
          const latestDesign = diyPlayer.designs[diyPlayer.designs.length - 1]; // 最新設計
          if (latestDesign.cost > 1) {
            latestDesign.cost -= 1;
                      }
        }
      }
      break;
      
    case 'ショート動画ブーム':
      // 転売が成功するたびに+2資金ボーナス（発動後永続）
      G.shortVideoBonus = true;
      break;
      
    case 'ギフト需要':
      // 人気度3以下の全商品の人気度を+1
      for (const pid in G.players) {
        for (const product of G.players[pid].personalMarket) {
          if (product.price > 0 && product.popularity <= 3) {
            const oldPopularity = product.popularity;
            product.popularity = Math.min(6, product.popularity + 1);
            if (product.popularity !== oldPopularity) {
                          }
          }
        }
      }
      for (const product of G.automata.market) {
        if (product.price > 0 && product.popularity <= 3) {
          product.popularity = Math.min(6, product.popularity + 1);
        }
      }
      break;
      
    case '緑化促進':
      // 市場汚染レベルを-3
      G.marketPollution = Math.max(0, G.marketPollution - 3);
            break;
      
    case '消費者不信':
      // あなた以外の全プレイヤーの威厳-1
      for (const pid in G.players) {
        if (pid !== playerId) {
          const targetPlayer = G.players[pid];
          targetPlayer.prestige = Math.max(-5, targetPlayer.prestige - 1);
                  }
      }
      break;
      
    case '市場開放':
      // ダイスを3つ引き、コスト0で設計・製造・販売（簡易実装）
      const marketPlayer = G.players[playerId];
      if (marketPlayer) {
        // ダイスを振る
        const dice1 = rollDice();
                
        // 最初のダイスで無料設計・製造・販売
        if (marketPlayer.designs.length < 6) {
          const freeDesign = {
            id: `free-design-${playerId}-${Date.now()}`,
            cost: dice1,
            isOpenSource: false
          };
          marketPlayer.designs.push(freeDesign);
          
          // 無料製造
          const freeProduct = {
            id: `free-product-${playerId}-${Date.now()}`,
            cost: dice1,
            price: dice1 * 2, // 自動販売価格設定
            popularity: 1,
            playerId: playerId,
            isResale: false
          };
          marketPlayer.personalMarket.push(freeProduct);
          
                  }
      }
      break;
      
    case '風評操作':
      // 任意のプレイヤー1人の威厳-3（簡易実装：ランダムな他プレイヤー）
      const otherPlayerIds = Object.keys(G.players).filter(pid => pid !== playerId);
      if (otherPlayerIds.length > 0) {
        const targetIndex = Math.floor(Math.random() * otherPlayerIds.length);
        const targetId = otherPlayerIds[targetIndex];
        const targetPlayer = G.players[targetId];
        
        targetPlayer.prestige = Math.max(-5, targetPlayer.prestige - 3);
              }
      break;
      
    case 'サステナビリティ':
      // プレイヤーが任意の商品の人気度を+3できる（実装は簡易版：自分の商品全てに+1）
      const sustainabilityPlayer = G.players[playerId];
      if (sustainabilityPlayer) {
        for (const product of sustainabilityPlayer.personalMarket) {
          const oldPopularity = product.popularity;
          product.popularity = Math.min(6, product.popularity + 1);
          if (product.popularity !== oldPopularity) {
                      }
        }
      }
      break;
      
    case '市場の寵児':
      // あなたの威厳+5
      const favoritePlayer = G.players[playerId];
      if (favoritePlayer) {
        favoritePlayer.prestige += 5;
              }
      break;
      
    default:
            break;
  }
}

function startGame(G: GameState, ctx: Ctx) {
  
  // 既に参加しているプレイヤーを初期状態に設定
  for (const playerId in G.players) {
    const player = G.players[playerId];
    // 基本ステータスを初期化
    player.money = 30;
    player.prestige = 5;
    player.resaleHistory = 0;
    player.actionPoints = 3;
    player.designs = [];
    player.personalMarket = [];
    
    // 初期設計を2つ生成
    const designDice = rollMultipleDice(2);
    player.designs = designDice.map((cost, index) => ({
      id: `design-${playerId}-${index}`,
      cost,
      isOpenSource: false
    }));
  }
  
  // ゲーム状態を更新
  G.phase = 'action';
  G.gameStarted = true;
  G.currentPlayer = '0';
  
  // ログ記録
  if (G.playLog) {
    G.playLog.push({
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      round: G.round,
      phase: 'lobby',
      actor: 'system',
      action: 'ゲーム開始',
      details: `${ctx.numPlayers}人でゲームを開始しました`,
      timestamp: Date.now()
    });
  }
  
  }

function joinGame(G: GameState, _ctx: Ctx, playerName: string) {
    
  // ロビー状態でのみ参加可能
  if (G.phase !== 'lobby') {
    return 'INVALID_MOVE';
  }
  
  // プレイヤー数の上限チェック（4人まで）
  const currentPlayerCount = Object.keys(G.players).length;
  if (currentPlayerCount >= 4) {
    console.error('Cannot join game: maximum players reached');
    return 'INVALID_MOVE';
  }
  
  // 新しいプレイヤーIDを生成（0から順番）
  const newPlayerId = String(currentPlayerCount);
  
  // プレイヤーが既に存在するかチェック
  if (G.players[newPlayerId]) {
    console.error(`Player ${newPlayerId} already exists`);
    return 'INVALID_MOVE';
  }
  
  // 新しいプレイヤーを作成（ゲーム開始時に初期化されるので基本情報のみ）
  G.players[newPlayerId] = {
    id: newPlayerId,
    name: playerName || `Player ${parseInt(newPlayerId) + 1}`,
    money: 0, // ゲーム開始時に30に設定される
    prestige: 0, // ゲーム開始時に5に設定される
    resaleHistory: 0,
    actionPoints: 0, // ゲーム開始時に3に設定される
    designs: [],
    personalMarket: []
  };
  
    
  // ログ記録
  if (G.playLog) {
    G.playLog.push({
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      round: G.round,
      phase: G.phase,
      actor: newPlayerId,
      action: 'ゲーム参加',
      details: `${G.players[newPlayerId].name}がゲームに参加しました`,
      timestamp: Date.now()
    });
  }
}

function addPlayLog(G: GameState, playerId: string, action: string, details: string) {
  if (G.playLog) {
    G.playLog.push({
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      round: G.round,
      phase: G.phase,
      actor: playerId,
      action: action,
      details: details,
      timestamp: Date.now()
    });
  }
}

export default MarketDisruption;