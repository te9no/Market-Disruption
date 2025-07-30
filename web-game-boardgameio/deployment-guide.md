# デプロイメントガイド

## 概要
このプロジェクトは以下の構成でデプロイされます：
- **バックエンド**: Railway (boardgame.io server)
- **フロントエンド**: Netlify (React + Vite)

## Railway バックエンドデプロイ

### 1. 自動デプロイ設定
- GitHubリポジトリと連携済み
- `main`ブランチへのpush時に自動デプロイ
- 設定ファイル: `railway.toml`

### 2. 環境変数
```
NODE_ENV=production
PORT=$PORT (Railway自動設定)
```

### 3. ヘルスチェック
- エンドポイント: `/games`
- 正常時レスポンス: `["MarketDisruption"]`

### 4. URL
- 本番URL: `https://web-game-boardgameio-production.up.railway.app`

## Netlify フロントエンドデプロイ

### 1. ビルド設定
```toml
[build]
  publish = "dist"
  command = "npm run build"
```

### 2. 環境変数（Netlify管理画面で設定）
```
VITE_SERVER_URL=https://web-game-boardgameio-production.up.railway.app
```

### 3. SPA設定
- すべてのルートを`/index.html`にリダイレクト
- React Router対応

## デプロイ手順

### Railway
1. コードをGitHubにpush
2. Railwayが自動デプロイ
3. `/games`エンドポイントで稼働確認

### Netlify
1. Netlify管理画面でGitHubリポジトリを連携
2. ビルド設定を確認
3. 環境変数`VITE_SERVER_URL`を設定
4. デプロイ実行

## テスト方法

### ローカルテスト
```bash
npm run build
npm run preview
```

### 本番テスト
1. `test-multiplayer.html`でサーバー接続確認
2. 複数ブラウザでマルチプレイヤーテスト
3. 異なるデバイスからアクセステスト

## トラブルシューティング

### よくある問題

1. **CORS エラー**
   - `server.js`のorigins設定を確認
   - NetlifyドメインがCORS設定に含まれているか確認

2. **環境変数が読み込まれない**
   - Viteでは`VITE_`プレフィックスが必要
   - Netlify管理画面で環境変数が正しく設定されているか確認

3. **WebSocket接続エラー**
   - HTTPSドメイン間でのWebSocket接続を確認
   - ファイアウォール設定を確認

4. **ビルドエラー**
   - `package-lock.json`が同期されているか確認
   - Node.jsバージョンの互換性を確認

## モニタリング

### Railway
- ログ: Railway管理画面 > Deployments > Logs
- メトリクス: CPU/メモリ使用量確認

### Netlify
- ログ: Netlify管理画面 > Site deploys
- 関数: Functions タブでサーバーレス関数の実行状況

## セキュリティ

### 環境変数管理
- 秘密情報は環境変数で管理
- `.env`ファイルは`.gitignore`に追加
- 本番用設定は各サービスの管理画面で設定