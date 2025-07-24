#!/usr/bin/env python3
"""
GitHub ActionsからClaude APIを呼び出してプレイテストを自動実行するスクリプト
"""

import os
import sys
import json
from datetime import datetime
from pathlib import Path
import anthropic

def main():
    # 環境変数からAPI keyを取得
    api_key = os.environ.get('ANTHROPIC_API_KEY')
    if not api_key:
        print("❌ ANTHROPIC_API_KEY環境変数が設定されていません")
        sys.exit(1)
    
    # テストタイプを取得（デフォルト: バランステスト）
    test_type = os.environ.get('TEST_TYPE', 'バランステスト')
    
    # Claude APIクライアント初期化
    try:
        client = anthropic.Anthropic(api_key=api_key)
        print(f"✅ Claude APIクライアント初期化完了")
    except Exception as e:
        print(f"❌ Claude APIクライアント初期化エラー: {e}")
        sys.exit(1)
    
    # プロジェクトのルートディレクトリを確認
    project_root = Path.cwd()
    claude_md_path = project_root / "CLAUDE.md"
    rule_md_path = project_root / "Rule.md"
    
    if not claude_md_path.exists() or not rule_md_path.exists():
        print(f"❌ 必要なファイルが見つかりません: {project_root}")
        print(f"CLAUDE.md存在: {claude_md_path.exists()}")
        print(f"Rule.md存在: {rule_md_path.exists()}")
        sys.exit(1)
    
    # CLAUDE.mdの内容を読み込み
    try:
        with open(claude_md_path, 'r', encoding='utf-8') as f:
            claude_md_content = f.read()
        
        with open(rule_md_path, 'r', encoding='utf-8') as f:
            rule_md_content = f.read()
            
        print("✅ プロジェクトファイル読み込み完了")
    except Exception as e:
        print(f"❌ ファイル読み込みエラー: {e}")
        sys.exit(1)
    
    # プレイテスト用のプロンプトを構築
    playtest_prompt = f"""
あなたはマーケット・ディスラプションのテストプレイ担当です。

以下のCLAUDE.mdの指示に従って、「{test_type}」のテストプレイを実行してください：

<CLAUDE.md>
{claude_md_content}
</CLAUDE.md>

<Rule.md>
{rule_md_content[:3000]}...
（完全なルールはCLAUDE.mdから参照してください）
</Rule.md>

**実行要求:**
1. {test_type}に適した4人のプレイヤー設定を行う
2. CLAUDE.mdの「順守すべきルール」をすべて厳密に守る
3. 特に以下を厳格にチェック：
   - AP計算の正確性（残りAP表示）
   - 日雇い労働の資金制限（100以下の場合のみ）
   - 人気度は1より下がらない
   - パーソナルマーケットグリッドの記録
   - 各ラウンドでダイスロール実行
   - 率直な感想を記録

4. テスト結果をtest/yyyymmdd_hhmmss_{test_type}.mdファイルに保存
5. 結果をgit commitして同期

GitHub Actionsから自動実行されているため、ファイル作成とcommitまで完了してください。
現在時刻: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
"""

    # Claude APIを呼び出し
    try:
        print(f"🚀 Claude APIに{test_type}のプレイテスト要求を送信中...")
        
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=8192,
            temperature=0.7,
            messages=[{
                "role": "user",
                "content": playtest_prompt
            }]
        )
        
        response = message.content[0].text
        print("✅ Claude APIからの応答を受信")
        
        # レスポンスをログファイルに保存（デバッグ用）
        log_path = project_root / "scripts" / f"playtest_log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        with open(log_path, 'w', encoding='utf-8') as f:
            f.write(f"Test Type: {test_type}\\n")
            f.write(f"Timestamp: {datetime.now().isoformat()}\\n")
            f.write(f"Response Length: {len(response)} characters\\n")
            f.write("=" * 50 + "\\n")
            f.write(response)
        
        print(f"📝 レスポンスログを保存: {log_path}")
        
        # プレイテストファイルが作成されたかチェック
        test_dir = project_root / "test"
        if test_dir.exists():
            # 最新のテストファイルを確認
            test_files = list(test_dir.glob("*.md"))
            test_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
            
            if test_files:
                latest_file = test_files[0]
                print(f"✅ 最新のテストファイル: {latest_file.name}")
            else:
                print("⚠️  テストファイルが見つかりません")
        
        print("🎉 プレイテスト要求完了")
        
    except anthropic.APIError as e:
        print(f"❌ Claude API エラー: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ 予期しないエラー: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()