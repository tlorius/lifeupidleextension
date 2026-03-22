import type { Upgrade } from "./types";
import type { GameState } from "./types";

/**
 * Upgrade definitions organized by tree with prerequisites and linked upgrades
 */
export const upgradeDefinitions: Record<string, Upgrade> = {
  // ===== COMBAT TREE =====
  // Root: Attack I - Foundation attack upgrade
  attack_i: {
    id: "attack_i",
    name: "Attack I",
    description: "Increase attack by 10% per level",
    type: "attackBoost",
    tree: "combat",
    level: 0,
    baseCost: 50,
    scaling: 1.5,
    bonuses: [{ percentBonusType: "attack", percentBonusAmount: 0.1 }],
    prerequisites: [], // No prerequisites, root node
    linkedUpgrades: [
      { upgradeId: "sharp_blade", unlocksAtLevel: 1 },
      { upgradeId: "attack_mastery", unlocksAtLevel: 3 },
    ],
  },

  // Attack I -> Sharp Blade
  sharp_blade: {
    id: "sharp_blade",
    name: "Sharp Blade",
    description: "Further increase attack by 5% per level",
    type: "attackBoost",
    tree: "combat",
    level: 0,
    baseCost: 100,
    scaling: 1.6,
    bonuses: [{ percentBonusType: "attack", percentBonusAmount: 0.05 }],
    prerequisites: ["attack_i"],
    linkedUpgrades: [],
  },

  // Attack I (level 3) -> Attack Mastery
  attack_mastery: {
    id: "attack_mastery",
    name: "Attack Mastery",
    description: "Master combat, increase attack by 3% per level",
    type: "attackBoost",
    tree: "combat",
    level: 0,
    baseCost: 120,
    scaling: 1.7,
    bonuses: [{ percentBonusType: "attack", percentBonusAmount: 0.03 }],
    prerequisites: ["attack_i"],
    linkedUpgrades: [],
  },

  // Root: Defense I - Foundation defense upgrade
  defense_i: {
    id: "defense_i",
    name: "Defense I",
    description: "Increase defense by 10% per level",
    type: "attackBoost",
    tree: "combat",
    level: 0,
    baseCost: 50,
    scaling: 1.5,
    bonuses: [{ percentBonusType: "defense", percentBonusAmount: 0.1 }],
    prerequisites: [],
    linkedUpgrades: [{ upgradeId: "iron_skin", unlocksAtLevel: 1 }],
  },

  // Defense I -> Iron Skin
  iron_skin: {
    id: "iron_skin",
    name: "Iron Skin",
    description: "Further increase defense by 5% per level",
    type: "attackBoost",
    tree: "combat",
    level: 0,
    baseCost: 100,
    scaling: 1.6,
    bonuses: [{ percentBonusType: "defense", percentBonusAmount: 0.05 }],
    prerequisites: ["defense_i"],
    linkedUpgrades: [],
  },

  // ===== RESOURCE TREE =====
  // Root: Gold Rush - Foundation gold income upgrade
  gold_rush: {
    id: "gold_rush",
    name: "Gold Rush",
    description: "Increase gold income by 10% per level",
    type: "autoGold",
    tree: "resource",
    level: 0,
    baseCost: 75,
    scaling: 1.6,
    bonuses: [{ percentBonusType: "goldIncome", percentBonusAmount: 0.1 }],
    prerequisites: [],
    linkedUpgrades: [
      { upgradeId: "gold_efficiency", unlocksAtLevel: 1 },
      { upgradeId: "wealth", unlocksAtLevel: 3 },
    ],
  },

  // Gold Rush -> Gold Efficiency
  gold_efficiency: {
    id: "gold_efficiency",
    name: "Gold Efficiency",
    description: "Refine gold generation, increase by 5% per level",
    type: "autoGold",
    tree: "resource",
    level: 0,
    baseCost: 120,
    scaling: 1.7,
    bonuses: [{ percentBonusType: "goldIncome", percentBonusAmount: 0.05 }],
    prerequisites: ["gold_rush"],
    linkedUpgrades: [],
  },

  // Gold Efficiency (level 2) -> Wealth
  wealth: {
    id: "wealth",
    name: "Wealth",
    description: "Accumulate great wealth, increase gold by 3% per level",
    type: "autoGold",
    tree: "resource",
    level: 0,
    baseCost: 150,
    scaling: 1.8,
    bonuses: [{ percentBonusType: "goldIncome", percentBonusAmount: 0.03 }],
    prerequisites: ["gold_rush"],
    linkedUpgrades: [],
  },

  // Root: Energy Conservation
  energy_conservation: {
    id: "energy_conservation",
    name: "Energy Conservation",
    description: "Increase energy regeneration by 10% per level",
    type: "energyRegen",
    tree: "resource",
    level: 0,
    baseCost: 60,
    scaling: 1.5,
    bonuses: [
      { percentBonusType: "energyRegeneration", percentBonusAmount: 0.1 },
    ],
    prerequisites: [],
    linkedUpgrades: [],
  },

  // Root: Gem Hunter
  gem_hunter: {
    id: "gem_hunter",
    name: "Gem Hunter",
    description: "Find 5% more gems per level",
    type: "gemFinder",
    tree: "resource",
    level: 0,
    baseCost: 100,
    scaling: 1.8,
    bonuses: [],
    prerequisites: [],
    linkedUpgrades: [],
  },

  // ===== MAGIC TREE =====
  // Root: Mage Talent
  mage_talent: {
    id: "mage_talent",
    name: "Mage Talent",
    description: "Increase intelligence by 10% per level",
    type: "attackBoost",
    tree: "magic",
    level: 0,
    baseCost: 75,
    scaling: 1.7,
    bonuses: [{ percentBonusType: "intelligence", percentBonusAmount: 0.1 }],
    prerequisites: [],
    linkedUpgrades: [
      { upgradeId: "arcane_knowledge", unlocksAtLevel: 1 },
      { upgradeId: "spellcraft", unlocksAtLevel: 3 },
    ],
  },

  // Mage Talent -> Arcane Knowledge
  arcane_knowledge: {
    id: "arcane_knowledge",
    name: "Arcane Knowledge",
    description: "Further increase intelligence by 5% per level",
    type: "attackBoost",
    tree: "magic",
    level: 0,
    baseCost: 120,
    scaling: 1.8,
    bonuses: [{ percentBonusType: "intelligence", percentBonusAmount: 0.05 }],
    prerequisites: ["mage_talent"],
    linkedUpgrades: [],
  },

  // Mage Talent (level 3) -> Spellcraft
  spellcraft: {
    id: "spellcraft",
    name: "Spellcraft",
    description: "Master spellcasting, increase intelligence by 3% per level",
    type: "attackBoost",
    tree: "magic",
    level: 0,
    baseCost: 150,
    scaling: 1.9,
    bonuses: [{ percentBonusType: "intelligence", percentBonusAmount: 0.03 }],
    prerequisites: ["mage_talent"],
    linkedUpgrades: [],
  },

  // ===== FARMING TREE =====
  // Root: Plant Mastery
  plant_mastery: {
    id: "plant_mastery",
    name: "Plant Mastery",
    description: "Increase plant growth speed by 10% per level",
    type: "plantGrowth",
    tree: "farming",
    level: 0,
    baseCost: 80,
    scaling: 1.6,
    bonuses: [{ percentBonusType: "plantGrowth", percentBonusAmount: 0.1 }],
    prerequisites: [],
    linkedUpgrades: [
      { upgradeId: "better_watering", unlocksAtLevel: 1 },
      { upgradeId: "composting", unlocksAtLevel: 1 },
    ],
  },

  // Plant Mastery -> Better Watering
  better_watering: {
    id: "better_watering",
    name: "Better Watering",
    description: "Watering effects last 10% longer per level",
    type: "wateringDuration",
    tree: "farming",
    level: 0,
    baseCost: 100,
    scaling: 1.6,
    bonuses: [
      { percentBonusType: "wateringDuration", percentBonusAmount: 0.1 },
    ],
    prerequisites: ["plant_mastery"],
    linkedUpgrades: [{ upgradeId: "soil_aeration", unlocksAtLevel: 1 }],
  },

  // Plant Mastery -> Composting (parallel tier 2 branch)
  composting: {
    id: "composting",
    name: "Composting",
    description: "Enrich soil naturally to boost plant growth by 10% per level",
    type: "plantGrowth",
    tree: "farming",
    level: 0,
    baseCost: 110,
    scaling: 1.65,
    bonuses: [{ percentBonusType: "plantGrowth", percentBonusAmount: 0.1 }],
    prerequisites: ["plant_mastery"],
    linkedUpgrades: [{ upgradeId: "soil_aeration", unlocksAtLevel: 1 }],
  },

  // Tier 3: requires both tier 2 branches at level 1
  soil_aeration: {
    id: "soil_aeration",
    name: "Soil Aeration",
    description: "Loosen the earth to improve plant growth by 8% per level",
    type: "plantGrowth",
    tree: "farming",
    level: 0,
    baseCost: 140,
    scaling: 1.7,
    bonuses: [{ percentBonusType: "plantGrowth", percentBonusAmount: 0.08 }],
    prerequisites: ["better_watering", "composting"],
    linkedUpgrades: [{ upgradeId: "greenhouse_design", unlocksAtLevel: 2 }],
  },

  // Soil Aeration (level 2) -> Greenhouse Design
  greenhouse_design: {
    id: "greenhouse_design",
    name: "Greenhouse Design",
    description:
      "Refine climate control to extend watering duration by 12% per level",
    type: "wateringDuration",
    tree: "farming",
    level: 0,
    baseCost: 220,
    scaling: 1.8,
    bonuses: [
      { percentBonusType: "wateringDuration", percentBonusAmount: 0.12 },
    ],
    prerequisites: ["soil_aeration"],
    linkedUpgrades: [{ upgradeId: "harvest_festival", unlocksAtLevel: 3 }],
  },

  // Greenhouse Design (level 3) -> Harvest Festival
  harvest_festival: {
    id: "harvest_festival",
    name: "Harvest Festival",
    description: "Celebrate abundance to boost plant growth by 15% per level",
    type: "plantGrowth",
    tree: "farming",
    level: 0,
    baseCost: 360,
    scaling: 1.95,
    bonuses: [{ percentBonusType: "plantGrowth", percentBonusAmount: 0.15 }],
    prerequisites: ["greenhouse_design"],
    linkedUpgrades: [],
  },
};

/**
 * Get an upgrade definition by ID
 */
export function getUpgradeDef(upgradeId: string): Upgrade | null {
  return upgradeDefinitions[upgradeId] ?? null;
}

/**
 * Check if an upgrade's prerequisites are met
 */
export function areUpgradePrerequisitesMet(
  state: GameState,
  upgradeId: string,
): boolean {
  const upgradeDef = getUpgradeDef(upgradeId);
  if (!upgradeDef || !upgradeDef.prerequisites) return true;

  return upgradeDef.prerequisites.every((prerequisiteId) => {
    const prerequisiteUpgrade = state.upgrades.find(
      (u) => u.id === prerequisiteId,
    );
    return prerequisiteUpgrade && prerequisiteUpgrade.level > 0;
  });
}

/**
 * Check if an upgrade is unlocked by linked upgrades
 */
export function isUpgradeUnlocked(
  state: GameState,
  upgradeId: string,
): boolean {
  const upgradeDef = getUpgradeDef(upgradeId);
  if (!upgradeDef) return false;

  // If no prerequisites, it's unlocked by default
  if (!upgradeDef.prerequisites || upgradeDef.prerequisites.length === 0) {
    return true;
  }

  // Check if all prerequisites are met
  return areUpgradePrerequisitesMet(state, upgradeId);
}

/**
 * Get all upgrades that are unlocked by a specific upgrade reaching a certain level
 */
export function getUnlockedUpgrades(
  state: GameState,
  upgradeId: string,
): string[] {
  const unlockedIds: string[] = [];
  const parentUpgrade = state.upgrades.find((u) => u.id === upgradeId);

  if (!parentUpgrade) return unlockedIds;

  const parentDef = getUpgradeDef(upgradeId);
  if (!parentDef || !parentDef.linkedUpgrades) return unlockedIds;

  for (const linked of parentDef.linkedUpgrades) {
    const requiredLevel = linked.unlocksAtLevel ?? 1;
    if (parentUpgrade.level >= requiredLevel) {
      unlockedIds.push(linked.upgradeId);
    }
  }

  return unlockedIds;
}

/**
 * Get all upgrades organized by tree
 */
export function getUpgradesByTree(tree: string): Upgrade[] {
  return Object.values(upgradeDefinitions).filter((u) => u.tree === tree);
}

/**
 * Get all available upgrade trees
 */
export function getUpgradeTrees(): string[] {
  const trees = new Set(Object.values(upgradeDefinitions).map((u) => u.tree));
  return Array.from(trees);
}

/**
 * Check if player has purchased an upgrade and get its level
 */
export function getUpgradeLevel(state: GameState, upgradeId: string): number {
  const upgrade = state.upgrades.find((u) => u.id === upgradeId);
  return upgrade?.level ?? 0;
}

/**
 * Purchase an upgrade (if enough gold/resources)
 */
export function buyUpgrade(state: GameState, upgradeId: string): GameState {
  const def = getUpgradeDef(upgradeId);
  if (!def) return state;

  const currentLevel = getUpgradeLevel(state, upgradeId);
  const cost = Math.ceil(def.baseCost * Math.pow(def.scaling, currentLevel));

  // Check if enough gold
  if (state.resources.gold < cost) return state;

  // Find existing upgrade or create new one
  const existingIndex = state.upgrades.findIndex((u) => u.id === upgradeId);
  let newUpgrades = [...state.upgrades];

  if (existingIndex !== -1) {
    // Level up existing upgrade
    newUpgrades[existingIndex] = {
      ...newUpgrades[existingIndex],
      level: newUpgrades[existingIndex].level + 1,
    };
  } else {
    // Create new upgrade
    newUpgrades.push({
      ...def,
      level: 1,
    });
  }

  return {
    ...state,
    resources: {
      ...state.resources,
      gold: state.resources.gold - cost,
    },
    upgrades: newUpgrades,
  };
}
