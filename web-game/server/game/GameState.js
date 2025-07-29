export class GameState {
  constructor(id) {
    this.id = id;
    this.state = 'waiting'; // 'waiting', 'playing', 'finished'
    this.players = [];
    this.currentPlayerIndex = 0;
    this.currentRound = 0;
    this.currentPhase = 'action'; // 'action', 'automata', 'market'
    
    // Market pollution by category
    this.pollution = {
      'game-console': 0,
      'diy-gadget': 0,
      'figure': 0,
      'accessory': 0,
      'toy': 0
    };
    
    // Global pollution level (for new rule system)
    this.globalPollution = 0;
    
    // Regulation progress (0-3: no regulation, public comment, consideration, active)
    this.regulationLevel = 0;
    
    // Shared market board (20x6 grid: price 1-20, popularity 1-6)
    this.sharedMarket = this.initializeSharedMarket();
    
    // Automata state (no personal markets)
    this.manufacturerAutomata = {
      inventory: []
    };
    
    this.resaleAutomata = {
      funds: 20,
      inventory: [],
      pauseRounds: 0
    };
    
    // Dice pool - no categories, just values
    this.dicePool = [1, 2, 3, 4, 5, 6];
    
    // Trend effects that are currently active
    this.activeTrends = [];
    
    // Game winner
    this.winner = null;
    
    // Automata action log for current round
    this.automataActions = [];
    
    // Play log for tracking all game events
    this.playLog = [];
  }
  
  addPlayer(player) {
    if (this.players.length >= 4) {
      throw new Error('Game is full');
    }
    this.players.push(player);
    
    // If game is already playing, give the new player initial setup
    if (this.state === 'playing') {
      this.initializePlayerForOngoingGame(player);
    }
  }
  
  initializePlayerForOngoingGame(player) {
    console.log(`🎯 Initializing player ${player.name} for ongoing game`);
    
    // Give initial designs (same as other players got)
    for (let i = 1; i <= 2; i++) {
      const slot = [1, 2, 3, 4, 5, 6].find(s => !player.getDesign(s));
      if (slot) {
        const design = this.rollRandomDesign();
        player.addDesign(slot, design);
        console.log(`📋 Added design to slot ${slot}:`, design);
      }
    }
    
    // Reset action points for current turn
    player.resetActionPoints();
    console.log(`✅ Player ${player.name} initialized for ongoing game`);
  }
  
  addToPlayLog(type, message, playerId = null, playerName = null) {
    const logEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type,
      message,
      playerId,
      playerName
    };
    
    this.playLog.push(logEntry);
    
    // Keep only last 100 entries to prevent memory issues
    if (this.playLog.length > 100) {
      this.playLog = this.playLog.slice(-100);
    }
    
    console.log(`📜 PlayLog: ${message}`);
  }
  
  initializeSharedMarket() {
    const market = {};
    for (let price = 1; price <= 20; price++) {
      market[price] = {};
      for (let popularity = 1; popularity <= 6; popularity++) {
        market[price][popularity] = null; // null = empty slot
      }
    }
    return market;
  }

  // Add product to shared market
  addProductToSharedMarket(product, price) {
    const slot = this.sharedMarket[price][product.popularity];
    if (slot !== null) {
      console.log(`🚫 Shared market slot occupied at price ${price}, popularity ${product.popularity}:`, slot);
      throw new Error(`Market slot already occupied at price ${price}, popularity ${product.popularity}`);
    }
    
    console.log(`✅ Adding product to shared market at price ${price}, popularity ${product.popularity}`, product);
    this.sharedMarket[price][product.popularity] = product;
    return true;
  }

  // Remove product from shared market
  removeProductFromSharedMarket(price, popularity) {
    const product = this.sharedMarket[price][popularity];
    if (!product) {
      throw new Error('No product at specified location in shared market');
    }
    
    this.sharedMarket[price][popularity] = null;
    return product;
  }

  // Get all products in shared market
  getAllSharedMarketProducts() {
    const products = [];
    for (let price = 1; price <= 20; price++) {
      for (let popularity = 1; popularity <= 6; popularity++) {
        const product = this.sharedMarket[price][popularity];
        if (product) {
          products.push({
            ...product,
            price,
            popularity
          });
        }
      }
    }
    return products;
  }
  
  removePlayer(playerId) {
    this.players = this.players.filter(p => p.id !== playerId);
  }
  
  startGame() {
    if (this.players.length < 1) {
      throw new Error('Need at least 1 player');
    }
    
    this.state = 'playing';
    this.currentRound = 1;
    
    this.addToPlayLog('game', 'ゲーム開始！');
    
    // Give initial designs to all players
    this.giveInitialDesigns();
    
    // Reset all players' action points
    this.players.forEach(player => player.resetActionPoints());
    
    this.addToPlayLog('round', `ラウンド ${this.currentRound} 開始`);
  }
  
  giveInitialDesigns() {
    console.log(`🎨 Giving initial designs to ${this.players.length} players`);
    this.players.forEach(player => {
      console.log(`🎨 Giving designs to player: ${player.name}`);
      // Each player gets 2 random designs
      for (let i = 1; i <= 2; i++) {
        const design = this.rollRandomDesign();
        console.log(`🎨 Generated design for slot ${i}:`, design);
        player.addDesign(i, design);
      }
      console.log(`🎨 Player ${player.name} now has designs:`, Object.keys(player.designs));
    });
  }
  
  rollRandomDesign() {
    const value = Math.floor(Math.random() * 6) + 1;
    
    // Convert value to cost (as per rules)
    const costMap = { 6: 1, 5: 2, 4: 3, 3: 4, 2: 5, 1: 6 };
    const cost = costMap[value] || value;
    
    const design = {
      value,
      cost,
      id: `design-${value}-${Date.now()}`
    };
    
    console.log(`🎲 Rolled design:`, design);
    return design;
  }
  
  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex];
  }
  
  nextPlayer() {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    
    console.log(`🔄 Next player: ${this.currentPlayerIndex} (${this.players[this.currentPlayerIndex]?.name})`);
    
    // If back to first player, check if round should end
    if (this.currentPlayerIndex === 0) {
      console.log('🎯 Back to first player, checking phase end...');
      return this.checkPhaseEnd();
    }
    
    return false; // Continue current phase
  }
  
  checkPhaseEnd() {
    console.log(`📋 Checking phase end. Current phase: ${this.currentPhase}`);
    
    if (this.currentPhase === 'action') {
      console.log('🤖 Switching to automata phase...');
      this.currentPhase = 'automata';
      this.processAutomataPhase();
      
      // After automata phase, move to market phase
      console.log('🏪 Switching to market phase...');
      this.currentPhase = 'market';
      this.processMarketPhase();
      
      // After market phase, start next round
      return this.nextRound();
    } else if (this.currentPhase === 'automata') {
      console.log('🏪 Switching to market phase...');
      this.currentPhase = 'market';
      this.processMarketPhase();
      return false;
    } else if (this.currentPhase === 'market') {
      return this.nextRound();
    }
    
    return false;
  }
  
  nextRound() {
    this.currentRound++;
    this.currentPhase = 'action';
    this.currentPlayerIndex = 0;
    
    // Reset action points for all players
    this.players.forEach(player => player.resetActionPoints());
    
    // Refresh resale automata funds
    this.resaleAutomata.funds = Math.min(20, this.resaleAutomata.funds + 20);
    
    // Clear previous round's automata actions at start of new round
    this.automataActions = [];
    
    console.log(`🎯 Round ${this.currentRound} started`);
    
    return false; // Game continues
  }
  
  processAction(playerId, actionData) {
    console.log(`🎯 Processing action: ${actionData.type} from player ${playerId}, game state: ${this.state}`);
    
    const player = this.players.find(p => p.id === playerId);
    if (!player) {
      return { success: false, error: 'Player not found' };
    }
    
    // Check if game is already finished
    if (this.state === 'finished') {
      console.log(`❌ Action ${actionData.type} rejected: Game has already ended`);
      return { success: false, error: 'Game has already ended' };
    }
    
    // Allow end_game action by any player at any time
    if (actionData.type !== 'end_game' && this.getCurrentPlayer().id !== playerId) {
      return { success: false, error: 'Not your turn' };
    }
    
    // Allow end_game action in any phase
    if (this.currentPhase !== 'action' && actionData.type !== 'end_game') {
      return { success: false, error: 'Not action phase' };
    }
    
    try {
      const { type, ...params } = actionData;
      let result;
      
      switch (type) {
        case 'manufacture':
          result = this.actionManufacture(player, params);
          break;
        case 'sell':
          result = this.actionSell(player, params);
          break;
        case 'purchase':
          result = this.actionPurchase(player, params);
          break;
        case 'resale':
          result = this.actionResale(player, params);
          break;
        case 'review':
          result = this.actionReview(player, params);
          break;
        case 'design':
          result = this.actionDesign(player, params);
          break;
        case 'part_time_job':
          result = this.actionPartTimeJob(player, params);
          break;
        case 'day_labor':
          result = this.actionDayLabor(player, params);
          break;
        case 'buyback':
          result = this.actionBuyback(player, params);
          break;
        case 'buy_dignity':
          result = this.actionBuyDignity(player, params);
          break;
        case 'end_sale':
          result = this.actionEndSale(player, params);
          break;
        case 'promote_regulation':
          result = this.actionPromoteRegulation(player, params);
          break;
        case 'trend_research':
          result = this.actionTrendResearch(player, params);
          break;
        case 'end_turn':
          result = this.actionEndTurn(player, params);
          break;
        case 'end_game':
          result = this.actionEndGame(player, params);
          break;
        case 'skip-automata':
          result = this.actionSkipAutomata(player, params);
          break;
        case 'skip-market':
          result = this.actionSkipMarket(player, params);
          break;
        default:
          throw new Error('Unknown action type');
      }
      
      // Check for victory after action
      if (this.checkVictory(player)) {
        this.state = 'finished';
        this.winner = player;
      }
      
      // Auto end turn if AP reaches 0
      if (player.actionPoints <= 0) {
        console.log(`🔄 Player ${player.name} has 0 AP, auto-ending turn`);
        const nextPhase = this.nextPlayer();
        result.autoEndTurn = true;
        result.nextPhase = nextPhase;
      }
      
      return { success: true, action: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // AI プレイヤーの自動行動
  
  actionManufacture(player, { designSlot }) {
    console.log(`🏭 Manufacturing action for player ${player.name}:`, { designSlot });
    console.log(`🏭 Player inventory before:`, player.inventory.length);
    
    if (!player.hasActionPoints(1)) {
      throw new Error('Not enough action points');
    }
    
    const design = player.getDesign(designSlot);
    if (!design) {
      console.log(`❌ No design in slot ${designSlot} for player ${player.name}`);
      console.log(`🔍 Player designs:`, Object.fromEntries(player.designs));
      throw new Error('No design in specified slot');
    }
    
    console.log(`🎨 Using design:`, design);
    
    if (!player.canAfford(design.cost)) {
      throw new Error('Cannot afford manufacturing cost');
    }
    
    player.spendActionPoints(1);
    player.spendFunds(design.cost);
    
    // Create product
    const product = {
      id: `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      value: design.value,
      cost: design.cost,
      popularity: 1,
      ownerId: player.id,
      designSlot
    };
    
    console.log(`📦 Created product:`, product);
    
    player.inventory.push(product);
    
    console.log(`🏭 Player inventory after:`, player.inventory.length);
    console.log(`📦 Full inventory:`, player.inventory);
    
    this.addToPlayLog('action', `商品(値${design.value})を製造しました`, player.id, player.name);
    
    return { type: 'manufacture', product, designSlot };
  }
  
  actionSell(player, { productId, price }) {
    if (!player.hasActionPoints(1)) {
      throw new Error('Not enough action points');
    }
    
    if (!player.canPerformRegularActions()) {
      throw new Error('Cannot perform regular actions with low prestige');
    }
    
    const productIndex = player.inventory.findIndex(p => p.id === productId);
    if (productIndex === -1) {
      throw new Error('Product not found in inventory');
    }
    
    const product = player.inventory[productIndex];
    
    // Check price limit based on prestige
    const maxPrice = player.getPriceLimit(product.cost);
    if (price > maxPrice) {
      throw new Error(`Price exceeds limit (max: ${maxPrice})`);
    }
    
    // Apply pollution penalty to regular sales (not resales)
    const pollutionPenalty = this.getPollutionPenalty();
    const adjustedPrice = Math.max(1, price - pollutionPenalty);
    
    // Prepare product for market (before removing from inventory)
    const marketProduct = { ...product };
    marketProduct.price = adjustedPrice;
    
    // Verify shared market slot is available before proceeding
    const existingProduct = this.sharedMarket[adjustedPrice] && this.sharedMarket[adjustedPrice][marketProduct.popularity];
    if (existingProduct !== null) {
      console.log(`🚫 Shared market slot occupied at price ${adjustedPrice}, popularity ${marketProduct.popularity}:`, existingProduct);
      throw new Error(`Market slot already occupied at price ${adjustedPrice}, popularity ${marketProduct.popularity}`);
    }
    
    // Only spend action points and remove from inventory after all checks pass
    player.spendActionPoints(1);
    player.inventory.splice(productIndex, 1);
    
    // Add to shared market (should not fail now)
    this.addProductToSharedMarket(marketProduct, adjustedPrice);
    
    this.addToPlayLog('action', `商品(値${marketProduct.value})を¥${adjustedPrice}で出品しました`, player.id, player.name);
    
    return { type: 'sell', product: marketProduct, originalPrice: price, adjustedPrice };
  }
  

  actionReview(player, { targetProductId, reviewType, useOutsourcing = false }) {
    console.log(`🔍 actionReview: Searching for product ${targetProductId}, reviewType: ${reviewType}, useOutsourcing: ${useOutsourcing}`);
    
    if (!player.hasActionPoints(1)) {
      throw new Error('Not enough action points');
    }

    // Find product by ID in shared market
    let product = null;
    let price = null;
    let popularity = null;

    // Check shared market
    console.log(`🔍 Checking shared market for product ${targetProductId}`);
    for (const priceKey in this.sharedMarket) {
      for (const popularityKey in this.sharedMarket[priceKey]) {
        const prod = this.sharedMarket[priceKey][popularityKey];
        if (prod && prod.id === targetProductId) {
          console.log(`✅ Found product in shared market at price ${priceKey}, popularity ${popularityKey}`);
          product = prod;
          price = parseInt(priceKey);
          popularity = parseInt(popularityKey);
          break;
        }
      }
      if (product) break;
    }


    if (!product) {
      console.log(`❌ Product ${targetProductId} not found in any market`);
      throw new Error(`Product not found: ${targetProductId}`);
    }

    player.spendActionPoints(1);

    if (useOutsourcing) {
      // Review outsourcing
      const cost = reviewType === 'positive' ? 3 : 2;
      if (!player.canAfford(cost)) {
        throw new Error('Cannot afford review outsourcing');
      }

      player.spendFunds(cost);

      // Detection chance (1 in 6)
      const detected = Math.floor(Math.random() * 6) + 1 === 1;
      if (detected) {
        player.modifyPrestige(-2);
      }

      // Apply review effect
      const popularityChange = reviewType === 'positive' ? 1 : -1;
      const newPopularity = Math.max(1, Math.min(6, product.popularity + popularityChange));
      
      if (newPopularity !== product.popularity) {
        // Move product to new popularity slot in shared market
        this.removeProductFromSharedMarket(price, popularity);
        product.popularity = newPopularity;
        this.addProductToSharedMarket(product, price);
      }

      return { 
        type: 'review', 
        reviewType, 
        outsourced: true, 
        detected, 
        cost,
        oldPopularity: popularity,
        newPopularity: product.popularity 
      };
    } else {
      // Direct review
      if (player.prestige < 1) {
        throw new Error('Not enough prestige for direct review');
      }

      player.modifyPrestige(-1);

      const popularityChange = reviewType === 'positive' ? 1 : -1;
      const newPopularity = Math.max(1, Math.min(6, product.popularity + popularityChange));
      
      if (newPopularity !== product.popularity) {
        // Move product to new popularity slot in shared market
        this.removeProductFromSharedMarket(price, popularity);
        product.popularity = newPopularity;
        this.addProductToSharedMarket(product, price);
      }

      return { 
        type: 'review', 
        reviewType, 
        outsourced: false,
        oldPopularity: popularity,
        newPopularity: product.popularity 
      };
    }
  }

  actionDesign(player, { openSource = false, selectedDiceIndex = 0, selectedDice = null, designSlot = null }) {
    if (!player.hasActionPoints(2)) {
      throw new Error('Not enough action points');
    }

    // Use provided slot or find empty design slot
    let targetSlot = designSlot;
    if (!targetSlot) {
      targetSlot = [1, 2, 3, 4, 5, 6].find(slot => !player.getDesign(slot));
      if (!targetSlot) {
        throw new Error('No empty design slots');
      }
    } else {
      // Validate that the selected slot is empty
      if (player.getDesign(targetSlot)) {
        throw new Error(`Design slot ${targetSlot} is already occupied`);
      }
    }

    player.spendActionPoints(2);

    let selectedDesign;
    let allOptions = [];

    if (selectedDice) {
      // Client has already chosen a dice
      selectedDesign = {
        category: selectedDice.category,
        value: selectedDice.value,
        cost: selectedDice.cost,
        id: `${selectedDice.category}-${selectedDice.value}-${Date.now()}`
      };
    } else {
      // Roll 3 dice, auto-select the first one (fallback)
      const dice1 = this.rollRandomDesign();
      const dice2 = this.rollRandomDesign();
      const dice3 = this.rollRandomDesign();
      allOptions = [dice1, dice2, dice3];
      selectedDesign = allOptions[selectedDiceIndex] || dice1;
    }

    player.addDesign(targetSlot, selectedDesign);

    if (openSource) {
      player.modifyPrestige(2);
      if (!player.openSourceDesigns) {
        player.openSourceDesigns = new Set();
      }
      player.openSourceDesigns.add(selectedDesign.id);
    }

    return { 
      type: 'design', 
      design: selectedDesign, 
      slot: targetSlot, 
      openSource,
      selectedDiceIndex,
      options: allOptions.length > 0 ? allOptions : [selectedDesign]
    };
  }

  actionPartTimeJob(player) {
    if (!player.hasActionPoints(2)) {
      throw new Error('Not enough action points');
    }

    player.spendActionPoints(2);
    player.gainFunds(5);

    return { type: 'part_time_job', fundsGained: 5 };
  }

  actionDayLabor(player) {
    if (!player.hasActionPoints(3)) {
      throw new Error('Not enough action points');
    }

    if (player.funds > 100) {
      throw new Error('Day labor only available when funds <= 100');
    }

    player.spendActionPoints(3);
    player.gainFunds(18);

    return { type: 'day_labor', fundsGained: 18 };
  }

  actionBuyback(player, { price, popularity }) {
    if (!player.hasActionPoints(1)) {
      throw new Error('Not enough action points');
    }

    const product = this.sharedMarket[price][popularity];
    if (!product || product.ownerId !== player.id) {
      throw new Error('No product owned by you at specified location');
    }

    player.spendActionPoints(1);
    
    // Remove from shared market and add to inventory
    this.removeProductFromSharedMarket(price, popularity);
    player.inventory.push(product);

    return { type: 'buyback', product, price, popularity };
  }

  actionBuyDignity(player, params) {
    if (!player.hasActionPoints(1)) {
      throw new Error('Not enough action points');
    }

    if (player.funds < 5) {
      throw new Error('Not enough funds to buy dignity');
    }

    player.spendActionPoints(1);
    player.spendFunds(5);
    player.modifyPrestige(1);

    return { 
      type: 'buy_dignity', 
      cost: 5,
      prestigeGained: 1,
      newPrestige: player.prestige,
      newFunds: player.funds
    };
  }

  actionEndSale(player, { designSlot }) {
    if (!player.hasActionPoints(1)) {
      throw new Error('Not enough action points');
    }

    const design = player.getDesign(designSlot);
    if (!design) {
      throw new Error('No design in specified slot');
    }

    // Check if any products of this design exist in any market
    let productsExist = false;
    
    // Check shared market
    for (let price = 1; price <= 20; price++) {
      for (let popularity = 1; popularity <= 6; popularity++) {
        const product = this.sharedMarket[price][popularity];
        if (product && product.designSlot === designSlot && product.ownerId === player.id) {
          productsExist = true;
          break;
        }
      }
      if (productsExist) break;
    }

    if (productsExist) {
      throw new Error('Cannot end sale while products exist in markets');
    }

    player.spendActionPoints(1);
    player.designs.delete(designSlot);

    return { type: 'end_sale', designSlot };
  }

  actionPromoteRegulation(player) {
    if (!player.hasActionPoints(2)) {
      throw new Error('Not enough action points');
    }

    player.spendActionPoints(2);

    // Roll 2d6 for regulation success
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const total = dice1 + dice2;
    const success = total >= 9;

    if (success) {
      this.regulationLevel = Math.min(3, this.regulationLevel + 1);
      
      if (this.regulationLevel === 1) {
        // Stage 1: Public Comment
        this.addToPlayLog('regulation', '段階1: パブリックコメント募集開始 - 転売規制が検討されています');
        // Reduce resale automata mass purchase by 1
      } else if (this.regulationLevel === 2) {
        // Stage 2: Under Consideration  
        this.addToPlayLog('regulation', '段階2: 規制検討中 - 転売価格制限発動（購入価格+3資金まで）');
      } else if (this.regulationLevel === 3) {
        // Stage 3: Regulation Activated
        this.addToPlayLog('regulation', '段階3: 転売規制発動 - 全転売品没収、価格制限強化（購入価格+1資金まで）');
        
        // Confiscate all resale products and fine players
        this.players.forEach(p => {
          // Remove resale products from inventory
          p.inventory = p.inventory.filter(product => !product.previousOwner);
          
          // Remove resale products owned by this player from shared market
          for (let price = 1; price <= 20; price++) {
            for (let popularity = 1; popularity <= 6; popularity++) {
              const product = this.sharedMarket[price][popularity];
              if (product && product.isResale && product.ownerId === p.id) {
                this.removeProductFromSharedMarket(price, popularity);
              }
            }
          }
          
          // Fine based on resale history
          const fine = p.resaleHistory * 2;
          if (fine > 0) {
            p.spendFunds(Math.min(fine, p.funds)); // Don't allow negative funds
            this.addToPlayLog('regulation', `${p.name}に転売履歴${p.resaleHistory}回による罰金${fine}資金を課す`, p.id, p.name);
          }
        });

        // Reset resale automata and pause for 2 rounds
        this.resaleAutomata.inventory = [];
        this.resaleAutomata.pauseRounds = 2;
      }
    }

    return { 
      type: 'promote_regulation', 
      dice: [dice1, dice2], 
      total, 
      success, 
      newRegulationLevel: this.regulationLevel 
    };
  }

  actionTrendResearch(player) {
    if (!player.hasActionPoints(2)) {
      throw new Error('Not enough action points');
    }

    player.spendActionPoints(2);

    // Roll 3d6 for trend
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const dice3 = Math.floor(Math.random() * 6) + 1;
    const total = dice1 + dice2 + dice3;

    const trendEffect = this.getTrendEffect(total);
    
    // Log the trend research result
    this.addToPlayLog('action', `📈 トレンド調査: [${dice1}][${dice2}][${dice3}] = ${total} → ${trendEffect.name}`, player.id, player.name);
    this.addToPlayLog('trend', `🎯 ${trendEffect.name}: ${trendEffect.effect} (コスト: ${trendEffect.cost})`);

    return { 
      type: 'trend_research', 
      dice: [dice1, dice2, dice3], 
      total, 
      trendEffect 
    };
  }

  actionPurchase(player, { sellerId, productId, price, popularity }) {
    if (!player.hasActionPoints(1)) {
      throw new Error('Not enough action points');
    }

    // Find seller (for funds transfer)
    let seller;
    
    if (sellerId === 'manufacturer-automata') {
      seller = this.manufacturerAutomata;
    } else if (sellerId === 'resale-automata') {
      seller = this.resaleAutomata;
    } else {
      seller = this.players.find(p => p.id === sellerId);
      if (!seller) {
        throw new Error('Seller not found');
      }
    }

    // Find product in shared market
    const product = this.sharedMarket[price]?.[popularity];
    if (!product) {
      console.log('🔍 Product not found in shared market at location:', {
        sellerId,
        price,
        popularity,
        availableMarket: Object.keys(this.sharedMarket).map(p => ({
          price: p,
          products: Object.keys(this.sharedMarket[p] || {})
        }))
      });
      throw new Error('Product not found at specified location');
    }
    
    // If productId is provided, verify it matches
    if (productId && product.id !== productId) {
      console.log('🔍 Product ID mismatch:', {
        expectedId: productId,
        actualId: product.id,
        price,
        popularity,
        sellerId
      });
      throw new Error('Product ID mismatch');
    }

    // Check if player can afford
    if (!player.canAfford(price)) {
      throw new Error('Cannot afford product');
    }

    player.spendActionPoints(1);
    player.spendFunds(price);

    // Remove product from shared market
    this.removeProductFromSharedMarket(price, popularity);
    
    // Transfer funds to seller
    if (sellerId === 'manufacturer-automata' || sellerId === 'resale-automata') {
      seller.funds += price;
    } else {
      seller.gainFunds(price);
    }

    // Add to buyer's inventory with resale flag
    const resaleProduct = {
      ...product,
      previousOwner: sellerId,
      originalPrice: product.price || price
    };
    player.inventory.push(resaleProduct);

    // Update buyer's resale history
    player.incrementResaleHistory();

    // Reduce seller's prestige if selling to reseller
    if (sellerId !== 'manufacturer-automata' && sellerId !== 'resale-automata') {
      seller.modifyPrestige(-1);
    }

    return { 
      type: 'purchase', 
      productId, 
      price, 
      popularity, 
      sellerId,
      buyerFunds: player.funds,
      sellerFunds: seller.funds
    };
  }


  actionEndTurn(player) {
    // End current player's turn
    player.actionPoints = 0;
    
    const nextPhase = this.nextPlayer();
    
    return { type: 'end_turn', nextPhase };
  }

  actionSkipAutomata(player, params) {
    if (this.currentPhase !== 'automata') {
      throw new Error('Not in automata phase');
    }
    
    console.log('⏭️ Skipping automata phase...');
    this.currentPhase = 'market';
    this.processMarketPhase();
    
    // Move to next round
    const nextRoundResult = this.nextRound();
    
    return { 
      type: 'skip-automata', 
      newPhase: this.currentPhase,
      newRound: this.currentRound,
      nextRound: nextRoundResult
    };
  }

  actionSkipMarket(player, params) {
    if (this.currentPhase !== 'market') {
      throw new Error('Not in market phase');
    }
    
    console.log('⏭️ Skipping market phase...');
    
    // Move to next round
    const nextRoundResult = this.nextRound();
    
    return { 
      type: 'skip-market', 
      newPhase: this.currentPhase,
      newRound: this.currentRound,
      nextRound: nextRoundResult
    };
  }

  actionEndGame(player, params) {
    console.log(`🏁 Player ${player.name} requested game end`);
    console.log(`🏁 Current game state: ${this.state}, phase: ${this.currentPhase}`);
    
    // No action points required for ending game
    // Immediately end the game
    this.state = 'finished';
    
    // Determine winner based on current scores
    this.winner = this.determineWinnerByScore();
    
    console.log(`🏆 Game ended manually. Winner: ${this.winner?.name || 'None'}`);
    
    return { 
      type: 'end_game', 
      initiatedBy: player.name,
      winner: this.winner,
      gameEnded: true,
      finalScores: this.players.map(p => ({
        name: p.name,
        prestige: p.prestige,
        funds: p.funds,
        score: this.calculateFinalScore(p)
      }))
    };
  }

  determineWinnerByScore() {
    if (this.players.length === 0) return null;
    
    // Sort players by final score (prestige priority, then funds)
    const sortedPlayers = [...this.players].sort((a, b) => {
      if (a.prestige !== b.prestige) {
        return b.prestige - a.prestige; // Higher prestige wins
      }
      return b.funds - a.funds; // Higher funds wins as tiebreaker
    });
    
    return sortedPlayers[0];
  }

  calculateFinalScore(player) {
    // Final score calculation: prestige is primary, funds as secondary
    return player.prestige * 1000 + player.funds;
  }

  getTrendEffect(total) {
    const trends = {
      3: { name: '経済特需', effect: '全プレイヤーに+15資金', cost: 'なし' },
      4: { name: '技術革新', effect: '自身の任意の設計1つのダイス値-1', cost: 'なし' },
      5: { name: 'インフルエンサー紹介', effect: '自身の全商品の人気度を+1', cost: 'なし' },
      6: { name: '汚染改善キャンペーン', effect: '市場汚染レベルを-2', cost: 'なし' },
      7: { name: 'サステナビリティ', effect: '任意の商品の人気度を+3（任意の組み合わせ）', cost: '1威厳' },
      8: { name: 'DIYブーム', effect: '全てのプレイヤーの最新設計のダイス値-1', cost: 'なし' },
      9: { name: 'インフレ進行', effect: '全ての転売ではない商品の価格+2（発動後永続）', cost: 'なし' },
      10: { name: 'ショート動画ブーム', effect: '転売が成功するたびに+2資金ボーナス（発動後永続）', cost: 'なし' },
      11: { name: 'ショート動画ブーム', effect: '転売が成功するたびに+2資金ボーナス（発動後永続）', cost: 'なし' },
      12: { name: 'テレワーク需要', effect: '価格10以下の全商品の人気度を+1', cost: 'なし' },
      13: { name: 'ギフト需要', effect: '人気度3以下の全商品の人気度を+1', cost: 'なし' },
      14: { name: '緑化促進', effect: '市場汚染レベルを-3', cost: '3威厳' },
      15: { name: '消費者不信', effect: 'あなた以外の全プレイヤーの威厳-1', cost: '2威厳' },
      16: { name: '市場開放', effect: 'ダイスを3つ引き、コスト0で設計（オープンソース不可）、製造、販売を行うことができる。使用しなかったダイスはダイスプールに戻す。', cost: 'なし' },
      17: { name: '風評操作', effect: '任意のプレイヤー1人の威厳-3', cost: '2威厳' },
      18: { name: '市場の寵児', effect: 'あなたの威厳+5', cost: 'なし' }
    };

    return trends[total] || trends[10]; // Default to common trend
  }
  
  checkVictory(player) {
    // Prestige victory: prestige 17+ AND funds 75+
    if (player.prestige >= 17 && player.funds >= 75) {
      return true;
    }
    
    // Funds victory: funds 150+
    if (player.funds >= 150) {
      return true;
    }
    
    return false;
  }
  
  getPollutionPenalty() {
    const globalPollution = this.globalPollution || 0;
    if (globalPollution <= 2) return 0;
    if (globalPollution <= 5) return 1;
    if (globalPollution <= 8) return 2;
    if (globalPollution <= 11) return 3;
    return 4;
  }
  
  processAutomataPhase() {
    console.log('🤖 === AUTOMATA PHASE START ===');
    
    this.addToPlayLog('phase', 'オートマフェーズ開始');
    
    // Clear previous automata actions
    this.automataActions = [];
    
    // Process manufacturer automata
    console.log('🏭 Processing manufacturer automata...');
    const manufacturerResult = this.processManufacturerAutomata();
    console.log('🏭 Manufacturer automata result:', manufacturerResult);
    this.automataActions.push({
      type: 'manufacturer',
      ...manufacturerResult
    });
    
    // Add detailed manufacturer log
    if (manufacturerResult.action) {
      const diceText = `[${manufacturerResult.dice[0]}, ${manufacturerResult.dice[1]}] = ${manufacturerResult.total}`;
      let actionText = '';
      
      switch (manufacturerResult.action) {
        case 'high_cost_manufacture':
          actionText = `高コスト商品製造: 商品(値${manufacturerResult.design.value},コスト${manufacturerResult.design.cost})を¥${manufacturerResult.price}で出品`;
          break;
        case 'medium_cost_manufacture':
          actionText = `中コスト商品製造: 商品(値${manufacturerResult.design.value},コスト${manufacturerResult.design.cost})を¥${manufacturerResult.price}で出品`;
          break;
        case 'low_cost_manufacture':
          actionText = `低コスト商品製造: 商品(値${manufacturerResult.design.value},コスト${manufacturerResult.design.cost})を¥${manufacturerResult.price}で出品`;
          break;
        case 'inventory_clearance':
          actionText = '在庫一掃セール: 全商品価格を2下げる';
          break;
        default:
          actionText = `${manufacturerResult.action}を実行`;
      }
      
      this.addToPlayLog('automata', `メーカーオートマ ${diceText}: ${actionText}`, 'manufacturer-automata', 'メーカーオートマ');
    }
    
    // Process resale automata
    console.log('💰 Processing resale automata...');
    const resaleResult = this.processResaleAutomata();
    console.log('💰 Resale automata result:', resaleResult);
    this.automataActions.push({
      type: 'resale',
      ...resaleResult
    });
    
    // Add detailed resale log
    if (resaleResult.action) {
      const diceText = `[${resaleResult.dice[0]}, ${resaleResult.dice[1]}] = ${resaleResult.total}`;
      let actionText = '';
      
      switch (resaleResult.action) {
        case 'mass_purchase':
          if (resaleResult.purchasedProducts?.length > 0) {
            actionText = `大量購入: ${resaleResult.purchasedProducts.length}個の安い商品を購入して転売出品`;
          } else {
            actionText = '大量購入を試みたが購入できる商品がなかった';
          }
          break;
        case 'selective_purchase':
          if (resaleResult.purchasedProducts?.length > 0) {
            actionText = `選別購入: 人気商品1個を購入して転売出品`;
          } else {
            actionText = '選別購入を試みたが条件に合う商品がなかった';
          }
          break;
        case 'wait_and_see':
          actionText = '様子見: この回は購入せず';
          break;
        case 'speculative_purchase':
          if (resaleResult.purchasedProducts?.length > 0) {
            actionText = `投機購入: ランダム商品1個を購入して転売出品`;
          } else {
            actionText = '投機購入を試みたが購入できる商品がなかった';
          }
          break;
        case 'paused':
          actionText = '規制により行動を停止中';
          break;
        default:
          actionText = `${resaleResult.action}を実行`;
      }
      
      this.addToPlayLog('automata', `転売オートマ ${diceText}: ${actionText}`, 'resale-automata', '転売オートマ');
    }
    
    console.log('🤖 === AUTOMATA PHASE END ===');
    
    return {
      manufacturer: manufacturerResult,
      resale: resaleResult
    };
  }
  
  processManufacturerAutomata() {
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const total = dice1 + dice2;
    
    let action, design, product, price;
    
    if (total >= 2 && total <= 4) {
      // High cost product manufacturing
      design = this.rollDesignWithCostRange(3, 5);
      action = 'high_cost_manufacture';
      price = design.cost * 3;
      
      // Review highest priced product negatively
      this.automataReviewAction('negative', 'highest_price');
    } else if (total >= 5 && total <= 7) {
      // Medium cost product manufacturing
      design = this.rollDesignWithCost(3);
      action = 'medium_cost_manufacture';
      price = design.cost * 2;
    } else if (total >= 8 && total <= 10) {
      // Low cost product manufacturing
      design = this.rollDesignWithCostRange(1, 3);
      action = 'low_cost_manufacture';
      price = design.cost * 2;
      
      // Review own cheapest product positively
      this.automataReviewAction('positive', 'own_cheapest');
    } else if (total >= 11 && total <= 12) {
      // Inventory clearance
      action = 'inventory_clearance';
      this.reduceAutomataProductPrices(2);
    }
    
    if (design) {
      // Create and place product
      product = {
        id: `automata-product-${Date.now()}`,
        value: design.value,
        cost: design.cost,
        popularity: 1,
        ownerId: 'manufacturer-automata',
        price: price
      };
      
      this.manufacturerAutomata.inventory.push(product);
      // Add product directly to shared market with popularity 1
      this.addProductToSharedMarket(product, price);
    }
    
    console.log(`Manufacturer automata: ${action}, dice: ${dice1}+${dice2}=${total}`);
    
    return { action, dice: [dice1, dice2], total, design, product, price };
  }
  
  processResaleAutomata() {
    // Skip if regulation level 3 and within 2 rounds of activation
    if (this.regulationLevel === 3 && this.resaleAutomata.pauseRounds > 0) {
      this.resaleAutomata.pauseRounds--;
      console.log(`Resale automata paused due to regulation`);
      return { action: 'paused', reason: 'regulation' };
    }
    
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const total = dice1 + dice2;
    
    let action, purchasedProducts = [];
    const availableFunds = this.resaleAutomata.funds;
    
    if (total >= 2 && total <= 4) {
      // Mass purchase - buy up to 3 cheapest products
      action = 'mass_purchase';
      const limit = this.regulationLevel === 1 ? 2 : 3; // Reduced during public comment
      purchasedProducts = this.automataPurchase('cheapest', limit, availableFunds);
    } else if (total === 5 || total === 9) {
      // Selective purchase - highest popularity product
      action = 'selective_purchase';
      purchasedProducts = this.automataPurchase('highest_popularity', 1, availableFunds);
    } else if (total >= 6 && total <= 8) {
      // Wait and see
      action = 'wait_and_see';
    } else if (total >= 10 && total <= 12) {
      // Speculative purchase - random product
      action = 'speculative_purchase';
      purchasedProducts = this.automataPurchase('random', 1, availableFunds);
    }
    
    // Process purchased products for resale
    purchasedProducts.forEach(product => {
      const resalePrice = product.price + 5;
      
      // Create new resale product with automata's "own dice" (same concept as player resale)
      const resaleProduct = {
        id: `resale-automata-${Date.now()}`,
        cost: product.cost,
        value: product.value,
        price: resalePrice,
        popularity: product.popularity,
        isResale: true,
        originalOwner: product.ownerId,
        reseller: 'resale-automata',
        ownerId: 'resale-automata'
      };
      
      // Add to shared market
      console.log(`💰 Resale automata putting product on market: 商品(値${resaleProduct.value}) at price ${resalePrice}`);
      this.addProductToSharedMarket(resaleProduct, resalePrice);
      
      // Add global pollution (new rule system)
      this.globalPollution = (this.globalPollution || 0) + 1;
    });
    
    console.log(`Resale automata: ${action}, purchased ${purchasedProducts.length} products`);
    console.log(`💰 Resale automata action completed`);
    
    return { 
      action, 
      dice: [dice1, dice2], 
      total, 
      purchasedProducts, 
      funds: this.resaleAutomata.funds 
    };
  }

  rollDesignWithCostRange(minCost, maxCost) {
    let design;
    do {
      design = this.rollRandomDesign();
    } while (design.cost < minCost || design.cost > maxCost);
    return design;
  }

  rollDesignWithCost(targetCost) {
    let design;
    do {
      design = this.rollRandomDesign();
    } while (design.cost !== targetCost);
    return design;
  }

  automataReviewAction(type, target) {
    // Find products for review based on target criteria
    const allProducts = this.getAllMarketProducts();
    
    let targetProducts = [];
    
    if (target === 'highest_price') {
      const maxPrice = Math.max(...allProducts.map(p => p.price));
      targetProducts = allProducts.filter(p => p.price === maxPrice);
    } else if (target === 'own_cheapest') {
      const automataProducts = allProducts.filter(p => p.ownerId === 'manufacturer-automata');
      if (automataProducts.length > 0) {
        const minPrice = Math.min(...automataProducts.map(p => p.price));
        targetProducts = automataProducts.filter(p => p.price === minPrice);
      }
    }
    
    // Apply review to first target product
    if (targetProducts.length > 0) {
      const product = targetProducts[0];
      const owner = this.players.find(p => p.id === product.ownerId) || 
                    (product.ownerId === 'manufacturer-automata' ? this.manufacturerAutomata : null);
      
      if (owner) {
        const popularityChange = type === 'positive' ? 1 : -1;
        const newPopularity = Math.max(1, Math.min(6, product.popularity + popularityChange));
        
        // Move product in shared market
        if (newPopularity !== product.popularity) {
          this.removeProductFromSharedMarket(product.price, product.popularity);
          const oldPopularity = product.popularity;
          product.popularity = newPopularity;
          this.addProductToSharedMarket(product, product.price);
          
          // Log the review action
          const reviewType = type === 'positive' ? '高評価' : '低評価';
          const targetDesc = target === 'highest_price' ? '最高価格商品' : target === 'own_cheapest' ? '自社最安商品' : '商品';
          this.addToPlayLog('automata', `メーカーオートマ: ${targetDesc}「商品(値${product.value})」に${reviewType}レビュー (人気度${oldPopularity}→${newPopularity})`, 'manufacturer-automata', 'メーカーオートマ');
        }
      }
    }
  }

  automataPurchase(strategy, limit, availableFunds) {
    const allProducts = this.getAllMarketProducts()
      .filter(p => p.ownerId !== 'resale-automata'); // Don't buy from self
    
    let targetProducts = [];
    
    if (strategy === 'cheapest') {
      targetProducts = allProducts
        .sort((a, b) => a.price - b.price || b.popularity - a.popularity)
        .slice(0, limit);
    } else if (strategy === 'highest_popularity') {
      targetProducts = allProducts
        .sort((a, b) => b.popularity - a.popularity || a.price - b.price)
        .slice(0, 1);
    } else if (strategy === 'random') {
      if (allProducts.length > 0) {
        const randomIndex = Math.floor(Math.random() * allProducts.length);
        targetProducts = [allProducts[randomIndex]];
      }
    }
    
    // Purchase affordable products
    const purchased = [];
    let remainingFunds = availableFunds;
    
    for (const product of targetProducts) {
      if (remainingFunds >= product.price) {
        // Remove from original owner's market
        const owner = this.players.find(p => p.id === product.ownerId) || 
                      (product.ownerId === 'manufacturer-automata' ? this.manufacturerAutomata : null);
        
        // Remove from shared market
        this.removeProductFromSharedMarket(product.price, product.popularity);
        
        // Pay owner
        if (owner.gainFunds) {
          owner.gainFunds(product.price);
        } else {
          owner.funds = (owner.funds || 0) + product.price;
        }
        
        remainingFunds -= product.price;
        purchased.push(product);
        
        // Log individual purchase
        const ownerName = owner.name || (product.ownerId === 'manufacturer-automata' ? 'メーカーオートマ' : product.ownerId);
        console.log(`💰 Resale automata purchased: 商品(値${product.value}) from ${ownerName} for ¥${product.price}`);
      }
    }
    
    this.resaleAutomata.funds = remainingFunds;
    return purchased;
  }

  getAllMarketProducts() {
    // Return all products from shared market
    return this.getAllSharedMarketProducts();
  }

  reduceAutomataProductPrices(reduction) {
    // Reduce manufacturer automata product prices in shared market
    let reducedCount = 0;
    
    for (const [price, popularityMap] of Object.entries(this.sharedMarket)) {
      for (const [popularity, product] of Object.entries(popularityMap)) {
        if (product && product.ownerId === 'manufacturer-automata') {
          const oldPrice = parseInt(price);
          const newPrice = Math.max(1, oldPrice - reduction);
          
          if (newPrice < oldPrice) {
            // Remove from old position
            this.removeProductFromSharedMarket(oldPrice, parseInt(popularity));
            // Update product price
            product.price = newPrice;
            // Add to new position
            this.addProductToSharedMarket(product, newPrice);
            reducedCount++;
          }
        }
      }
    }
    
    // Log the price reduction action
    if (reducedCount > 0) {
      this.addToPlayLog('automata', `メーカーオートマ: ${reducedCount}個の商品価格を${reduction}下げる在庫一掃セール実施`, 'manufacturer-automata', 'メーカーオートマ');
    }
  }
  
  processMarketPhase() {
    console.log('🏪 === MARKET PHASE START ===');
    
    this.addToPlayLog('phase', '市場フェーズ開始');
    
    // Roll demand dice
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const demandValue = dice1 + dice2;
    
    console.log(`🎲 Market demand dice: ${dice1} + ${dice2} = ${demandValue}`);
    this.addToPlayLog('phase', `市場需要判定 [${dice1}, ${dice2}] = ${demandValue}: 需要値${demandValue}の商品が購入対象`);
    
    // Find all products with matching demand value
    const matchingProducts = this.findProductsByDemandValue(demandValue);
    console.log(`🛍️ Found ${matchingProducts.length} matching products`);
    
    // Sort by popularity (then by price if tied)
    matchingProducts.sort((a, b) => {
      if (a.popularity !== b.popularity) {
        return b.popularity - a.popularity; // Higher popularity first
      }
      return a.price - b.price; // Lower price first
    });
    
    // Purchase up to 5 products
    const purchasedProducts = matchingProducts.slice(0, 5);
    console.log(`💳 Purchasing ${purchasedProducts.length} products (max 5)`);
    
    purchasedProducts.forEach(product => {
      const owner = this.players.find(p => p.id === product.ownerId) || 
                    (product.ownerId === 'manufacturer-automata' ? this.manufacturerAutomata : null) ||
                    (product.ownerId === 'resale-automata' ? this.resaleAutomata : null);
      
      if (owner) {
        console.log(`💰 Paying ${product.price} funds to ${owner.name || product.ownerId} for ${product.category}`);
        
        // Pay owner
        if (owner.gainFunds) {
          owner.gainFunds(product.price);
        }
        
        // Remove from shared market
        this.removeProductFromSharedMarket(product.price, product.popularity);
      }
    });
    
    console.log(`🏪 === MARKET PHASE END === (demand: ${demandValue}, purchased: ${purchasedProducts.length})`);
    
    // Log market results
    if (purchasedProducts.length > 0) {
      const purchaseDetails = purchasedProducts.map(p => {
        const ownerName = this.players.find(player => player.id === p.ownerId)?.name || 
                         (p.ownerId === 'manufacturer-automata' ? 'メーカーオートマ' : 
                          p.ownerId === 'resale-automata' ? '転売オートマ' : p.ownerId);
        return `商品(値${p.value})(¥${p.price}, ${ownerName})`;
      }).join(', ');
      this.addToPlayLog('phase', `市場で${purchasedProducts.length}個の商品が購入: ${purchaseDetails}`);
    } else {
      this.addToPlayLog('phase', `市場で購入された商品なし (対象商品${matchingProducts.length}個)`);
    }
    
    return {
      demandValue,
      dice: [dice1, dice2],
      matchingProducts: matchingProducts.length,
      purchasedProducts: purchasedProducts.length
    };
  }
  
  findProductsByDemandValue(demandValue) {
    const products = [];
    
    // Get all products from all sources
    const allProducts = this.getAllMarketProducts();
    
    allProducts.forEach(product => {
      const productDemandValues = this.getProductDemandValue(product);
      if (productDemandValues.includes(demandValue)) {
        products.push(product);
      }
    });
    
    return products;
  }
  
  getProductDemandValue(product) {
    // Convert cost to demand value based on rules
    const costToDemand = {
      1: [6, 7, 8],
      2: [5, 9],
      3: [4, 10],
      4: [3, 11],
      5: [2, 12]
    };
    
    const demandValues = costToDemand[product.cost] || [];
    return demandValues;
  }

  // Enhanced resale system - direct purchase and resale
  actionResale(player, { sellerId, productId, price, popularity, resalePrice }) {
    console.log('🔄 Resale action debug:', {
      buyerId: player.id,
      buyerName: player.name,
      sellerId,
      productId,
      price,
      popularity,
      availablePlayers: this.players.map(p => ({ id: p.id, name: p.name }))
    });
    
    if (!player.hasActionPoints(2)) {
      throw new Error('Not enough action points (resale requires 2AP)');
    }
    
    // No prestige requirement for resale action - prestige is reduced as consequence

    // Find seller (for funds transfer)
    let seller;
    
    if (sellerId === 'manufacturer-automata') {
      seller = this.manufacturerAutomata;
    } else if (sellerId === 'resale-automata') {
      seller = this.resaleAutomata;
    } else {
      seller = this.players.find(p => p.id === sellerId);
      if (!seller) {
        throw new Error('Seller not found');
      }
    }

    // Find product in shared market
    const product = this.sharedMarket[price]?.[popularity];
    console.log('🔍 Product search debug in shared market:', {
      price,
      popularity,
      productId,
      foundProduct: product,
      foundProductId: product?.id,
      marketAtPrice: this.sharedMarket[price]
    });
    
    if (!product) {
      throw new Error(`Product not found at price ${price}, popularity ${popularity}`);
    }
    if (product.id !== productId) {
      throw new Error(`Product ID mismatch: expected ${productId}, found ${product.id}`);
    }

    // Check if player can afford
    if (!player.canAfford(price)) {
      throw new Error('Cannot afford product');
    }

    // Use provided resale price or calculate default
    let finalResalePrice = resalePrice;
    if (!resalePrice) {
      // Calculate default resale price with bonus if not provided
      const resaleBonus = player.getResaleBonus();
      finalResalePrice = price + resaleBonus;
    }

    // Calculate maximum allowed price
    const resaleBonus = player.getResaleBonus();
    let maxResalePrice = price + resaleBonus;

    // Apply regulation limits to maximum
    if (this.regulationLevel === 2) {
      maxResalePrice = Math.min(maxResalePrice, price + 3);
    } else if (this.regulationLevel === 3) {
      maxResalePrice = Math.min(maxResalePrice, price + 1);
    }

    // Cap at 20
    maxResalePrice = Math.min(maxResalePrice, 20);

    // Validate provided resale price
    if (finalResalePrice > maxResalePrice) {
      throw new Error(`Resale price exceeds maximum allowed (max: ${maxResalePrice})`);
    }
    
    if (finalResalePrice < price) {
      throw new Error(`Resale price cannot be lower than purchase price (${price})`);
    }

    // Verify resale market slot is available before proceeding
    const existingProduct = this.sharedMarket[finalResalePrice] && this.sharedMarket[finalResalePrice][product.popularity];
    if (existingProduct !== null) {
      throw new Error(`Shared market slot already occupied at price ${finalResalePrice}, popularity ${product.popularity}`);
    }

    // Execute purchase and resale
    player.spendActionPoints(2);
    player.modifyPrestige(-1); // Spend 1 prestige for resale action
    player.spendFunds(price);

    // Remove product from shared market
    this.removeProductFromSharedMarket(price, popularity);
    
    // Transfer funds to seller
    if (sellerId === 'manufacturer-automata' || sellerId === 'resale-automata') {
      seller.funds += price;
    } else {
      seller.gainFunds(price);
    }

    // Create resale product with buyer's own dice (same value, buyer's color)
    // In web version, we use buyer's ID as the product owner
    const resaleProduct = {
      id: `resale-${player.id}-${Date.now()}`,
      cost: product.cost, // Keep original dice value
      value: product.value, // Keep original dice value for display
      price: finalResalePrice,
      popularity: product.popularity,
      isResale: true,
      originalOwner: product.ownerId || sellerId,
      reseller: player.id,
      ownerId: player.id // New owner is the reseller
    };

    // Add to shared market immediately
    this.addProductToSharedMarket(resaleProduct, finalResalePrice);

    // Update buyer's resale history (no additional prestige penalty)
    player.incrementResaleHistory();

    // Add pollution marker (global pollution instead of category-based)
    this.globalPollution = (this.globalPollution || 0) + 1;

    this.addToPlayLog('action', `商品(値${resaleProduct.value})を¥${price}で購入し¥${finalResalePrice}で転売しました`, player.id, player.name);

    return { 
      type: 'resale', 
      product: resaleProduct, 
      purchasePrice: price,
      resalePrice: finalResalePrice,
      resaleBonus,
      sellerId,
      newResaleHistory: player.resaleHistory,
      buyerFunds: player.funds,
      sellerFunds: seller.funds
    };
  }
  
  isGameOver() {
    return this.state === 'finished';
  }
  
  getWinner() {
    return this.winner;
  }
  
  toJSON() {
    return {
      id: this.id,
      state: this.state,
      players: this.players.map(p => p.toJSON()),
      currentPlayerIndex: this.currentPlayerIndex,
      currentRound: this.currentRound,
      currentPhase: this.currentPhase,
      pollution: this.pollution,
      globalPollution: this.globalPollution,
      regulationLevel: this.regulationLevel,
      sharedMarket: this.sharedMarket,
      manufacturerAutomata: this.manufacturerAutomata,
      resaleAutomata: this.resaleAutomata,
      activeTrends: this.activeTrends,
      automataActions: this.automataActions,
      winner: this.winner ? this.winner.toJSON() : null,
      playLog: this.playLog
    };
  }
}