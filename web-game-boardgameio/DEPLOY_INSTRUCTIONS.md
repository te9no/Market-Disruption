# 🚀 デプロイ手順書

## 1. GitHubリポジトリ作成＆プッシュ

### GitHubでリポジトリ作成
1. https://github.com にアクセス
2. "New repository" をクリック
3. Repository name: `market-disruption-web` (お好みの名前)
4. Public または Private を選択
5. "Create repository" をクリック

### リモート追加＆プッシュ
作成されたリポジトリのURLを使って以下を実行：

```bash
cd "C:\Users\tatuy\Documents\work\Market Disruption\web-game-boardgameio"

# リモートリポジトリを追加（YOUR_USERNAMEとYOUR_REPO_NAMEを置き換える）
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# プッシュ
git push -u origin master
```

## 2. Railway（サーバー）デプロイ

### 手順
1. https://railway.app にアクセス
2. GitHub でサインイン
3. "New Project" → "Deploy from GitHub repo"
4. 作成したリポジトリを選択
5. 自動デプロイ開始
6. デプロイ完了後、URLをコピー（例：`abc123.railway.app`）

### 設定確認
- ✅ `railway.toml` が自動認識される
- ✅ `npm run server` が自動実行される
- ✅ 環境変数 `PORT` が自動設定される

## 3. Netlify（フロントエンド）デプロイ

### 手順
1. https://netlify.com にアクセス
2. GitHub でサインイン
3. "New site from Git" をクリック
4. GitHub を選択 → リポジトリを選択
5. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. "Deploy site" をクリック

### 環境変数設定
デプロイ後、Netlify Dashboard で：
1. Site settings → Environment variables
2. "Add a variable" をクリック
3. 設定:
   - **Key**: `VITE_SERVER_URL`
   - **Value**: `your-railway-url.railway.app` (Railway のURL、httpsは除く)
4. "Save" をクリック
5. "Deploy" → "Trigger deploy" で再デプロイ

## 4. 動作確認

### テスト手順
1. Netlify の URL にアクセス
2. ロビー画面が表示されることを確認
3. "新しいゲームを作成" でゲーム作成
4. 別ブラウザ/タブで同じURLにアクセス
5. "既存のゲームに参加" でマルチプレイヤーテスト

### 完成！🎉
- **フロントエンド**: https://your-site.netlify.app
- **サーバー**: https://your-app.railway.app
- **マルチプレイヤー**: 世界中からアクセス可能

## トラブルシューティング

### サーバー接続エラー
- Railway URLが正しく設定されているか確認
- `VITE_SERVER_URL` にはhttps://を含めない

### ビルドエラー
- Node.js バージョンが18以上か確認
- package.json の依存関係が正しいか確認

---
**🎮 マーケット・ディスラプション Web版 完成！**