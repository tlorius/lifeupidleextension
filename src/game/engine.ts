import { getItemDefSafe } from "./items";
import type { GameState, ItemInstance, Stats } from "./types";

/**
 * Calculate gold income per second based on player stats and upgrades
 */
export function getGoldIncome(state: GameState): number {
  const baseGoldPerSecond = state.stats.attack || 1;
  const totalStats = getTotalStats(state);
  const goldIncomeBonus = totalStats.goldIncome ?? 0;

  const now = Date.now();
  const tempGoldBoost =
    (state.temporaryEffects?.goldIncomeBoostUntil ?? 0) > now
      ? (state.temporaryEffects?.goldIncomeBoostPercent ?? 0)
      : 0;

  // Apply gold income bonus: (1 + goldIncome)
  return baseGoldPerSecond * (1 + (goldIncomeBonus + tempGoldBoost) / 100);
}

export function applyIdle(state: GameState, deltaMs: number): void {
  const seconds = deltaMs / 1000;
  const goldPerSecond = getGoldIncome(state);
  state.resources.gold += goldPerSecond * seconds;
}

/**
 * Rarity multipliers for stat scaling and upgrade costs.
 * Can be extended in the future with bonus effects.
 */
const rarityMultipliers = {
  common: { statScale: 1, costScale: 1 },
  rare: { statScale: 1.2, costScale: 1.3 },
  epic: { statScale: 1.5, costScale: 1.6 },
  legendary: { statScale: 1.8, costScale: 2 },
  unique: { statScale: 2, costScale: 2.5 },
};

/**
 * Calculate the stats for an item at a given level.
 * Applies rarity-based scaling and optional per-level scaling.
 * @param baseStat - Base stat value from item definition
 * @param level - Current item level
 * @param rarity - Item rarity
 * @param bonusMultiplier - Optional bonus multiplier for future extensions (default: 1)
 */
export function calculateItemStat(
  baseStat: number,
  level: number,
  rarity: string,
  bonusMultiplier: number = 1,
): number {
  const multiplier =
    rarityMultipliers[rarity as keyof typeof rarityMultipliers];
  if (!multiplier) return baseStat;

  // Apply rarity multiplier to base stat
  let stat = baseStat * multiplier.statScale * bonusMultiplier;

  // Every 10 levels, apply a 5% scaling increase
  const tenLevelBonus = 1 + Math.floor(level / 10) * 0.05;
  stat *= tenLevelBonus;

  // Add per-level scaling: 2% increase per level
  stat +=
    baseStat * 0.02 * (level - 1) * multiplier.statScale * bonusMultiplier;

  return stat;
}

/**
 * Calculate all stats for an item instance.
 * @param item - Item instance
 * @param def - Item definition
 * @param bonusMultipliers - Optional bonus multipliers per stat for future extensions
 */
export function getItemStats(
  item: ItemInstance,
  def: { stats?: Partial<Stats>; rarity?: string },
  bonusMultipliers?: Partial<Record<keyof Stats, number>>,
): Partial<Stats> {
  if (!def.stats) return {};

  const stats: Partial<Stats> = {};
  for (const [key, value] of Object.entries(def.stats)) {
    if (value !== undefined && typeof value === "number") {
      const bonus = bonusMultipliers?.[key as keyof Stats] ?? 1;
      stats[key as keyof Stats] = calculateItemStat(
        value,
        item.level,
        def.rarity || "common",
        bonus,
      );
    }
  }
  return stats;
}

/**
 * Calculate the gem cost to upgrade an item.
 * Scales with both level and rarity.
 * @param currentLevel - Current item level
 * @param rarity - Item rarity
 * @param baseCost - Base cost per level (default: 10 gems)
 * @param costBonusMultiplier - Optional bonus multiplier for future extensions (default: 1)
 */
export function calculateUpgradeCost(
  currentLevel: number,
  rarity: string,
  baseCost: number = 10,
  costBonusMultiplier: number = 1,
): number {
  const multiplier =
    rarityMultipliers[rarity as keyof typeof rarityMultipliers];
  if (!multiplier) return baseCost * currentLevel * costBonusMultiplier;

  // Cost increases with each level, scaled by rarity
  const cost =
    baseCost * currentLevel * multiplier.costScale * costBonusMultiplier;
  return Math.ceil(cost);
}

/**
 * Check if an item is already equipped.
 */
export function isItemEquipped(state: GameState, itemUid: string): boolean {
  const equipment = state.equipment;
  return Object.values(equipment).includes(itemUid);
}

export function addItem(
  state: GameState,
  itemId: string,
  quantity: number = 1,
): GameState {
  return {
    ...state,
    inventory: [
      ...state.inventory,
      {
        uid: crypto.randomUUID(),
        itemId,
        quantity,
        level: 1,
      },
    ],
  };
}

function consumeInventoryItem(
  state: GameState,
  itemUid: string,
): { inventory: GameState["inventory"]; item?: ItemInstance } | null {
  const itemIndex = state.inventory.findIndex((i) => i.uid === itemUid);
  if (itemIndex === -1) return null;

  const item = state.inventory[itemIndex];
  const nextInventory = [...state.inventory];
  const nextQuantity = Math.max(0, (item.quantity ?? 1) - 1);

  if (nextQuantity > 0) {
    nextInventory[itemIndex] = { ...item, quantity: nextQuantity };
  } else {
    nextInventory.splice(itemIndex, 1);
  }

  return { inventory: nextInventory, item };
}

export function usePotion(state: GameState, itemUid: string): GameState {
  const consumed = consumeInventoryItem(state, itemUid);
  if (!consumed?.item) return state;

  const item = consumed.item;
  const def = getItemDefSafe(item.itemId);
  if (!def || def.type !== "potion") return state;

  const now = Date.now();
  const tempEffects = {
    goldIncomeBoostPercent: state.temporaryEffects?.goldIncomeBoostPercent ?? 0,
    goldIncomeBoostUntil: state.temporaryEffects?.goldIncomeBoostUntil ?? 0,
  };

  let nextState: GameState = {
    ...state,
    inventory: consumed.inventory,
  };

  if (def.id === "health_potion") {
    const currentEnergy = nextState.resources.energy ?? 100;
    nextState = {
      ...nextState,
      resources: {
        ...nextState.resources,
        energy: Math.min(100, currentEnergy + 50),
      },
    };
  } else if (def.id === "mana_potion") {
    tempEffects.goldIncomeBoostPercent = Math.max(
      tempEffects.goldIncomeBoostPercent ?? 0,
      25,
    );
    tempEffects.goldIncomeBoostUntil = Math.max(
      tempEffects.goldIncomeBoostUntil ?? 0,
      now + 10 * 60 * 1000,
    );
  } else if (def.id === "elixir") {
    const currentEnergy = nextState.resources.energy ?? 100;
    nextState = {
      ...nextState,
      resources: {
        ...nextState.resources,
        energy: Math.min(100, currentEnergy + 30),
      },
    };
    tempEffects.goldIncomeBoostPercent = Math.max(
      tempEffects.goldIncomeBoostPercent ?? 0,
      60,
    );
    tempEffects.goldIncomeBoostUntil = Math.max(
      tempEffects.goldIncomeBoostUntil ?? 0,
      now + 20 * 60 * 1000,
    );
  } else if (def.id === "immortal_brew") {
    nextState = {
      ...nextState,
      stats: {
        ...nextState.stats,
        attack: (nextState.stats.attack ?? 0) + 2,
        defense: (nextState.stats.defense ?? 0) + 2,
        intelligence: (nextState.stats.intelligence ?? 0) + 2,
      },
      resources: {
        ...nextState.resources,
        energy: 100,
      },
    };
    tempEffects.goldIncomeBoostPercent = Math.max(
      tempEffects.goldIncomeBoostPercent ?? 0,
      100,
    );
    tempEffects.goldIncomeBoostUntil = Math.max(
      tempEffects.goldIncomeBoostUntil ?? 0,
      now + 30 * 60 * 1000,
    );
  } else if (def.id === "swift_tonic") {
    tempEffects.goldIncomeBoostPercent = Math.max(
      tempEffects.goldIncomeBoostPercent ?? 0,
      200,
    );
    tempEffects.goldIncomeBoostUntil = Math.max(
      tempEffects.goldIncomeBoostUntil ?? 0,
      now + 5 * 60 * 1000,
    );
  } else if (def.id === "fortitude_brew") {
    nextState = {
      ...nextState,
      stats: {
        ...nextState.stats,
        defense: (nextState.stats.defense ?? 0) + 3,
      },
      resources: {
        ...nextState.resources,
        energy: 100,
      },
    };
  } else if (def.id === "scholars_draught") {
    nextState = {
      ...nextState,
      stats: {
        ...nextState.stats,
        intelligence: (nextState.stats.intelligence ?? 0) + 5,
      },
    };
    tempEffects.goldIncomeBoostPercent = Math.max(
      tempEffects.goldIncomeBoostPercent ?? 0,
      50,
    );
    tempEffects.goldIncomeBoostUntil = Math.max(
      tempEffects.goldIncomeBoostUntil ?? 0,
      now + 15 * 60 * 1000,
    );
  } else if (def.id === "berserkers_tonic") {
    nextState = {
      ...nextState,
      stats: {
        ...nextState.stats,
        attack: (nextState.stats.attack ?? 0) + 10,
        defense: (nextState.stats.defense ?? 0) - 3,
      },
    };
  } else if (def.id === "chaos_potion") {
    const roll = Math.floor(Math.random() * 5);
    if (roll === 0) {
      nextState = {
        ...nextState,
        stats: {
          ...nextState.stats,
          attack: (nextState.stats.attack ?? 0) + 15,
        },
      };
    } else if (roll === 1) {
      nextState = {
        ...nextState,
        stats: {
          ...nextState.stats,
          defense: (nextState.stats.defense ?? 0) + 15,
        },
      };
    } else if (roll === 2) {
      nextState = {
        ...nextState,
        stats: {
          ...nextState.stats,
          intelligence: (nextState.stats.intelligence ?? 0) + 15,
        },
      };
    } else if (roll === 3) {
      tempEffects.goldIncomeBoostPercent = Math.max(
        tempEffects.goldIncomeBoostPercent ?? 0,
        300,
      );
      tempEffects.goldIncomeBoostUntil = Math.max(
        tempEffects.goldIncomeBoostUntil ?? 0,
        now + 10 * 60 * 1000,
      );
    } else {
      // Curse: lose stats across the board
      nextState = {
        ...nextState,
        stats: {
          ...nextState.stats,
          attack: Math.max(0, (nextState.stats.attack ?? 0) - 10),
          defense: Math.max(0, (nextState.stats.defense ?? 0) - 10),
          intelligence: Math.max(0, (nextState.stats.intelligence ?? 0) - 10),
        },
      };
    }
  }

  return {
    ...nextState,
    temporaryEffects: tempEffects,
  };
}

export function sellItem(state: GameState, itemUid: string): GameState {
  const item = state.inventory.find((i) => i.uid === itemUid);
  if (!item) return state;

  const def = getItemDefSafe(item.itemId);
  if (!def || !def.sellPrice) return state;

  return {
    ...state,
    resources: {
      ...state.resources,
      gold: state.resources.gold + def.sellPrice,
    },
    inventory: state.inventory.filter((i) => i.uid !== itemUid),
  };
}

export function equipItem(
  state: GameState,
  itemUid: string,
  targetAccessorySlot?: "accessory1" | "accessory2",
): GameState {
  const item = state.inventory.find((i) => i.uid === itemUid);
  if (!item) return state;

  const def = getItemDefSafe(item.itemId);
  if (!def) return state;

  const newEquipment = { ...state.equipment };
  const isSprinkler = def.type === "tool" && def.id.includes("sprinkler");
  if (isSprinkler) return state;

  if (def.type === "accessory") {
    if (targetAccessorySlot) {
      newEquipment[targetAccessorySlot] = item.uid;
    } else if (!newEquipment.accessory1) {
      // find first empty accessory slot
      newEquipment.accessory1 = item.uid;
    } else if (!newEquipment.accessory2) {
      newEquipment.accessory2 = item.uid;
    } else {
      // no empty slot, replace accessory 1 by default
      newEquipment.accessory1 = item.uid;
    }
  } else if (def.type === "weapon") {
    newEquipment.weapon = item.uid;
  } else if (def.type === "armor") {
    newEquipment.armor = item.uid;
  } else if (def.type === "pet") {
    newEquipment.pet = item.uid;
  } else if (def.type === "tool") {
    newEquipment.tool = item.uid;
  } else {
    // other types not equipable for now
    return state;
  }

  return {
    ...state,
    equipment: newEquipment,
  };
}

/**
 * Upgrade an item to the next level, consuming gems.
 * Returns the same state if the upgrade is not possible (not enough gems, etc).
 */
export function upgradeItem(state: GameState, itemUid: string): GameState {
  const itemIndex = state.inventory.findIndex((i) => i.uid === itemUid);
  if (itemIndex === -1) return state;

  const item = state.inventory[itemIndex];
  const def = getItemDefSafe(item.itemId);
  if (!def) return state;
  if (def.type === "potion") return state;

  const cost = calculateUpgradeCost(item.level, def.rarity);
  if ((state.resources.gems ?? 0) < cost) return state;

  // Create new inventory with upgraded item
  const newInventory = [...state.inventory];
  newInventory[itemIndex] = {
    ...item,
    level: item.level + 1,
  };

  return {
    ...state,
    inventory: newInventory,
    resources: {
      ...state.resources,
      gems: (state.resources.gems ?? 0) - cost,
    },
  };
}

/**
 * Calculate stats contribution from base stats
 */
export function getBaseStats(state: GameState): Partial<Stats> {
  return { ...state.stats };
}

/**
 * Calculate stats contribution from equipped items
 */
export function getEquipmentStats(state: GameState): Partial<Stats> {
  const stats: Partial<Stats> = {};
  const slot = state.equipment;

  const itemSlots = [
    "weapon",
    "armor",
    "accessory1",
    "accessory2",
    "pet",
    "tool",
  ] as const;

  for (const slotName of itemSlots) {
    const uid = slot[slotName];
    if (!uid) continue;

    const item = state.inventory.find((i) => i.uid === uid);
    if (!item) continue;

    const def = getItemDefSafe(item.itemId);
    if (!def || !def.stats) continue;

    // Calculate stat values for this item
    for (const [key, value] of Object.entries(def.stats)) {
      if (value !== undefined && typeof value === "number") {
        const stat = calculateItemStat(
          value,
          item.level,
          def.rarity || "common",
        );
        stats[key as keyof Stats] = (stats[key as keyof Stats] ?? 0) + stat;
      }
    }
  }

  return stats;
}

/**
 * Calculate stats contribution from upgrades
 * Includes both flat bonuses (statsFlat) and percentage bonuses (percentBonusType)
 */
export function getUpgradeStats(state: GameState): Partial<Stats> {
  const stats: Partial<Stats> = {};

  for (const upgrade of state.upgrades) {
    // Handle flat bonuses (e.g., +2 attack per level)
    for (const bonus of upgrade.bonuses ?? []) {
      if (bonus.statsFlat) {
        for (const [key, value] of Object.entries(bonus.statsFlat)) {
          if (value !== undefined && typeof value === "number") {
            stats[key as keyof Stats] =
              (stats[key as keyof Stats] ?? 0) + value * upgrade.level;
          }
        }
      }

      // Handle percentage bonuses (e.g., +10% goldIncome per level)
      if (bonus.percentBonusType && bonus.percentBonusAmount !== undefined) {
        const bonusType = bonus.percentBonusType;
        const bonusPercentage = bonus.percentBonusAmount * upgrade.level * 100;
        stats[bonusType] = (stats[bonusType] ?? 0) + bonusPercentage;
      }
    }
  }

  return stats;
}

/**
 * Calculate stats contribution from pets
 */
export function getPetStats(state: GameState): Partial<Stats> {
  const stats: Partial<Stats> = {};
  const petUid = state.equipment.pet;

  if (!petUid) return stats;

  const petItem = state.inventory.find((i) => i.uid === petUid);
  if (!petItem) return stats;

  const petDef = getItemDefSafe(petItem.itemId);
  if (!petDef || !petDef.petBonus) return stats;

  // Calculate percentage bonus contribution
  const bonusType = petDef.petBonus.bonusType;
  const bonusAmount = petDef.petBonus.bonusAmount;

  // Store as percentage (e.g., 0.1 * 100 = 10% per level)
  stats[bonusType] =
    (stats[bonusType] ?? 0) + bonusAmount * petItem.level * 100;

  return stats;
}

/**
 * Calculate total stats with all bonuses from items, upgrades, and pets
 *
 * Applies bonuses in order:
 * 1. Base stats
 * 2. Equipment stats (fixed values from items)
 * 3. Upgrade stat bonuses (flat and percentage)
 * 4. Pet bonuses (percentage based on equipped pet)
 */
export function getTotalStats(state: GameState): Partial<Stats> {
  const baseStats = getBaseStats(state);
  const equipmentStats = getEquipmentStats(state);
  const upgradeStats = getUpgradeStats(state);
  const petStats = getPetStats(state);

  // Initialize base totals
  const total: Partial<Stats> = {
    attack:
      (baseStats.attack ?? 0) +
      (equipmentStats.attack ?? 0) +
      (upgradeStats.attack ?? 0),
    defense: (equipmentStats.defense ?? 0) + (upgradeStats.defense ?? 0),
    intelligence:
      (equipmentStats.intelligence ?? 0) + (upgradeStats.intelligence ?? 0),
    gardening:
      (baseStats.gardening ?? 0) +
      (equipmentStats.gardening ?? 0) +
      (upgradeStats.gardening ?? 0),
    // New stats - start with equipment/upgrade/pet percentages
    goldIncome: (upgradeStats.goldIncome ?? 0) + (petStats.goldIncome ?? 0),
    energyRegeneration:
      (upgradeStats.energyRegeneration ?? 0) +
      (petStats.energyRegeneration ?? 0),
    plantGrowth: (upgradeStats.plantGrowth ?? 0) + (petStats.plantGrowth ?? 0),
    wateringDuration:
      (upgradeStats.wateringDuration ?? 0) + (petStats.wateringDuration ?? 0),
  };

  // Apply multipliers from upgrades (old-style multipliers if they exist)
  for (const upgrade of state.upgrades) {
    for (const bonus of upgrade.bonuses ?? []) {
      if (bonus.attackMultiplier && total.attack) {
        total.attack *= Math.pow(bonus.attackMultiplier, upgrade.level);
      }
      if (bonus.defenseMultiplier && total.defense) {
        total.defense *= Math.pow(bonus.defenseMultiplier, upgrade.level);
      }
      if (bonus.intelligenceMultiplier && total.intelligence) {
        total.intelligence *= Math.pow(
          bonus.intelligenceMultiplier,
          upgrade.level,
        );
      }
    }
  }

  return total;
}
