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
import { formatCompactNumber } from "../numberFormat";
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

export type FightConsumableSlots = [string | null, string | null];

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

export interface YAxisTick {
  value: number;
  label: string;
  y: number; // percentage from top (0-100)
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
  yAxisTicks: YAxisTick[];
  maxDpsValue: number;
}

export interface FightDpsSourceStatViewModel {
  label: string;
  value: number;
}

export interface FightDpsWindowOptionViewModel {
  windowMs: number;
  label: string;
  isSelected: boolean;
}

export interface FightDpsPanelViewModel {
  windowSeconds: number;
  toggleLabel: string;
  deltaTone: "positive" | "negative";
  hasDamageHistory: boolean;
  emptyMessage: string | null;
  sourceStats: FightDpsSourceStatViewModel[];
  windowOptions: FightDpsWindowOptionViewModel[];
}

export interface FightSpellActionViewModel {
  id: string;
  name: string;
  description: string;
  requiredLevel: number;
  manaCost: number;
  cooldownMs: number;
  canCast: boolean;
  cooldownLabel: string;
}

export interface FightSpellPathEntryViewModel {
  id: string;
  name: string;
  requiredLevel: number;
  isUnlocked: boolean;
}

export interface FightSpellPanelViewModel {
  isVisible: boolean;
  classLabel: string | null;
  showManageButton: boolean;
  unlockedSpellSlots: number;
  maxSpellSlots: number;
  emptyMessage: string | null;
  spellActions: FightSpellActionViewModel[];
  spellPath: FightSpellPathEntryViewModel[];
}

export interface FightConsumableSlotViewModel {
  slotIndex: 0 | 1;
  itemId: string | null;
  itemUid: string | null;
  icon: string;
  rarityTint: string;
  quantityLabel: string;
  cooldownLabel: string | null;
  isOnCooldown: boolean;
  title: string;
  isEmpty: boolean;
}

export interface FightConsumablesPanelViewModel {
  slots: FightConsumableSlotViewModel[];
}

export interface FightConsumableModalSlotViewModel {
  slotIndex: 0 | 1;
  label: string;
  isSelected: boolean;
}

export interface FightConsumableOptionViewModel {
  itemId: string;
  name: string;
  quantityLabel: string;
  icon: string;
  rarityTint: string;
  alreadyEquippedInOtherSlot: boolean;
}

export interface FightConsumableModalViewModel {
  slotTabs: FightConsumableModalSlotViewModel[];
  selectedSlot: 0 | 1;
  options: FightConsumableOptionViewModel[];
  isEmpty: boolean;
}

export interface FightEncounterSummaryViewModel {
  levelLabel: string;
  rewardsLabel: string;
}

export interface FightCombatLogEntryViewModel {
  id: string;
  text: string;
  color: string;
}

export interface FightCombatLogViewModel {
  isEmpty: boolean;
  emptyMessage: string | null;
  entries: FightCombatLogEntryViewModel[];
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
  const bucketCount = 24;
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

  // Generate 4-5 y-axis ticks evenly distributed
  const tickCount = 5;
  const tickInterval = maxValue / (tickCount - 1);
  const yAxisTicks: YAxisTick[] = Array.from({ length: tickCount }, (_, i) => {
    const value = tickInterval * i;
    return {
      value,
      label: formatCompactNumber(value, { minCompactValue: 1000 }),
      y: 100 - (value / maxValue) * 100,
    };
  });

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
    yAxisTicks,
    maxDpsValue: maxValue,
  };
}

export function selectFightSpellPanel(
  state: GameState,
  slottedSpells: CombatSpell[],
): FightSpellPanelViewModel {
  const spellsUnlocked = Boolean(state.playerProgress.unlockedSystems?.spells);
  const activeClassId = state.character.activeClassId;
  const unlockedSpellSlots = getSpellSlotsForLevel(state.playerProgress.level);
  const playerMana = Math.max(0, Math.min(100, state.resources.energy ?? 100));
  const spellCooldowns = state.combat.spellCooldowns ?? {};

  let emptyMessage: string | null = null;
  if (unlockedSpellSlots <= 0) {
    emptyMessage =
      "Spell slots unlock at level 10. Continue leveling to equip spells.";
  } else if (slottedSpells.length === 0) {
    emptyMessage =
      "No spells are slotted. Open Character and assign spells to slots.";
  }

  return {
    isVisible: spellsUnlocked,
    classLabel: activeClassId ? `(Class: ${activeClassId})` : null,
    showManageButton: Boolean(activeClassId) && unlockedSpellSlots > 0,
    unlockedSpellSlots,
    maxSpellSlots: 8,
    emptyMessage,
    spellActions: slottedSpells.map((spell) => {
      const cooldownMs = spellCooldowns[spell.id] ?? 0;
      const canCast = cooldownMs <= 0 && playerMana >= spell.manaCost;

      return {
        id: spell.id,
        name: spell.name,
        description: spell.description,
        requiredLevel: spell.requiredLevel,
        manaCost: spell.manaCost,
        cooldownMs,
        canCast,
        cooldownLabel:
          cooldownMs > 0
            ? `Cooldown ${formatRemainingMs(cooldownMs)}`
            : "Ready",
      };
    }),
    spellPath: getGeneralCombatSpellPath().map((spell) => ({
      id: spell.id,
      name: spell.name,
      requiredLevel: spell.requiredLevel,
      isUnlocked: state.playerProgress.level >= spell.requiredLevel,
    })),
  };
}

export function selectFightDpsPanel(
  metrics: FightDpsMetrics,
  dpsWindowMs: number,
  hasDamageHistory: boolean,
  isExpanded: boolean,
): FightDpsPanelViewModel {
  return {
    windowSeconds: dpsWindowMs / 1000,
    toggleLabel: isExpanded ? "Hide Graph" : "Show Graph",
    deltaTone: metrics.dpsDelta >= 0 ? "positive" : "negative",
    hasDamageHistory,
    emptyMessage: hasDamageHistory
      ? null
      : "No damage recorded yet. Start attacking to populate the meter.",
    sourceStats: [
      { label: "Auto DPS", value: metrics.currentAutoDps },
      { label: "Click DPS", value: metrics.currentClickDps },
      { label: "Spell DPS", value: metrics.currentSpellDps },
      { label: "Pet DPS", value: metrics.currentPetDps },
    ],
    windowOptions: [30_000, 60_000, 120_000, 300_000].map((windowMs) => {
      const seconds = windowMs / 1000;
      const label =
        seconds >= 60 ? `${Math.round(seconds / 60)}m` : `${seconds}s`;
      return {
        windowMs,
        label,
        isSelected: dpsWindowMs === windowMs,
      };
    }),
  };
}

export function selectFightConsumablesPanel(
  state: GameState,
  equippedConsumables: FightConsumableSlots,
): FightConsumablesPanelViewModel {
  const potionSummaries = selectPotionSummaries(state);
  const potionById = new Map(
    potionSummaries.map((summary) => [summary.itemId, summary]),
  );
  const consumableCooldowns = state.combat.consumableCooldowns ?? {};

  return {
    slots: [0, 1].map((slotIndex) => {
      const normalizedSlotIndex = slotIndex as 0 | 1;
      const selectedItemId = equippedConsumables[normalizedSlotIndex];
      const itemSummary = selectedItemId
        ? (potionById.get(selectedItemId) ?? null)
        : null;
      const cooldownMs = selectedItemId
        ? (consumableCooldowns[selectedItemId] ?? 0)
        : 0;
      const isOnCooldown = cooldownMs > 0;

      return {
        slotIndex: normalizedSlotIndex,
        itemId: selectedItemId,
        itemUid: itemSummary?.itemUid ?? null,
        icon: itemSummary ? getPotionIcon(itemSummary.itemId) : "+",
        rarityTint: itemSummary
          ? getRarityTint(itemSummary.rarity)
          : "rgba(120,140,160,0.35)",
        quantityLabel: itemSummary ? `x${itemSummary.quantity}` : "Empty",
        cooldownLabel: isOnCooldown ? formatRemainingMs(cooldownMs) : null,
        isOnCooldown,
        title: itemSummary
          ? `${itemSummary.name}${isOnCooldown ? ` (${formatRemainingMs(cooldownMs)})` : ""}`
          : `Select potion for slot ${normalizedSlotIndex + 1}`,
        isEmpty: !itemSummary,
      };
    }),
  };
}

export function selectFightConsumableModal(
  state: GameState,
  equippedConsumables: FightConsumableSlots,
  selectedSlot: 0 | 1,
): FightConsumableModalViewModel {
  const potionSummaries = selectPotionSummaries(state);

  return {
    slotTabs: [0, 1].map((slotIndex) => ({
      slotIndex: slotIndex as 0 | 1,
      label: `Slot ${slotIndex + 1}`,
      isSelected: selectedSlot === slotIndex,
    })),
    selectedSlot,
    options: potionSummaries.map((potion) => ({
      itemId: potion.itemId,
      name: potion.name,
      quantityLabel: `x${potion.quantity}`,
      icon: getPotionIcon(potion.itemId),
      rarityTint: getRarityTint(potion.rarity),
      alreadyEquippedInOtherSlot: equippedConsumables.some(
        (itemId, index) => itemId === potion.itemId && index !== selectedSlot,
      ),
    })),
    isEmpty: potionSummaries.length === 0,
  };
}

export function selectFightEncounterSummary(
  state: GameState,
): FightEncounterSummaryViewModel {
  const combat = state.combat;
  return {
    levelLabel: `Level ${combat.currentLevel} • Highest ${combat.highestLevelReached} • Next boss Lv ${nextBossLevel(combat.currentLevel)}`,
    rewardsLabel: `Enemy rewards: +${combat.enemy.goldReward} Gold, +${combat.enemy.gemsReward} Gems, +${combat.enemy.xpReward} XP`,
  };
}

export function selectFightCombatLog(
  entries: FightCombatLogEntryViewModel[],
): FightCombatLogViewModel {
  return {
    isEmpty: entries.length === 0,
    emptyMessage:
      entries.length === 0
        ? "Defeat enemies to generate loot and progression events."
        : null,
    entries,
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

function formatRemainingMs(remainingMs: number): string {
  const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(seconds / 60);
  const leftoverSeconds = seconds % 60;
  if (minutes <= 0) return `${leftoverSeconds}s`;
  return `${minutes}m ${leftoverSeconds}s`;
}

function getRarityTint(rarity: string): string {
  if (rarity === "unique") return "#ff9ad9";
  if (rarity === "legendary") return "#ffd36f";
  if (rarity === "epic") return "#8bc7ff";
  if (rarity === "rare") return "#7cf0c4";
  return "#d8e2ee";
}

function getPotionIcon(itemId: string): string {
  if (itemId === "health_potion") return "🧪";
  if (itemId === "mana_potion") return "🔷";
  if (itemId === "elixir") return "✨";
  if (itemId === "immortal_brew") return "☀️";
  if (itemId === "swift_tonic") return "⚡";
  if (itemId === "fortitude_brew") return "🛡️";
  if (itemId === "scholars_draught") return "📘";
  if (itemId === "berserkers_tonic") return "🔥";
  if (itemId === "chaos_potion") return "🌌";
  return "🧴";
}

function nextBossLevel(currentLevel: number): number {
  return Math.ceil(currentLevel / 5) * 5;
}
