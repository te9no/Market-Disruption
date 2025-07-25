# 🚨 Railway デプロイエラー修正手順

## 問題の概要
Railway で `SIGTERM` エラーが発生している問題の修正手順

## 🔧 実施した修正

### 1. **サーバー設定の最適化**
- ✅ `package.json` にNode.jsバージョン指定
- ✅ プロセス終了シグナルの適切な処理
- ✅ メモリ使用量制限（512MB）
- ✅ 健康チェックエンドポイント追加

### 2. **Railway設定ファイル**
- ✅ `railway.toml` - ヘルスチェック設定
- ✅ `nixpacks.toml` - ビルド設定最適化

### 3. **プロセス管理**
```javascript
// SIGTERM/SIGINT ハンドリング
process.on('SIGTERM', () => {
  console.log('💤 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('🛑 Server closed');
    process.exit(0);
  });
});
```

## 🚀 代替デプロイオプション

### Option A: **Render** (推奨代替)
```bash
# Render でのデプロイ手順
1. render.com でアカウント作成
2. GitHub リポジトリを接続
3. "New Web Service" を選択
4. Root Directory: web-game/server
5. Build Command: npm install
6. Start Command: npm start
```

### Option B: **Fly.io**
```bash
# Fly.io でのデプロイ
1. fly.io でアカウント作成
2. fly CLI をインストール
3. cd web-game/server
4. fly apps create market-disruption-server
5. fly deploy
```

### Option C: **Heroku**
```bash
# Heroku でのデプロイ
1. heroku create market-disruption-server
2. git subtree push --prefix=web-game/server heroku main
```

## 🔧 Railway 再試行手順

### 1. **環境変数設定**
```
NODE_ENV=production
PORT=3001
ALLOWED_ORIGINS=https://your-netlify-app.netlify.app
```

### 2. **リソース設定**
- **Memory**: 512MB 以上
- **vCPU**: 0.5 以上
- **Region**: Tokyo (アジア向け) または Oregon (グローバル)

### 3. **ログ確認方法**
```bash
# Railway CLI でログ確認
railway logs --tail

# または Railway ダッシュボードで確認
```

## 🐛 トラブルシューティング

### SIGTERM エラーの原因
1. **メモリ不足** → メモリ制限を引き上げ
2. **プロセス終了処理** → graceful shutdown 実装済み
3. **ビルド失敗** → nixpacks.toml で修正済み
4. **依存関係** → package.json 最適化済み

### 確認すべきポイント
- [ ] Railway プロジェクトのメモリ設定
- [ ] 環境変数が正しく設定されているか
- [ ] GitHub 接続が正常か
- [ ] ルートディレクトリが `web-game/server` に設定されているか

## ✅ 成功の確認方法

### 1. **ヘルスチェック**
```bash
curl https://your-railway-app.railway.app/health
# 期待される応答: {"status":"OK","timestamp":"...","uptime":123}
```

### 2. **統計情報**
```bash
curl https://your-railway-app.railway.app/stats
# 期待される応答: {"games":0,"players":0,"memory":{...},"uptime":123}
```

### 3. **WebSocket接続テスト**
```javascript
// ブラウザコンソールで
const socket = io('https://your-railway-app.railway.app');
socket.on('connect', () => console.log('✅ Connected!'));
```

## 🔄 再デプロイ手順

1. **コード変更をプッシュ**
   ```bash
   git add .
   git commit -m "Fix Railway deployment issues"
   git push origin main
   ```

2. **Railway で自動デプロイ確認**
   - Dashboard → Deployments → 最新のデプロイ状況確認

3. **手動再デプロイ（必要な場合）**
   ```bash
   railway up
   ```

これでRailwayデプロイが成功するはずです！ 🚀