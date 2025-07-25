# 🚨 緊急修正ガイド

## 現在の問題
Netlify が古いキャッシュを使用し、間違ったURL (`market-disruption.railway.internal`) に接続中

## ⚡ 即座の修正手順

### Step 1: Railway の正しいURLを確認
1. Railway Dashboard に移動
2. プロジェクト → Settings → Environment
3. "Domains" セクションで公開URLを確認
   - 通常: `https://[app-name]-production-[hash].up.railway.app`
   - 例: `https://market-disruption-production-a1b2c3.up.railway.app`

### Step 2: Netlify 環境変数を即座に更新
1. [Netlify Dashboard](https://app.netlify.com) にログイン
2. Market Disruption サイトを選択
3. "Site settings" → "Environment variables"
4. `VITE_API_URL` を削除して再作成：
   ```
   Key: VITE_API_URL
   Value: https://[実際のRailway URL]
   Scopes: All deploy contexts
   ```

### Step 3: 強制的な再ビルド
1. Netlify Dashboard → "Deploys"
2. "Trigger deploy" → "Clear cache and deploy site"
3. または Git で空コミットをプッシュ:
   ```bash
   git commit --allow-empty -m "Force rebuild with correct API URL"
   git push origin main
   ```

### Step 4: Railway CORS設定
Railway Dashboard → Environment Variables:
```
ALLOWED_ORIGINS=https://market-disruption.netlify.app,https://[your-actual-netlify-url]
NODE_ENV=production
```

## 🔍 デバッグ情報

### Railway URL 確認方法
```bash
# Railway CLI (if installed)
railway status

# または curl でテスト
curl https://[railway-url]/health
```

### Netlify 環境変数確認
```bash
# デプロイ後、ブラウザコンソールで:
console.log('API URL:', import.meta.env.VITE_API_URL);
```

## 🆘 緊急代替案

### Option A: 一時的な公開テストサーバー
```bash
# ローカルで ngrok を使用
cd web-game/server
npm start
# 別ターミナル:
ngrok http 3001
# 出力されたURLをNetlifyで使用
```

### Option B: Render への即座移行
```bash
1. render.com でアカウント作成
2. GitHub リポジトリ接続
3. Web Service 作成:
   - Root Directory: web-game/server
   - Build Command: npm install
   - Start Command: npm start
4. 5分でデプロイ完了
5. Netlify で新URLに変更
```

## ✅ 成功確認

### 1. Railway 健康チェック
```bash
curl https://[railway-url]/health
# 期待される応答: {"status":"OK",...}
```

### 2. CORS テスト
```bash
curl -H "Origin: https://market-disruption.netlify.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://[railway-url]/
```

### 3. WebSocket 接続テスト
ブラウザコンソール:
```javascript
const socket = io('https://[railway-url]');
socket.on('connect', () => console.log('✅ Connected!'));
socket.on('connect_error', (err) => console.error('❌ Error:', err));
```

## 🎯 最優先タスク

1. [ ] Railway の実際の公開URLを特定
2. [ ] Netlify 環境変数 `VITE_API_URL` を正しいURLに更新
3. [ ] Netlify キャッシュクリアして強制再ビルド
4. [ ] Railway CORS設定更新
5. [ ] WebSocket接続テスト

**注意**: `.railway.internal` は内部URLなので絶対に外部アクセス不可！公開URLを使用すること。