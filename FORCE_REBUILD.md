# 🔄 強制リビルド手順

この変更により Netlify が新しい環境変数で強制的にリビルドされます。

## 実行手順:

```bash
# 1. このファイルを削除
rm FORCE_REBUILD.md

# 2. 変更をコミット
git add .
git commit -m "🔧 Fix API URL: Use correct Railway public domain"

# 3. プッシュしてNetlifyリビルドをトリガー
git push origin main
```

## Netlify でのマニュアル手順:

1. Netlify Dashboard にアクセス
2. Site settings → Environment variables
3. `VITE_API_URL` を削除
4. 新しく作成:
   - Key: `VITE_API_URL`  
   - Value: `https://[正しいRailway URL]`
5. Deploys → Trigger deploy → "Clear cache and deploy site"

## 確認事項:

- [ ] Railway で実際の公開URLを確認済み
- [ ] `railway.internal` ではなく `up.railway.app` ドメインを使用
- [ ] Netlify 環境変数が更新済み
- [ ] キャッシュクリアしてリビルド実行済み