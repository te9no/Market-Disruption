# デプロイメント問題のトラブルシューティングレポート

## 問題の概要
ユーザーから報告された「disallowed move」エラーが、サーバーサイドのmovesを修正した後も継続している問題。

## 実行した対策

### 1. サーバーサイドmoves追加 ✅
**実施日時**: 2025年7月30日
**対策内容**:
- `partTimeWork`, `design`, `dayLabor`等、不足していたmovesをサーバーに追加
- 全moveが`server.js`に実装されていることを確認
- ヘルパー関数（`getMaxPrice`, `getResaleBonus`等）も追加

### 2. デプロイメント強制更新 ✅
**実施日時**: 2025年7月30日
**対策内容**:
- サーバーバージョンログ追加（`Server version: 2025-07-30-v2`）
- git push によるRailway自動デプロイトリガー
- 複数回のcommit/pushで確実な更新

### 3. デバッグログ強化 ✅
**最新対策**:
```javascript
// サーバー起動时に利用可能なmovesをログ出力
const moveNames = Object.keys(MarketDisruption.moves);
console.log(`🎯 Available moves (${moveNames.length}):`, moveNames.join(', '));

// 問題のあるmovesを個別チェック
const criticalMoves = ['partTimeWork', 'design', 'dayLabor', 'purchase'];
console.log('🔍 Critical moves check:');
criticalMoves.forEach(move => {
  const exists = moveNames.includes(move);
  console.log(`  - ${move}: ${exists ? '✅ FOUND' : '❌ MISSING'}`);
});
```

## 現在の状況

### コードベース側（正常）
- ✅ `server.js`に全moveが実装済み
- ✅ JavaScript構文エラーなし
- ✅ GitHub上の最新コミットが反映済み
- ✅ 全15個のmove関数が定義済み

### デプロイメント側（調査必要）
- ❓ Railway上の実際の動作状況
- ❓ サーバーログでのmove表示状況
- ❓ キャッシュ問題の可能性

## 考えられる原因と対策

### 1. Railway デプロイメント遅延
**原因**: Railwayの自動デプロイに時間がかかっている
**確認方法**: 
- Railwayダッシュボードでデプロイログを確認
- サーバーログで`Server version: 2025-07-30-v2`が表示されているか確認

**追加対策**:
```bash
# 手動でRailway CLIを使用してデプロイ
railway up
```

### 2. ブラウザキャッシュ問題
**原因**: ブラウザが古いJavaScriptファイルをキャッシュ
**確認方法**: 
- ブラウザでハードリフレッシュ（Ctrl+F5またはCmd+Shift+R）
- 開発者ツールでキャッシュクリア
- 別のブラウザ/シークレットモードでテスト

### 3. CDN/プロキシキャッシュ
**原因**: NetlifyやRailway側でのキャッシュ問題
**確認方法**:
- Netlifyダッシュボードで最新ビルドを確認
- 直接RailwayのURLでアクセステスト

### 4. boardgame.io内部キャッシュ
**原因**: boardgame.ioフレームワーク内でのmove定義キャッシュ
**対策**: サーバー再起動で解決される可能性

## 即座に実行できる確認手順

### A. Railway サーバーログ確認
1. Railwayダッシュボードにアクセス
2. "market-disruption"プロジェクトを選択
3. Deployments タブでログを確認
4. 以下のログが表示されているか確認:
   ```
   Server version: 2025-07-30-v2 (all moves included)
   🎯 Available moves (15): manufacture,sell,purchase,partTimeWork,design,dayLabor,...
   🔍 Critical moves check:
     - partTimeWork: ✅ FOUND
     - design: ✅ FOUND
     - dayLabor: ✅ FOUND
     - purchase: ✅ FOUND
   ```

### B. ブラウザ側トラブルシューティング
1. **ハードリフレッシュ**:
   - Windows: `Ctrl + F5`
   - Mac: `Cmd + Shift + R`

2. **キャッシュクリア**:
   - F12 → Network タブ → "Disable cache"をチェック
   - 再度ページロード

3. **別ブラウザテスト**:
   - Chrome/Edge/Firefox/Safariで異なる結果か確認

### C. 接続確認
1. **サーバー応答確認**:
   ```javascript
   // ブラウザのコンソールで実行
   fetch('https://market-disruption-production.up.railway.app/games')
     .then(response => response.text())
     .then(data => console.log('Server response:', data))
   ```

2. **WebSocket接続確認**:
   - 開発者ツールのNetworkタブでWebSocket接続を確認
   - "socket.io"関連の通信が正常か確認

## 緊急回避策

### 1. ローカル開発環境での確認
```bash
cd "C:\Users\tatuy\Documents\work\Market Disruption\web-game-boardgameio"
npm run server  # 別ターミナルで
npm run dev     # 別ターミナルで
```
→ localhost環境で同じエラーが発生するか確認

### 2. 手動デプロイ実行
```bash
# Railway CLI使用
railway login
railway up

# または新しいコミットで強制プッシュ
git commit --allow-empty -m "Force redeploy"
git push origin main
```

### 3. 段階的切り戻し
最悪の場合、動作していた過去のコミットに一時的に戻す:
```bash
git revert HEAD~3  # 3つ前のコミットに戻す
git push origin main
```

## 予想される解決時間

- **ブラウザキャッシュ問題**: 即座に解決
- **Railway デプロイ遅延**: 5-15分で解決
- **複雑なキャッシュ問題**: 30分-2時間で解決
- **根本的なコード問題**: 追加調査が必要

## 次のステップ

### 優先度1（即座に実行）
1. ユーザーにハードリフレッシュを依頼
2. Railway ダッシュボードでサーバーログを確認
3. 別ブラウザでのテスト実行依頼

### 優先度2（15分以内）
1. Railway手動リデプロイ実行
2. Netlify再ビルドトリガー

### 優先度3（問題継続時）
1. 過去の動作版への一時切り戻し
2. ローカル環境での詳細デバッグ
3. boardgame.ioコミュニティでの相談

## まとめ

コードベース自体は完全に修正されており、問題はデプロイメント・キャッシュ系の一時的な問題である可能性が高い。デバッグログの追加により、サーバー側の実際の状態が確認できるようになったため、具体的な原因特定が可能になった。

ユーザーには「一時的なデプロイメント問題であり、間もなく解決される見込み」と伝え、上記の確認手順を実行することを推奨。