# 推奨コマンド集

## 開発コマンド (web-game-boardgameio ディレクトリ内で実行)

### 基本開発
```bash
npm run dev          # 開発サーバー起動 (ポート3002)
npm run build        # プロダクションビルド
npm run preview      # ビルド結果のプレビュー
npm run server       # バックエンドサーバー起動
npm start            # フロントエンド・バックエンド同時起動
```

### テスト
```bash
npm test             # Jest テスト実行
npm run test         # Jest テスト実行 (同上)
```

### デバッグ
```bash
npm run debug-api    # API デバッグテスト
npm run debug-local  # ローカル環境でのデバッグ
npm run debug-prod   # プロダクション環境でのデバッグ
```

### ビルド検証
```bash
tsc                  # TypeScript コンパイル確認
npm run build        # ビルドテスト
```

## Git コマンド (Windows)
```bash
git status           # ステータス確認
git add .            # 全ファイル追加
git commit -m "msg"  # コミット
git push origin main # プッシュ
```

## ファイル操作 (Windows)
```bash
dir                  # ディレクトリ一覧 (ls 相当)
cd                   # ディレクトリ移動
type                 # ファイル内容表示 (cat 相当)
findstr              # 文字列検索 (grep 相当)
```

## プレイテスト
```bash
python scripts/request_playtest.py  # プレイテスト実行リクエスト
```