# Market Disruption AI機能 - 使用ガイド

## 🎯 AIモードでのゲームプレイ方法

### 1. ゲーム開始
1. ロビー画面で「🤖 AI観戦ゲーム」を選択
2. ゲーム画面が表示されたら、以下のAI機能を利用

### 2. AI機能の使い方

#### 🔧 AI Debug Panel（デバッグパネル）
- **🔍 AI分析テスト**: 現在の状況をAIが分析
- **🧠 ムーブ生成テスト**: AIが最適なアクションを決定
- **🚀 AIムーブ実行**: 実際にAIアクションを実行
- **⏭️ ターン終了**: 手動でターン終了（APが残っていても）
- **🎮 簡単デモ**: 全工程を自動実行

#### 🎮 AI Game Controller（ゲーム制御）
- **🤖 現在プレイヤーでAI実行**: 1回だけAI実行
- **⏭️ ターン終了**: 手動ターン終了
- **🔄 全員AI ON**: 全プレイヤーをAI化
- **⏹️ 全員AI OFF**: AI制御を無効化
- **🚀 フル自動デモ**: 完全自動でゲーム進行

### 3. ターン終了の仕組み

#### 自動ターン終了
- AIがAPを全て使い切ると自動的にターン終了
- 1人プレイ：オートマ＆マーケット実行
- 複数人プレイ：次のプレイヤーのターンへ移行

#### 手動ターン終了
1. **AI Debug Panel** の「⏭️ ターン終了」ボタン
2. **AI Game Controller** の「⏭️ ターン終了」ボタン
3. **通常のゲーム画面** の「ターン終了」ボタン

### 4. トラブルシューティング

#### ターン終了が機能しない場合
1. **F12 > Console** でエラーログ確認
2. **AI Debug Panel** で段階的テスト
3. ブラウザの更新（F5）

#### AI実行が動作しない場合
1. 現在のプレイヤーのAPが0でないか確認
2. **AI Debug Panel** の「AI分析テスト」でエラー確認
3. コンソールログで詳細エラー確認

## 🚀 API使用例

### 基本的なAI実行
```javascript
// 現在プレイヤーでAI実行
moves.executeAIMove();

// ターン終了（1人プレイ）
moves.executeAutomataAndMarket();

// ターン終了（複数人プレイ）
ctx.events.endTurn();
```

### AI分析の取得
```javascript
import { AIGameAnalyzer } from './game/AIInterface';

const analyzer = new AIGameAnalyzer(gameState, playerId);
const analysis = analyzer.analyzeGame();
console.log('利用可能アクション:', analysis.availableActions);
console.log('推奨アクション:', analysis.recommendations);
```

## 📊 ログの見方

### コンソールログ例
```
🤖 Player 1 のターン開始
💰 資金: 20 | ⭐ 威厳: 0 | ⚡ AP: 3
📋 Move #1 - AI分析中...
🎯 AI Player 0 executing: partTimeWork (confidence: 0.9)
🧠 Reasoning: 資金不足のため労働で資金確保
✅ Move #1 実行完了
🔄 Player 1 のAPが0になりました - 自動ターン終了
```

### デバッグパネルログ例
```
14:30:15: 🔍 AI分析開始 - Player 1
14:30:15: ✅ AI分析完了
14:30:15: 📊 利用可能アクション: 5個
14:30:15: 💡 推奨アクション: 3個
14:30:15: 🎯 最優先: partTimeWork - 資金不足のため労働で資金確保
```

## 🎮 推奨プレイフロー

### 初回テスト
1. 「🤖 AI観戦ゲーム」でゲーム開始
2. **AI Debug Panel** の「🎮 簡単デモ」実行
3. コンソールログで動作確認

### 手動制御
1. **AI Debug Panel** で段階的テスト
2. 「🚀 AIムーブ実行」で1回ずつ実行
3. APが0になったら「⏭️ ターン終了」

### 全自動観戦
1. **AI Game Controller** の「🚀 フル自動デモ」
2. AI実行間隔を調整（0.5秒〜5秒）
3. 途中停止したい場合は「⏹️ 停止」

## ⚙️ 設定オプション

### AI実行間隔
- **高速 (0.5秒)**: デバッグ・テスト用
- **普通 (1秒)**: 通常観戦用
- **ゆっくり (2秒)**: 学習・分析用
- **とてもゆっくり (5秒)**: 詳細確認用

### 個別AI制御
- **🤖 P1**: Player 1のAI有効/無効
- **👤 P2**: Player 2のAI無効/有効
- 混在プレイ（人間+AI）も可能

これでMarket DisruptionのAI機能を完全に活用できます！🎯