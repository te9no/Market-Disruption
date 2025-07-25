# 🚀 代替デプロイ戦略

## 現在の問題
Railway の内部URL (`railway.internal`) に接続しようとして失敗している

## 🎯 即座に動作する代替案

### Option 1: **Vercel (最も簡単)**
フロントエンドとバックエンドを同時にデプロイ

#### 手順:
1. **プロジェクト構造を調整**
   ```
   ├── api/
   │   └── index.js (server コードを移動)
   ├── web-game/client/ (フロントエンド)
   └── vercel.json
   ```

2. **vercel.json を作成**
   ```json
   {
     "builds": [
       { "src": "api/index.js", "use": "@vercel/node" },
       { "src": "web-game/client/package.json", "use": "@vercel/static-build" }
     ],
     "routes": [
       { "src": "/api/(.*)", "dest": "/api/index.js" },
       { "src": "/(.*)", "dest": "/web-game/client/$1" }
     ]
   }
   ```

### Option 2: **Render (推奨)**
安定したデプロイとWebSocket対応

#### バックエンド (Render Web Service):
```yaml
# render.yaml
services:
  - type: web
    name: market-disruption-server
    env: node
    buildCommand: npm install
    startCommand: npm start
    rootDir: web-game/server
    envVars:
      - key: NODE_ENV
        value: production
```

#### フロントエンド (Netlify):
```bash
# Netlify 環境変数
VITE_API_URL=https://market-disruption-server.onrender.com
```

### Option 3: **Fly.io**
高性能でWebSocket完全対応

#### fly.toml:
```toml
app = "market-disruption"
primary_region = "nrt"

[build]
  dockerfile = "Dockerfile"

[[services]]
  protocol = "tcp"
  internal_port = 3001

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
```

## 🔧 即効修正方法

### Quick Fix 1: Public Railway URL を使用

1. **Railway Dashboard で正しいURL確認**
   - `https://[app-name]-production-[hash].up.railway.app`

2. **Netlify 環境変数更新**
   ```bash
   VITE_API_URL=https://market-disruption-production-abcd123.up.railway.app
   ```

3. **Railway CORS更新**
   ```bash
   ALLOWED_ORIGINS=https://market-disruption.netlify.app
   ```

### Quick Fix 2: 一時的なローカルテスト

1. **ローカルサーバー起動**
   ```bash
   cd web-game/server
   npm start
   ```

2. **ngrok でトンネル作成**
   ```bash
   ngrok http 3001
   # 出力された URL を使用: https://abc123.ngrok.io
   ```

3. **Netlify で ngrok URL を使用**
   ```bash
   VITE_API_URL=https://abc123.ngrok.io
   ```

## 🎮 最速デプロイ手順 (Render + Netlify)

### 1. **Render でバックエンド**
```bash
1. render.com でアカウント作成
2. "New Web Service" → GitHub リポジトリ接続
3. Root Directory: web-game/server
4. Build Command: npm install
5. Start Command: npm start
6. Environment Variables:
   - NODE_ENV=production
   - ALLOWED_ORIGINS=https://your-netlify-app.netlify.app
```

### 2. **Netlify でフロントエンド**
```bash
1. 環境変数設定:
   - VITE_API_URL=https://your-render-app.onrender.com
2. 再デプロイ
```

### 3. **動作確認**
```bash
# バックエンド健康チェック
curl https://your-render-app.onrender.com/health

# フロントエンド接続テスト
# Netlify URL にアクセスしてWebSocket接続確認
```

## ⚡ 緊急対応チェックリスト

- [ ] Railway の実際のpublic URLを確認
- [ ] Netlify 環境変数 `VITE_API_URL` を正しいURLに更新
- [ ] Railway 環境変数 `ALLOWED_ORIGINS` にNetlify URLを追加
- [ ] 両サービスを再デプロイ
- [ ] ブラウザコンソールで接続URL確認
- [ ] WebSocket接続テスト

**最優先**: Railway の正しい public URL を特定して、Netlify の環境変数を更新することです！