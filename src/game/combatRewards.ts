import {
  COMBAT_CHASE_DROP_CONFIG,
  COMBAT_LOOT_TABLES,
  type CombatLootEntry,
} from "./combatConfig";
import { addItem } from "./engine";
import { getItemDefSafe } from "./items";
import { grantPlayerXp } from "./progression";
import type { GameState } from "./types";
import type {
  CombatEnemyInstance,
  CombatEvent,
  CombatRng,
  CombatRuntimeState,
} from "./combat";

export interface CombatLootDrop {
  itemId: string;
  quantity: number;
  itemLevel?: number;
}

interface ApplyEnemyRewardOptions {
  createEnemyInstance: (level: number) => CombatEnemyInstance;
  getPlayerMaxHp: (state: GameState) => number;
  xpRewardMultiplier: number;
}

function pickWeightedEntry(
  entries: CombatLootEntry[],
  rng: CombatRng,
): CombatLootEntry | null {
  const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
  if (totalWeight <= 0) return null;

  const roll = rng() * totalWeight;
  let cursor = 0;
  for (const entry of entries) {
    cursor += entry.weight;
    if (roll <= cursor) return entry;
  }

  return entries[entries.length - 1] ?? null;
}

function rollQuantity(entry: CombatLootEntry, rng: CombatRng): number {
  const min = Math.max(1, Math.floor(entry.quantityMin ?? 1));
  const max = Math.max(min, Math.floor(entry.quantityMax ?? min));
  if (min === max) return min;

  return min + Math.floor(rng() * (max - min + 1));
}

function isEquipmentItem(itemId: string): boolean {
  const itemDef = getItemDefSafe(itemId);
  return (
    itemDef?.type === "weapon" ||
    itemDef?.type === "armor" ||
    itemDef?.type === "accessory"
  );
}

function getBossEquipmentItemLevel(enemy: CombatEnemyInstance): number {
  const tierBonus = Math.max(1, Math.floor(enemy.level / 5));
  return 1 + tierBonus;
}

function applyLootDrops(state: GameState, drops: CombatLootDrop[]): GameState {
  let next = state;
  for (const drop of drops) {
    next = addItem(next, drop.itemId, drop.quantity, drop.itemLevel ?? 1);
  }
  return next;
}

export function resolveBossLootDrops(
  enemy: CombatEnemyInstance,
  rng: CombatRng = Math.random,
): CombatLootDrop[] {
  if (enemy.kind !== "boss") return [];

  const drops: CombatLootDrop[] = [];
  const lootTableId = enemy.lootTableId;
  if (lootTableId) {
    const table = COMBAT_LOOT_TABLES[lootTableId];
    if (table) {
      for (const guaranteedEntry of table.guaranteed ?? []) {
        drops.push({
          itemId: guaranteedEntry.itemId,
          quantity: rollQuantity(guaranteedEntry, rng),
        });
      }

      const equipmentPool = table.weighted.filter((entry) =>
        isEquipmentItem(entry.itemId),
      );
      const guaranteedEquipment = pickWeightedEntry(equipmentPool, rng);
      if (guaranteedEquipment) {
        drops.push({
          itemId: guaranteedEquipment.itemId,
          quantity: 1,
          itemLevel: getBossEquipmentItemLevel(enemy),
        });
      }

      const weightedRolls = Math.max(1, Math.floor(table.weightedRolls ?? 1));
      for (let rollIndex = 0; rollIndex < weightedRolls; rollIndex += 1) {
        const weightedEntry = pickWeightedEntry(table.weighted, rng);
        if (!weightedEntry) continue;

        drops.push({
          itemId: weightedEntry.itemId,
          quantity: rollQuantity(weightedEntry, rng),
          itemLevel: isEquipmentItem(weightedEntry.itemId)
            ? getBossEquipmentItemLevel(enemy)
            : undefined,
        });
      }
    }
  }

  if (
    enemy.level >= COMBAT_CHASE_DROP_CONFIG.unlocksAtLevel &&
    rng() < COMBAT_CHASE_DROP_CONFIG.chance
  ) {
    const chaseTable = COMBAT_LOOT_TABLES[COMBAT_CHASE_DROP_CONFIG.lootTableId];
    const chaseEntry = chaseTable
      ? pickWeightedEntry(chaseTable.weighted, rng)
      : null;
    if (chaseEntry) {
      drops.push({
        itemId: chaseEntry.itemId,
        quantity: rollQuantity(chaseEntry, rng),
        itemLevel: isEquipmentItem(chaseEntry.itemId)
          ? getBossEquipmentItemLevel(enemy) + 1
          : undefined,
      });
    }
  }

  return drops;
}

export function applyEnemyReward(
  runtime: CombatRuntimeState,
  state: GameState,
  rng: CombatRng,
  options: ApplyEnemyRewardOptions,
): { runtime: CombatRuntimeState; state: GameState; events: CombatEvent[] } {
  const events: CombatEvent[] = [
    {
      type: "enemyDefeated",
      value: runtime.currentLevel,
    },
  ];

  let nextState: GameState = {
    ...state,
    resources: {
      ...state.resources,
      gold: state.resources.gold + runtime.enemy.goldReward,
      gems: (state.resources.gems ?? 0) + runtime.enemy.gemsReward,
    },
  };

  const preRewardHp = state.stats.hp ?? 1;
  const preRewardLevel = state.playerProgress.level;
  const hadSpellsUnlocked = Boolean(
    state.playerProgress.unlockedSystems?.spells,
  );
  const scaledXpReward = Math.max(
    1,
    Math.round(runtime.enemy.xpReward * options.xpRewardMultiplier),
  );
  nextState = grantPlayerXp(nextState, scaledXpReward);
  const postRewardHp = nextState.stats.hp ?? preRewardHp;
  const postRewardLevel = nextState.playerProgress.level;
  const hasSpellsUnlocked = Boolean(
    nextState.playerProgress.unlockedSystems?.spells,
  );
  const hpDelta = Math.max(0, postRewardHp - preRewardHp);

  if (postRewardLevel > preRewardLevel) {
    events.push({
      type: "levelUp",
      value: postRewardLevel,
    });
  }

  if (!hadSpellsUnlocked && hasSpellsUnlocked) {
    events.push({
      type: "systemUnlocked",
      systemId: "spells",
    });
  }

  const lootDrops = resolveBossLootDrops(runtime.enemy, rng);
  if (lootDrops.length > 0) {
    nextState = applyLootDrops(nextState, lootDrops);
    for (const drop of lootDrops) {
      events.push({
        type: "lootGranted",
        itemId: drop.itemId,
        quantity: drop.quantity,
        itemLevel: drop.itemLevel,
      });
    }
  }

  const nextLevel = runtime.currentLevel + 1;
  const checkpointLevel =
    runtime.enemy.kind === "boss"
      ? Math.max(runtime.lastBossCheckpointLevel, nextLevel)
      : runtime.lastBossCheckpointLevel;
  const maxHp = options.getPlayerMaxHp(nextState);

  const nextRuntime: CombatRuntimeState = {
    ...runtime,
    currentLevel: nextLevel,
    highestLevelReached: Math.max(runtime.highestLevelReached, nextLevel),
    lastBossCheckpointLevel: checkpointLevel,
    playerCurrentHp: Math.min(maxHp, runtime.playerCurrentHp + hpDelta),
    enemy: options.createEnemyInstance(nextLevel),
    playerAttackRemainderMs: 0,
    enemyAttackRemainderMs: 0,
  };

  return {
    runtime: nextRuntime,
    state: nextState,
    events,
  };
}
