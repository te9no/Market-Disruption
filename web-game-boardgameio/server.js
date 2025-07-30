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

// 簡単なゲーム定義を直接作成
const MarketDisruption = {
  name: 'MarketDisruption',
  setup: ({ ctx }) => {
    const G = {
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
    
    // プレイヤー初期化
    for (let i = 0; i < ctx.numPlayers; i++) {
      const playerId = String(i);
      G.players[playerId] = {
        id: playerId,
        name: `Player ${i + 1}`,
        money: 30,
        prestige: 5,
        resaleHistory: 0,
        actionPoints: 3,
        designs: [
          { id: `design-${playerId}-0`, cost: Math.floor(Math.random() * 6) + 1, isOpenSource: false },
          { id: `design-${playerId}-1`, cost: Math.floor(Math.random() * 6) + 1, isOpenSource: false }
        ],
        personalMarket: []
      };
    }
    
    return G;
  },
  
  moves: {
    manufacture: ({ G, ctx }, designId) => {
      const player = G.players[ctx.currentPlayer];
      if (player.actionPoints < 1) return 'INVALID_MOVE';
      
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
      console.log('Server sell action:', { productId, price, currentPlayer: ctx.currentPlayer });
      
      const player = G.players[ctx.currentPlayer];
      if (!player || player.actionPoints < 1) {
        console.log('Invalid move: insufficient AP or no player');
        return 'INVALID_MOVE';
      }
      
      if (!productId || typeof price !== 'number' || price <= 0 || !Number.isInteger(price)) {
        console.log('Invalid move: bad parameters', { productId, price, priceType: typeof price });
        return 'INVALID_MOVE';
      }
      
      const product = player.personalMarket.find(p => p.id === productId && p.price === 0);
      if (!product) {
        console.log('Invalid move: product not found or already priced', { productId, products: player.personalMarket.map(p => ({ id: p.id, price: p.price })) });
        return 'INVALID_MOVE';
      }
      
      product.price = price;
      player.actionPoints -= 1;
      console.log('Sell successful:', { productId, price });
    }
  },
  
  minPlayers: 1,
  maxPlayers: 4,
  
  phases: {
    action: {
      start: true,
      next: 'automata',
      onEnd: ({ G }) => {
        console.log('Action phase ending');
        // APリセット
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
        onBegin: ({ G }) => {
          console.log('Automata phase begin');
          // 簡単なオートマ処理
          G.round++;
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
        onBegin: ({ G }) => {
          console.log('Market phase begin');
          // 市場処理（簡単版）
        }
      },
      next: 'action'
    }
  },
  
  // フェーズ終了用のイベント
  events: {
    endPhase: true,
    endTurn: true
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

console.log('Server origins configured:', [
  'Origins.LOCALHOST_IN_DEVELOPMENT', 
  'Origins.LOCALHOST',
  'https://market-disruption.netlify.app',
  'https://*.netlify.app (regex)',
  'https://*.railway.app (regex)'
]);

const port = process.env.PORT || 8000;

console.log('Starting server with configuration:');
console.log('PORT:', port);
console.log('NODE_ENV:', process.env.NODE_ENV);

// boardgame.ioサーバー起動
server.run(port, () => {
  console.log(`✅ Boardgame.io server successfully running on port ${port}`);
  console.log(`🎮 Game available at: http://localhost:${port}/games`);
  console.log(`🔗 Health check: http://localhost:${port}/games`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
}).catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});