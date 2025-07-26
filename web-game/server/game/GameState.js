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
    
    // Regulation progress (0-3: no regulation, public comment, consideration, active)
    this.regulationLevel = 0;
    
    // Automata state
    this.manufacturerAutomata = {
      inventory: [],
      personalMarket: this.initializeAutomataMarket()
    };
    
    this.resaleAutomata = {
      funds: 20,
      inventory: [],
      personalMarket: this.initializeAutomataMarket()
    };
    
    // Dice pools
    this.categoryDice = {
      'game-console': [1, 2, 3, 4, 5, 6],
      'diy-gadget': [1, 2, 3, 4, 5, 6],
      'figure': [1, 2, 3, 4, 5, 6],
      'accessory': [1, 2, 3, 4, 5, 6],
      'toy': [1, 2, 3, 4, 5, 6]
    };
    
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
  
  initializeAutomataMarket() {
    const market = {};
    for (let price = 1; price <= 20; price++) {
      market[price] = {};
      for (let popularity = 1; popularity <= 6; popularity++) {
        market[price][popularity] = null; // null = empty slot
      }
    }
    return market;
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
    const categories = Object.keys(this.categoryDice);
    const category = categories[Math.floor(Math.random() * categories.length)];
    const value = Math.floor(Math.random() * 6) + 1;
    
    // Convert value to cost (as per rules)
    const costMap = { 6: 1, 5: 2, 4: 3, 3: 4, 2: 5, 1: 6 };
    const cost = costMap[value] || value;
    
    const design = {
      category,
      value,
      cost,
      id: `${category}-${value}-${Date.now()}`
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
      category: design.category,
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
    
    this.addToPlayLog('action', `${design.category}を製造しました`, player.id, player.name);
    
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
    
    // Apply pollution penalty to regular sales
    const pollutionPenalty = this.getPollutionPenalty(product.category);
    const adjustedPrice = Math.max(1, price - pollutionPenalty);
    
    if (this.pollution[product.category] >= 5) {
      throw new Error('Category too polluted for regular sales');
    }
    
    // Prepare product for market (before removing from inventory)
    const marketProduct = { ...product };
    marketProduct.price = adjustedPrice;
    
    // Verify market slot is available before proceeding
    if (player.personalMarket[adjustedPrice] && player.personalMarket[adjustedPrice][marketProduct.popularity]) {
      throw new Error('Market slot already occupied');
    }
    
    // Only spend action points and remove from inventory after all checks pass
    player.spendActionPoints(1);
    player.inventory.splice(productIndex, 1);
    
    // Add to personal market (should not fail now)
    player.addProductToMarket(marketProduct, adjustedPrice);
    
    this.addToPlayLog('action', `${marketProduct.category}を¥${adjustedPrice}で出品しました`, player.id, player.name);
    
    return { type: 'sell', product: marketProduct, originalPrice: price, adjustedPrice };
  }
  
  actionPurchase(player, { targetPlayerId, price, popularity }) {
    if (!player.hasActionPoints(1)) {
      throw new Error('Not enough action points');
    }
    
    const targetPlayer = this.players.find(p => p.id === targetPlayerId);
    if (!targetPlayer) {
      throw new Error('Target player not found');
    }
    
    const product = targetPlayer.personalMarket[price][popularity];
    if (!product) {
      throw new Error('No product at specified location');
    }
    
    if (!player.canAfford(price)) {
      throw new Error('Cannot afford product');
    }
    
    player.spendActionPoints(1);
    player.spendFunds(price);
    targetPlayer.gainFunds(price);
    
    // Remove from target's market and add to buyer's inventory
    targetPlayer.removeProductFromMarket(price, popularity);
    
    // Add ownership history
    product.previousOwner = product.ownerId;
    product.ownerId = player.id;
    product.purchasePrice = price;
    
    player.inventory.push(product);
    
    return { type: 'purchase', product, targetPlayerId, price };
  }

  actionReview(player, { targetPlayerId, price, popularity, reviewType, useOutsourcing = false }) {
    if (!player.hasActionPoints(1)) {
      throw new Error('Not enough action points');
    }

    const targetPlayer = this.players.find(p => p.id === targetPlayerId);
    if (!targetPlayer) {
      throw new Error('Target player not found');
    }

    const product = targetPlayer.personalMarket[price][popularity];
    if (!product) {
      throw new Error('No product at specified location');
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
        // Move product to new popularity slot
        targetPlayer.removeProductFromMarket(price, popularity);
        product.popularity = newPopularity;
        targetPlayer.addProductToMarket(product, price);
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
        // Move product to new popularity slot
        targetPlayer.removeProductFromMarket(price, popularity);
        product.popularity = newPopularity;
        targetPlayer.addProductToMarket(product, price);
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

    const product = player.personalMarket[price][popularity];
    if (!product) {
      throw new Error('No product at specified location');
    }

    player.spendActionPoints(1);
    
    // Remove from market and add to inventory
    player.removeProductFromMarket(price, popularity);
    player.inventory.push(product);

    return { type: 'buyback', product, price, popularity };
  }

  actionBuyDignity(player, params) {
    if (!player.hasActionPoints(1)) {
      throw new Error('Not enough action points');
    }

    if (player.funds < 10) {
      throw new Error('Not enough funds to buy dignity');
    }

    player.spendActionPoints(1);
    player.spendFunds(10);
    player.modifyPrestige(1);

    return { 
      type: 'buy_dignity', 
      cost: 10,
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
    
    // Check all players' markets
    for (const checkPlayer of this.players) {
      for (let price = 1; price <= 20; price++) {
        for (let popularity = 1; popularity <= 6; popularity++) {
          const product = checkPlayer.personalMarket[price][popularity];
          if (product && product.designSlot === designSlot && product.ownerId === player.id) {
            productsExist = true;
            break;
          }
        }
        if (productsExist) break;
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
      
      if (this.regulationLevel === 3) {
        // Regulation activated - confiscate all resale inventory
        this.players.forEach(p => {
          p.inventory = p.inventory.filter(product => !product.previousOwner);
          
          // Remove resale products from personal markets
          for (let price = 1; price <= 20; price++) {
            for (let popularity = 1; popularity <= 6; popularity++) {
              const product = p.personalMarket[price][popularity];
              if (product && product.previousOwner) {
                p.removeProductFromMarket(price, popularity);
              }
            }
          }
        });

        // Reset resale automata inventory
        this.resaleAutomata.inventory = [];
        this.resaleAutomata.personalMarket = {};
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

    // Find seller (player or automata)
    let seller;
    let sellerMarket;
    
    if (sellerId === 'manufacturer-automata') {
      seller = this.manufacturerAutomata;
      sellerMarket = this.manufacturerAutomata.personalMarket;
    } else if (sellerId === 'resale-automata') {
      seller = this.resaleAutomata;
      sellerMarket = this.resaleAutomata.personalMarket;
    } else {
      seller = this.players.find(p => p.id === sellerId);
      if (!seller) {
        throw new Error('Seller not found');
      }
      sellerMarket = seller.personalMarket;
    }

    // Find product
    const product = sellerMarket[price]?.[popularity];
    if (!product || product.id !== productId) {
      throw new Error('Product not found');
    }

    // Check if player can afford
    if (!player.canAfford(price)) {
      throw new Error('Cannot afford product');
    }

    player.spendActionPoints(1);
    player.spendFunds(price);

    // Remove product from seller's market
    if (sellerId === 'manufacturer-automata' || sellerId === 'resale-automata') {
      delete sellerMarket[price][popularity];
      seller.funds += price;
    } else {
      seller.removeProductFromMarket(price, popularity);
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
      3: { name: '経済特需', effect: 'All players gain 15 funds', cost: 0 },
      4: { name: '技術革新', effect: 'Reduce any design dice value by 1', cost: 0 },
      5: { name: 'インフルエンサー紹介', effect: 'Choose category, +2 popularity to your products', cost: 0 },
      6: { name: '汚染改善キャンペーン', effect: 'Remove 1 pollution marker from any category', cost: 0 },
      7: { name: 'サステナビリティ', effect: '+1 popularity to all open source products', cost: 1 },
      8: { name: 'DIYブーム', effect: 'All diy-gadget designs -1 dice value', cost: 0 },
      9: { name: 'インフレ進行', effect: 'All non-resale product prices +2', cost: 0 },
      10: { name: 'ショート動画ブーム', effect: '+2 funds bonus per resale success', cost: 0 },
      11: { name: 'ショート動画ブーム', effect: '+2 funds bonus per resale success', cost: 0 },
      12: { name: 'テレワーク需要', effect: '+1 popularity to game-console and diy-gadget', cost: 0 },
      13: { name: 'ギフト需要', effect: '+1 popularity to accessory and toy', cost: 0 },
      14: { name: '緑化促進', effect: 'Remove 2 pollution markers total', cost: 3 },
      15: { name: '消費者不信', effect: 'All other players -1 prestige', cost: 2 },
      16: { name: '市場開放', effect: 'Free design, manufacture, and sell', cost: 0 },
      17: { name: '風評操作', effect: 'Target player -3 prestige', cost: 2 },
      18: { name: '市場の寵児', effect: 'You gain +5 prestige', cost: 0 }
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
  
  getPollutionPenalty(category) {
    const pollutionLevel = this.pollution[category];
    if (pollutionLevel === 0) return 0;
    if (pollutionLevel === 1) return 1;
    if (pollutionLevel === 2) return 3;
    if (pollutionLevel >= 3) return 5;
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
          actionText = `高コスト商品製造: ${manufacturerResult.design.category}(コスト${manufacturerResult.design.cost})を¥${manufacturerResult.price}で出品`;
          break;
        case 'medium_cost_manufacture':
          actionText = `中コスト商品製造: ${manufacturerResult.design.category}(コスト${manufacturerResult.design.cost})を¥${manufacturerResult.price}で出品`;
          break;
        case 'low_cost_manufacture':
          actionText = `低コスト商品製造: ${manufacturerResult.design.category}(コスト${manufacturerResult.design.cost})を¥${manufacturerResult.price}で出品`;
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
        category: design.category,
        value: design.value,
        cost: design.cost,
        popularity: 1,
        ownerId: 'manufacturer-automata',
        price: price
      };
      
      this.manufacturerAutomata.inventory.push(product);
      if (!this.manufacturerAutomata.personalMarket[price]) {
        this.manufacturerAutomata.personalMarket[price] = {};
      }
      this.manufacturerAutomata.personalMarket[price][1] = product;
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
      product.previousOwner = product.ownerId;
      product.ownerId = 'resale-automata';
      product.purchasePrice = product.price;
      product.price = resalePrice;
      
      // Add to resale automata market
      console.log(`💰 Resale automata putting product on market: ${product.category} at price ${resalePrice}`);
      if (!this.resaleAutomata.personalMarket[resalePrice]) {
        this.resaleAutomata.personalMarket[resalePrice] = {};
      }
      this.resaleAutomata.personalMarket[resalePrice][product.popularity] = product;
      
      // Add pollution
      this.pollution[product.category]++;
    });
    
    console.log(`Resale automata: ${action}, purchased ${purchasedProducts.length} products`);
    console.log(`💰 Resale automata market after action:`, Object.keys(this.resaleAutomata.personalMarket).length, 'price points');
    
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
        
        // Move product in market
        if (owner.personalMarket && owner.personalMarket[product.price]) {
          delete owner.personalMarket[product.price][product.popularity];
          const oldPopularity = product.popularity;
          product.popularity = newPopularity;
          if (!owner.personalMarket[product.price][newPopularity]) {
            owner.personalMarket[product.price][newPopularity] = product;
          }
          
          // Log the review action
          const reviewType = type === 'positive' ? '高評価' : '低評価';
          const targetDesc = target === 'highest_price' ? '最高価格商品' : target === 'own_cheapest' ? '自社最安商品' : '商品';
          this.addToPlayLog('automata', `メーカーオートマ: ${targetDesc}「${product.category}」に${reviewType}レビュー (人気度${oldPopularity}→${newPopularity})`, 'manufacturer-automata', 'メーカーオートマ');
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
        
        if (owner && owner.personalMarket && owner.personalMarket[product.price]) {
          delete owner.personalMarket[product.price][product.popularity];
          
          // Pay owner
          if (owner.gainFunds) {
            owner.gainFunds(product.price);
          }
          
          remainingFunds -= product.price;
          purchased.push(product);
          
          // Log individual purchase
          const ownerName = owner.name || (product.ownerId === 'manufacturer-automata' ? 'メーカーオートマ' : product.ownerId);
          console.log(`💰 Resale automata purchased: ${product.category} from ${ownerName} for ¥${product.price}`);
        }
      }
    }
    
    this.resaleAutomata.funds = remainingFunds;
    return purchased;
  }

  getAllMarketProducts() {
    const products = [];
    
    // Player products
    this.players.forEach(player => {
      products.push(...player.getAllMarketProducts());
    });
    
    // Automata products
    for (const [price, popularityMap] of Object.entries(this.manufacturerAutomata.personalMarket)) {
      for (const [popularity, product] of Object.entries(popularityMap)) {
        if (product) {
          products.push({ ...product, price: parseInt(price), popularity: parseInt(popularity) });
        }
      }
    }
    
    for (const [price, popularityMap] of Object.entries(this.resaleAutomata.personalMarket)) {
      for (const [popularity, product] of Object.entries(popularityMap)) {
        if (product) {
          products.push({ ...product, price: parseInt(price), popularity: parseInt(popularity) });
        }
      }
    }
    
    return products;
  }

  reduceAutomataProductPrices(reduction) {
    // Reduce manufacturer automata product prices
    const newMarket = {};
    let reducedCount = 0;
    
    for (const [price, popularityMap] of Object.entries(this.manufacturerAutomata.personalMarket)) {
      for (const [popularity, product] of Object.entries(popularityMap)) {
        if (product) {
          const oldPrice = parseInt(price);
          const newPrice = Math.max(1, oldPrice - reduction);
          product.price = newPrice;
          
          if (!newMarket[newPrice]) {
            newMarket[newPrice] = {};
          }
          newMarket[newPrice][popularity] = product;
          
          if (newPrice < oldPrice) {
            reducedCount++;
          }
        }
      }
    }
    
    this.manufacturerAutomata.personalMarket = newMarket;
    
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
        
        // Remove from market
        if (owner.removeProductFromMarket) {
          owner.removeProductFromMarket(product.price, product.popularity);
        } else if (owner.personalMarket && owner.personalMarket[product.price]) {
          delete owner.personalMarket[product.price][product.popularity];
        }
      }
    });
    
    console.log(`🏪 === MARKET PHASE END === (demand: ${demandValue}, purchased: ${purchasedProducts.length})`);
    
    // Log market results
    if (purchasedProducts.length > 0) {
      const purchaseDetails = purchasedProducts.map(p => {
        const ownerName = this.players.find(player => player.id === p.ownerId)?.name || 
                         (p.ownerId === 'manufacturer-automata' ? 'メーカーオートマ' : 
                          p.ownerId === 'resale-automata' ? '転売オートマ' : p.ownerId);
        return `${p.category}(¥${p.price}, ${ownerName})`;
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

  // Enhanced resale system
  actionResale(player, { productId, targetPrice }) {
    if (!player.hasActionPoints(1)) {
      throw new Error('Not enough action points');
    }

    const productIndex = player.inventory.findIndex(p => p.id === productId);
    if (productIndex === -1) {
      throw new Error('Product not found in inventory');
    }

    const product = player.inventory[productIndex];
    
    if (!product.previousOwner) {
      throw new Error('Can only resale purchased products');
    }

    // Calculate resale price with regulations
    const basePrice = product.purchasePrice + 5 + player.getResaleBonus();
    let maxResalePrice = basePrice;

    if (this.regulationLevel === 2) {
      maxResalePrice = product.purchasePrice + 3;
    } else if (this.regulationLevel === 3) {
      maxResalePrice = product.purchasePrice + 1;
    }

    const finalPrice = Math.min(targetPrice || basePrice, maxResalePrice);

    // Prepare product for market (before removing from inventory)
    const marketProduct = { ...product };
    marketProduct.price = finalPrice;
    
    // Verify market slot is available before proceeding
    if (player.personalMarket[finalPrice] && player.personalMarket[finalPrice][marketProduct.popularity]) {
      throw new Error('Market slot already occupied');
    }

    // Only spend action points and remove from inventory after all checks pass
    player.spendActionPoints(1);
    player.inventory.splice(productIndex, 1);

    // Add to personal market (should not fail now)
    player.addProductToMarket(marketProduct, finalPrice);

    // Update resale history and prestige
    player.incrementResaleHistory();
    player.modifyPrestige(-1);

    // Add pollution marker
    this.pollution[marketProduct.category]++;

    this.addToPlayLog('action', `${marketProduct.category}を¥${finalPrice}で転売しました`, player.id, player.name);

    return { 
      type: 'resale', 
      product: marketProduct, 
      finalPrice, 
      basePrice, 
      maxResalePrice,
      newResaleHistory: player.resaleHistory 
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
      regulationLevel: this.regulationLevel,
      manufacturerAutomata: this.manufacturerAutomata,
      resaleAutomata: this.resaleAutomata,
      activeTrends: this.activeTrends,
      automataActions: this.automataActions,
      winner: this.winner ? this.winner.toJSON() : null,
      playLog: this.playLog
    };
  }
}