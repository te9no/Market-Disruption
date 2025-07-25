# 🌐 Netlify 環境変数設定手順

## 🔧 現在の問題
フロントエンドが間違ったRailway URL (`market-disruption.railway.internal`) に接続しようとしています。

## ✅ 解決方法

### 1. **Railway の実際のURL を確認**

Railway ダッシュボードで以下を確認：
1. プロジェクトページを開く
2. "Deployments" タブを確認
3. 成功したデプロイメントの "View Logs" をクリック
4. ログで実際のURL（例：`https://market-disruption-production-abcd123.up.railway.app`）を確認

### 2. **Netlify 環境変数の設定**

#### Method A: Netlify Dashboard (推奨)
1. [netlify.com](https://netlify.com) にログイン
2. Market Disruption プロジェクトを選択
3. "Site settings" → "Environment variables" をクリック
4. "Add a variable" をクリック
5. 以下を設定：
   ```
   Key: VITE_API_URL
   Value: https://[your-actual-railway-url]
   ```
6. "Create variable" をクリック
7. サイトを再デプロイ

#### Method B: netlify.toml ファイル (代替)
```toml
[build.environment]
  VITE_API_URL = "https://your-actual-railway-url"
```

### 3. **Railway URL の形式**

Railway URL は通常以下のいずれかの形式：
- `https://[app-name]-production-[hash].up.railway.app`
- `https://[app-name]-[hash].up.railway.app`
- カスタムドメインを設定している場合はそのURL

### 4. **設定確認方法**

#### 環境変数が正しく設定されているか確認：
```bash
# Netlify Functions (ローカル)
netlify env:list

# または Netlify Dashboard で確認
```

#### デプロイ後の動作確認：
```javascript
// ブラウザコンソールで確認
console.log('API URL:', import.meta.env.VITE_API_URL);
```

### 5. **Railway CORS設定の更新**

Railway 側でも CORS 設定を更新する必要があります：

```bash
# Railway Dashboard → Environment Variables
ALLOWED_ORIGINS=https://your-netlify-app.netlify.app,https://app.netlify.com
```

## 🔄 再デプロイ手順

### 1. **Railway URL確認後**
```bash
# .env.production を更新
VITE_API_URL=https://[実際のRailway URL]

# コミット&プッシュ
git add .
git commit -m "Update production API URL"
git push origin main
```

### 2. **Netlify で再デプロイ**
- 自動デプロイされる、または
- Netlify Dashboard → "Deploys" → "Trigger deploy"

### 3. **動作確認**
```bash
# 健康チェック
curl https://[Railway URL]/health

# フロントエンドでWebSocket接続確認
# ブラウザで Netlify URL にアクセス
```

## 🐛 トラブルシューティング

### WebSocket 接続失敗
- [ ] Railway URL が正しいか確認
- [ ] Railway でCORS設定済みか確認
- [ ] Netlify で環境変数設定済みか確認
- [ ]両方のサービスがHTTPS使用しているか確認

### 接続タイムアウト
- [ ] Railway アプリが起動しているか確認
- [ ] Railway ログでエラーがないか確認
- [ ] ファイアウォール設定確認

### CORS エラー
```bash
# Railway 環境変数を確認
ALLOWED_ORIGINS=https://your-netlify-app.netlify.app
NODE_ENV=production
```

## 📋 チェックリスト

- [ ] Railway デプロイ成功確認
- [ ] Railway の実際のURL確認
- [ ] Netlify 環境変数設定
- [ ] Railway CORS設定更新
- [ ] 両サービス再デプロイ
- [ ] WebSocket接続テスト
- [ ] ゲーム機能テスト

完了後、Market Disruption ゲームが完全に動作するはずです！ 🎮✨