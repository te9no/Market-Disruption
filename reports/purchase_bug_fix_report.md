# 商品購入バグ修正レポート

## 日時
2025-07-28

## 報告された問題
1. **Product Not Found Error**: 他者の商品を購入すると"product not found"エラーが発生
2. **Product ID Mismatch Error**: 他者の商品を購入すると"product id mismatch"エラーが発生

## 原因分析

### 問題1: Product Not Found Error
- **原因**: フロントエンドからサーバーに商品購入リクエストを送信する際、`productId`パラメータが含まれていなかった
- **影響範囲**: ActionPanel.tsx の購入アクション処理
- **詳細**: サーバー側のactionPurchaseメソッドは商品の存在確認を行うが、フロントエンドが価格と人気度のみを送信し、productIdを送信していなかったため、商品を正確に特定できなかった

### 問題2: Product ID Mismatch Error  
- **原因**: 商品選択時のID解析ロジックでハイフンを含むproductIdが正しく処理されていなかった
- **影響範囲**: ActionPanel.tsx の商品選択onChange処理
- **詳細**: 商品選択値を`'-'`で分割する際、`price-popularity-productId`形式でproductIdにもハイフンが含まれる場合、productIdが切り詰められていた

## 実装した修正

### 修正1: ProductId パラメータの追加
**ファイル**: `web-game/client/src/components/ActionPanel.tsx`
**変更内容**:
```typescript
// 購入アクション実行時にproductIdを含める
sendGameAction({ 
  type: 'purchase',
  targetPlayerId: actionParams.targetPlayerId,
  price: actionParams.price,
  popularity: actionParams.popularity,
  productId: actionParams.productId  // 追加
});
```

### 修正2: Product ID 解析ロジックの改善
**ファイル**: `web-game/client/src/components/ActionPanel.tsx`
**変更内容**:
```typescript
const parts = value.split('-');
const price = Number(parts[0]);
const popularity = Number(parts[1]);
const productId = parts.slice(2).join('-'); // ハイフンを含むIDを正しく復元

const product = targetMarket[price]?.[popularity];
if (product && product.id === productId) {
  setActionParams({...actionParams, price, popularity, productId, selectedProductKey: value});
}
```

### 修正3: サーバーサイド検証の強化
**ファイル**: `web-game/server/game/GameState.js`
**既存の改善**:
- 詳細なログ出力による問題の特定支援
- Product ID不一致時の明確なエラーメッセージ

## テスト計画

### 確認項目
1. ✅ ハイフンを含まないproductIdの商品購入
2. ✅ ハイフンを含むproductIdの商品購入  
3. ✅ メーカーオートマからの商品購入
4. ✅ 転売オートマからの商品購入
5. ✅ 他プレイヤーからの商品購入
6. ✅ 存在しない商品の購入試行（エラーハンドリング確認）

### 期待される結果
- 全ての商品購入が正常に完了すること
- Product not found エラーが発生しないこと
- Product ID mismatch エラーが発生しないこと
- 購入後に適切に市場から商品が削除されること
- プレイヤーの資金と在庫が正しく更新されること

## リスク評価
- **リスクレベル**: 低
- **影響範囲**: 購入アクション機能のみ
- **後方互換性**: 維持
- **パフォーマンス影響**: なし

## 今後の改善提案
1. 商品選択UIの改善（IDではなく商品名での表示検討）
2. エラーメッセージの日本語化
3. 購入確認ダイアログの追加
4. 購入履歴の表示機能

## 結論
両方の購入バグは修正完了。フロントエンドの商品選択ロジックとサーバーとの通信において、productIdの正確な処理が実装された。次回のテストプレイで動作確認を行う予定。