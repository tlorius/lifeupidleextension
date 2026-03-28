import type { CharacterState, ClassId } from "./classes/types";

export interface Meta {
  version: number;
  lastUpdate: number;
}

export interface Resources {
  gold: number;
  energy?: number;
  gems?: number;
  ruby?: number;
}

export type rarity = "common" | "rare" | "epic" | "legendary" | "unique";

export interface Stats {
  attack: number;
  hp?: number;
  agility?: number;
  critChance?: number;
  intelligence?: number;
  defense?: number;
  gardening?: number;
  goldIncome?: number; // % bonus to gold generation
  energyRegeneration?: number; // % bonus to energy regen
  plantGrowth?: number; // % bonus to plant growth speed
  wateringDuration?: number; // % bonus to watering effect duration
  petStrength?: number; // % bonus to equipped pet bonus effectiveness
}

export type CropCategory =
  | "flower"
  | "vegetable"
  | "fruit"
  | "herb"
  | "grape"
  | "grains"
  | "special";

export interface CropDefinition {
  id: string;
  name: string;
  seedItemId: string; // Reference to seed item in inventory
  category: CropCategory;
  growthTimeMinutes: number; // e.g., 30 minutes or 10 hours (600 minutes)
  baseYield: number; // Crop resource units without watering bonus
  baseXP: number; // XP gained per harvest
  baseGold: number; // Gold per harvest
  isPerennial: boolean; // If true, respawns after harvest; if false, one-time
  rarity: rarity; // Determines seed rarity
  spriteStages: number; // Number of growth stages for animation (placeholder: 1 for now)
}

export interface TreeDefinition {
  id: string;
  name: string;
  category: CropCategory;
  growthTimeMinutes: number;
  baseYield: number;
  baseXP: number;
  baseGold: number;
  spriteStages: number;
}

export type RockTier = "small" | "medium" | "large";

export interface RockDefinition {
  tier: RockTier;
  energyCost: number; // 25, 50, 100
  minPickaxeRarity: rarity;
  minPickaxeLevel: number;
}

export type ToolType =
  | "pickaxe"
  | "shovel"
  | "wateringCan"
  | "sprinkler"
  | "harvester"
  | "planter"
  | "scythe";

export interface ToolDefinition {
  id: string;
  name: string;
  type: ToolType;
  rarity: rarity;
  level: number;
  // Pickaxe: minLevel required to break rocks of each tier
  // Shovel: can move/remove plants
  // Watering Can: wateredArea (1 = self, 3 = 3x3, 5 = 5x5), waterPerUse
  // Sprinkler: waterRange (1 = self, 3 = 3x3, etc), waterPerHour
  // Scythe: harvestRange (1 = self, 3 = 3x3, etc)
  stats?: {
    waterRange?: number; // For watering cans and sprinklers
    harvestRange?: number; // For scythe
    waterAmount?: number; // Amount of water per use
  };
}

export interface CropResourceStorage {
  [category: string]: number; // e.g., { flower: 250, vegetable: 100, ... }
}

export interface CropMasteryEntry {
  level: number;
  xp: number;
  prestige: number;
}

export interface CropMasteryState {
  [cropId: string]: CropMasteryEntry;
}

export interface CropInstance {
  position: FieldPosition;
  seedId: string; // Reference to crop definition
  plantedAt: number; // timestamp
  waterLevel: number; // 0-100, only tracked for non-sprinklered fields
  xpLevel: number;
  prestige: number; // Prestige level
  hasSprinkler: boolean;
  sprinklerTier?: string; // If has sprinkler, what tier
}

export interface TreeInstance {
  treeId: string;
  plantedAt: number;
  xpLevel: number;
  prestige: number;
  hasSprinkler: boolean;
  sprinklerTier?: string;
}

export interface FieldPosition {
  row: number;
  col: number;
}

export interface GardenState {
  gridSize: { rows: number; cols: number };

  // Explicit unlocked field positions; when absent, legacy grid rectangle is assumed.
  unlockedFields?: FieldPosition[];

  // Crops grouped by ID for efficient storage
  crops: Record<string, CropInstance[]>;

  // Trees grouped by ID
  trees: Record<string, TreeInstance[]>;

  // Rock positions grouped by tier
  rocks: {
    small: FieldPosition[];
    medium: FieldPosition[];
    large: FieldPosition[];
  };

  // Employee tools
  tools: Record<string, number>; // toolId -> level owned

  // Storage limits & current amounts
  cropStorage: {
    limits: CropResourceStorage; // Max capacity per category
    current: CropResourceStorage; // Current amounts
  };

  // Per-crop mastery progression used for level and prestige bonuses.
  cropMastery?: CropMasteryState;

  // Sprinkler placements grouped by tier
  sprinklers: Record<string, FieldPosition[]>; // "sprinkler_common" -> [[row, col], ...]

  // Harvester placements grouped by tier
  harvesters: Record<string, FieldPosition[]>;

  // Planter placements grouped by tier
  planters: Record<string, FieldPosition[]>;

  // Seed used by planter automation
  selectedPlanterSeedId?: string | null;

  // Optional per-planter seed assignment keyed by "row,col".
  planterSeedSelections?: Record<string, string>;

  // Keeps interval remainders so periodic automation checks stay stable across ticks.
  automationTimers?: {
    harvesterRemainderMs?: number;
    planterRemainderMs?: number;
    seedMakerRemainderMs?: number;
  };

  // Seedmaker automation state.
  seedMaker?: {
    isRunning?: boolean;
    selectedSeedId?: string | null;
  };
}

export interface TemporaryEffects {
  goldIncomeBoostPercent?: number;
  goldIncomeBoostUntil?: number;
}

export interface PlayerProgress {
  level: number;
  xp: number;
  totalXpEarned: number;
  unspentPoints?: number;
  unlockedSystems?: {
    spells?: boolean;
    classes?: boolean;
    dpsMeter?: boolean;
  };
  lastLevelUpAt?: number;
}

export interface CombatEnemySnapshot {
  level: number;
  enemyId: string;
  name: string;
  kind: "normal" | "boss";
  maxHp: number;
  currentHp: number;
  damage: number;
  attacksPerSecond: number;
  goldReward: number;
  gemsReward: number;
  xpReward: number;
  lootTableId?: string;
}

export interface CombatState {
  currentLevel: number;
  highestLevelReached: number;
  lastBossCheckpointLevel: number;
  playerCurrentHp: number;
  enemy: CombatEnemySnapshot;
  playerAttackRemainderMs: number;
  enemyAttackRemainderMs: number;
  spellCooldowns?: Record<string, number>;
  consumableCooldowns?: Record<string, number>;
  spellSynergyBuff?: {
    sourceClassId?: ClassId;
    nextClassSpellMultiplier?: number;
  };
  fightMode?: "progression" | "farming";
  farmingTargetLevel?: number;
}

export interface GameState {
  meta: {
    version: number;
    lastUpdate: number;
  };

  resources: Resources;
  stats: Stats;
  playerProgress: PlayerProgress;
  combat: CombatState;
  temporaryEffects?: TemporaryEffects;

  inventory: ItemInstance[];
  equipment: Equipment;
  character: CharacterState;

  upgrades: Upgrade[];
  pets: Pet[];

  garden: GardenState;
}

export type ItemType =
  | "weapon"
  | "armor"
  | "accessory"
  | "potion"
  | "seed"
  | "pet"
  | "tool";

export interface ItemInstance {
  uid: string;
  itemId: string;
  quantity: number;
  level: number;
}

export interface ItemDefinition {
  id: string;
  name: string;
  type: ItemType;
  rarity: rarity;
  setId?: string;
  stats?: Partial<Stats>;
  sellPrice?: number;
  // Percentage bonuses (primarily for pets, but available for all items)
  // Applies as: stat * (1 + (bonusType * bonusAmount * level))
  petBonus?: {
    bonusType: keyof Stats; // "attack", "goldIncome", etc.
    bonusAmount: number; // E.g., 0.1 = 10% bonus per level
  };
}

// Equipment slots for the player character
export interface Equipment {
  weapon: string | null;
  armor: string | null;
  accessory1: string | null;
  accessory2: string | null;
  pet: string | null;
  tool: string | null;
}

export type UpgradeType =
  | "autoGold"
  | "attackBoost"
  | "energyRegen"
  | "gemFinder"
  | "petMastery"
  | "plantGrowth"
  | "wateringDuration";

export interface UpgradeBonus {
  attackMultiplier?: number;
  defenseMultiplier?: number;
  intelligenceMultiplier?: number;
  goldMultiplier?: number;
  statsFlat?: Partial<Stats>;
  // Percentage bonuses (applied as: stat * (1 + percentBonus * level))
  percentBonusType?: keyof Stats; // Which stat this upgrade gives a % bonus to
  percentBonusAmount?: number; // E.g., 0.1 = 10% bonus per level
}

export interface LinkedUpgrade {
  upgradeId: string;
  unlocksAtLevel?: number; // Defaults to 1 if not specified
}

export interface Upgrade {
  id: string;
  name: string;
  description?: string;
  level: number;
  baseCost: number;
  scaling: number;
  type: UpgradeType;
  tree: string; // e.g., "combat", "resource", "farming"
  bonuses: UpgradeBonus[];
  prerequisites?: string[]; // Array of upgrade IDs that must be purchased first
  linkedUpgrades?: LinkedUpgrade[]; // Upgrades that unlock when this upgrade reaches certain level
}

export interface Pet {
  id: string;
  level: number;
  bonus: {
    goldMultiplier?: number;
    attackMultiplier?: number;
  };
}

export type PlantType = "flower" | "vegetable" | "fruit" | "herb";

export interface Plant {
  id: string;
  type: PlantType;
  level: number;
  growthTime: number;
  lastWatered: number;
}
