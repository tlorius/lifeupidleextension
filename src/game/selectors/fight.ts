import {
  getAvailableCombatSpellsForState,
  getGeneralCombatSpellPath,
  getPlayerAttacksPerSecond,
  getPlayerCritChance,
} from "../combat";
import { getSpellSlotsForLevel } from "../classes";
import { getTotalStats } from "../engine";
import { getItemDefSafe } from "../items";
import { getXpForNextLevel } from "../progression";
import type { GameState } from "../types";

export interface DamagePoint {
  timestamp: number;
  damage: number;
  source: "auto" | "click" | "spell" | "pet";
}

export interface ConsumableSummary {
  itemId: string;
  itemUid: string;
  name: string;
  quantity: number;
  rarity: string;
}

type CombatSpell = ReturnType<typeof getAvailableCombatSpellsForState>[number];

export interface FightViewModel {
  totalStats: ReturnType<typeof getTotalStats>;
  playerMaxHp: number;
  playerHpPercent: number;
  playerMana: number;
  enemyHpPercent: number;
  attacksPerSecond: number;
  critChance: number;
  xpForNextLevel: number;
  xpProgressPercent: number;
  combatTitle: string;
  unlockedSpellSlots: number;
  activeClassId: GameState["character"]["activeClassId"];
  slottedSpells: CombatSpell[];
  potionSummaries: ConsumableSummary[];
  generalSpellPath: ReturnType<typeof getGeneralCombatSpellPath>;
  manaRegenPerSecond: number;
  checkpointLevel: number;
}

export interface FightDpsMetrics {
  currentDps: number;
  previousDps: number;
  currentAutoDps: number;
  currentClickDps: number;
  currentSpellDps: number;
  currentPetDps: number;
  dpsDelta: number;
  dpsDeltaPercent: number;
  dpsGraphPoints: string;
}

export function selectFightView(state: GameState): FightViewModel {
  const combat = state.combat;
  const totalStats = getTotalStats(state);
  const playerMaxHp = Math.max(
    1,
    Math.round(totalStats.hp ?? state.stats.hp ?? 1),
  );
  const playerHpPercent = Math.max(
    0,
    Math.min(100, (combat.playerCurrentHp / playerMaxHp) * 100),
  );
  const playerMana = Math.max(0, Math.min(100, state.resources.energy ?? 100));
  const enemyHpPercent = Math.max(
    0,
    Math.min(
      100,
      (combat.enemy.currentHp / Math.max(1, combat.enemy.maxHp)) * 100,
    ),
  );

  const attacksPerSecond = getPlayerAttacksPerSecond(state);
  const critChance = getPlayerCritChance(state);
  const xpForNextLevel = getXpForNextLevel(state.playerProgress.level || 1);
  const xpProgressPercent =
    Number.isFinite(xpForNextLevel) && xpForNextLevel > 0
      ? Math.max(
          0,
          Math.min(
            100,
            ((state.playerProgress?.xp ?? 0) / xpForNextLevel) * 100,
          ),
        )
      : 100;

  const unlockedSpellSlots = getSpellSlotsForLevel(state.playerProgress.level);
  const availableSpells = getAvailableCombatSpellsForState(state);
  const activeClassId = state.character.activeClassId;
  const slottedSpells = selectSlottedSpells(
    state,
    activeClassId,
    unlockedSpellSlots,
    availableSpells,
  );

  return {
    totalStats,
    playerMaxHp,
    playerHpPercent,
    playerMana,
    enemyHpPercent,
    attacksPerSecond,
    critChance,
    xpForNextLevel,
    xpProgressPercent,
    combatTitle: `${combat.enemy.name} (Lv ${combat.enemy.level})`,
    unlockedSpellSlots,
    activeClassId,
    slottedSpells,
    potionSummaries: selectPotionSummaries(state),
    generalSpellPath: getGeneralCombatSpellPath(),
    manaRegenPerSecond: 2 * (1 + (totalStats.energyRegeneration ?? 0) / 100),
    checkpointLevel: Math.max(1, combat.lastBossCheckpointLevel || 1),
  };
}

export function selectFightDpsMetrics(
  damageHistory: DamagePoint[],
  clockNow: number,
  dpsWindowMs: number,
): FightDpsMetrics {
  const bucketCount = 12;
  const bucketWidthMs = dpsWindowMs / bucketCount;
  const start = clockNow - dpsWindowMs;
  const dpsBuckets = Array.from({ length: bucketCount }, () => 0);

  for (const point of damageHistory) {
    if (point.timestamp < start || point.timestamp > clockNow) continue;
    const offset = point.timestamp - start;
    const index = Math.min(
      bucketCount - 1,
      Math.max(0, Math.floor(offset / bucketWidthMs)),
    );
    dpsBuckets[index] += point.damage;
  }

  const normalizedBuckets = dpsBuckets.map(
    (value) => value / (bucketWidthMs / 1000),
  );

  const currentDps = getWindowDps(
    damageHistory,
    clockNow - dpsWindowMs,
    clockNow,
  );
  const previousDps = getWindowDps(
    damageHistory,
    clockNow - dpsWindowMs * 2,
    clockNow - dpsWindowMs,
  );
  const currentAutoDps = getSourceDps(
    damageHistory,
    "auto",
    clockNow - dpsWindowMs,
    clockNow,
  );
  const currentClickDps = getSourceDps(
    damageHistory,
    "click",
    clockNow - dpsWindowMs,
    clockNow,
  );
  const currentSpellDps = getSourceDps(
    damageHistory,
    "spell",
    clockNow - dpsWindowMs,
    clockNow,
  );
  const currentPetDps = getSourceDps(
    damageHistory,
    "pet",
    clockNow - dpsWindowMs,
    clockNow,
  );

  const dpsDelta = currentDps - previousDps;
  const dpsDeltaPercent =
    previousDps > 0 ? (dpsDelta / previousDps) * 100 : currentDps > 0 ? 100 : 0;
  const maxValue = Math.max(1, ...normalizedBuckets);
  const dpsGraphPoints = normalizedBuckets
    .map((value, index) => {
      const x = (index / Math.max(1, normalizedBuckets.length - 1)) * 100;
      const y = 100 - (value / maxValue) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return {
    currentDps,
    previousDps,
    currentAutoDps,
    currentClickDps,
    currentSpellDps,
    currentPetDps,
    dpsDelta,
    dpsDeltaPercent,
    dpsGraphPoints,
  };
}

function selectSlottedSpells(
  state: GameState,
  activeClassId: GameState["character"]["activeClassId"],
  unlockedSpellSlots: number,
  availableSpells: CombatSpell[],
): CombatSpell[] {
  if (!state.playerProgress.unlockedSystems?.spells) return [];
  if (unlockedSpellSlots <= 0) return [];

  if (!activeClassId) {
    return availableSpells.slice(0, unlockedSpellSlots);
  }

  const selectedIds =
    state.character.classProgress[activeClassId]?.selectedSpellIds.slice(
      0,
      unlockedSpellSlots,
    ) ?? [];
  const uniqueIds = new Set<string>();
  const result: CombatSpell[] = [];

  for (const spellId of selectedIds) {
    if (!spellId || uniqueIds.has(spellId)) continue;
    const spell = availableSpells.find((entry) => entry.id === spellId);
    if (!spell) continue;
    uniqueIds.add(spell.id);
    result.push(spell);
  }

  return result;
}

function selectPotionSummaries(state: GameState): ConsumableSummary[] {
  const grouped = new Map<string, ConsumableSummary>();

  for (const item of state.inventory) {
    const itemDef = getItemDefSafe(item.itemId);
    if (!itemDef || itemDef.type !== "potion") continue;

    const existing = grouped.get(item.itemId);
    if (existing) {
      existing.quantity += item.quantity ?? 1;
      continue;
    }

    grouped.set(item.itemId, {
      itemId: item.itemId,
      itemUid: item.uid,
      name: itemDef.name,
      quantity: item.quantity ?? 1,
      rarity: itemDef.rarity,
    });
  }

  return Array.from(grouped.values()).sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}

function getWindowDps(
  damageHistory: DamagePoint[],
  start: number,
  end: number,
): number {
  const totalDamage = damageHistory.reduce((sum, point) => {
    return point.timestamp >= start && point.timestamp < end
      ? sum + point.damage
      : sum;
  }, 0);
  return totalDamage / Math.max(1, (end - start) / 1000);
}

function getSourceDps(
  damageHistory: DamagePoint[],
  source: DamagePoint["source"],
  start: number,
  end: number,
): number {
  const totalDamage = damageHistory.reduce((sum, point) => {
    return point.source === source &&
      point.timestamp >= start &&
      point.timestamp < end
      ? sum + point.damage
      : sum;
  }, 0);
  return totalDamage / Math.max(1, (end - start) / 1000);
}
