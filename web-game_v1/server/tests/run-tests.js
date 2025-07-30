#!/usr/bin/env node

import { spawn } from 'child_process';
import { readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// テストカテゴリーの定義
const TEST_CATEGORIES = {
  unit: {
    name: '単体テスト',
    pattern: 'tests/game/*.test.js',
    description: 'ゲームロジックの基本機能テスト'
  },
  integration: {
    name: '統合テスト', 
    pattern: 'tests/integration/*.test.js',
    description: 'Socket.IO通信とサーバー連携テスト'
  },
  e2e: {
    name: 'E2Eテスト',
    pattern: 'tests/e2e/*.test.js', 
    description: '完全なゲームフロー検証テスト'
  }
};

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

// テストファイルを検索
function findTestFiles(pattern) {
  const files = [];
  const testDir = join(__dirname, '../');
  
  function searchDirectory(dir, currentPattern) {
    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        searchDirectory(fullPath, currentPattern);
      } else if (entry.endsWith('.test.js')) {
        const relativePath = fullPath.replace(testDir, '').replace(/\\/g, '/');
        if (relativePath.includes(pattern.split('*')[0])) {
          files.push(fullPath);
        }
      }
    }
  }
  
  const patternDir = pattern.split('*')[0];
  const searchDir = join(testDir, patternDir);
  
  try {
    searchDirectory(searchDir, pattern);
  } catch (error) {
    // ディレクトリが存在しない場合は空配列を返す
  }
  
  return files;
}

// 単一テストカテゴリを実行
async function runTestCategory(category, options = {}) {
  const testConfig = TEST_CATEGORIES[category];
  if (!testConfig) {
    throw new Error(`Unknown test category: ${category}`);
  }

  log('INFO', `\n${'='.repeat(60)}`);
  log('INFO', `${testConfig.name} 実行開始`);
  log('INFO', `説明: ${testConfig.description}`);
  log('INFO', `${'='.repeat(60)}`);

  const testFiles = findTestFiles(testConfig.pattern);
  
  if (testFiles.length === 0) {
    log('WARNING', `テストファイルが見つかりません: ${testConfig.pattern}`);
    return { success: true, tests: 0, category };
  }

  log('INFO', `発見されたテストファイル: ${testFiles.length}個`);
  testFiles.forEach(file => {
    log('INFO', `  - ${file.replace(__dirname + '/../', '')}`);
  });

  const nodeArgs = [
    '--test',
    ...(options.watch ? ['--watch'] : []),
    ...(options.coverage ? [] : []), // カバレッジは別途c8で処理
    ...testFiles
  ];

  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const testProcess = spawn('node', nodeArgs, {
      stdio: 'inherit',
      env: { 
        ...process.env, 
        NODE_ENV: 'test',
        FORCE_COLOR: '1' // カラー出力を強制
      }
    });

    testProcess.on('close', (code) => {
      const duration = Date.now() - startTime;
      const durationSeconds = (duration / 1000).toFixed(2);
      
      if (code === 0) {
        log('SUCCESS', `${testConfig.name} 完了 (${durationSeconds}秒)`);
        resolve({ success: true, category, duration });
      } else {
        log('ERROR', `${testConfig.name} 失敗 (終了コード: ${code})`);
        resolve({ success: false, category, duration, exitCode: code });
      }
    });

    testProcess.on('error', (error) => {
      log('ERROR', `${testConfig.name} 実行エラー: ${error.message}`);
      resolve({ success: false, category, error: error.message });
    });
  });
}

// 全テストカテゴリを実行
async function runAllTests(options = {}) {
  log('INFO', colorize('bright', '\n🧪 マーケット・ディスラプション テストスイート開始'));
  log('INFO', `テスト実行時刻: ${new Date().toLocaleString()}`);
  
  const results = [];
  const totalStartTime = Date.now();

  for (const [category, config] of Object.entries(TEST_CATEGORIES)) {
    if (options.categories && !options.categories.includes(category)) {
      log('INFO', `スキップ: ${config.name}`);
      continue;
    }

    try {
      const result = await runTestCategory(category, options);
      results.push(result);
      
      if (!result.success && options.failFast) {
        log('ERROR', 'fail-fast モードによりテスト実行を中断');
        break;
      }
    } catch (error) {
      log('ERROR', `${config.name} 実行中にエラー: ${error.message}`);
      results.push({ success: false, category, error: error.message });
      
      if (options.failFast) {
        break;
      }
    }
  }

  // 結果サマリー
  const totalDuration = (Date.now() - totalStartTime) / 1000;
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  log('INFO', `\n${'='.repeat(60)}`);
  log('INFO', colorize('bright', 'テスト実行結果サマリー'));
  log('INFO', `${'='.repeat(60)}`);
  
  results.forEach(result => {
    const status = result.success ? 
      colorize('green', '✅ PASS') : 
      colorize('red', '❌ FAIL');
    const duration = result.duration ? ` (${(result.duration / 1000).toFixed(2)}s)` : '';
    log('INFO', `${status} ${TEST_CATEGORIES[result.category].name}${duration}`);
    
    if (!result.success && result.error) {
      log('ERROR', `     エラー: ${result.error}`);
    }
  });

  log('INFO', `\n総実行時間: ${totalDuration.toFixed(2)}秒`);
  log('INFO', `成功: ${colorize('green', successCount)} / 失敗: ${colorize('red', failCount)} / 合計: ${results.length}`);

  if (failCount === 0) {
    log('SUCCESS', colorize('bright', '🎉 全てのテストが正常に完了しました！'));
  } else {
    log('ERROR', colorize('bright', '💥 一部のテストが失敗しました'));
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
    categories: null,
    watch: false,
    coverage: false,
    failFast: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--categories':
      case '-c':
        options.categories = args[++i]?.split(',');
        break;
      case '--watch':
      case '-w':
        options.watch = true;
        break;
      case '--coverage':
        options.coverage = true;
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
        if (Object.keys(TEST_CATEGORIES).includes(arg)) {
          options.categories = [arg];
        }
    }
  }

  return options;
}

// ヘルプ表示
function showHelp() {
  console.log(colorize('bright', '\n🧪 マーケット・ディスラプション テストランナー'));
  console.log('\n使用方法:');
  console.log('  node run-tests.js [オプション] [カテゴリ]');
  
  console.log('\n利用可能なテストカテゴリ:');
  Object.entries(TEST_CATEGORIES).forEach(([key, config]) => {
    console.log(`  ${colorize('cyan', key.padEnd(12))} - ${config.description}`);
  });
  
  console.log('\nオプション:');
  console.log('  -c, --categories <list>  実行するカテゴリ (カンマ区切り)');
  console.log('  -w, --watch             ファイル変更時に自動再実行');
  console.log('  --coverage              カバレッジレポート生成');
  console.log('  -f, --fail-fast         最初の失敗で実行停止');
  console.log('  -h, --help              このヘルプを表示');
  
  console.log('\n使用例:');
  console.log('  node run-tests.js                    # 全テスト実行');
  console.log('  node run-tests.js unit               # 単体テストのみ');
  console.log('  node run-tests.js -c unit,integration # 指定カテゴリのみ');
  console.log('  node run-tests.js --watch            # ウォッチモード');
  console.log('  node run-tests.js --coverage         # カバレッジ付き');
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

export { runAllTests, runTestCategory, TEST_CATEGORIES };