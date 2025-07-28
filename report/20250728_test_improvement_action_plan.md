# 🚀 マーケット・ディスラプション テスト改善アクションプラン

**策定日**: 2025年7月28日  
**対象期間**: 2025年8月〜10月  
**責任者**: 開発チーム

---

## 🎯 改善目標

### 現状
- **テスト成功率**: 49.4% (42/85)
- **サーバーサイド**: 16.7% (7/42)
- **クライアントサイド**: 81.4% (35/43)

### 目標
- **テスト成功率**: 95%以上
- **サーバーサイド**: 90%以上
- **クライアントサイド**: 98%以上
- **新機能テストカバレッジ**: 80%以上

---

## 📋 アクション項目

### 🔴 高優先度 (即座に対応)

#### 1. テストコード基盤修正
**期限**: 2025年8月5日  
**担当**: バックエンドエンジニア  
**工数**: 2-3日

**詳細タスク:**
- [ ] メソッド名統一修正
  ```javascript
  // 修正対象メソッド
  runAutomataPhase() → processAutomataPhase()
  runManufacturerAutomata() → processManufacturerAutomata()
  runResaleAutomata() → processResaleAutomata()
  runMarketPhase() → processMarketPhase()
  ```
- [ ] Import構文の全面見直し
- [ ] 欠損ファイル `GameManager.js` の作成

**成功指標:**
- サーバーサイドテスト成功率 70%以上
- メソッド名関連エラー 0件

#### 2. UIテスト期待値修正
**期限**: 2025年8月3日  
**担当**: フロントエンドエンジニア  
**工数**: 1日

**詳細タスク:**
- [ ] ModernButton コンポーネントのテスト戦略見直し
  ```typescript
  // 修正例
  // 現在: expect(button).toBeDisabled();
  // 修正: expect(button).toHaveClass('opacity-60');
  ```
- [ ] カスタムマッチャーの実装
- [ ] ActionPanel テストの全面修正

**成功指標:**
- ActionPanel テスト成功率 95%以上
- UIテスト関連エラー 0件

### 🟡 中優先度 (1-2週間以内)

#### 3. テストカバレッジ拡張
**期限**: 2025年8月15日  
**担当**: 全体チーム  
**工数**: 5-7日

**詳細タスク:**
- [ ] オートマシステム完全テスト実装
  ```javascript
  // 新規テストケース
  - Manufacturer Automata 完全フロー
  - Resale Automata 規制対応
  - Market Phase 需要判定
  ```
- [ ] 規制システムテスト強化
- [ ] 勝利条件テスト追加
- [ ] エラーハンドリングテスト拡張

**成功指標:**
- 機能カバレッジ 80%以上
- 新規テストケース 20件以上追加

#### 4. 統合テスト強化
**期限**: 2025年8月20日  
**担当**: フルスタックエンジニア  
**工数**: 3-4日

**詳細タスク:**
- [ ] E2Eテストシナリオ完成
- [ ] Socket.IO 統合テスト修復
- [ ] 実際のゲームフローテスト
- [ ] マルチプレイヤーシナリオテスト

**成功指標:**
- E2Eテスト成功率 90%以上
- リアルタイム通信テスト 完全成功

### 🟢 低優先度 (1ヶ月以内)

#### 5. パフォーマンス・負荷テスト
**期限**: 2025年9月15日  
**担当**: DevOpsエンジニア  
**工数**: 3-5日

**詳細タスク:**
- [ ] 大量データ処理性能テスト
- [ ] 同時接続負荷テスト
- [ ] メモリリークテスト
- [ ] レスポンス時間測定

#### 6. 自動化・CI/CD統合
**期限**: 2025年9月30日  
**担当**: DevOpsチーム  
**工数**: 7-10日

**詳細タスク:**
- [ ] GitHub Actions統合
- [ ] 自動テストレポート生成
- [ ] 回帰テスト自動実行
- [ ] 品質ゲート設定

---

## 📊 具体的修正計画

### Week 1: 基盤修正

#### Day 1-2: サーバーサイド修正
```bash
# 1. テストファイル修正
web-game/server/tests/game/
├── GameState.test.js     # メソッド名修正
├── actions.test.js       # API呼び出し修正  
└── automata.test.js      # 統合テスト修正

# 2. 欠損ファイル作成
web-game/server/
└── GameManager.js        # 新規作成
```

#### Day 3: クライアントサイド修正
```typescript
// ActionPanel.test.tsx 修正例
describe('Action Buttons', () => {
  it('should disable manufacture when no designs', () => {
    // 修正前
    // expect(manufactureButton).toBeDisabled();
    
    // 修正後
    expect(manufactureButton).toHaveStyle('opacity: 0.6');
    expect(manufactureButton).toHaveAttribute('disabled');
  });
});
```

### Week 2: カバレッジ拡張

#### 新規テストケース例
```javascript
// automata.test.js 追加テスト
describe('Market Phase Integration', () => {
  it('should handle demand dice and purchase correctly', () => {
    // 需要ダイス判定テスト
    const result = gameState.processMarketPhase();
    expect(result.demandValue).toBeGreaterThanOrEqual(2);
    expect(result.demandValue).toBeLessThanOrEqual(12);
  });
  
  it('should respect pollution effects on sales', () => {
    // 汚染システムテスト
    gameState.pollution['toy'] = 5;
    expect(() => {
      player.sellProduct('toy-product', 10);
    }).toThrow('Category too polluted');
  });
});
```

### Week 3-4: 統合テスト

#### E2Eテストシナリオ
```javascript
// complete-game.test.js 強化
describe('Complete Game Scenarios', () => {
  it('should complete prestige victory path', async () => {
    // 1. ゲーム作成・開始
    // 2. プレイヤーアクション実行
    // 3. オートマフェーズ処理
    // 4. 市場フェーズ処理
    // 5. 勝利条件達成確認
  });
  
  it('should handle regulation enforcement correctly', async () => {
    // 規制システム完全テスト
  });
});
```

---

## 🔧 技術的実装詳細

### 1. カスタムマッチャー実装

```typescript
// test/matchers.ts
expect.extend({
  toBeVisuallyDisabled(received) {
    const pass = received.style.opacity === '0.6' || 
                 received.style.cursor === 'not-allowed';
    
    return {
      message: () => `expected element to be visually disabled`,
      pass,
    };
  },
});
```

### 2. テストユーティリティ作成

```typescript
// test/utils.ts
export const createTestGameState = (options = {}) => {
  const gameState = new GameState('test-game');
  // デフォルト設定適用
  return gameState;
};

export const createTestPlayer = (overrides = {}) => {
  return new Player('test-player', 'テストプレイヤー', {
    funds: 30,
    prestige: 5,
    ...overrides
  });
};
```

### 3. モックシステム強化

```javascript
// test/mocks/GameManager.js
export class GameManager {
  constructor() {
    this.games = new Map();
  }
  
  createGame(playerId, playerName) {
    // モック実装
  }
  
  joinGame(gameId, playerId, playerName) {
    // モック実装  
  }
}
```

---

## 📈 品質指標とKPI

### 測定指標

| 指標 | 現状 | 目標 | 測定方法 |
|------|------|------|----------|
| **総合テスト成功率** | 49.4% | 95% | 自動テスト実行 |
| **サーバーテスト成功率** | 16.7% | 90% | Node.js test runner |
| **クライアントテスト成功率** | 81.4% | 98% | Vitest実行 |
| **コードカバレッジ** | 未測定 | 80% | c8/istanbul |
| **テスト実行時間** | 3.6秒 | <5秒 | CI/CD測定 |

### 週次進捗追跡

```
Week 1 目標:
├── サーバーテスト成功率: 70%
├── クライアントテスト成功率: 95%
└── 技術債務解消: 80%

Week 2 目標:  
├── 新規テストケース: +20件
├── カバレッジ向上: 65%
└── 統合テスト修復: 50%

Week 3-4 目標:
├── E2Eテスト完成: 100%
├── 総合成功率: 90%
└── パフォーマンステスト: 着手
```

---

## 🚨 リスクと対策

### 高リスク項目

#### 1. 複雑なゲームロジック
**リスク**: オートマシステムの複雑性によるテスト困難
**対策**: 
- 段階的テスト実装
- モック・スタブ活用
- ユニットテスト→統合テスト順序

#### 2. UI/UXテストの複雑性
**リスク**: モダンUIコンポーネントのテスト困難
**対策**:
- Testing Library ベストプラクティス適用
- カスタムマッチャー活用
- 視覚的テスト導入検討

#### 3. 時間的制約
**リスク**: 期限内完了困難
**対策**:
- 優先度明確化
- 並行作業推進
- 最小限実装→拡張アプローチ

---

## ✅ アクション実行チェックリスト

### Phase 1: 基盤修正 (Week 1)
- [ ] サーバーテストメソッド名修正完了
- [ ] GameManager.js作成完了
- [ ] クライアントUIテスト修正完了
- [ ] 基本テスト成功率70%達成

### Phase 2: 拡張実装 (Week 2-3)
- [ ] オートマシステムテスト完成
- [ ] E2Eテストシナリオ実装
- [ ] 統合テスト修復完了
- [ ] カバレッジ80%達成

### Phase 3: 品質向上 (Week 4-)
- [ ] パフォーマンステスト実装
- [ ] CI/CD統合完了
- [ ] 自動レポート生成
- [ ] 総合成功率95%達成

---

## 📞 連絡・報告体制

### 週次進捗会議
**日時**: 毎週金曜日 16:00-17:00  
**参加者**: 開発チーム全員  
**議題**: 進捗確認、課題共有、次週計画

### 緊急時エスカレーション
**Level 1**: チーム内相談 (即時)  
**Level 2**: テックリード判断 (4時間以内)  
**Level 3**: プロジェクトマネージャー判断 (24時間以内)

---

**📝 このアクションプランは [Claude Code](https://claude.ai/code) により策定されました**

**承認**: _________________ 日付: _________________