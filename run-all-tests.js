#!/usr/bin/env node

import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// カラー出力用のヘルパー
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(color, text) {
  return `${colors[color]}${text}${colors.reset}`;
}

function log(level, message) {
  const timestamp = new Date().toLocaleTimeString();
  const levelColors = {
    INFO: 'blue',
    SUCCESS: 'green', 
    WARNING: 'yellow',
    ERROR: 'red'
  };
  
  console.log(`[${timestamp}] ${colorize(levelColors[level] || 'reset', level)}: ${message}`);
}

// テストスイート定義
const TEST_SUITES = {
  server: {
    name: 'サーバーサイドテスト',
    directory: 'web-game/server',
    command: 'npm',
    args: ['test'],
    description: 'Node.js組み込みテストランナー使用'
  },
  client: {
    name: 'クライアントサイドテスト', 
    directory: 'web-game/client',
    command: 'npm',
    args: ['run', 'test'],
    description: 'Vitest使用（React Testing Library）'
  }
};

// 単一テストスイートを実行
async function runTestSuite(suiteName) {
  const suite = TEST_SUITES[suiteName];
  if (!suite) {
    throw new Error(`Unknown test suite: ${suiteName}`);
  }

  log('INFO', `\n${'='.repeat(60)}`);
  log('INFO', `${suite.name} 実行開始`);
  log('INFO', `説明: ${suite.description}`);
  log('INFO', `ディレクトリ: ${suite.directory}`);
  log('INFO', `${'='.repeat(60)}`);

  const workingDir = join(__dirname, suite.directory);
  const startTime = Date.now();

  return new Promise((resolve) => {
    const testProcess = spawn(suite.command, suite.args, {
      cwd: workingDir,
      stdio: 'inherit',
      shell: true,
      env: { 
        ...process.env, 
        NODE_ENV: 'test',
        FORCE_COLOR: '1'
      }
    });

    testProcess.on('close', (code) => {
      const duration = Date.now() - startTime;
      const durationSeconds = (duration / 1000).toFixed(2);
      
      if (code === 0) {
        log('SUCCESS', `${suite.name} 完了 (${durationSeconds}秒)`);
        resolve({ success: true, suite: suiteName, duration });
      } else {
        log('ERROR', `${suite.name} 失敗 (終了コード: ${code})`);
        resolve({ success: false, suite: suiteName, duration, exitCode: code });
      }
    });

    testProcess.on('error', (error) => {
      log('ERROR', `${suite.name} 実行エラー: ${error.message}`);
      resolve({ success: false, suite: suiteName, error: error.message });
    });
  });
}

// 依存関係のインストール
async function installDependencies(suiteName) {
  const suite = TEST_SUITES[suiteName];
  const workingDir = join(__dirname, suite.directory);
  
  log('INFO', `${suite.name} の依存関係をインストール中...`);
  
  return new Promise((resolve) => {
    const installProcess = spawn('npm', ['install'], {
      cwd: workingDir,
      stdio: 'pipe',
      shell: true
    });

    let output = '';
    installProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    installProcess.stderr.on('data', (data) => {
      output += data.toString();
    });

    installProcess.on('close', (code) => {
      if (code === 0) {
        log('SUCCESS', `${suite.name} の依存関係インストール完了`);
        resolve({ success: true });
      } else {
        log('ERROR', `${suite.name} の依存関係インストール失敗`);
        console.log(output);
        resolve({ success: false, error: `npm install failed with code ${code}` });
      }
    });

    installProcess.on('error', (error) => {
      log('ERROR', `${suite.name} インストールエラー: ${error.message}`);
      resolve({ success: false, error: error.message });
    });
  });
}

// 全テストスイートを実行
async function runAllTests(options = {}) {
  log('INFO', colorize('bright', '\n🧪 マーケット・ディスラプション 統合テストスイート開始'));
  log('INFO', `テスト実行時刻: ${new Date().toLocaleString()}`);
  
  const results = [];
  const totalStartTime = Date.now();

  // 実行するスイートを決定
  const suitesToRun = options.suites || Object.keys(TEST_SUITES);
  
  for (const suiteName of suitesToRun) {
    if (!(suiteName in TEST_SUITES)) {
      log('WARNING', `Unknown test suite: ${suiteName}`);
      continue;
    }

    try {
      // 依存関係のインストール
      if (options.install) {
        const installResult = await installDependencies(suiteName);
        if (!installResult.success) {
          results.push({ 
            success: false, 
            suite: suiteName, 
            error: `依存関係インストール失敗: ${installResult.error}` 
          });
          
          if (options.failFast) {
            log('ERROR', 'fail-fast モードにより中断');
            break;
          }
          continue;
        }
      }

      // テスト実行
      const result = await runTestSuite(suiteName);
      results.push(result);
      
      if (!result.success && options.failFast) {
        log('ERROR', 'fail-fast モードによりテスト実行を中断');
        break;
      }
    } catch (error) {
      log('ERROR', `${TEST_SUITES[suiteName].name} 実行中にエラー: ${error.message}`);
      results.push({ success: false, suite: suiteName, error: error.message });
      
      if (options.failFast) {
        break;
      }
    }
  }

  // 結果サマリー
  const totalDuration = (Date.now() - totalStartTime) / 1000;
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  log('INFO', `\n${'='.repeat(80)}`);
  log('INFO', colorize('bright', 'テスト実行結果サマリー'));
  log('INFO', `${'='.repeat(80)}`);
  
  results.forEach(result => {
    const status = result.success ? 
      colorize('green', '✅ PASS') : 
      colorize('red', '❌ FAIL');
    const duration = result.duration ? ` (${(result.duration / 1000).toFixed(2)}s)` : '';
    log('INFO', `${status} ${TEST_SUITES[result.suite].name}${duration}`);
    
    if (!result.success && result.error) {
      log('ERROR', `     エラー: ${result.error}`);
    }
  });

  log('INFO', `\n総実行時間: ${totalDuration.toFixed(2)}秒`);
  log('INFO', `成功: ${colorize('green', successCount)} / 失敗: ${colorize('red', failCount)} / 合計: ${results.length}`);

  if (failCount === 0) {
    log('SUCCESS', colorize('bright', '🎉 全てのテストスイートが正常に完了しました！'));
    log('INFO', '\n📊 テストカバレッジの詳細:');
    log('INFO', '  - サーバーサイド: Node.js内蔵テストで基本機能とロジックを検証');
    log('INFO', '  - クライアントサイド: Vitestでコンポーネントとフックを検証');
    log('INFO', '  - 統合テスト: Socket.IO通信とE2Eシナリオを検証');
  } else {
    log('ERROR', colorize('bright', '💥 一部のテストスイートが失敗しました'));
    log('INFO', '\n🔧 トラブルシューティング:');
    log('INFO', '  - 依存関係: --install オプションで再インストール');
    log('INFO', '  - 個別実行: 特定のスイートのみ指定して詳細確認');
    log('INFO', '  - ログ確認: より詳細なエラー情報を確認');
  }

  return {
    success: failCount === 0,
    total: results.length,
    passed: successCount,
    failed: failCount,
    duration: totalDuration,
    results
  };
}

// CLI引数の解析
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    suites: null,
    install: false,
    failFast: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--suites':
      case '-s':
        options.suites = args[++i]?.split(',');
        break;
      case '--install':
      case '-i':
        options.install = true;
        break;
      case '--fail-fast':
      case '-f':
        options.failFast = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        if (Object.keys(TEST_SUITES).includes(arg)) {
          options.suites = [arg];
        }
    }
  }

  return options;
}

// ヘルプ表示
function showHelp() {
  console.log(colorize('bright', '\n🧪 マーケット・ディスラプション 統合テストランナー'));
  console.log('\n使用方法:');
  console.log('  node run-all-tests.js [オプション] [スイート]');
  
  console.log('\n利用可能なテストスイート:');
  Object.entries(TEST_SUITES).forEach(([key, suite]) => {
    console.log(`  ${colorize('cyan', key.padEnd(10))} - ${suite.description}`);
  });
  
  console.log('\nオプション:');
  console.log('  -s, --suites <list>     実行するスイート (カンマ区切り)');
  console.log('  -i, --install           依存関係を事前インストール');
  console.log('  -f, --fail-fast         最初の失敗で実行停止');
  console.log('  -h, --help              このヘルプを表示');
  
  console.log('\n使用例:');
  console.log('  node run-all-tests.js                    # 全テストスイート実行');
  console.log('  node run-all-tests.js server             # サーバーテストのみ');
  console.log('  node run-all-tests.js -s client,server   # 指定スイートのみ');
  console.log('  node run-all-tests.js --install          # 依存関係インストール付き');
  console.log('  node run-all-tests.js --fail-fast        # 高速失敗モード');
  
  console.log('\n🎯 推奨ワークフロー:');
  console.log('  1. 初回実行: node run-all-tests.js --install');
  console.log('  2. 開発中:   node run-all-tests.js --fail-fast');
  console.log('  3. CI/CD:    node run-all-tests.js');
}

// メイン実行
async function main() {
  const options = parseArgs();
  
  if (options.help) {
    showHelp();
    return;
  }

  try {
    const result = await runAllTests(options);
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    log('ERROR', `テスト実行中に予期しないエラー: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// 直接実行された場合のみmainを呼び出し
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { runAllTests, TEST_SUITES };