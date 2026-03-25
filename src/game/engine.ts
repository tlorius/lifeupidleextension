import { getItemDefSafe } from "./items";
import { uniqueSetDefinitions } from "./itemSets";
import { getActiveClassNodeRank } from "./classes";
import { getUpgradeStats as getUpgradeStatsDomain } from "./upgradeStats";
import type { GameState, ItemInstance, Stats } from "./types";

export const MAX_MANA = 100;
const BASE_MANA_REGEN_PER_SECOND = 2;

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

export function getManaRegenPerSecond(state: GameState): number {
  const totalStats = getTotalStats(state);
  const manaRegenBonus = totalStats.energyRegeneration ?? 0;
  return BASE_MANA_REGEN_PER_SECOND * (1 + manaRegenBonus / 100);
}

export function applyIdle(state: GameState, deltaMs: number): void {
  const seconds = deltaMs / 1000;
  const goldPerSecond = getGoldIncome(state);

  let idleGoldMultiplier = 1;
  const longArcRank = getActiveClassNodeRank(state, "idler_1");
  const silentLedgerRank = getActiveClassNodeRank(state, "idler_2");
  const restingEdgeRank = getActiveClassNodeRank(state, "idler_3");
  const patienceDividendRank = getActiveClassNodeRank(state, "idler_7");
  const streakKeeperRank = getActiveClassNodeRank(state, "idler_4");
  const quietReserveRank = getActiveClassNodeRank(state, "idler_5");
  const delayedImpactRank = getActiveClassNodeRank(state, "idler_6");
  const clockworkCalmRank = getActiveClassNodeRank(state, "idler_8");
  const returnMomentumRank = getActiveClassNodeRank(state, "idler_9");
  const fortuneReserveRank = getActiveClassNodeRank(state, "idler_10");
  const stillnessWardRank = getActiveClassNodeRank(state, "idler_11");
  const perpetualEngineRank = getActiveClassNodeRank(state, "idler_12");
  const currentStreak = Math.max(
    0,
    state.character.idleCheckIn?.streakDays ?? 0,
  );

  if (longArcRank > 0 || patienceDividendRank > 0 || streakKeeperRank > 0) {
    const durationHours = Math.max(0, deltaMs / (1000 * 60 * 60));
    idleGoldMultiplier += longArcRank * 0.1;
    idleGoldMultiplier += silentLedgerRank * 0.05;
    idleGoldMultiplier += restingEdgeRank * 0.04;
    idleGoldMultiplier += delayedImpactRank * 0.03;
    idleGoldMultiplier += Math.min(
      1.2,
      durationHours * (0.015 + patienceDividendRank * 0.006),
    );
    idleGoldMultiplier += Math.min(
      0.5,
      durationHours * (0.01 + returnMomentumRank * 0.003),
    );
    idleGoldMultiplier += Math.min(
      0.6,
      currentStreak * (0.01 + streakKeeperRank * 0.003),
    );
    idleGoldMultiplier += fortuneReserveRank * 0.03;
    idleGoldMultiplier += perpetualEngineRank > 0 ? 0.2 : 0;
  }

  state.resources.gold += goldPerSecond * seconds * idleGoldMultiplier;

  const currentMana = state.resources.energy ?? MAX_MANA;
  let manaRegenPerSecond = getManaRegenPerSecond(state);
  manaRegenPerSecond *= 1 + quietReserveRank * 0.04 + clockworkCalmRank * 0.03;
  manaRegenPerSecond += stillnessWardRank > 0 ? 0.5 : 0;
  state.resources.energy = Math.min(
    MAX_MANA,
    currentMana + manaRegenPerSecond * seconds,
  );
}

/**
 * Rarity multipliers for stat scaling and upgrade costs.
 * Can be extended in the future with bonus effects.
 */
const rarityMultipliers = {
  common: { statScale: 1, costScale: 1, perLevelScale: 0.02 },
  rare: { statScale: 1.2, costScale: 1.3, perLevelScale: 0.02 },
  epic: { statScale: 3.2, costScale: 2.1, perLevelScale: 0.08 },
  legendary: { statScale: 9, costScale: 4.4, perLevelScale: 0.22 },
  unique: { statScale: 30, costScale: 8.5, perLevelScale: 0.6 },
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

  // Add per-level scaling. Higher rarities ramp much harder.
  stat +=
    baseStat *
    multiplier.perLevelScale *
    (level - 1) *
    multiplier.statScale *
    bonusMultiplier;

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
  itemLevel: number = 1,
): GameState {
  return {
    ...state,
    inventory: [
      ...state.inventory,
      {
        uid: crypto.randomUUID(),
        itemId,
        quantity,
        level: Math.max(1, Math.floor(itemLevel)),
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
  const combatMaxHp = Math.max(1, Math.round(getTotalStats(nextState).hp ?? 1));

  if (def.id === "health_potion") {
    const currentEnergy = nextState.resources.energy ?? MAX_MANA;
    nextState = {
      ...nextState,
      combat: {
        ...nextState.combat,
        playerCurrentHp: Math.min(
          combatMaxHp,
          nextState.combat.playerCurrentHp + Math.round(combatMaxHp * 0.35),
        ),
      },
      resources: {
        ...nextState.resources,
        energy: Math.min(MAX_MANA, currentEnergy + 50),
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
    const currentEnergy = nextState.resources.energy ?? MAX_MANA;
    nextState = {
      ...nextState,
      combat: {
        ...nextState.combat,
        playerCurrentHp: Math.min(
          combatMaxHp,
          nextState.combat.playerCurrentHp + Math.round(combatMaxHp * 0.2),
        ),
      },
      resources: {
        ...nextState.resources,
        energy: Math.min(MAX_MANA, currentEnergy + 30),
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
      combat: {
        ...nextState.combat,
        playerCurrentHp: combatMaxHp,
      },
      stats: {
        ...nextState.stats,
        attack: (nextState.stats.attack ?? 0) + 2,
        defense: (nextState.stats.defense ?? 0) + 2,
        intelligence: (nextState.stats.intelligence ?? 0) + 2,
      },
      resources: {
        ...nextState.resources,
        energy: MAX_MANA,
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
        energy: MAX_MANA,
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
  const isPlacementTool =
    def.type === "tool" &&
    (def.id.includes("sprinkler") ||
      def.id.includes("harvester") ||
      def.id.includes("planter"));
  if (isPlacementTool) return state;

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
  return getUpgradeStatsDomain(state);
}

/**
 * Calculate stats contribution from pets
 */
export function getPetStats(state: GameState): Partial<Stats> {
  return getPetStatsWithStrengthMultiplier(state, 1);
}

function getPetStatsWithStrengthMultiplier(
  state: GameState,
  petStrengthMultiplier: number,
): Partial<Stats> {
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
    (stats[bonusType] ?? 0) +
    bonusAmount * petItem.level * 100 * petStrengthMultiplier;

  return stats;
}

function addStats(target: Partial<Stats>, source: Partial<Stats>): void {
  for (const [key, value] of Object.entries(source)) {
    if (typeof value !== "number") continue;
    const statKey = key as keyof Stats;
    target[statKey] = (target[statKey] ?? 0) + value;
  }
}

function getActiveClassNodeStatBonuses(state: GameState): Partial<Stats> {
  const activeClassId = state.character.activeClassId;
  if (!activeClassId) return {};

  const bonuses: Partial<Stats> = {};
  const addBonus = (key: keyof Stats, value: number): void => {
    if (!value) return;
    bonuses[key] = (bonuses[key] ?? 0) + value;
  };
  const rank = (nodeId: string): number =>
    getActiveClassNodeRank(state, nodeId);

  if (activeClassId === "berserker") {
    addBonus("attack", rank("berserker_1") * 3.5);
    addBonus("agility", rank("berserker_2") * 2.5);
    addBonus("defense", rank("berserker_3") * 2.2);
    addBonus("critChance", rank("berserker_4") * 1.4);
    addBonus("energyRegeneration", rank("berserker_5") * 3.8);
    addBonus("hp", rank("berserker_6") * 7.5);
    addBonus("attack", rank("berserker_7") * 3.2);
    addBonus("critChance", rank("berserker_8") * 1.2);
    addBonus("attack", rank("berserker_9") * 5.8);
    addBonus("attack", rank("berserker_10") * 3.6);
    addBonus("defense", rank("berserker_11") * 8.5);
    addBonus("hp", rank("berserker_11") * 12);
    addBonus("attack", rank("berserker_12") * 14);
    addBonus("hp", rank("berserker_12") * 20);
  }

  if (activeClassId === "sorceress") {
    addBonus("energyRegeneration", rank("sorceress_1") * 5.5);
    addBonus("intelligence", rank("sorceress_2") * 2.8);
    addBonus("intelligence", rank("sorceress_3") * 3.2);
    addBonus("defense", rank("sorceress_4") * 2.2);
    addBonus("attack", rank("sorceress_5") * 2.6);
    addBonus("critChance", rank("sorceress_6") * 1.6);
    addBonus("agility", rank("sorceress_7") * 2.4);
    addBonus("energyRegeneration", rank("sorceress_8") * 4.8);
    addBonus("intelligence", rank("sorceress_9") * 2.4);
    addBonus("critChance", rank("sorceress_10") * 2);
    addBonus("defense", rank("sorceress_11") * 8);
    addBonus("intelligence", rank("sorceress_12") * 14);
    addBonus("attack", rank("sorceress_12") * 6);
  }

  if (activeClassId === "farmer") {
    addBonus("hp", rank("farmer_1") * 8.5);
    addBonus("plantGrowth", rank("farmer_2") * 5.5);
    addBonus("defense", rank("farmer_3") * 2.8);
    addBonus("plantGrowth", rank("farmer_4") * 4.8);
    addBonus("energyRegeneration", rank("farmer_5") * 2.8);
    addBonus("goldIncome", rank("farmer_6") * 2.5);
    addBonus("hp", rank("farmer_7") * 10);
    addBonus("wateringDuration", rank("farmer_8") * 5.2);
    addBonus("plantGrowth", rank("farmer_9") * 3.5);
    addBonus("hp", rank("farmer_10") * 9.2);
    addBonus("plantGrowth", rank("farmer_11") * 8);
    addBonus("wateringDuration", rank("farmer_11") * 6);
    addBonus("goldIncome", rank("farmer_11") * 5);
    addBonus("attack", rank("farmer_12") * 8);
    addBonus("plantGrowth", rank("farmer_12") * 10);
  }

  if (activeClassId === "archer") {
    addBonus("agility", rank("archer_1") * 3);
    addBonus("attack", rank("archer_2") * 2.4);
    addBonus("attack", rank("archer_3") * 2.2);
    addBonus("agility", rank("archer_4") * 3);
    addBonus("critChance", rank("archer_5") * 1.6);
    addBonus("agility", rank("archer_6") * 2.4);
    addBonus("agility", rank("archer_7") * 2.4);
    addBonus("critChance", rank("archer_8") * 1.2);
    addBonus("attack", rank("archer_9") * 2.8);
    addBonus("attack", rank("archer_10") * 3.2);
    addBonus("agility", rank("archer_11") * 4.2);
    addBonus("attack", rank("archer_12") * 12);
    addBonus("critChance", rank("archer_12") * 4);
  }

  if (activeClassId === "idler") {
    addBonus("goldIncome", rank("idler_1") * 4.5);
    addBonus("goldIncome", rank("idler_2") * 4.8);
    addBonus("attack", rank("idler_3") * 2.4);
    addBonus("goldIncome", rank("idler_4") * 3.2);
    addBonus("energyRegeneration", rank("idler_5") * 4.2);
    addBonus("attack", rank("idler_6") * 2.6);
    addBonus("goldIncome", rank("idler_7") * 4.2);
    addBonus("energyRegeneration", rank("idler_8") * 3.6);
    addBonus("attack", rank("idler_9") * 2.4);
    addBonus("goldIncome", rank("idler_10") * 3.2);
    addBonus("defense", rank("idler_11") * 7.5);
    addBonus("goldIncome", rank("idler_12") * 10);
    addBonus("energyRegeneration", rank("idler_12") * 6);
  }

  if (activeClassId === "tamer") {
    addBonus("petStrength", rank("tamer_1") * 5.5);
    addBonus("agility", rank("tamer_2") * 2.8);
    addBonus("defense", rank("tamer_3") * 2.5);
    addBonus("critChance", rank("tamer_4") * 1.8);
    addBonus("attack", rank("tamer_5") * 2.8);
    addBonus("petStrength", rank("tamer_6") * 4.2);
    addBonus("agility", rank("tamer_7") * 2.6);
    addBonus("defense", rank("tamer_8") * 2.6);
    addBonus("petStrength", rank("tamer_9") * 4);
    addBonus("attack", rank("tamer_10") * 3.5);
    addBonus("hp", rank("tamer_11") * 10.5);
    addBonus("petStrength", rank("tamer_12") * 10);
    addBonus("attack", rank("tamer_12") * 8);
  }

  return bonuses;
}

export function getUniqueSetStats(state: GameState): Partial<Stats> {
  const setCategoryPieces = new Map<
    string,
    { weapon: boolean; armor: boolean; accessory: boolean; pet: boolean }
  >();

  const equippedUids = [
    state.equipment.weapon,
    state.equipment.armor,
    state.equipment.accessory1,
    state.equipment.accessory2,
    state.equipment.pet,
  ].filter((uid): uid is string => Boolean(uid));

  for (const uid of equippedUids) {
    const item = state.inventory.find((entry) => entry.uid === uid);
    if (!item) continue;

    const def = getItemDefSafe(item.itemId);
    if (!def?.setId || def.rarity !== "unique") continue;

    const setPieces = setCategoryPieces.get(def.setId) ?? {
      weapon: false,
      armor: false,
      accessory: false,
      pet: false,
    };

    if (def.type === "weapon") setPieces.weapon = true;
    if (def.type === "armor") setPieces.armor = true;
    if (def.type === "accessory") setPieces.accessory = true;
    if (def.type === "pet") setPieces.pet = true;

    setCategoryPieces.set(def.setId, {
      weapon: setPieces.weapon,
      armor: setPieces.armor,
      accessory: setPieces.accessory,
      pet: setPieces.pet,
    });
  }

  const result: Partial<Stats> = {};
  for (const [setId, pieces] of setCategoryPieces.entries()) {
    const setDef = uniqueSetDefinitions[setId];
    if (!setDef) continue;

    const pieceCount = [
      pieces.weapon,
      pieces.armor,
      pieces.accessory,
      pieces.pet,
    ].filter(Boolean).length;
    if (pieceCount >= 2) {
      addStats(result, setDef.twoPiece);
    }
    if (pieceCount >= 4) {
      addStats(result, setDef.fourPiece);
    }
  }

  return result;
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
  const setStats = getUniqueSetStats(state);
  const classNodeStats = getActiveClassNodeStatBonuses(state);

  const prePetStrength =
    (baseStats.petStrength ?? 0) +
    (equipmentStats.petStrength ?? 0) +
    (upgradeStats.petStrength ?? 0) +
    (setStats.petStrength ?? 0) +
    (classNodeStats.petStrength ?? 0);
  const petStrengthMultiplier = Math.max(0, 1 + prePetStrength / 100);
  const petStats = getPetStatsWithStrengthMultiplier(
    state,
    petStrengthMultiplier,
  );

  // Initialize base totals
  const total: Partial<Stats> = {
    attack:
      (baseStats.attack ?? 0) +
      (equipmentStats.attack ?? 0) +
      (upgradeStats.attack ?? 0) +
      (setStats.attack ?? 0) +
      (classNodeStats.attack ?? 0),
    hp:
      (baseStats.hp ?? 0) +
      (equipmentStats.hp ?? 0) +
      (upgradeStats.hp ?? 0) +
      (setStats.hp ?? 0) +
      (classNodeStats.hp ?? 0),
    agility:
      (baseStats.agility ?? 0) +
      (equipmentStats.agility ?? 0) +
      (upgradeStats.agility ?? 0) +
      (setStats.agility ?? 0) +
      (classNodeStats.agility ?? 0),
    critChance:
      (baseStats.critChance ?? 0) +
      (equipmentStats.critChance ?? 0) +
      (upgradeStats.critChance ?? 0) +
      (setStats.critChance ?? 0) +
      (classNodeStats.critChance ?? 0),
    defense:
      (baseStats.defense ?? 0) +
      (equipmentStats.defense ?? 0) +
      (upgradeStats.defense ?? 0) +
      (setStats.defense ?? 0) +
      (classNodeStats.defense ?? 0),
    intelligence:
      (baseStats.intelligence ?? 0) +
      (equipmentStats.intelligence ?? 0) +
      (upgradeStats.intelligence ?? 0) +
      (setStats.intelligence ?? 0) +
      (classNodeStats.intelligence ?? 0),
    gardening:
      (baseStats.gardening ?? 0) +
      (equipmentStats.gardening ?? 0) +
      (upgradeStats.gardening ?? 0) +
      (setStats.gardening ?? 0),
    // New stats - start with equipment/upgrade/pet percentages
    goldIncome:
      (upgradeStats.goldIncome ?? 0) +
      (setStats.goldIncome ?? 0) +
      (petStats.goldIncome ?? 0) +
      (classNodeStats.goldIncome ?? 0),
    energyRegeneration:
      (upgradeStats.energyRegeneration ?? 0) +
      (setStats.energyRegeneration ?? 0) +
      (petStats.energyRegeneration ?? 0) +
      (classNodeStats.energyRegeneration ?? 0),
    plantGrowth:
      (upgradeStats.plantGrowth ?? 0) +
      (setStats.plantGrowth ?? 0) +
      (petStats.plantGrowth ?? 0) +
      (classNodeStats.plantGrowth ?? 0),
    wateringDuration:
      (upgradeStats.wateringDuration ?? 0) +
      (setStats.wateringDuration ?? 0) +
      (petStats.wateringDuration ?? 0) +
      (classNodeStats.wateringDuration ?? 0),
    petStrength: prePetStrength,
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
