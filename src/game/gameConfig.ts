/**
 * GAME BALANCE CONFIGURATION
 * All hardcoded game values centralized for easy playtesting and balance adjustments
 */

/**
 * ROCK MECHANICS
 */
export const ROCK_CONFIG = {
  small: { energyCost: 25, minPickaxeLevel: 1 },
  medium: { energyCost: 50, minPickaxeLevel: 5 },
  large: { energyCost: 100, minPickaxeLevel: 15 },
} as const;

/**
 * WATER MECHANICS
 */
export const WATER_CONFIG = {
  waterCostEnergy: 10, // Energy cost per watering action
  waterDecayRate: 100 / 720, // percentage per minute (720 min = 12 hours)
  maxWaterBonus: 1.0, // 100% = 2x yield
  fullWaterThreshold: 100, // Sets field to 100% when placing sprinkler or initiating water
} as const;

/**
 * SEEDMAKER MECHANICS
 */
export const SEED_MAKER_CONFIG = {
  baseDurationMs: 60_000, // 1 minute per seed at level 1
  baseSpecialDurationMs: 300_000, // 5 minutes per special seed at level 1
  durationReductionPerLevel: 0.05, // 5% faster per additional level
  minDurationMs: 1_000,
  defaultCost: {
    gemCost: 1,
    resourceCost: 1,
  },
  costsBySeed: {
    sunflower_seed_common: { gemCost: 1, resourceCost: 1 },
    rose_seed_rare: { gemCost: 1, resourceCost: 1 },
    carrot_seed_common: { gemCost: 1, resourceCost: 1 },
    cabbage_seed_rare: { gemCost: 1, resourceCost: 1 },
    apple_seed_common: { gemCost: 1, resourceCost: 1 },
    berry_seed_rare: { gemCost: 1, resourceCost: 1 },
    mint_seed_common: { gemCost: 1, resourceCost: 1 },
    wheat_seed_common: { gemCost: 1, resourceCost: 1 },
    corn_seed_rare: { gemCost: 1, resourceCost: 1 },
    grape_seed_common: { gemCost: 1, resourceCost: 1 },
    astral_lotus_seed_epic: { gemCost: 4, resourceCost: 25 },
    void_truffle_seed_legendary: { gemCost: 8, resourceCost: 45 },
    phoenix_bloom_seed_unique: { gemCost: 16, resourceCost: 80 },
  },
} as const;

/**
 * CROP DEFINITIONS - Growth times in minutes, yields are per-harvest amounts
 */
export const CROP_CONFIG = {
  // Flowers
  sunflower_common: {
    id: "sunflower_common",
    name: "Sunflower",
    seedItemId: "sunflower_seed_common",
    category: "flower" as const,
    growthTimeMinutes: 30,
    baseYield: 10,
    baseXP: 5,
    baseGold: 20,
    isPerennial: false,
    rarity: "common" as const,
    spriteStages: 1,
  },
  rose_rare: {
    id: "rose_rare",
    name: "Rose",
    seedItemId: "rose_seed_rare",
    category: "flower" as const,
    growthTimeMinutes: 60,
    baseYield: 20,
    baseXP: 10,
    baseGold: 50,
    isPerennial: false,
    rarity: "rare" as const,
    spriteStages: 1,
  },

  // Vegetables
  carrot_common: {
    id: "carrot_common",
    name: "Carrot",
    seedItemId: "carrot_seed_common",
    category: "vegetable" as const,
    growthTimeMinutes: 45,
    baseYield: 15,
    baseXP: 8,
    baseGold: 30,
    isPerennial: false,
    rarity: "common" as const,
    spriteStages: 1,
  },
  cabbage_rare: {
    id: "cabbage_rare",
    name: "Cabbage",
    seedItemId: "cabbage_seed_rare",
    category: "vegetable" as const,
    growthTimeMinutes: 90,
    baseYield: 25,
    baseXP: 15,
    baseGold: 60,
    isPerennial: false,
    rarity: "rare" as const,
    spriteStages: 1,
  },

  // Fruits
  apple_common: {
    id: "apple_common",
    name: "Apple",
    seedItemId: "apple_seed_common",
    category: "fruit" as const,
    growthTimeMinutes: 60,
    baseYield: 12,
    baseXP: 10,
    baseGold: 40,
    isPerennial: true,
    rarity: "common" as const,
    spriteStages: 1,
  },
  berry_rare: {
    id: "berry_rare",
    name: "Berry",
    seedItemId: "berry_seed_rare",
    category: "fruit" as const,
    growthTimeMinutes: 75,
    baseYield: 18,
    baseXP: 12,
    baseGold: 50,
    isPerennial: false,
    rarity: "rare" as const,
    spriteStages: 1,
  },

  // Herbs
  mint_common: {
    id: "mint_common",
    name: "Mint",
    seedItemId: "mint_seed_common",
    category: "herb" as const,
    growthTimeMinutes: 40,
    baseYield: 8,
    baseXP: 6,
    baseGold: 25,
    isPerennial: true, // Perennial herb
    rarity: "common" as const,
    spriteStages: 1,
  },

  // Grains
  wheat_common: {
    id: "wheat_common",
    name: "Wheat",
    seedItemId: "wheat_seed_common",
    category: "grains" as const,
    growthTimeMinutes: 120,
    baseYield: 30,
    baseXP: 20,
    baseGold: 80,
    isPerennial: false,
    rarity: "common" as const,
    spriteStages: 1,
  },
  corn_rare: {
    id: "corn_rare",
    name: "Corn",
    seedItemId: "corn_seed_rare",
    category: "grains" as const,
    growthTimeMinutes: 150,
    baseYield: 40,
    baseXP: 30,
    baseGold: 120,
    isPerennial: false,
    rarity: "rare" as const,
    spriteStages: 1,
  },

  // Special - Grapes (perennial)
  grape_common: {
    id: "grape_common",
    name: "Grape",
    seedItemId: "grape_seed_common",
    category: "grape" as const,
    growthTimeMinutes: 180,
    baseYield: 50,
    baseXP: 40,
    baseGold: 150,
    isPerennial: true, // Perennial crop
    rarity: "common" as const,
    spriteStages: 1,
  },

  // Special crops - explicit special category seeds/plants
  astral_lotus_epic: {
    id: "astral_lotus_epic",
    name: "Astral Lotus",
    seedItemId: "astral_lotus_seed_epic",
    category: "special" as const,
    growthTimeMinutes: 210,
    baseYield: 60,
    baseXP: 48,
    baseGold: 220,
    isPerennial: false,
    rarity: "epic" as const,
    spriteStages: 1,
  },
  void_truffle_legendary: {
    id: "void_truffle_legendary",
    name: "Void Truffle",
    seedItemId: "void_truffle_seed_legendary",
    category: "special" as const,
    growthTimeMinutes: 300,
    baseYield: 72,
    baseXP: 62,
    baseGold: 340,
    isPerennial: false,
    rarity: "legendary" as const,
    spriteStages: 1,
  },
  phoenix_bloom_unique: {
    id: "phoenix_bloom_unique",
    name: "Phoenix Bloom",
    seedItemId: "phoenix_bloom_seed_unique",
    category: "special" as const,
    growthTimeMinutes: 420,
    baseYield: 86,
    baseXP: 90,
    baseGold: 520,
    isPerennial: false,
    rarity: "unique" as const,
    spriteStages: 1,
  },
} as const;

/**
 * TOOL DEFINITIONS
 */
export const TOOL_CONFIG = {
  // Pickaxes
  pickaxe_common: {
    id: "pickaxe_common",
    name: "Wooden Pickaxe",
    type: "pickaxe" as const,
    rarity: "common" as const,
    level: 1,
    stats: { waterRange: 0, harvestRange: 0, waterAmount: 0 },
  },
  pickaxe_rare: {
    id: "pickaxe_rare",
    name: "Iron Pickaxe",
    type: "pickaxe" as const,
    rarity: "rare" as const,
    level: 5,
    stats: { waterRange: 0, harvestRange: 0, waterAmount: 0 },
  },
  pickaxe_epic: {
    id: "pickaxe_epic",
    name: "Mithril Pickaxe",
    type: "pickaxe" as const,
    rarity: "epic" as const,
    level: 15,
    stats: { waterRange: 0, harvestRange: 0, waterAmount: 0 },
  },

  // Watering Cans
  watering_can_common: {
    id: "watering_can_common",
    name: "Watering Can",
    type: "wateringCan" as const,
    rarity: "common" as const,
    level: 1,
    stats: { waterRange: 1, harvestRange: 0, waterAmount: 30 },
  },
  watering_can_rare: {
    id: "watering_can_rare",
    name: "Copper Watering Can",
    type: "wateringCan" as const,
    rarity: "rare" as const,
    level: 5,
    stats: { waterRange: 3, harvestRange: 0, waterAmount: 50 },
  },

  // Sprinklers
  sprinkler_common: {
    id: "sprinkler_common",
    name: "Basic Sprinkler",
    type: "sprinkler" as const,
    rarity: "common" as const,
    level: 1,
    stats: { waterRange: 1, harvestRange: 0, waterAmount: 0 },
  },
  sprinkler_rare: {
    id: "sprinkler_rare",
    name: "Standard Sprinkler",
    type: "sprinkler" as const,
    rarity: "rare" as const,
    level: 5,
    stats: { waterRange: 3, harvestRange: 0, waterAmount: 0 },
  },
  sprinkler_epic: {
    id: "sprinkler_epic",
    name: "Advanced Sprinkler",
    type: "sprinkler" as const,
    rarity: "epic" as const,
    level: 15,
    stats: { waterRange: 5, harvestRange: 0, waterAmount: 0 },
  },

  // Harvesters
  harvester_common: {
    id: "harvester_common",
    name: "Basic Harvester",
    type: "harvester" as const,
    rarity: "common" as const,
    level: 1,
    stats: { waterRange: 1, harvestRange: 0, waterAmount: 0 },
  },
  harvester_rare: {
    id: "harvester_rare",
    name: "Field Harvester",
    type: "harvester" as const,
    rarity: "rare" as const,
    level: 5,
    stats: { waterRange: 3, harvestRange: 0, waterAmount: 0 },
  },
  harvester_epic: {
    id: "harvester_epic",
    name: "Pulse Harvester",
    type: "harvester" as const,
    rarity: "epic" as const,
    level: 15,
    stats: { waterRange: 5, harvestRange: 0, waterAmount: 0 },
  },

  // Planters
  planter_common: {
    id: "planter_common",
    name: "Basic Planter",
    type: "planter" as const,
    rarity: "common" as const,
    level: 1,
    stats: { waterRange: 1, harvestRange: 0, waterAmount: 0 },
  },
  planter_rare: {
    id: "planter_rare",
    name: "Field Planter",
    type: "planter" as const,
    rarity: "rare" as const,
    level: 5,
    stats: { waterRange: 3, harvestRange: 0, waterAmount: 0 },
  },
  planter_epic: {
    id: "planter_epic",
    name: "Pulse Planter",
    type: "planter" as const,
    rarity: "epic" as const,
    level: 15,
    stats: { waterRange: 5, harvestRange: 0, waterAmount: 0 },
  },

  // Scythes
  scythe_common: {
    id: "scythe_common",
    name: "Scythe",
    type: "scythe" as const,
    rarity: "common" as const,
    level: 1,
    stats: { waterRange: 0, harvestRange: 1, waterAmount: 0 },
  },
  scythe_rare: {
    id: "scythe_rare",
    name: "Curved Scythe",
    type: "scythe" as const,
    rarity: "rare" as const,
    level: 5,
    stats: { waterRange: 0, harvestRange: 3, waterAmount: 0 },
  },
} as const;

/**
 * GARDEN STARTING STATE
 */
export const GARDEN_STARTING_CONFIG = {
  gridRows: 2,
  gridCols: 2,
  previewGridOffset: 2, // adds 2 to rows and cols for preview
  startingTools: {
    pickaxe_common: 1,
    watering_can_common: 1,
  },
  cropStorageLimits: {
    flower: 1000,
    vegetable: 1000,
    fruit: 1000,
    herb: 1000,
    grains: 1000,
    grape: 1000,
    special: 1000,
  },
} as const;

/**
 * STARTING RESOURCES
 */
export const STARTING_RESOURCES = {
  gold: 0,
  gems: 100,
  energy: 100,
} as const;

/**
 * STARTING STATS (base player stats)
 */
export const STARTING_STATS = {
  attack: 10,
  intelligence: 10,
  defense: 10,
  gardening: 1,
  "goldIncome%": 0,
  "energyRegeneration%": 0,
  "plantGrowth%": 0,
  "wateringDuration%": 0,
} as const;

/**
 * STAT CALCULATION CONSTANTS
 */
export const STAT_CONFIG = {
  // Rarity multipliers for items
  rarityMultipliers: {
    common: { statScale: 1.0, costScale: 1.0 },
    rare: { statScale: 1.2, costScale: 1.3 },
    epic: { statScale: 1.5, costScale: 1.6 },
    legendary: { statScale: 1.8, costScale: 2.0 },
    unique: { statScale: 2.0, costScale: 2.5 },
  },
  // Scaling per level
  perLevelBonus: 0.02, // 2% per level
  tenLevelBonus: 0.05, // additional 5% per 10 levels
} as const;

/**
 * PET BONUSES
 */
export const PET_CONFIG = {
  wolf_pup: { statBonus: 0.05, statType: "attack%" as const },
  fire_fox: { statBonus: 0.1, statType: "goldIncome%" as const },
  ice_dragon: { statBonus: 0.12, statType: "defense%" as const },
  phoenix: { statBonus: 0.15, statType: "intelligence%" as const },
  void_beast: { statBonus: 0.2, statType: "attack%" as const },
} as const;

/**
 * IDLE MECHANICS
 */
export const IDLE_CONFIG = {
  idleTickIntervalMs: 1000, // Run idle tick every 1 second
  goldPerSecond: 1, // Base gold income (modified by upgrades)
} as const;
