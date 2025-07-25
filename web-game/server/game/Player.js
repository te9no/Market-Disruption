export class Player {
  constructor(id, name, role = 'player') {
    this.id = id;
    this.name = name;
    this.role = role; // 'host', 'player', or 'ai'
    
    // Game state
    this.funds = 30;
    this.prestige = 5;
    this.resaleHistory = 0;
    this.actionPoints = 3;
    
    // Personal market grid (20x6: price 1-20, popularity 1-6)
    this.personalMarket = this.initializeMarket();
    
    // Design board (up to 6 designs)
    this.designs = new Map(); // slot -> design
    
    // Inventory (manufactured products not yet sold)
    this.inventory = [];
    
    // Open source designs
    this.openSourceDesigns = new Set();
  }
  
  initializeMarket() {
    const market = {};
    for (let price = 1; price <= 20; price++) {
      market[price] = {};
      for (let popularity = 1; popularity <= 6; popularity++) {
        market[price][popularity] = null; // null = empty slot
      }
    }
    return market;
  }
  
  // Add product to personal market
  addProductToMarket(product, price) {
    const slot = this.personalMarket[price][product.popularity];
    if (slot !== null) {
      throw new Error('Market slot already occupied');
    }
    
    this.personalMarket[price][product.popularity] = product;
    return true;
  }
  
  // Remove product from personal market
  removeProductFromMarket(price, popularity) {
    const product = this.personalMarket[price][popularity];
    if (!product) {
      throw new Error('No product at specified location');
    }
    
    this.personalMarket[price][popularity] = null;
    return product;
  }
  
  // Check if can afford action
  canAfford(cost) {
    return this.funds >= cost;
  }
  
  // Spend funds
  spendFunds(amount) {
    if (!this.canAfford(amount)) {
      throw new Error('Insufficient funds');
    }
    this.funds -= amount;
  }
  
  // Gain funds
  gainFunds(amount) {
    this.funds += amount;
  }
  
  // Check if has enough AP
  hasActionPoints(required) {
    return this.actionPoints >= required;
  }
  
  // Spend action points
  spendActionPoints(amount) {
    if (!this.hasActionPoints(amount)) {
      throw new Error('Insufficient action points');
    }
    this.actionPoints -= amount;
  }
  
  // Reset action points (start of turn)
  resetActionPoints() {
    this.actionPoints = 3;
  }
  
  // Add design to design board
  addDesign(slot, design) {
    if (this.designs.has(slot)) {
      throw new Error('Design slot already occupied');
    }
    this.designs.set(slot, design);
  }
  
  // Get design from slot
  getDesign(slot) {
    return this.designs.get(slot);
  }
  
  // Check prestige-based price limit
  getPriceLimit(manufacturingCost) {
    if (this.prestige <= 2) return manufacturingCost * 2;
    if (this.prestige <= 8) return manufacturingCost * 3;
    return manufacturingCost * 4;
  }
  
  // Update prestige
  modifyPrestige(amount) {
    this.prestige = Math.max(1, this.prestige + amount); // Minimum prestige is 1
  }
  
  // Update resale history
  incrementResaleHistory() {
    this.resaleHistory++;
  }
  
  // Get resale bonus based on history
  getResaleBonus() {
    if (this.resaleHistory <= 1) return 0;
    if (this.resaleHistory <= 4) return 3;
    if (this.resaleHistory <= 7) return 6;
    return 10; // 8+ times
  }
  
  // Check if can perform regular actions (prestige >= -2)
  canPerformRegularActions() {
    return this.prestige >= -2;
  }

  // Get price limit method for server-side access
  getPriceLimit(manufacturingCost) {
    if (this.prestige <= 2) return manufacturingCost * 2;
    if (this.prestige <= 8) return manufacturingCost * 3;
    return manufacturingCost * 4;
  }
  
  // Get all products in personal market
  getAllMarketProducts() {
    const products = [];
    for (let price = 1; price <= 20; price++) {
      for (let popularity = 1; popularity <= 6; popularity++) {
        const product = this.personalMarket[price][popularity];
        if (product) {
          products.push({
            ...product,
            price,
            popularity,
            owner: this.id
          });
        }
      }
    }
    return products;
  }
  
  // Convert to JSON for client
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      funds: this.funds,
      prestige: this.prestige,
      resaleHistory: this.resaleHistory,
      actionPoints: this.actionPoints,
      personalMarket: this.personalMarket,
      designs: Object.fromEntries(this.designs),
      inventory: this.inventory,
      openSourceDesigns: Array.from(this.openSourceDesigns)
    };
  }
}