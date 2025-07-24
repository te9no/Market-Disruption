# GitHub Actions自動プレイテスト設定ガイド

## 概要

このリポジトリには、Claude APIを使用してマーケット・ディスラプションのプレイテストを自動実行するGitHub Actionsワークフローが含まれています。

## 必要な設定

### 1. Anthropic API Keyの設定

1. [Anthropic Console](https://console.anthropic.com/)にアクセス
2. API Keyを生成
3. GitHubリポジトリの設定で以下を行う：
   - `Settings` → `Secrets and variables` → `Actions`
   - `New repository secret`をクリック
   - **Name**: `ANTHROPIC_API_KEY`
   - **Secret**: 生成したAPI Key
   - `Add secret`をクリック

### 2. GitHub Actionsの権限設定

1. リポジトリの`Settings` → `Actions` → `General`
2. `Workflow permissions`セクションで：
   - `Read and write permissions`を選択
   - `Allow GitHub Actions to create and approve pull requests`にチェック

## 使用方法

### 自動実行
- 毎週月曜日の午前9時（UTC）に自動実行されます

### 手動実行
1. リポジトリの`Actions`タブに移動
2. `Automated Playtest Request`ワークフローを選択
3. `Run workflow`をクリック
4. テストタイプを選択：
   - バランステスト
   - システムブレイカーテスト
   - 癖のあるプレイヤーテスト
   - 新ルール検証テスト

## ワークフローの動作

1. **Python環境のセットアップ**: 必要な依存関係をインストール
2. **Claude APIの呼び出し**: 指定されたテストタイプでプレイテストを要求
3. **結果の確認**: 新しいテストファイルが作成されたかチェック
4. **コミット**: 結果を自動的にコミット・プッシュ
5. **エラー処理**: 失敗時にはIssueを自動作成

## ファイル構造

```
.github/
  workflows/
    auto-playtest.yml     # GitHub Actionsワークフロー
scripts/
  request_playtest.py     # Claude API呼び出しスクリプト
  playtest_log_*.txt      # 実行ログ（自動生成）
test/                     # プレイテスト結果（自動生成）
  yyyymmdd_hhmmss_*.md
```

## トラブルシューティング

### よくある問題

1. **API Key エラー**
   - `ANTHROPIC_API_KEY`が正しく設定されているか確認
   - API Keyの有効期限をチェック

2. **権限エラー**
   - GitHub Actionsの書き込み権限が有効になっているか確認

3. **プレイテストファイルが作成されない**
   - `scripts/playtest_log_*.txt`でClaude APIの応答を確認
   - CLAUDE.mdとRule.mdが存在するかチェック

### ログの確認方法

1. `Actions`タブで失敗したワークフローをクリック
2. 各ステップのログを確認
3. `scripts/playtest_log_*.txt`でAPIの詳細な応答を確認

## 制限事項

- Claude API の利用制限に依存
- 1回のプレイテストで約8,000トークンを使用
- 月間実行回数は約4-5回（スケジュール実行の場合）

## カスタマイズ

### 実行頻度の変更
`.github/workflows/auto-playtest.yml`の`cron`設定を変更：
```yaml
schedule:
  - cron: '0 9 * * 1'  # 毎週月曜9時 → お好みの時間に変更
```

### テストタイプの追加
ワークフローファイルの`options`に新しいテストタイプを追加可能

## セキュリティ

- API Keyは暗号化されたSecretsに保存
- スクリプトはAPI Keyをログに出力しない
- 生成されたログファイルにはAPI Keyは含まれない