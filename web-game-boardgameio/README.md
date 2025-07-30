# マーケット・ディスラプション - Webゲーム

転売ヤーをテーマにしたクニツィア風ボードゲームのWebアプリケーション版です。

## 🎮 ゲーム概要

- **プレイヤー数**: 2-4人
- **プレイ時間**: 30-45分
- **勝利条件**: 威厳17ポイント+資金75以上 または 資金150達成

## 🚀 デプロイ方法

### Railway（サーバー）

1. [Railway](https://railway.app/)にサインアップ
2. 「New Project」→「Deploy from GitHub repo」
3. このリポジトリを選択
4. 自動的にサーバーがデプロイされます
5. デプロイ完了後、Railway URLをメモ（例: `your-app.railway.app`）

### Netlify（フロントエンド）

1. [Netlify](https://netlify.com/)にサインアップ
2. 「New site from Git」→GitHubリポジトリを選択
3. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Environment variables を設定:
   - `VITE_SERVER_URL` = `your-railway-app.railway.app`（RailwayのURL）
5. Deploy site をクリック

## 🛠 ローカル開発

### 必要条件
- Node.js 18以上
- npm

### セットアップ
```bash
# 依存関係をインストール
npm install

# サーバー起動（ポート8000）
npm run server

# 別ターミナルでクライアント起動（ポート3002）  
npm run dev

# または同時起動
npm start
```

## 📋 技術スタック

- **フロントエンド**: React, TypeScript, Vite
- **バックエンド**: Node.js, boardgame.io
- **通信**: Socket.IO
- **デプロイ**: Netlify + Railway

## 🎯 機能

- ✅ マルチプレイヤー対応（リアルタイム同期）
- ✅ 6×6マーケットボード
- ✅ プレイヤーアクション（製造、販売、転売など）
- ✅ オートマシステム
- ✅ フェーズ管理（action → automata → market）
- ✅ ゲームロビー機能

## 🐛 トラブルシューティング

### 接続エラーが発生する場合
1. サーバーが起動していることを確認
2. CORS設定が正しいことを確認
3. 環境変数`VITE_SERVER_URL`が正しく設定されていることを確認

### ゲームが開始されない場合
1. ブラウザのコンソールでエラーを確認
2. F12開発者ツールでネットワークタブを確認
3. サーバーログを確認

## 📞 サポート

問題が発生した場合は、ブラウザの開発者ツール（F12）でコンソールログを確認してください。