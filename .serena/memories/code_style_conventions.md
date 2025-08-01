# コードスタイルと規約

## TypeScript/React 規約

### ファイル命名
- コンポーネント: PascalCase (例: `SimpleGame.tsx`)
- ユーティリティ: camelCase
- 設定ファイル: kebab-case

### コード規約
- **TypeScript**: 厳密な型付けを使用
- **React**: 関数コンポーネントを使用
- **インデント**: 2スペース
- **セミコロン**: 使用する

### プロジェクト固有の規約
- ゲームロジックは `/src/game/` に配置
- UIコンポーネントは `/src/components/` に配置
- boardgame.io のパターンに従う

## ファイル構造規約
```
src/
├── main.tsx           # エントリーポイント
├── SimpleGame.tsx     # メインゲームコンポーネント
├── components/        # UIコンポーネント
├── game/             # ゲームロジック
└── __tests__/        # テストファイル
```

## 設定ファイル
- `vite.config.mjs`: Vite設定
- `tsconfig.json`: TypeScript設定
- `jest.config.js`: Jest設定
- `package.json`: 依存関係とスクリプト

## 環境設定
- `.env.example`: 環境変数テンプレート
- `.env.production`: プロダクション環境変数
- `netlify.toml`: Netlify設定
- `railway.toml`: Railway設定