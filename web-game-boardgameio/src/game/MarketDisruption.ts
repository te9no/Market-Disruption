import { Game, Ctx } from 'boardgame.io';
import { GameState, initialGameState, createInitialPlayer, Player, Product, Design } from './GameState';

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
  
  setup: ({ ctx }) => {
    const G = { ...initialGameState };
    
    for (let i = 0; i < ctx.numPlayers; i++) {
      const playerId = String(i);
      G.players[playerId] = createInitialPlayer(playerId, `Player ${i + 1}`);
      
      const designDice = rollMultipleDice(2);
      G.players[playerId].designs = designDice.map((cost, index) => ({
        id: `design-${playerId}-${index}`,
        cost,
        isOpenSource: false
      }));
    }
    
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
    activateTrend: ({ G, ctx }) => activateTrend(G, ctx)
  },


  endIf: ({ G }) => {
    if (G.gameEnded) {
      return { winner: G.winner };
    }
  },

  minPlayers: 1,
  maxPlayers: 4,
  
  // 初期フェーズをactionに設定
  phases: {
    action: {
      start: true,  // これが初期フェーズであることを明示
      next: 'automata',
      turn: {
        order: {
          first: () => 0,
          next: ({ ctx }) => {
            // 1人プレイの場合は常に同じプレイヤー（オートマとの対戦）
            if (ctx.numPlayers === 1) {
              return 0;
            }
            // 複数人プレイの場合は通常の順番
            return (ctx.playOrderPos + 1) % ctx.numPlayers;
          },
        }
      },
      // フェーズ終了は手動で制御（ボタンクリック時）
      endIf: () => false,
      onEnd: ({ G }) => {
        console.log('Action phase ending - resetting AP for all players');
        // 全プレイヤーのAPをリセット
        for (const playerId in G.players) {
          G.players[playerId].actionPoints = 3;
        }
      }
    },

    automata: {
      moves: {},
      onBegin: ({ G, events }) => {
        console.log('🤖 Automata phase started: executing automata actions');
        executeManufacturerAutomata(G);
        executeResaleAutomata(G);
        
        // 少し待ってから次のフェーズに進む
        console.log('⏰ Scheduling transition to market phase in 2000ms');
        setTimeout(() => {
          console.log('🔄 Transitioning from automata to market phase');
          if (events && events.endPhase) {
            events.endPhase();
          } else {
            console.error('❌ events.endPhase not available in automata phase');
          }
        }, 2000);
      },
      next: 'market'
    },

    market: {
      moves: {},
      onBegin: ({ G, events }) => {
        console.log('🏪 Market phase started: executing market actions');
        executeMarketPhase(G);
        
        // 少し待ってから次のフェーズに進む
        console.log('⏰ Scheduling transition to action phase in 2000ms');
        setTimeout(() => {
          console.log('🔄 Transitioning from market to action phase');
          if (events && events.endPhase) {
            events.endPhase();
          } else {
            console.error('❌ events.endPhase not available in market phase');
          }
        }, 2000);
      },
      next: 'action',
      onEnd: ({ G }) => {
        G.round++;
        console.log(`🎮 Starting round ${G.round}`);
        
        // 勝利条件チェック
        for (const playerId in G.players) {
          if (checkVictoryConditions(G.players[playerId])) {
            G.gameEnded = true;
            G.winner = playerId;
            G.phase = 'victory';
            console.log(`🏆 Game ended! Winner: ${G.players[playerId].name}`);
            break;
          }
        }
      }
    },

    victory: {
      moves: {},
      turn: {
        order: {
          first: () => 0,
          next: () => undefined,
        }
      }
    }
  },
  
  turn: {
    order: {
      first: () => 0,
      next: ({ ctx }) => (ctx.playOrderPos + 1) % ctx.numPlayers,
    }
  },
  
  // フェーズ終了用のイベント
  events: {
    endPhase: true,
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
  if (player.prestige <= -3) return 'INVALID_MOVE';
  
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
  if (diceSum <= 4) action = 'high-cost';
  else if (diceSum <= 7) action = 'mid-cost';
  else if (diceSum <= 10) action = 'low-cost';
  else action = 'clearance';
  
  if (action === 'clearance') {
    for (const product of G.automata.market) {
      product.price = Math.max(1, product.price - 2);
    }
  } else {
    let targetCost: number;
    if (action === 'high-cost') {
      do { targetCost = rollDice(); } while (targetCost < 3);
    } else if (action === 'mid-cost') {
      targetCost = 3;
    } else {
      do { targetCost = rollDice(); } while (targetCost > 3);
    }
    
    const product: Product = {
      id: `automata-product-${Date.now()}`,
      cost: targetCost,
      price: targetCost * (action === 'high-cost' ? 3 : 2),
      popularity: 1,
      playerId: 'manufacturer-automata',
      isResale: false
    };
    
    G.automata.market.push(product);
  }
}

function executeResaleAutomata(G: GameState): void {
  if (G.automata.resaleOrganizationMoney < 20) {
    G.automata.resaleOrganizationMoney = 20;
  }
  
  const diceSum = rollDice() + rollDice();
  
  if (diceSum >= 6 && diceSum <= 8) return;
  
  const allProducts: Product[] = [];
  for (const playerId in G.players) {
    allProducts.push(...G.players[playerId].personalMarket);
  }
  allProducts.push(...G.automata.market);
  
  let targetProducts: Product[] = [];
  
  if (diceSum <= 4) {
    targetProducts = allProducts
      .sort((a, b) => a.price - b.price || b.popularity - a.popularity)
      .slice(0, 3);
  } else if (diceSum === 5 || diceSum === 9) {
    targetProducts = allProducts
      .sort((a, b) => b.popularity - a.popularity || a.price - b.price)
      .slice(0, 1);
  } else if (diceSum >= 10) {
    const randomIndex = Math.floor(Math.random() * allProducts.length);
    targetProducts = [allProducts[randomIndex]];
  }
  
  for (const product of targetProducts) {
    if (G.automata.resaleOrganizationMoney >= product.price) {
      G.automata.resaleOrganizationMoney -= product.price;
      
      const resaleProduct: Product = {
        ...product,
        id: `resale-${Date.now()}`,
        price: product.price + 5,
        isResale: true,
        originalCost: product.cost,
        originalPlayerId: product.playerId,
        playerId: 'resale-automata'
      };
      
      G.automata.market.push(resaleProduct);
      
      const originalPlayer = G.players[product.playerId];
      if (originalPlayer) {
        originalPlayer.money += product.price;
        const productIndex = originalPlayer.personalMarket.findIndex(p => p.id === product.id);
        if (productIndex !== -1) {
          originalPlayer.personalMarket.splice(productIndex, 1);
        }
      }
      
      G.marketPollution++;
    }
  }
}

function executeMarketPhase(G: GameState): void {
  const demandDice = rollDice() + rollDice();
  
  const allProducts: Product[] = [];
  for (const playerId in G.players) {
    allProducts.push(...G.players[playerId].personalMarket);
  }
  allProducts.push(...G.automata.market);
  
  const eligibleProducts = allProducts.filter(product => {
    const demandValues = getDemandValue(product.cost);
    return demandValues.includes(demandDice);
  });
  
  eligibleProducts.sort((a, b) => b.popularity - a.popularity || a.price - b.price);
  
  const purchasedProducts = eligibleProducts.slice(0, 5);
  
  for (const product of purchasedProducts) {
    const actualPrice = Math.max(1, product.price - getPollutionPenalty(G.marketPollution));
    
    if (product.playerId === 'manufacturer-automata' || product.playerId === 'resale-automata') {
      const productIndex = G.automata.market.findIndex(p => p.id === product.id);
      if (productIndex !== -1) {
        G.automata.market.splice(productIndex, 1);
      }
    } else {
      const player = G.players[product.playerId];
      if (player) {
        player.money += actualPrice;
        const productIndex = player.personalMarket.findIndex(p => p.id === product.id);
        if (productIndex !== -1) {
          player.personalMarket.splice(productIndex, 1);
        }
      }
    }
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
  
  const targetPlayer = G.players[targetPlayerId];
  if (!targetPlayer) return 'INVALID_MOVE';
  
  const product = targetPlayer.personalMarket.find(p => p.id === productId);
  if (!product) return 'INVALID_MOVE';
  
  player.prestige -= 1;
  player.actionPoints -= 1;
  
  if (isPositive) {
    product.popularity = Math.min(6, product.popularity + 1);
  } else {
    product.popularity = Math.max(1, product.popularity - 1);
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
  if (player.prestige < 1) return 'INVALID_MOVE';
  
  const targetPlayer = G.players[targetPlayerId];
  if (!targetPlayer) return 'INVALID_MOVE';
  
  const productIndex = targetPlayer.personalMarket.findIndex(p => p.id === productId);
  if (productIndex === -1) return 'INVALID_MOVE';
  
  const product = targetPlayer.personalMarket[productIndex];
  if (player.money < product.price) return 'INVALID_MOVE';
  
  const resaleBonus = getResaleBonus(player.resaleHistory);
  const maxResalePrice = Math.min(24, product.price + resaleBonus);
  
  if (resalePrice > maxResalePrice) return 'INVALID_MOVE';
  
  player.money -= product.price;
  targetPlayer.money += product.price;
  player.actionPoints -= 2;
  player.prestige -= 1;
  player.resaleHistory += 1;
  
  targetPlayer.personalMarket.splice(productIndex, 1);
  
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
  
  const regulationDice = rollDice() + rollDice();
  if (regulationDice >= 9) {
    G.regulationLevel++;
    
    if (G.regulationLevel >= 3) {
      for (const playerId in G.players) {
        const p = G.players[playerId];
        p.personalMarket = p.personalMarket.filter(product => !product.isResale);
        p.money -= p.resaleHistory * 2;
      }
      
      G.automata.market = G.automata.market.filter(product => !product.isResale);
    }
  }
  
  player.actionPoints -= 2;
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
    player.prestige -= effect.cost.prestige;
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
  console.log(`🌟 Executing trend effect: ${effect.name}`);
  
  switch (effect.name) {
    case '経済特需':
      for (const pid in G.players) {
        G.players[pid].money += 15;
      }
      console.log('📈 All players gained 15 money');
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
            console.log(`Product ${product.id} popularity: ${oldPopularity} → ${product.popularity}`);
          }
        }
        console.log(`📱 All products of player ${playerId} gained +1 popularity`);
      }
      break;
      
    case '汚染改善キャンペーン':
      G.marketPollution = Math.max(0, G.marketPollution - 2);
      console.log(`🌱 Market pollution reduced by 2, now: ${G.marketPollution}`);
      break;
      
    case 'テレワーク需要':
      // 価格10以下の全商品の人気度+1
      for (const pid in G.players) {
        for (const product of G.players[pid].personalMarket) {
          if (product.price > 0 && product.price <= 10) {
            const oldPopularity = product.popularity;
            product.popularity = Math.min(6, product.popularity + 1);
            if (product.popularity !== oldPopularity) {
              console.log(`Product ${product.id} popularity: ${oldPopularity} → ${product.popularity}`);
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
      
    case 'サステナビリティ':
      // プレイヤーが任意の商品の人気度を+3できる（実装は簡易版：自分の商品全てに+1）
      const sustainabilityPlayer = G.players[playerId];
      if (sustainabilityPlayer) {
        for (const product of sustainabilityPlayer.personalMarket) {
          const oldPopularity = product.popularity;
          product.popularity = Math.min(6, product.popularity + 1);
          if (product.popularity !== oldPopularity) {
            console.log(`Product ${product.id} popularity: ${oldPopularity} → ${product.popularity}`);
          }
        }
      }
      break;
      
    default:
      console.log(`Unknown trend effect: ${effect.name}`);
      break;
  }
}

export default MarketDisruption;