/**
 * Market Disruption ゲーム API テスト
 * 一人プレイモードでの動作確認テスト
 */

const SERVER_URL = 'https://market-disruption-production.up.railway.app';

class GameAPITest {
  constructor() {
    this.gameID = null;
    this.playerID = '0';
    this.playerCredentials = null;
    this.gameState = null;
  }

  async log(message) {
    console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * APIの基本状態を確認
   */
  async checkAPIStatus() {
    try {
      const response = await fetch(`${SERVER_URL}/api/status`);
      const data = await response.json();
      
      await this.log(`✅ API Status: ${data.status}`);
      await this.log(`🎮 Game: ${data.game}`);
      await this.log(`📊 Available moves: ${data.moveCount}`);
      await this.log(`🎯 Critical moves check:`);
      
      Object.entries(data.criticalMoves).forEach(([move, available]) => {
        console.log(`   ${move}: ${available ? '✅' : '❌'}`);
      });
      
      return data;
    } catch (error) {
      await this.log(`❌ API Status check failed: ${error.message}`);
      return null;
    }
  }

  /**
   * 新しいゲームを作成
   */
  async createGame() {
    try {
      const response = await fetch(`${SERVER_URL}/games/MarketDisruption/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          numPlayers: 1
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create game: ${response.status}`);
      }

      const data = await response.json();
      this.gameID = data.gameID || data.matchID || 'test-game-' + Date.now();
      
      await this.log(`🎮 Game created: ${this.gameID}`);
      return data;
    } catch (error) {
      await this.log(`❌ Game creation failed: ${error.message}`);
      await this.log(`Trying with generated game ID...`);
      
      // フォールバック: 手動でゲームIDを生成
      this.gameID = 'test-game-' + Date.now();
      await this.log(`🎮 Using generated game ID: ${this.gameID}`);
      return { gameID: this.gameID };
    }
  }

  /**
   * ゲームに参加
   */
  async joinGame() {
    try {
      const response = await fetch(`${SERVER_URL}/games/MarketDisruption/${this.gameID}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerID: this.playerID,
          playerName: 'API Tester'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to join game: ${response.status}`);
      }

      const data = await response.json();
      this.playerCredentials = data.playerCredentials;
      
      await this.log(`👤 Joined game as player ${this.playerID}`);
      return data;
    } catch (error) {
      await this.log(`❌ Game join failed: ${error.message}`);
      return null;
    }
  }

  /**
   * ゲーム状態を取得
   */
  async getGameState() {
    try {
      let url = `${SERVER_URL}/games/MarketDisruption/${this.gameID}`;
      if (this.playerCredentials) {
        url += `?playerID=${this.playerID}&credentials=${this.playerCredentials}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to get game state: ${response.status}`);
      }

      const data = await response.json();
      this.gameState = data;
      
      const G = data.G;
      const ctx = data.ctx;
      const player = G.players[this.playerID];
      
      await this.log(`📊 Game State:`);
      await this.log(`   Round: ${G.round}, Phase: ${ctx.phase}`);
      await this.log(`   Current Player: ${ctx.currentPlayer}, Active: ${ctx.currentPlayer === this.playerID}`);
      
      if (player) {
        await this.log(`   Player Stats: Money=${player.money}, Prestige=${player.prestige}, AP=${player.actionPoints}`);
        await this.log(`   Designs: ${player.designs.length}, Products: ${player.personalMarket.length}`);
      }
      
      return data;
    } catch (error) {
      await this.log(`❌ Get game state failed: ${error.message}`);
      return null;
    }
  }

  /**
   * アクションを実行
   */
  async makeMove(moveName, ...args) {
    try {
      const response = await fetch(`${SERVER_URL}/games/MarketDisruption/${this.gameID}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerID: this.playerID,
          credentials: this.playerCredentials,
          type: moveName,
          args: args
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Move failed: ${response.status} - ${errorText}`);
      }

      await this.log(`✅ Move executed: ${moveName}(${args.join(', ')})`);
      return true;
    } catch (error) {
      await this.log(`❌ Move ${moveName} failed: ${error.message}`);
      return false;
    }
  }

  /**
   * 基本的なゲームプレイテスト
   */
  async runBasicGameplayTest() {
    await this.log(`\n🚀 Starting Basic Gameplay Test\n`);

    // 1. API状態確認
    const apiStatus = await this.checkAPIStatus();
    if (!apiStatus) return false;

    await this.delay(1000);

    // 2. ゲーム作成
    const gameCreated = await this.createGame();
    if (!gameCreated) return false;

    await this.delay(1000);

    // 3. ゲーム参加
    const joined = await this.joinGame();
    if (!joined) return false;

    await this.delay(1000);

    // 4. 初期状態確認
    const initialState = await this.getGameState();
    if (!initialState) return false;

    await this.delay(2000);

    // 5. 基本アクションテスト
    await this.log(`\n🎯 Testing Basic Actions\n`);

    // パートタイム労働テスト
    await this.log(`Testing partTimeWork...`);
    await this.makeMove('partTimeWork');
    await this.delay(1000);
    await this.getGameState();

    await this.delay(2000);

    // デザインテスト
    await this.log(`Testing design...`);
    await this.makeMove('design', false);
    await this.delay(1000);
    await this.getGameState();

    await this.delay(2000);

    // フェーズ遷移テスト（製造→販売→オートマフェーズ）
    await this.log(`\n🔄 Testing Phase Transitions\n`);
    
    // 製造テスト
    const state = await this.getGameState();
    if (state && state.G.players[this.playerID].designs.length > 0) {
      const designId = state.G.players[this.playerID].designs[0].id;
      await this.log(`Testing manufacture with design: ${designId}`);
      await this.makeMove('manufacture', designId);
      await this.delay(1000);
      await this.getGameState();
    }

    await this.delay(2000);

    await this.log(`\n✅ Basic Gameplay Test Completed\n`);
    return true;
  }
}

// テスト実行
async function runTests() {
  const tester = new GameAPITest();
  
  try {
    await tester.runBasicGameplayTest();
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Node.js環境で実行する場合
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameAPITest;
  
  // 直接実行された場合はテストを開始
  if (require.main === module) {
    runTests();
  }
} else {
  // ブラウザ環境で実行する場合
  runTests();
}