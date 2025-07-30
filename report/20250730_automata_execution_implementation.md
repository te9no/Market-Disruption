# オートマアクション実行システム実装レポート

## 実装日時
2025年7月30日

## 実装概要
「オートマフェーズへ」ボタンを押したときにオートマのアクションが適切に実行されるシステムを実装しました。

## 実装内容

### 1. サーバーサイド改修 (server.js)

#### A. オートマ実行関数の追加
- `executeManufacturerAutomata(G)`: メーカー・オートマの行動処理
- `executeResaleAutomata(G)`: 転売ヤー・オートマの行動処理
- `executeMarketPhase(G)`: 市場フェーズの需要処理
- `getPollutionPenalty(pollutionLevel)`: 市場汚染による価格ペナルティ計算

#### B. フェーズシステムの強化
```javascript
automata: {
  moves: {},
  turn: {
    order: {
      first: () => 0,
      next: () => undefined,
    },
    onBegin: ({ G, events }) => {
      console.log('Automata phase: executing automata actions');
      executeManufacturerAutomata(G);
      executeResaleAutomata(G);
      
      // 自動的に次のフェーズに進む
      if (events && events.endPhase) {
        setTimeout(() => events.endPhase(), 1500);
      }
    }
  },
  next: 'market'
}
```

#### C. 詳細なログ出力
- 各オートマの行動をコンソールに詳細出力
- ダイスロール結果、商品作成、購入処理の追跡
- デバッグ情報の充実

### 2. メーカー・オートマ処理詳細

#### 行動パターン
- **2d6 ≤ 4**: 高コスト商品製造 (コスト3-6、価格×3)
- **2d6 5-7**: 中コスト商品製造 (コスト3、価格×2)  
- **2d6 8-10**: 低コスト商品製造 (コスト1-3、価格×2)
- **2d6 ≥ 11**: セール実施 (全商品価格-2、最低1)

#### 実装されたロジック
```javascript
function executeManufacturerAutomata(G) {
  const diceSum = rollDice() + rollDice();
  
  let action;
  if (diceSum <= 4) action = 'high-cost';
  else if (diceSum <= 7) action = 'mid-cost';
  else if (diceSum <= 10) action = 'low-cost';
  else action = 'clearance';
  
  console.log(`🤖 Manufacturer Automata: dice=${diceSum}, action=${action}`);
  
  if (action === 'clearance') {
    for (const product of G.automata.market) {
      product.price = Math.max(1, product.price - 2);
    }
  } else {
    // 商品製造処理
    const product = {
      id: `automata-product-${Date.now()}`,
      cost: targetCost,
      price: targetCost * (action === 'high-cost' ? 3 : 2),
      popularity: 1,
      playerId: 'manufacturer-automata',
      isResale: false
    };
    G.automata.market.push(product);
  }
}
```

### 3. 転売ヤー・オートマ処理詳細

#### 行動パターン
- **2d6 ≤ 4**: 安価商品3つを転売（価格昇順、人気度降順）
- **2d6 = 5,9**: 人気商品1つを転売（人気度降順、価格昇順）
- **2d6 = 6-8**: 行動なし
- **2d6 ≥ 10**: ランダム商品1つを転売

#### 実装されたロジック
```javascript
function executeResaleAutomata(G) {
  if (G.automata.resaleOrganizationMoney < 20) {
    G.automata.resaleOrganizationMoney = 20;
  }
  
  const diceSum = rollDice() + rollDice();
  
  if (diceSum >= 6 && diceSum <= 8) return;
  
  // 対象商品選択ロジック
  let targetProducts = [];
  
  if (diceSum <= 4) {
    targetProducts = allProducts
      .sort((a, b) => a.price - b.price || b.popularity - a.popularity)
      .slice(0, 3);
  } else if (diceSum === 5 || diceSum === 9) {
    targetProducts = allProducts
      .sort((a, b) => b.popularity - a.popularity || a.price - b.price)
      .slice(0, 1);
  } else if (diceSum >= 10) {
    const randomIndex = Math.floor(Math.random() * allProducts.length);
    targetProducts = [allProducts[randomIndex]];
  }
  
  // 転売処理（価格+5で再販）
  for (const product of targetProducts) {
    if (G.automata.resaleOrganizationMoney >= product.price) {
      // 転売商品作成
      const resaleProduct = {
        ...product,
        id: `resale-${Date.now()}`,
        price: product.price + 5,
        isResale: true,
        originalCost: product.cost,
        originalPlayerId: product.playerId,
        playerId: 'resale-automata'
      };
      
      G.automata.market.push(resaleProduct);
      G.marketPollution++; // 市場汚染度増加
    }
  }
}
```

### 4. 市場フェーズ処理詳細

#### 需要システム
```javascript
const getDemandValue = (cost) => {
  const demandMap = {
    1: [6, 7, 8],   // コスト1の商品は2d6が6-8で需要あり
    2: [5, 9],      // コスト2の商品は2d6が5,9で需要あり
    3: [4, 10],     // コスト3の商品は2d6が4,10で需要あり
    4: [3, 11],     // コスト4の商品は2d6が3,11で需要あり
    5: [2, 12]      // コスト5の商品は2d6が2,12で需要あり
  };
  return demandMap[cost] || [];
};
```

#### 購入処理
```javascript
function executeMarketPhase(G) {
  const demandDice = rollDice() + rollDice();
  
  // 需要条件を満たす商品をフィルタリング
  const eligibleProducts = allProducts.filter(product => {
    const demandValues = getDemandValue(product.cost);
    return demandValues.includes(demandDice);
  });
  
  // 人気度降順、価格昇順でソート
  eligibleProducts.sort((a, b) => b.popularity - a.popularity || a.price - b.price);
  
  // 上位5商品を購入
  const purchasedProducts = eligibleProducts.slice(0, 5);
  
  for (const product of purchasedProducts) {
    const actualPrice = Math.max(1, product.price - getPollutionPenalty(G.marketPollution));
    
    // プレイヤーに売上金を支払い、商品を市場から削除
    if (product.playerId !== 'manufacturer-automata' && product.playerId !== 'resale-automata') {
      const player = G.players[product.playerId];
      if (player) {
        player.money += actualPrice;
        const productIndex = player.personalMarket.findIndex(p => p.id === product.id);
        if (productIndex !== -1) {
          player.personalMarket.splice(productIndex, 1);
        }
      }
    } else {
      // オートマ商品の場合は単純に削除
      const productIndex = G.automata.market.findIndex(p => p.id === product.id);
      if (productIndex !== -1) {
        G.automata.market.splice(productIndex, 1);
      }
    }
  }
}
```

### 5. 市場汚染システム

#### 汚染ペナルティ
```javascript
function getPollutionPenalty(pollutionLevel) {
  if (pollutionLevel <= 2) return 0;   // 汚染レベル0-2: ペナルティなし
  if (pollutionLevel <= 5) return 1;   // 汚染レベル3-5: -1価格
  if (pollutionLevel <= 8) return 2;   // 汚染レベル6-8: -2価格
  if (pollutionLevel <= 11) return 3;  // 汚染レベル9-11: -3価格
  return 4;                            // 汚染レベル12+: -4価格
}
```

### 6. フェーズ遷移システム

#### 自動進行タイミング
```javascript
onBegin: ({ G, events }) => {
  console.log('Automata phase: executing automata actions');
  executeManufacturerAutomata(G);
  executeResaleAutomata(G);
  
  // 1.5秒後に自動的に市場フェーズへ進行
  if (events && events.endPhase) {
    setTimeout(() => events.endPhase(), 1500);
  }
}
```

#### 1人プレイ対応
```javascript
endIf: ({ ctx }) => {
  if (ctx.numPlayers === 1) {
    return true; // 1人プレイの場合は即座にフェーズ終了可能
  }
  return false;
}
```

## テストケース

### 期待される動作
1. **「オートマフェーズへ」ボタン押下**
   - アクションフェーズからオートマフェーズに遷移
   - メーカー・オートマが2d6をロールして適切な行動を実行
   - 転売ヤー・オートマが2d6をロールして適切な行動を実行
   - 1.5秒後に自動的に市場フェーズに進行

2. **市場フェーズ自動実行**
   - 需要ダイス（2d6）をロール
   - 需要条件を満たす商品を選択
   - 人気度・価格順で上位5商品を購入処理
   - 1.5秒後に自動的にアクションフェーズに戻る

3. **状態更新確認**
   - オートマ商品がオートマ・マーケットに追加される
   - 転売による市場汚染度が増加する
   - プレイヤーの商品が購入された場合、資金が増加する
   - 商品がマーケットから適切に削除される

## デプロイ状況

### Railway (バックエンド)
- URL: https://market-disruption-production.up.railway.app
- 状態: デプロイ完了
- ログ: オートマ実行ログが出力される

### Netlify (フロントエンド)  
- URL: https://market-disruption.netlify.app
- 状態: デプロイ完了
- 環境変数: VITE_SERVER_URL設定済み

## 今後の課題

1. **ユーザビリティ改善**
   - オートマアクション実行中の視覚的フィードバック
   - アクション結果の明確な表示

2. **パフォーマンス最適化**
   - フェーズ遷移の高速化
   - 不要な再レンダリングの削減

3. **エラーハンドリング**
   - ネットワーク接続エラー時の処理
   - 不正な状態からの復旧機能

## 実装完了確認

✅ オートマフェーズでメーカー・オートマの行動が実行される
✅ オートマフェーズで転売ヤー・オートマの行動が実行される  
✅ 市場フェーズで需要システムが機能する
✅ フェーズ自動遷移が適切に動作する
✅ 1人プレイモードで「オートマフェーズへ」ボタンが機能する
✅ サーバー・クライアント間の状態同期が正常
✅ 本番環境へのデプロイが完了

## 技術的詳細

### 使用技術
- **フレームワーク**: boardgame.io
- **バックエンド**: Node.js + Express
- **フロントエンド**: React + TypeScript + Vite
- **デプロイ**: Railway (サーバー) + Netlify (クライアント)
- **通信**: Socket.IO (WebSocket)

### 主要な変更ファイル
- `server.js`: オートマ実行ロジック追加（355行の追加）
- `src/game/MarketDisruption.ts`: クライアント側ゲームロジック（同期済み）
- `src/components/GameBoard.tsx`: UI改善とデバッグログ強化

## 結論

オートマアクション実行システムの実装が完了し、ユーザーが「オートマフェーズへ」ボタンを押すことで期待通りにオートマの行動が実行されるようになりました。ゲームの核となるオートマシステムが正常に機能し、プレイヤーとオートマの戦略的対戦が実現されています。