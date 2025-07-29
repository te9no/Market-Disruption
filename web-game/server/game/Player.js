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
    
    // No personal market - using shared market board
    
    // Design board (up to 6 designs)
    this.designs = new Map(); // slot -> design
    
    // Inventory (manufactured products not yet sold)
    this.inventory = [];
    
    // Open source designs
    this.openSourceDesigns = new Set();
  }
  
  // Personal market methods removed - using shared market board
  
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
    console.log(`🎨 Adding design to player ${this.name}, slot ${slot}:`, design);
    if (this.designs.has(slot)) {
      console.log(`❌ Slot ${slot} already occupied for player ${this.name}`);
      throw new Error('Design slot already occupied');
    }
    this.designs.set(slot, design);
    console.log(`✅ Design added successfully. Player ${this.name} now has ${this.designs.size} designs`);
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
    this.prestige = Math.max(-5, Math.min(26, this.prestige + amount)); // Range: -5 to +26
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

  // getAllMarketProducts removed - using shared market board
  
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
      // personalMarket removed - using shared market board
      designs: Object.fromEntries(this.designs),
      inventory: this.inventory,
      openSourceDesigns: Array.from(this.openSourceDesigns)
    };
  }
}