# Market Disruption AI API Documentation

このドキュメントは、外部AIシステムがMarket Disruptionゲームと連携するためのAPIインターフェースを説明します。

## 概要

Market DisruptionゲームはBoardGame.ioフレームワークを使用しており、以下のAI機能を提供します：

1. **AI分析機能**: ゲーム状態の詳細分析
2. **AI自動実行機能**: 最適なムーブの自動選択と実行
3. **外部API連携**: WebSocketまたはHTTP経由でのAI制御

## AI関連のインターフェース

### GameAnalysis（ゲーム分析結果）

```typescript
interface GameAnalysis {
  currentPlayer: Player;                // 現在のプレイヤー情報
  availableActions: ActionInfo[];       // 実行可能なアクション一覧
  gameStatus: GameStatus;               // ゲーム全体の状況
  marketSituation: MarketAnalysis;      // 市場分析
  playerRankings: PlayerRanking[];      // プレイヤーランキング
  recommendations: AIRecommendation[];  // AI推奨アクション
}
```

### ActionInfo（アクション情報）

```typescript
interface ActionInfo {
  actionName: string;           // アクション名
  apCost: number;              // 消費AP
  requirements: string[];       // 実行条件
  expectedOutcome: string;      // 期待される結果
  parameters?: ActionParameter[]; // 必要なパラメータ
  isRecommended: boolean;       // AI推奨かどうか
  riskLevel: 'low' | 'medium' | 'high'; // リスクレベル
}
```

## 利用可能なゲーム操作

### 主要なアクション

1. **manufacture** - 商品製造
   - パラメータ: `designId` (設計ID)
   - AP消費: 1
   - 必要条件: 設計図、製造コスト分の資金

2. **sell** - 商品販売
   - パラメータ: `productId` (商品ID), `price` (販売価格)
   - AP消費: 1
   - 必要条件: 未販売商品

3. **purchase** - 商品購入
   - パラメータ: `targetPlayerId`, `productId`
   - AP消費: 1
   - 必要条件: 購入価格分の資金

4. **resale** - 転売
   - パラメータ: `targetPlayerId`, `productId`, `resalePrice`
   - AP消費: 2
   - 必要条件: 購入価格分の資金
   - 副作用: 威厳-1、市場汚染

5. **design** - 設計作成
   - パラメータ: `isOpenSource` (オプション)
   - AP消費: 2
   - 必要条件: 5資金

6. **research** - リサーチ
   - AP消費: 1
   - 必要条件: 3資金

7. **partTimeWork** - アルバイト
   - AP消費: 2
   - 効果: +5資金

8. **dayLabor** - 日雇い労働
   - AP消費: 3
   - 必要条件: 資金100以下
   - 効果: +18資金

9. **promoteRegulation** - 規制推進
   - AP消費: 2
   - 効果: 2d6で10+なら規制進行

## AI自動実行機能

### executeAIMove

現在のプレイヤーに対してAIが最適と判断するアクションを自動実行します。

```typescript
// ゲーム内で直接呼び出し
moves.executeAIMove();
```

### AI分析取得

```typescript
// ローカルでAI分析を実行
import { AIGameAnalyzer } from './game/AIInterface';
const analyzer = new AIGameAnalyzer(gameState, playerId);
const analysis = analyzer.analyzeGame();
```

## 勝利条件

AIは以下の勝利条件を考慮して戦略を立てます：

1. **資金勝利**: 資金150以上
2. **威厳勝利**: 威厳17 + 資金75以上

## 戦略的考慮事項

### リスク管理
- **転売**: 高利益だが威厳低下と市場汚染のリスク
- **正規ルート**: 安定的だが利益は控えめ
- **労働**: 確実な資金確保だがAP効率は低い

### 市場分析
- **人気度**: 2d6による需要判定の確率
- **価格設定**: コスト×1.2〜2.0の範囲で推奨
- **競合**: 他プレイヤーとの価格競争

### タイミング
- **規制推進**: 市場汚染が深刻な時に効果的
- **設計**: ゲーム序盤に取得推奨
- **転売**: 短期利益を狙う時期の判断

## 外部システム連携

### WebSocket接続（boardgame.io標準）

```javascript
// サーバーURL（本番環境）
const serverUrl = 'https://market-disruption-production.up.railway.app';

// SocketIO接続
const socket = io(serverUrl);
```

### AI制御フロー

1. ゲーム状態を監視
2. 自分のターンでAI分析実行
3. 推奨アクションの選択
4. パラメータの決定
5. アクション実行
6. 結果の評価

## デバッグとログ

全てのAI実行はコンソールに詳細なログが出力されます：

```
🤖 AI Player 0 executing: manufacture (confidence: 0.7)
🧠 Reasoning: 推奨アクション: 商品製造 (コスト: 3)
```

## 実装例

### 基本的なAI制御

```typescript
// AIによる自動プレイ
const executeAITurn = async (gameState, playerId) => {
  const analyzer = new AIGameAnalyzer(gameState, playerId);
  const moveGenerator = new AIMoveGenerator(analyzer);
  const optimalMove = moveGenerator.generateOptimalMove();
  
  if (optimalMove) {
    console.log(`AI executing: ${optimalMove.actionName}`);
    // 実際のムーブ実行はgame moveを通して行う
    moves[optimalMove.actionName](...optimalMove.parameters);
  }
};
```

### カスタムAI戦略

```typescript
// カスタム戦略の実装
class CustomAIStrategy {
  constructor(gameState, playerId) {
    this.analyzer = new AIGameAnalyzer(gameState, playerId);
  }
  
  selectAction() {
    const analysis = this.analyzer.analyzeGame();
    
    // カスタムロジック
    if (analysis.currentPlayer.money < 10) {
      return { actionName: 'partTimeWork' };
    }
    
    if (analysis.currentPlayer.prestige >= 15) {
      return { actionName: 'partTimeWork' }; // 安全策
    }
    
    // 高利益の転売機会を探す
    const profitableResales = analysis.marketSituation.profitableOpportunities
      .filter(op => op.type === 'resale' && op.expectedProfit > 20);
    
    if (profitableResales.length > 0) {
      return {
        actionName: 'resale',
        parameters: { /* 転売パラメータ */ }
      };
    }
    
    return analysis.recommendations[0]; // デフォルトは推奨アクション
  }
}
```

## 注意事項

1. **AP管理**: 各ターンで3APまで使用可能
2. **リアルタイム制約**: マルチプレイでは他プレイヤーを待たせないよう配慮
3. **エラーハンドリング**: 無効なアクションは自動的に無視される
4. **ゲーム終了**: 勝利条件達成時は自動的にゲーム終了

このAPIを使用することで、高度なAI戦略を実装し、自動的にMarket Disruptionをプレイできます。