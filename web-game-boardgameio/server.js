const { Server, Origins } = require('boardgame.io/server');

// プロセス終了時のハンドリング
process.on('SIGTERM', () => {
  console.log('📡 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📡 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// ヘルパー関数
const rollDice = (sides = 6) => Math.floor(Math.random() * sides) + 1;
const rollMultipleDice = (count, sides = 6) => Array.from({ length: count }, () => rollDice(sides));

const getDemandValue = (cost) => {
  const demandMap = {
    1: [6, 7, 8],
    2: [5, 9], 
    3: [4, 10],
    4: [3, 11],
    5: [2, 12]
  };
  return demandMap[cost] || [];
};

const checkVictoryConditions = (player) => {
  return (player.prestige >= 17 && player.money >= 75) || player.money >= 150;
};

const getMaxPrice = (cost, prestige) => {
  if (prestige >= 9) return cost * 4;
  if (prestige >= 3) return cost * 3;
  return cost * 2;
};

const getResaleBonus = (resaleHistory) => {
  if (resaleHistory <= 1) return 5;
  if (resaleHistory <= 4) return 8;
  if (resaleHistory <= 7) return 11;
  return 15;
};

// ログ記録ヘルパー関数
const addToPlayLog = (G, ctx, actor, action, details) => {
  if (!G.playLog) G.playLog = [];
  G.playLog.push({
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    round: G.round,
    phase: ctx?.phase || G.phase,
    actor,
    action,
    details,
    timestamp: Date.now()
  });
};

// Initial game state functions
const initialGameState = {
  players: {},
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
  playLog: [],
  gameEnded: false,
  winner: null
};

const createInitialPlayer = (id, name) => ({
  id,
  name,
  money: 30,
  prestige: 5,
  resaleHistory: 0,
  actionPoints: 3,
  designs: [],
  personalMarket: []
});

// 本格的なゲーム定義
const MarketDisruption = {
  name: 'MarketDisruption',
  setup: ({ ctx }) => {
    const G = { ...initialGameState };
    
    // プレイヤー初期化
    for (let i = 0; i < ctx.numPlayers; i++) {
      const playerId = String(i);
      G.players[playerId] = createInitialPlayer(playerId, `Player ${i + 1}`);
      
      // 設計図をランダムに生成（TypeScript版と同じロジック）
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
    manufacture: ({ G, ctx }, designId) => {
      const player = G.players[ctx.currentPlayer];
      if (!player || player.actionPoints < 1) {
        console.error('Manufacture: Player not found or insufficient AP');
        return;
      }
      
      // actionフェーズでのみ製造可能
      if (ctx.phase !== 'action') {
        console.error('Manufacture: Not in action phase');
        return;
      }
      
      const design = player.designs.find(d => d.id === designId);
      if (!design || player.money < design.cost) {
        console.error('Manufacture: Design not found or insufficient money', { designId, playerMoney: player.money, designCost: design?.cost });
        return;
      }
      
      player.money -= design.cost;
      player.actionPoints -= 1;
      
      const product = {
        id: `product-${ctx.currentPlayer}-${Date.now()}`,
        cost: design.cost,
        price: 0,
        popularity: 1,
        playerId: ctx.currentPlayer,
        isResale: false
      };
      
      player.personalMarket.push(product);
      console.log(`Manufacture: Successfully created product ${product.id} with cost ${design.cost}`);
      
      addToPlayLog(G, ctx, ctx.currentPlayer, '製造', `コスト${design.cost}の商品を製造`);
    },
    
    sell: ({ G, ctx }, productId, price) => {
      const player = G.players[ctx.currentPlayer];
      if (!player || player.actionPoints < 1) {
        console.error('Sell: Player not found or insufficient AP');
        return;
      }
      
      // actionフェーズでのみ販売可能
      if (ctx.phase !== 'action') {
        console.error('Sell: Not in action phase');
        return;
      }
      
      if (!productId || typeof price !== 'number' || price <= 0 || !Number.isInteger(price)) {
        console.error('Sell: Invalid parameters', { productId, price, priceType: typeof price });
        return;
      }
      
      const product = player.personalMarket.find(p => p.id === productId && p.price === 0);
      if (!product) {
        console.error('Sell: Product not found or already priced', { 
          productId, 
          personalMarket: player.personalMarket.map(p => ({ id: p.id, price: p.price }))
        });
        return;
      }
      
      product.price = price;
      player.actionPoints -= 1;
      console.log(`Sell: Successfully set price ${price} for product ${productId}`);
      
      addToPlayLog(G, ctx, ctx.currentPlayer, '販売設定', `商品を${price}資金で販売設定`);
    },
    
    purchase: ({ G, ctx }, targetPlayerId, productId) => {
      const player = G.players[ctx.currentPlayer];
      if (!player || player.actionPoints < 1) return 'INVALID_MOVE';
      
      if (ctx.phase !== 'action') return 'INVALID_MOVE';
      
      // オートマからの購入の場合
      if (targetPlayerId === 'automata') {
        const productIndex = G.automata.market.findIndex(p => p.id === productId);
        if (productIndex === -1) return 'INVALID_MOVE';
        
        const product = G.automata.market[productIndex];
        if (player.money < product.price) return 'INVALID_MOVE';
        
        player.money -= product.price;
        player.actionPoints -= 1;
        
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
    },
    
    partTimeWork: ({ G, ctx }) => {
      const player = G.players[ctx.currentPlayer];
      if (!player || player.actionPoints < 2) {
        console.error('PartTimeWork: Player not found or insufficient AP');
        return;
      }
      
      // actionフェーズでのみ実行可能
      if (ctx.phase !== 'action') {
        console.error('PartTimeWork: Not in action phase');
        return;
      }
      
      player.money += 5;
      player.actionPoints -= 2;
      console.log(`PartTimeWork: Player ${ctx.currentPlayer} earned 5 money`);
      
      addToPlayLog(G, ctx, ctx.currentPlayer, 'アルバイト', '5資金を獲得');
    },
    
    design: ({ G, ctx }, isOpenSource = false) => {
      const player = G.players[ctx.currentPlayer];
      if (!player || player.actionPoints < 2) {
        console.error('Design: Player not found or insufficient AP');
        return;
      }
      if (player.designs.length >= 6) {
        console.error('Design: Too many designs');
        return;
      }
      
      // actionフェーズでのみ実行可能
      if (ctx.phase !== 'action') {
        console.error('Design: Not in action phase');
        return;
      }
      
      const designDice = rollMultipleDice(3);
      const selectedCost = designDice[Math.floor(Math.random() * 3)];
      
      const newDesign = {
        id: `design-${ctx.currentPlayer}-${Date.now()}`,
        cost: selectedCost,
        isOpenSource
      };
      
      player.designs.push(newDesign);
      player.actionPoints -= 2;
      
      if (isOpenSource) {
        player.prestige += 2;
        console.log(`Design: Player ${ctx.currentPlayer} created open-source design with cost ${selectedCost}, gained 2 prestige`);
        addToPlayLog(G, ctx, ctx.currentPlayer, 'オープンソース設計', `コスト${selectedCost}の設計を作成、威厳+2`);
      } else {
        console.log(`Design: Player ${ctx.currentPlayer} created design with cost ${selectedCost}`);
        addToPlayLog(G, ctx, ctx.currentPlayer, '設計', `コスト${selectedCost}の設計を作成`);
      }
    },
    
    dayLabor: ({ G, ctx }) => {
      const player = G.players[ctx.currentPlayer];
      if (!player || player.actionPoints < 3) {
        console.error('DayLabor: Player not found or insufficient AP');
        return;
      }
      if (player.money > 100) {
        console.error('DayLabor: Player has too much money');
        return;
      }
      
      // actionフェーズでのみ実行可能
      if (ctx.phase !== 'action') {
        console.error('DayLabor: Not in action phase');
        return;
      }
      
      player.money += 18;
      player.actionPoints -= 3;
      console.log(`DayLabor: Player ${ctx.currentPlayer} earned 18 money`);
      
      addToPlayLog(G, ctx, ctx.currentPlayer, '日雇い労働', '18資金を獲得');
    },
    
    review: ({ G, ctx }, targetPlayerId, productId, isPositive) => {
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
    },
    
    research: ({ G, ctx }) => {
      const player = G.players[ctx.currentPlayer];
      if (!player || player.actionPoints < 1) {
        console.error('Research: Player not found or insufficient AP');
        return;
      }
      
      // actionフェーズでのみ実行可能
      if (ctx.phase !== 'action') {
        console.error('Research: Not in action phase');
        return;
      }
      
      player.actionPoints -= 1;
      
      // トレンドダイス3個を振る
      const trendDice = rollMultipleDice(3);
      const trendSum = trendDice.reduce((sum, die) => sum + die, 0);
      
      // トレンドバズテーブルに基づく効果を提供
      const trendEffects = getTrendEffect(trendSum);
      
      console.log(`🔬 Research: Player ${ctx.currentPlayer} rolled trend dice ${trendDice.join(',')} (sum: ${trendSum})`);
      console.log(`📊 Trend Effect: ${trendEffects.name} - ${trendEffects.description}`);
      
      // 研究結果をゲーム状態に保存（プレイヤーが効果発動を選択できるように）
      if (!G.availableTrends) G.availableTrends = {};
      G.availableTrends[ctx.currentPlayer] = {
        sum: trendSum,
        effect: trendEffects,
        playerId: ctx.currentPlayer
      };
      
      addToPlayLog(G, ctx, ctx.currentPlayer, 'リサーチ', `トレンド調査: ${trendEffects.name}`);
    },

    activateTrend: ({ G, ctx }) => {
      const player = G.players[ctx.currentPlayer];
      if (!player) {
        console.error('ActivateTrend: Player not found');
        return;
      }

      if (!G.availableTrends || !G.availableTrends[ctx.currentPlayer]) {
        console.error('ActivateTrend: No available trend for player');
        return;
      }

      const trendData = G.availableTrends[ctx.currentPlayer];
      const effect = trendData.effect;

      // コストチェック
      if (effect.cost && effect.cost.prestige && player.prestige < effect.cost.prestige) {
        console.error('ActivateTrend: Insufficient prestige');
        return;
      }

      // コスト支払い
      if (effect.cost && effect.cost.prestige) {
        player.prestige -= effect.cost.prestige;
      }

      // 効果実行
      executeTrendEffect(G, effect, ctx.currentPlayer);

      // トレンドを消費
      delete G.availableTrends[ctx.currentPlayer];

      addToPlayLog(G, ctx, ctx.currentPlayer, 'トレンド発動', `${effect.name}を発動`);
    },
    
    buyBack: ({ G, ctx }, productId) => {
      const player = G.players[ctx.currentPlayer];
      if (!player || player.actionPoints < 1) return 'INVALID_MOVE';
      
      const productIndex = player.personalMarket.findIndex(p => p.id === productId);
      if (productIndex === -1) return 'INVALID_MOVE';
      
      player.personalMarket.splice(productIndex, 1);
      player.actionPoints -= 1;
    },
    
    discontinue: ({ G, ctx }, designId) => {
      const player = G.players[ctx.currentPlayer];
      if (!player || player.actionPoints < 1) return 'INVALID_MOVE';
      
      const designIndex = player.designs.findIndex(d => d.id === designId);
      if (designIndex === -1) return 'INVALID_MOVE';
      
      player.designs.splice(designIndex, 1);
      player.actionPoints -= 1;
    },
    
    resale: ({ G, ctx }, targetPlayerId, productId, resalePrice) => {
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
      
      const resaleProduct = {
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
    },
    
    promoteRegulation: ({ G, ctx }) => {
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
  },
  
  minPlayers: 1,
  maxPlayers: 4,
  
  phases: {
    action: {
      start: true,
      next: 'automata',
      turn: {
        order: {
          first: () => 0,
          next: ({ ctx }) => {
            if (ctx.numPlayers === 1) {
              return 0; // 1人プレイの場合は常に同じプレイヤー
            }
            return (ctx.playOrderPos + 1) % ctx.numPlayers;
          },
        }
      },
      // フェーズ終了は手動で制御（ボタンクリック時）
      endIf: () => false,
      onEnd: ({ G }) => {
        console.log('Action phase ending - resetting AP for all players');
        for (const playerId in G.players) {
          G.players[playerId].actionPoints = 3;
        }
      }
    },
    
    automata: {
      moves: {},
      onBegin: ({ G }) => {
        console.log('🤖 Automata phase started: executing automata actions');
        executeManufacturerAutomata(G);
        executeResaleAutomata(G);
        console.log('✅ Automata actions completed');
      },
      // automataフェーズは即座に終了する
      endIf: () => true,
      next: 'market'
    },
    
    market: {
      moves: {},
      onBegin: ({ G }) => {
        console.log('🏪 Market phase started: executing market actions');
        executeMarketPhase(G);
        console.log('✅ Market actions completed');
      },
      // marketフェーズも即座に終了する
      endIf: () => true,
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
  
  endIf: ({ G }) => {
    if (G.gameEnded) {
      return { winner: G.winner };
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

// オートマ実行関数
function executeManufacturerAutomata(G) {
  const diceSum = rollDice() + rollDice();
  
  let action;
  let targetCost;
  let priceMultiplier;
  
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
    console.log(`🤖 Manufacturer Automata: dice=${diceSum}, action=clearance`);
    console.log(`📦 Clearance: reduced prices of ${G.automata.market.length} products`);
    return;
  }
  
  console.log(`🤖 Manufacturer Automata: dice=${diceSum}, action=${action}`);
  
  // 製造アクション
  const product = {
    id: `manufacturer-automata-${Date.now()}`,
    cost: targetCost,
    price: targetCost * priceMultiplier,
    popularity: 1,
    playerId: 'manufacturer-automata',
    isResale: false
  };
  
  G.automata.market.push(product);
  console.log(`🏭 Manufacturer created product: cost=${targetCost}, price=${product.price}`);
  
  addToPlayLog(G, null, 'manufacturer-automata', '製造', `コスト${targetCost}、価格${product.price}の商品を製造`);
  
  // 副行動（レビュー）
  if (action === 'high-cost') {
    // 市場最高価格商品に低評価レビュー
    const allProducts = [];
    for (const playerId in G.players) {
      allProducts.push(...G.players[playerId].personalMarket);
    }
    allProducts.push(...G.automata.market.filter(p => p.id !== product.id)); // 自分の新商品は除外
    
    if (allProducts.length > 0) {
      const highestPriceProducts = allProducts
        .filter(p => p.price > 0)
        .sort((a, b) => b.price - a.price);
      
      if (highestPriceProducts.length > 0) {
        const targetProduct = highestPriceProducts[0];
        targetProduct.popularity = Math.max(1, targetProduct.popularity - 1);
        console.log(`👎 Manufacturer gave negative review to product ${targetProduct.id} (price: ${targetProduct.price})`);
        
        addToPlayLog(G, null, 'manufacturer-automata', 'レビュー', `価格${targetProduct.price}の商品に低評価`);
      }
    }
  } else if (action === 'low-cost') {
    // 自分の最安商品に高評価レビュー
    const ownProducts = G.automata.market.filter(p => p.price > 0);
    if (ownProducts.length > 0) {
      const cheapestProduct = ownProducts.sort((a, b) => a.price - b.price)[0];
      cheapestProduct.popularity = Math.min(6, cheapestProduct.popularity + 1);
      console.log(`👍 Manufacturer gave positive review to own product ${cheapestProduct.id} (price: ${cheapestProduct.price})`);
      
      addToPlayLog(G, null, 'manufacturer-automata', 'レビュー', `価格${cheapestProduct.price}の自商品に高評価`);
    }
  }
}

function executeResaleAutomata(G) {
  // 資金管理：各ターン開始時に20資金まで自動補充
  if (G.automata.resaleOrganizationMoney < 20) {
    G.automata.resaleOrganizationMoney = 20;
  }
  
  const diceSum = rollDice() + rollDice();
  console.log(`🔄 Resale Automata: dice=${diceSum}, money=${G.automata.resaleOrganizationMoney}`);
  
  // 様子見（6,7,8）
  if (diceSum >= 6 && diceSum <= 8) {
    console.log('📋 Resale Automata: no action (watching market)');
    return;
  }
  
  // 全プレイヤーとオートマのマーケットから商品を取得
  const allProducts = [];
  for (const playerId in G.players) {
    for (const product of G.players[playerId].personalMarket) {
      if (product.price > 0) { // 価格が設定されている商品のみ
        allProducts.push({...product, sourcePlayerId: playerId, sourceType: 'player'});
      }
    }
  }
  for (const product of G.automata.market) {
    if (product.price > 0 && !product.isResale) { // 転売品ではない商品のみ
      allProducts.push({...product, sourcePlayerId: 'automata', sourceType: 'automata'});
    }
  }
  
  let targetProducts = [];
  let resalePrice = 0;
  
  if (diceSum <= 4) {
    // 大量買い占め：最安値商品を3個まで
    targetProducts = allProducts
      .filter(p => p.price > 0)
      .sort((a, b) => a.price - b.price || b.popularity - a.popularity)
      .slice(0, 3);
    resalePrice = 5; // 購入価格+5資金
  } else if (diceSum === 5 || diceSum === 9) {
    // 選別購入：人気度最高の商品を1個
    targetProducts = allProducts
      .filter(p => p.price > 0)
      .sort((a, b) => b.popularity - a.popularity || a.price - b.price)
      .slice(0, 1);
    resalePrice = 5; // 購入価格+5資金
  } else if (diceSum >= 10) {
    // 投機購入：ランダム商品を1個
    if (allProducts.length > 0) {
      const randomIndex = Math.floor(Math.random() * allProducts.length);
      targetProducts = [allProducts[randomIndex]];
    }
    resalePrice = 8; // 購入価格+8資金
  }
  
  console.log(`🎯 Resale Automata targeting ${targetProducts.length} products`);
  
  for (const product of targetProducts) {
    if (G.automata.resaleOrganizationMoney >= product.price) {
      // 購入処理
      G.automata.resaleOrganizationMoney -= product.price;
      
      // 転売商品として出品
      const resaleProduct = {
        id: `resale-automata-${Date.now()}`,
        cost: product.cost,
        price: product.price + resalePrice,
        popularity: product.popularity,
        playerId: 'resale-automata',
        isResale: true,
        originalCost: product.cost,
        originalPlayerId: product.playerId
      };
      
      G.automata.market.push(resaleProduct);
      
      // 元の商品を削除し、売上を元の所有者に渡す
      if (product.sourceType === 'player') {
        const originalPlayer = G.players[product.sourcePlayerId];
        if (originalPlayer) {
          originalPlayer.money += product.price;
          const productIndex = originalPlayer.personalMarket.findIndex(p => p.id === product.id);
          if (productIndex !== -1) {
            originalPlayer.personalMarket.splice(productIndex, 1);
          }
        }
      } else {
        // オートマの商品の場合、マーケットから削除
        const productIndex = G.automata.market.findIndex(p => p.id === product.id);
        if (productIndex !== -1) {
          G.automata.market.splice(productIndex, 1);
        }
      }
      
      // 市場汚染レベル増加
      G.marketPollution++;
      console.log(`💰 Resale: bought product for ${product.price}, selling for ${resaleProduct.price}, pollution: ${G.marketPollution}`);
      
      addToPlayLog(G, null, 'resale-automata', '転売', `${product.price}資金で購入、${resaleProduct.price}資金で転売`);
    }
  }
}

function executeMarketPhase(G) {
  const demandDice = rollDice() + rollDice();
  console.log(`🎲 Market phase: demand dice=${demandDice}`);
  
  const allProducts = [];
  for (const playerId in G.players) {
    allProducts.push(...G.players[playerId].personalMarket);
  }
  allProducts.push(...G.automata.market);
  
  const eligibleProducts = allProducts.filter(product => {
    const demandValues = getDemandValue(product.cost);
    return demandValues.includes(demandDice);
  });
  
  console.log(`📈 ${eligibleProducts.length} products eligible for purchase`);
  
  eligibleProducts.sort((a, b) => b.popularity - a.popularity || a.price - b.price);
  
  const purchasedProducts = eligibleProducts.slice(0, 5);
  console.log(`🛒 ${purchasedProducts.length} products purchased`);
  
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
    
    console.log(`✅ Sold product: ${product.cost}/${product.price} for ${actualPrice} to player ${product.playerId}`);
  }
}

function getPollutionPenalty(pollutionLevel) {
  if (pollutionLevel <= 2) return 0;
  if (pollutionLevel <= 5) return 1;
  if (pollutionLevel <= 8) return 2;
  if (pollutionLevel <= 11) return 3;
  return 4;
}

const getTrendEffect = (sum) => {
  const effects = {
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
    13: { name: 'インフレ進行', description: '全ての転売ではない商品の価格+2（発動後永続）', cost: null },
    14: { name: 'テレワーク需要', description: '価格10以下の全商品の人気度を+1', cost: null },
    15: { name: 'DIYブーム', description: '全てのプレイヤーの最新設計のダイス値-1', cost: null },
    16: { name: 'サステナビリティ', description: '任意の商品の人気度を+3（任意の組み合わせ）', cost: { prestige: 1 } },
    17: { name: '汚染改善キャンペーン', description: '市場汚染レベルを-2', cost: null },
    18: { name: '経済特需', description: '全プレイヤーに+15資金', cost: null }
  };
  
  return effects[sum] || { name: '無効果', description: '特に変化なし', cost: null };
};

const executeTrendEffect = (G, effect, playerId) => {
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
          product.popularity = Math.min(6, product.popularity + 1);
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
            product.popularity = Math.min(6, product.popularity + 1);
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
      console.log('💸 All non-resale products gained +2 price');
      break;
      
    default:
      console.log(`⚠️ Trend effect ${effect.name} not implemented yet`);
  }
};

const server = Server({
  games: [MarketDisruption],
  origins: [
    Origins.LOCALHOST_IN_DEVELOPMENT, 
    Origins.LOCALHOST,
    // Netlify本番URL（具体的なドメイン）
    'https://market-disruption.netlify.app',
    // Netlifyのプレビュードメイン
    /^https:\/\/.*--market-disruption\.netlify\.app$/,
    // 一般的なNetlifyドメイン
    /^https:\/\/.*\.netlify\.app$/,
    // Railway本番URL  
    /^https:\/\/.*\.railway\.app$/
  ],
});

// Koaミドルウェアとして直接APIルートを追加
server.app.use(async (ctx, next) => {
  // API ルートの処理
  if (ctx.path === '/api/status') {
    ctx.type = 'application/json';
    ctx.body = {
      status: 'running',
      version: '2025-07-30-v3-api',
      timestamp: new Date().toISOString(),
      game: 'MarketDisruption',
      availableMoves: Object.keys(MarketDisruption.moves),
      moveCount: Object.keys(MarketDisruption.moves).length,
      criticalMoves: {
        partTimeWork: Object.keys(MarketDisruption.moves).includes('partTimeWork'),
        design: Object.keys(MarketDisruption.moves).includes('design'),
        dayLabor: Object.keys(MarketDisruption.moves).includes('dayLabor'),
        purchase: Object.keys(MarketDisruption.moves).includes('purchase')
      },
      endpoints: [
        'GET /api/status - Server status',
        'GET /api/moves - List all moves'
      ]
    };
    return;
  }
  
  if (ctx.path === '/api/moves') {
    ctx.type = 'application/json';
    const moves = {};
    Object.keys(MarketDisruption.moves).forEach(moveName => {
      moves[moveName] = {
        name: moveName,
        available: true
      };
    });

    ctx.body = {
      moves,
      count: Object.keys(moves).length,
      list: Object.keys(moves),
      criticalMovesCheck: {
        partTimeWork: Object.keys(MarketDisruption.moves).includes('partTimeWork') ? '✅ FOUND' : '❌ MISSING',
        design: Object.keys(MarketDisruption.moves).includes('design') ? '✅ FOUND' : '❌ MISSING',
        dayLabor: Object.keys(MarketDisruption.moves).includes('dayLabor') ? '✅ FOUND' : '❌ MISSING',
        purchase: Object.keys(MarketDisruption.moves).includes('purchase') ? '✅ FOUND' : '❌ MISSING'
      }
    };
    return;
  }
  
  // その他の場合は次のミドルウェアへ
  await next();
});

console.log('Server origins configured:', [
  'Origins.LOCALHOST_IN_DEVELOPMENT', 
  'Origins.LOCALHOST',
  'https://market-disruption.netlify.app',
  'https://*.netlify.app (regex)',
  'https://*.railway.app (regex)'
]);

const port = process.env.PORT || 8000;

console.log('Starting Market Disruption server with configuration:');
console.log('PORT:', port);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Server version: 2025-07-30-v3-api (Debug API enabled)');

// boardgame.ioサーバー起動
server.run(port, () => {
  console.log(`✅ Boardgame.io server successfully running on port ${port}`);
  console.log(`🎮 Game available at: http://localhost:${port}/games`);
  console.log(`🔗 Health check: http://localhost:${port}/games`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // デバッグ: 利用可能なmovesをログ出力
  const moveNames = Object.keys(MarketDisruption.moves);
  console.log(`🎯 Available moves (${moveNames.length}):`, moveNames.join(', '));
  
  // 問題のあるmovesを個別チェック
  const criticalMoves = ['partTimeWork', 'design', 'dayLabor', 'purchase'];
  console.log('🔍 Critical moves check:');
  criticalMoves.forEach(move => {
    const exists = moveNames.includes(move);
    console.log(`  - ${move}: ${exists ? '✅ FOUND' : '❌ MISSING'}`);
  });
  
  // 完全な問題診断情報
  console.log('🔧 COMPLETE DIAGNOSTIC INFORMATION:');
  console.log('='.repeat(50));
  console.log(`📅 Server Start Time: ${new Date().toISOString()}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🎯 Game Definition:`, MarketDisruption.name);
  console.log(`📊 Total Moves Available: ${moveNames.length}`);
  console.log(`📋 Complete Move List:`);
  moveNames.forEach((move, index) => {
    console.log(`   ${index + 1}. ${move} ✅`);
  });
  console.log('='.repeat(50));
  
  // API endpoints are disabled for now - focusing on core game functionality
  console.log('💡 To test moves, use the web interface and check browser console');
  console.log('🌐 Game URL: https://market-disruption.netlify.app');
  console.log('🔍 If buttons still not working, the issue is browser cache.');
  console.log('⚡ Solution: Hard refresh (Ctrl+F5) or clear browser cache');
  console.log('='.repeat(50));
}).catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});