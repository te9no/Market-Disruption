# 🚀 Market Disruption - デプロイ手順

## 📋 概要
このプロジェクトは以下の構成でデプロイします：
- **バックエンド**: Railway (Node.js + Socket.io)
- **フロントエンド**: Netlify (React + Vite)

## 🔧 事前準備

### 1. 必要なアカウント
- [Railway](https://railway.app/) アカウント
- [Netlify](https://netlify.com/) アカウント
- GitHub アカウント（推奨）

### 2. プロジェクトをGitHubにプッシュ（推奨）
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/market-disruption.git
git push -u origin main
```

## 🚂 Step 1: バックエンドをRailwayにデプロイ

### 1.1 Railwayでプロジェクト作成
1. [Railway](https://railway.app/)にログイン
2. "New Project" → "Deploy from GitHub repo"
3. リポジトリを選択
4. "web-game/server" フォルダを指定

### 1.2 環境変数の設定
Railway のダッシュボードで以下を設定：
```
NODE_ENV=production
PORT=3001
ALLOWED_ORIGINS=https://your-netlify-app.netlify.app
```

### 1.3 デプロイ確認
- Railway が自動的にビルド・デプロイ
- ログでエラーがないか確認
- デプロイされたURLをメモ（例: `https://your-railway-app.railway.app`）

## 🌐 Step 2: フロントエンドをNetlifyにデプロイ

### 2.1 環境変数の更新
`web-game/client/.env.production` ファイルを更新：
```
VITE_API_URL=https://your-railway-app.railway.app
```

### 2.2 Netlifyでサイト作成
1. [Netlify](https://netlify.com/)にログイン
2. "Add new site" → "Import an existing project"
3. GitHubリポジトリを選択
4. ビルド設定：
   - **Base directory**: `web-game/client`
   - **Build command**: `npm run build`
   - **Publish directory**: `web-game/client/dist`

### 2.3 環境変数の設定
Netlify ダッシュボードで環境変数を設定：
```
VITE_API_URL=https://your-railway-app.railway.app
```

### 2.4 CORSの更新
Railway の環境変数 `ALLOWED_ORIGINS` を更新：
```
ALLOWED_ORIGINS=https://your-netlify-app.netlify.app
```

## ✅ Step 3: 動作確認

### 3.1 フロントエンドの確認
- Netlify URL にアクセス
- ロビー画面が正常に表示される
- ゲーム作成・参加ができる

### 3.2 バックエンドの確認
- Railway URL にアクセス
- "Market Disruption Game Server" が表示される
- WebSocket接続が正常に動作する

### 3.3 統合テスト
- 複数のブラウザでアクセス
- マルチプレイヤーゲームが正常に動作
- リアルタイム同期が機能する

## 🔄 継続的デプロイ（自動更新）

### GitHub連携時の自動デプロイ
- **Railway**: main ブランチにプッシュで自動デプロイ
- **Netlify**: main ブランチにプッシュで自動ビルド・デプロイ

### 手動デプロイ
```bash
# フロントエンドのビルド
cd web-game/client
npm run build

# バックエンドの起動確認
cd ../server
npm start
```

## 🐛 トラブルシューティング

### よくある問題

#### 1. CORS エラー
- Railway の `ALLOWED_ORIGINS` を確認
- NetlifyのURLが正しく設定されているか確認

#### 2. WebSocket 接続エラー
- `VITE_API_URL` が正しいRailway URLを指しているか確認
- RailwayサーバーがHTTPS対応しているか確認

#### 3. ビルドエラー
- `npm install` でパッケージが正しくインストールされているか確認
- Node.jsバージョンが18以上か確認

### ログの確認方法
- **Railway**: ダッシュボード → Deployments → View Logs
- **Netlify**: ダッシュボード → Site overview → View functions

## 📱 代替デプロイオプション

### その他のプラットフォーム
- **Vercel**: フルスタックデプロイが可能
- **Render**: Railway の代替
- **Fly.io**: 高性能が必要な場合

### Docker でのデプロイ
必要に応じて Docker コンテナでのデプロイも可能です。

---

## 🎯 デプロイ完了！

両方のデプロイが成功したら：
1. **フロントエンドURL**: `https://your-app.netlify.app`
2. **バックエンドURL**: `https://your-app.railway.app`

これで世界中からアクセス可能なMarket Disruptionゲームの完成です！ 🎉