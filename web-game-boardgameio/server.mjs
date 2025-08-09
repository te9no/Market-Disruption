import { Server, Origins } from 'boardgame.io/server';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// ES Modules ローダーでTypeScriptコンパイル済みゲームをインポート
let MarketDisruption;

try {
  // ビルド済みファイルからゲーム定義をインポート
  const gameModule = await import('./dist/game/MarketDisruption.js');
  MarketDisruption = gameModule.default || gameModule.MarketDisruption;
  
  if (!MarketDisruption) {
    console.error('❌ Failed to load MarketDisruption game definition');
    process.exit(1);
  }
  
  console.log('✅ Successfully loaded MarketDisruption game from TypeScript');
  console.log('🎮 Available moves:', Object.keys(MarketDisruption.moves || {}));
  
} catch (error) {
  console.error('❌ Failed to import MarketDisruption game:', error);
  console.error('📝 Make sure to run "npm run build" first');
  process.exit(1);
}

// CORS設定
const corsOrigins = [
  // ローカル開発
  /^https?:\/\/localhost:\d+$/,
  /^https?:\/\/127\.0\.0\.1:\d+$/,
  // Netlify (フロントエンド)
  /^https:\/\/.*\.netlify\.app$/,
  // Railway本番URL  
  /^https:\/\/.*\.railway\.app$/
];

// Koa サーバーの作成
const server = Server({
  games: [MarketDisruption],
  origins: corsOrigins
});

const port = process.env.PORT || 8000;

server.run({ port: port }, () => {
  console.log('🚀 Market Disruption Server started successfully!');
  console.log(`🌐 Server running on port ${port}`);
  console.log(`🎮 Game available at: http://localhost:${port}/games`);
  console.log('📡 CORS enabled for:', corsOrigins.map(o => o.toString()));
  
  // デバッグ情報
  console.log('\n🔧 Debug Information:');
  console.log('='.repeat(50));
  console.log(`📅 Server Start Time: ${new Date().toISOString()}`);
  console.log(`🔧 Node Version: ${process.version}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  if (MarketDisruption.moves) {
    const moveNames = Object.keys(MarketDisruption.moves);
    console.log(`📊 Total Moves Available: ${moveNames.length}`);
    console.log(`🎯 Moves: ${moveNames.join(', ')}`);
  }
});