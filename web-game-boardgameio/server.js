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
      if (!player || player.actionPoints < 1) return 'INVALID_MOVE';
      
      const design = player.designs.find(d => d.id === designId);
      if (!design || player.money < design.cost) return 'INVALID_MOVE';
      
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
    },
    
    sell: ({ G, ctx }, productId, price) => {
      const player = G.players[ctx.currentPlayer];
      if (!player || player.actionPoints < 1) return 'INVALID_MOVE';
      
      if (!productId || typeof price !== 'number' || price <= 0 || !Number.isInteger(price)) {
        return 'INVALID_MOVE';
      }
      
      const product = player.personalMarket.find(p => p.id === productId && p.price === 0);
      if (!product) return 'INVALID_MOVE';
      
      product.price = price;
      player.actionPoints -= 1;
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
      if (!player || player.actionPoints < 2) return 'INVALID_MOVE';
      
      player.money += 5;
      player.actionPoints -= 2;
    },
    
    design: ({ G, ctx }, isOpenSource = false) => {
      const player = G.players[ctx.currentPlayer];
      if (!player || player.actionPoints < 2) return 'INVALID_MOVE';
      if (player.designs.length >= 6) return 'INVALID_MOVE';
      
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
      }
    },
    
    dayLabor: ({ G, ctx }) => {
      const player = G.players[ctx.currentPlayer];
      if (!player || player.actionPoints < 3) return 'INVALID_MOVE';
      if (player.money > 100) return 'INVALID_MOVE';
      
      player.money += 18;
      player.actionPoints -= 3;
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
      if (!player || player.actionPoints < 1) return 'INVALID_MOVE';
      
      player.actionPoints -= 1;
      
      // Research provides 3d6 dice roll result (implementation simplified)
      rollMultipleDice(3);
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
      turn: {
        order: {
          first: () => 0,
          next: () => undefined,
        },
        onBegin: ({ G, events }) => {
          console.log('Automata phase: executing automata actions');
          executeManufacturerAutomata(G);
          executeResaleAutomata(G);
          
          // 自動的に次のフェーズに進む
          if (events && events.endPhase) {
            setTimeout(() => events.endPhase(), 1500);
          }
        }
      },
      next: 'market'
    },
    
    market: {
      moves: {},
      turn: {
        order: {
          first: () => 0,
          next: () => undefined,
        },
        onBegin: ({ G, events }) => {
          console.log('Market phase: executing market actions');
          executeMarketPhase(G);
          
          // 自動的に次のフェーズに進む
          if (events && events.endPhase) {
            setTimeout(() => events.endPhase(), 1500);
          }
        }
      },
      next: 'action',
      onEnd: ({ G }) => {
        G.round++;
        
        // 勝利条件チェック
        for (const playerId in G.players) {
          if (checkVictoryConditions(G.players[playerId])) {
            G.gameEnded = true;
            G.winner = playerId;
            G.phase = 'victory';
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
  if (diceSum <= 4) action = 'high-cost';
  else if (diceSum <= 7) action = 'mid-cost';
  else if (diceSum <= 10) action = 'low-cost';
  else action = 'clearance';
  
  console.log(`🤖 Manufacturer Automata: dice=${diceSum}, action=${action}`);
  
  if (action === 'clearance') {
    for (const product of G.automata.market) {
      product.price = Math.max(1, product.price - 2);
    }
    console.log(`📦 Clearance: reduced prices of ${G.automata.market.length} products`);
  } else {
    let targetCost;
    if (action === 'high-cost') {
      do { targetCost = rollDice(); } while (targetCost < 3);
    } else if (action === 'mid-cost') {
      targetCost = 3;
    } else {
      do { targetCost = rollDice(); } while (targetCost > 3);
    }
    
    const product = {
      id: `automata-product-${Date.now()}`,
      cost: targetCost,
      price: targetCost * (action === 'high-cost' ? 3 : 2),
      popularity: 1,
      playerId: 'manufacturer-automata',
      isResale: false
    };
    
    G.automata.market.push(product);
    console.log(`🏭 Manufacturer created product: cost=${targetCost}, price=${product.price}`);
  }
}

function executeResaleAutomata(G) {
  if (G.automata.resaleOrganizationMoney < 20) {
    G.automata.resaleOrganizationMoney = 20;
  }
  
  const diceSum = rollDice() + rollDice();
  console.log(`🔄 Resale Automata: dice=${diceSum}, money=${G.automata.resaleOrganizationMoney}`);
  
  if (diceSum >= 6 && diceSum <= 8) {
    console.log('📋 Resale Automata: no action (dice 6-8)');
    return;
  }
  
  const allProducts = [];
  for (const playerId in G.players) {
    allProducts.push(...G.players[playerId].personalMarket);
  }
  allProducts.push(...G.automata.market);
  
  let targetProducts = [];
  
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
  
  console.log(`🎯 Resale Automata targeting ${targetProducts.length} products`);
  
  for (const product of targetProducts) {
    if (G.automata.resaleOrganizationMoney >= product.price) {
      G.automata.resaleOrganizationMoney -= product.price;
      
      const resaleProduct = {
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
      console.log(`💰 Resale: bought product for ${product.price}, selling for ${resaleProduct.price}`);
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