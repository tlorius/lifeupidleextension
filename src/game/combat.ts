import {
  COMBAT_CHASE_DROP_CONFIG,
  COMBAT_LEVELS,
  COMBAT_LOOT_TABLES,
  COMBAT_PLAYER_CONFIG,
  COMBAT_PROGRESS_CONFIG,
  type CombatEncounterKind,
  type CombatLevelConfig,
  type CombatLootEntry,
} from "./combatConfig";
import {
  classDefinitions,
  getActiveClassNodeRank,
  type ClassId,
} from "./classes";
import { addItem, getTotalStats, usePotion } from "./engine";
import { getItemDefSafe } from "./items";
import { grantPlayerXp } from "./progression";
import type { GameState } from "./types";

export type CombatRng = () => number;
export type CombatAttackSource = "auto" | "click" | "spell" | "pet";

export interface CombatSpellDefinition {
  id: string;
  name: string;
  description: string;
  manaCost: number;
  cooldownMs: number;
  requiredLevel: number;
  source: "general" | "class";
  classId?: ClassId;
}

const GENERAL_COMBAT_SPELL_DEFINITIONS: CombatSpellDefinition[] = [
  {
    id: "arcane_bolt",
    name: "Arcane Bolt",
    description:
      "Fire a focused bolt that scales with attack and intelligence.",
    manaCost: 25,
    cooldownMs: 6000,
    requiredLevel: 8,
    source: "general",
  },
  {
    id: "second_wind",
    name: "Second Wind",
    description: "Restore a chunk of combat HP using mana.",
    manaCost: 35,
    cooldownMs: 12000,
    requiredLevel: 10,
    source: "general",
  },
  {
    id: "mana_surge",
    name: "Mana Surge",
    description: "Replenish mana to sustain longer spell chains.",
    manaCost: 18,
    cooldownMs: 14000,
    requiredLevel: 14,
    source: "general",
  },
  {
    id: "ember_lance",
    name: "Ember Lance",
    description: "Launch a burning lance that scales with intelligence.",
    manaCost: 30,
    cooldownMs: 9000,
    requiredLevel: 18,
    source: "general",
  },
] as const;

export const COMBAT_SPELL_DEFINITIONS: CombatSpellDefinition[] =
  GENERAL_COMBAT_SPELL_DEFINITIONS;

const CLASS_COMBAT_SPELL_DEFINITIONS: CombatSpellDefinition[] = Object.values(
  classDefinitions,
).flatMap((classDef) =>
  classDef.classSpells.map((spell) => ({
    id: spell.id,
    name: spell.name,
    description: spell.description,
    manaCost: spell.manaCost,
    cooldownMs: spell.cooldownMs,
    requiredLevel: spell.requiredLevel,
    source: "class" as const,
    classId: classDef.id,
  })),
);

const ALL_COMBAT_SPELL_DEFINITIONS: CombatSpellDefinition[] = [
  ...GENERAL_COMBAT_SPELL_DEFINITIONS,
  ...CLASS_COMBAT_SPELL_DEFINITIONS,
];

const COMBAT_CONSUMABLE_COOLDOWNS_MS: Record<string, number> = {
  health_potion: 12000,
  mana_potion: 18000,
  elixir: 25000,
  immortal_brew: 45000,
  swift_tonic: 18000,
  fortitude_brew: 20000,
  scholars_draught: 22000,
  berserkers_tonic: 18000,
  chaos_potion: 30000,
};

export interface CombatEnemyInstance {
  level: number;
  enemyId: string;
  name: string;
  kind: CombatEncounterKind;
  maxHp: number;
  currentHp: number;
  damage: number;
  attacksPerSecond: number;
  goldReward: number;
  gemsReward: number;
  xpReward: number;
  lootTableId?: string;
}

export interface CombatRuntimeState {
  currentLevel: number;
  highestLevelReached: number;
  lastBossCheckpointLevel: number;
  playerCurrentHp: number;
  enemy: CombatEnemyInstance;
  playerAttackRemainderMs: number;
  enemyAttackRemainderMs: number;
  spellCooldowns?: Record<string, number>;
  consumableCooldowns?: Record<string, number>;
}

export interface CombatEvent {
  type:
    | "playerHit"
    | "enemyHit"
    | "enemyDefeated"
    | "playerDefeated"
    | "lootGranted"
    | "levelUp"
    | "systemUnlocked"
    | "spellCast"
    | "consumableUsed";
  value?: number;
  isCrit?: boolean;
  itemId?: string;
  quantity?: number;
  itemLevel?: number;
  systemId?: string;
  spellId?: string;
  attackSource?: CombatAttackSource;
}

export interface CombatTickResult {
  runtime: CombatRuntimeState;
  state: GameState;
  events: CombatEvent[];
}

export interface CombatOfflineResult {
  runtime: CombatRuntimeState;
  state: GameState;
  levelsCleared: number;
  defeatedByEnemy: boolean;
  itemsGained: number;
}

interface CombatLootDrop {
  itemId: string;
  quantity: number;
  itemLevel?: number;
}

const CRIT_DAMAGE_MULTIPLIER = 3.8;
const CLICK_CRIT_BONUS_MULTIPLIER = 1.25;
const NORMAL_HIT_VARIANCE_MIN = 0.92;
const NORMAL_HIT_VARIANCE_MAX = 1.08;
const CRIT_VARIANCE_MIN = 1.02;
const CRIT_VARIANCE_MAX = 1.34;
const NON_CRIT_SET_CRIT_CHANCE_CAP = 6;
const MIN_DAMAGE_PORTION_AFTER_DEFENSE = 0.05;
const MAX_COMBAT_ACTIONS_PER_TICK = 5000;
const COMBAT_XP_REWARD_MULTIPLIER = 0.6;

interface ActiveClassCombatModifiers {
  damageMultiplier: number;
  clickDamageMultiplier: number;
  spellDamageMultiplier: number;
  petDamageMultiplier: number;
  apsFlat: number;
  apsMultiplier: number;
  apsCapBonus: number;
  critChanceBonus: number;
  incomingDamageMultiplier: number;
  spellCooldownMultiplier: number;
  spellManaCostMultiplier: number;
  lifeStealPercent: number;
  manaOnHit: number;
  petProcChance: number;
  petProcDamageMultiplier: number;
  lethalSaveChance: number;
  lethalSaveHpRatio: number;
  healMultiplier: number;
  manaRestoreMultiplier: number;
}

function getActiveClassCombatModifiers(
  state: GameState,
): ActiveClassCombatModifiers {
  const activeClassId = state.character.activeClassId;
  const modifiers: ActiveClassCombatModifiers = {
    damageMultiplier: 1,
    clickDamageMultiplier: 1,
    spellDamageMultiplier: 1,
    petDamageMultiplier: 1,
    apsFlat: 0,
    apsMultiplier: 1,
    apsCapBonus: 0,
    critChanceBonus: 0,
    incomingDamageMultiplier: 1,
    spellCooldownMultiplier: 1,
    spellManaCostMultiplier: 1,
    lifeStealPercent: 0,
    manaOnHit: 0,
    petProcChance: 0,
    petProcDamageMultiplier: 0,
    lethalSaveChance: 0,
    lethalSaveHpRatio: 0.18,
    healMultiplier: 1,
    manaRestoreMultiplier: 1,
  };

  if (!activeClassId) {
    return modifiers;
  }

  const rank = (nodeId: string): number =>
    getActiveClassNodeRank(state, nodeId);

  if (activeClassId === "berserker") {
    modifiers.damageMultiplier += rank("berserker_1") * 0.035;
    modifiers.clickDamageMultiplier += rank("berserker_2") * 0.03;
    modifiers.incomingDamageMultiplier *= 1 - rank("berserker_3") * 0.02;
    modifiers.critChanceBonus += rank("berserker_4") * 1.25;
    modifiers.manaOnHit += rank("berserker_5") * 0.9;
    modifiers.lifeStealPercent += rank("berserker_6") * 0.9;
    modifiers.spellDamageMultiplier += rank("berserker_7") * 0.06;
    modifiers.damageMultiplier += rank("berserker_8") * 0.02;
    modifiers.damageMultiplier += rank("berserker_9") * 0.04;
    modifiers.damageMultiplier += rank("berserker_10") * 0.03;
    modifiers.lethalSaveChance += rank("berserker_11") > 0 ? 0.35 : 0;
    modifiers.damageMultiplier += rank("berserker_12") > 0 ? 0.2 : 0;
  }

  if (activeClassId === "sorceress") {
    modifiers.spellManaCostMultiplier *= 1 - rank("sorceress_1") * 0.025;
    modifiers.spellCooldownMultiplier *= 1 - rank("sorceress_2") * 0.03;
    modifiers.spellDamageMultiplier += rank("sorceress_3") * 0.05;
    modifiers.healMultiplier += rank("sorceress_4") * 0.03;
    modifiers.spellDamageMultiplier += rank("sorceress_5") * 0.045;
    modifiers.critChanceBonus += rank("sorceress_6") * 1.5;
    modifiers.apsMultiplier += rank("sorceress_7") * 0.025;
    modifiers.manaRestoreMultiplier += rank("sorceress_8") * 0.05;
    modifiers.spellDamageMultiplier += rank("sorceress_9") * 0.04;
    modifiers.spellDamageMultiplier += rank("sorceress_10") * 0.06;
    modifiers.lethalSaveChance += rank("sorceress_11") > 0 ? 0.28 : 0;
    modifiers.spellDamageMultiplier += rank("sorceress_12") > 0 ? 0.22 : 0;
  }

  if (activeClassId === "farmer") {
    modifiers.healMultiplier += rank("farmer_1") * 0.05;
    modifiers.incomingDamageMultiplier *= 1 - rank("farmer_3") * 0.018;
    modifiers.healMultiplier += rank("farmer_5") * 0.05;
    modifiers.manaRestoreMultiplier += rank("farmer_6") * 0.025;
    modifiers.incomingDamageMultiplier *= 1 - rank("farmer_7") * 0.015;
    modifiers.damageMultiplier += rank("farmer_8") * 0.02;
    modifiers.healMultiplier += rank("farmer_10") * 0.06;
    modifiers.healMultiplier += rank("farmer_11") > 0 ? 0.12 : 0;
    modifiers.damageMultiplier += rank("farmer_12") > 0 ? 0.14 : 0;
  }

  if (activeClassId === "archer") {
    modifiers.apsFlat += rank("archer_1") * 0.22;
    modifiers.damageMultiplier += rank("archer_2") * 0.02;
    modifiers.clickDamageMultiplier += rank("archer_3") * 0.035;
    modifiers.apsFlat += rank("archer_4") * 0.34;
    modifiers.critChanceBonus += rank("archer_5") * 1.6;
    modifiers.apsMultiplier += rank("archer_6") * 0.08;
    modifiers.apsMultiplier += rank("archer_7") * 0.03;
    modifiers.critChanceBonus += rank("archer_8") * 1;
    modifiers.damageMultiplier += rank("archer_9") * 0.015;
    modifiers.petProcChance += rank("archer_10") * 0.02;
    modifiers.apsMultiplier += rank("archer_11") > 0 ? 0.06 : 0;
    modifiers.apsCapBonus += rank("archer_6") * 2 + rank("archer_12") * 20;
    modifiers.damageMultiplier += rank("archer_12") > 0 ? 0.16 : 0;
  }

  if (activeClassId === "idler") {
    modifiers.manaRestoreMultiplier += rank("idler_5") * 0.06;
    modifiers.damageMultiplier += rank("idler_6") * 0.02;
    modifiers.damageMultiplier += rank("idler_9") * 0.02;
    modifiers.spellCooldownMultiplier *= 1 - rank("idler_10") * 0.02;
    modifiers.incomingDamageMultiplier *= 1 - rank("idler_11") * 0.04;
    modifiers.damageMultiplier += rank("idler_12") > 0 ? 0.08 : 0;
  }

  if (activeClassId === "tamer") {
    modifiers.petDamageMultiplier += rank("tamer_1") * 0.07;
    modifiers.petProcChance += rank("tamer_2") * 0.03;
    modifiers.incomingDamageMultiplier *= 1 - rank("tamer_3") * 0.02;
    modifiers.critChanceBonus += rank("tamer_4") * 1.4;
    modifiers.damageMultiplier += rank("tamer_5") * 0.03;
    modifiers.petProcDamageMultiplier += rank("tamer_6") * 0.08;
    modifiers.petDamageMultiplier += rank("tamer_7") * 0.045;
    modifiers.incomingDamageMultiplier *= 1 - rank("tamer_8") * 0.025;
    modifiers.petDamageMultiplier += rank("tamer_9") * 0.06;
    modifiers.petProcChance += rank("tamer_10") * 0.03;
    modifiers.lethalSaveChance += rank("tamer_11") > 0 ? 0.32 : 0;
    modifiers.petDamageMultiplier += rank("tamer_12") > 0 ? 0.2 : 0;
  }

  modifiers.incomingDamageMultiplier = Math.max(
    0.4,
    modifiers.incomingDamageMultiplier,
  );
  modifiers.spellCooldownMultiplier = Math.max(
    0.55,
    modifiers.spellCooldownMultiplier,
  );
  modifiers.spellManaCostMultiplier = Math.max(
    0.55,
    modifiers.spellManaCostMultiplier,
  );
  return modifiers;
}

function clampPercent(input: number): number {
  return Math.min(100, Math.max(0, input));
}

function tickCooldownMap(
  cooldowns: Record<string, number> | undefined,
  deltaMs: number,
): Record<string, number> {
  const next: Record<string, number> = {};
  for (const [key, value] of Object.entries(cooldowns ?? {})) {
    const remaining = Math.max(0, value - deltaMs);
    if (remaining > 0) {
      next[key] = remaining;
    }
  }
  return next;
}

function reduceCombatCooldowns(
  runtime: CombatRuntimeState,
  deltaMs: number,
): CombatRuntimeState {
  if (deltaMs <= 0) return runtime;

  return {
    ...runtime,
    spellCooldowns: tickCooldownMap(runtime.spellCooldowns, deltaMs),
    consumableCooldowns: tickCooldownMap(runtime.consumableCooldowns, deltaMs),
  };
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

export function getCombatConsumableCooldownMs(itemId: string): number {
  return COMBAT_CONSUMABLE_COOLDOWNS_MS[itemId] ?? 0;
}

export function getCombatSpellDefinition(
  spellId: string,
): CombatSpellDefinition | null {
  return (
    ALL_COMBAT_SPELL_DEFINITIONS.find((spell) => spell.id === spellId) ?? null
  );
}

export function getGeneralCombatSpellPath(): CombatSpellDefinition[] {
  return [...GENERAL_COMBAT_SPELL_DEFINITIONS].sort(
    (left, right) => left.requiredLevel - right.requiredLevel,
  );
}

export function getAvailableGeneralCombatSpells(
  level: number,
): CombatSpellDefinition[] {
  return GENERAL_COMBAT_SPELL_DEFINITIONS.filter(
    (spell) => level >= spell.requiredLevel,
  );
}

export function getClassCombatSpellsForClass(
  classId: ClassId,
): CombatSpellDefinition[] {
  return CLASS_COMBAT_SPELL_DEFINITIONS.filter(
    (spell) => spell.classId === classId,
  );
}

export function getAvailableCombatSpellsForState(
  state: GameState,
): CombatSpellDefinition[] {
  if (!state.playerProgress.unlockedSystems?.spells) return [];

  const level = state.playerProgress.level;
  const general = getAvailableGeneralCombatSpells(level);
  const activeClassId = state.character.activeClassId;
  if (!activeClassId) return general;

  const classSpells = getClassCombatSpellsForClass(activeClassId).filter(
    (spell) => level >= spell.requiredLevel,
  );
  return [...general, ...classSpells];
}

function applyLootDrops(state: GameState, drops: CombatLootDrop[]): GameState {
  let next = state;
  for (const drop of drops) {
    next = addItem(next, drop.itemId, drop.quantity, drop.itemLevel ?? 1);
  }
  return next;
}

function applyEnemyReward(
  runtime: CombatRuntimeState,
  state: GameState,
  rng: CombatRng,
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
    Math.round(runtime.enemy.xpReward * COMBAT_XP_REWARD_MULTIPLIER),
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
  const maxHp = getPlayerMaxHp(nextState);

  const nextRuntime: CombatRuntimeState = {
    ...runtime,
    currentLevel: nextLevel,
    highestLevelReached: Math.max(runtime.highestLevelReached, nextLevel),
    lastBossCheckpointLevel: checkpointLevel,
    playerCurrentHp: Math.min(maxHp, runtime.playerCurrentHp + hpDelta),
    enemy: createEnemyInstance(nextLevel),
    playerAttackRemainderMs: 0,
    enemyAttackRemainderMs: 0,
  };

  return {
    runtime: nextRuntime,
    state: nextState,
    events,
  };
}

function fallbackCombatLevelConfig(level: number): CombatLevelConfig {
  const highestDefined = COMBAT_LEVELS[COMBAT_LEVELS.length - 1];
  const levelDelta = Math.max(0, level - highestDefined.level);
  const majorFrom = Math.floor(
    (highestDefined.level - 1) /
      COMBAT_PROGRESS_CONFIG.majorDifficultySpikeIntervalLevels,
  );
  const majorTo = Math.floor(
    (level - 1) / COMBAT_PROGRESS_CONFIG.majorDifficultySpikeIntervalLevels,
  );
  const majorSteps = Math.max(0, majorTo - majorFrom);
  const isBoss = level % COMBAT_PROGRESS_CONFIG.bossIntervalLevels === 0;

  const hp = Math.round(
    highestDefined.hp * Math.pow(1.11, levelDelta) * Math.pow(1.35, majorSteps),
  );
  const damage = Math.round(
    highestDefined.damage *
      Math.pow(1.07, levelDelta) *
      Math.pow(1.3, majorSteps),
  );
  const aps = Math.min(
    3,
    highestDefined.attacksPerSecond * Math.pow(1.008, levelDelta),
  );
  const gold = Math.round(
    highestDefined.gold *
      Math.pow(1.09, levelDelta) *
      Math.pow(1.28, majorSteps),
  );
  const gems = Math.max(
    0,
    Math.round(
      highestDefined.gems *
        Math.pow(1.04, levelDelta) *
        Math.pow(1.2, majorSteps),
    ),
  );
  const xp = Math.round(
    highestDefined.xp * Math.pow(1.1, levelDelta) * Math.pow(1.4, majorSteps),
  );

  const bossScale = isBoss
    ? {
        hp: 2.1,
        damage: 1.55,
        aps: 1.08,
        gold: 2.1,
        gems: 2,
        xp: 2.3,
      }
    : {
        hp: 1,
        damage: 1,
        aps: 1,
        gold: 1,
        gems: 1,
        xp: 1,
      };

  return {
    level,
    enemyId: isBoss ? `boss_${level}` : `enemy_${level}`,
    name: isBoss ? `Boss Lv ${level}` : `Enemy Lv ${level}`,
    kind: isBoss ? "boss" : "normal",
    hp: Math.max(1, Math.round(hp * bossScale.hp)),
    damage: Math.max(1, Math.round(damage * bossScale.damage)),
    attacksPerSecond: Math.max(0.2, aps * bossScale.aps),
    gold: Math.max(1, Math.round(gold * bossScale.gold)),
    gems: Math.max(0, Math.round(gems * bossScale.gems)),
    xp: Math.max(1, Math.round(xp * bossScale.xp)),
    lootTableId: isBoss ? "boss_tier_4" : undefined,
  };
}

export function getCombatLevelConfig(level: number): CombatLevelConfig {
  const normalizedLevel = Math.max(1, Math.floor(level));
  const authored = COMBAT_LEVELS.find(
    (entry) => entry.level === normalizedLevel,
  );
  return authored ?? fallbackCombatLevelConfig(normalizedLevel);
}

export function createEnemyInstance(level: number): CombatEnemyInstance {
  const config = getCombatLevelConfig(level);
  return {
    level: config.level,
    enemyId: config.enemyId,
    name: config.name,
    kind: config.kind,
    maxHp: config.hp,
    currentHp: config.hp,
    damage: config.damage,
    attacksPerSecond: config.attacksPerSecond,
    goldReward: config.gold,
    gemsReward: config.gems,
    xpReward: config.xp,
    lootTableId: config.lootTableId,
  };
}

export function getPlayerMaxHp(state: GameState): number {
  const stats = getTotalStats(state);
  return Math.max(1, Math.round(stats.hp ?? 1));
}

export function getPlayerAttacksPerSecond(state: GameState): number {
  const stats = getTotalStats(state);
  const agility = Math.max(0, stats.agility ?? 0);
  const combatModifiers = getActiveClassCombatModifiers(state);
  let aps =
    COMBAT_PLAYER_CONFIG.baseAttacksPerSecond +
    agility * COMBAT_PLAYER_CONFIG.agilityToApsScale;
  aps = (aps + combatModifiers.apsFlat) * combatModifiers.apsMultiplier;

  const capBonus = combatModifiers.apsCapBonus;
  const hardCap = Math.min(
    100,
    COMBAT_PLAYER_CONFIG.maxAttacksPerSecond + capBonus,
  );
  return Math.min(hardCap, Math.max(0.2, aps));
}

export function getPlayerCritChance(state: GameState): number {
  const stats = getTotalStats(state);
  const combatModifiers = getActiveClassCombatModifiers(state);
  const rawCritChance = clampPercent(
    (stats.critChance ?? 0) + combatModifiers.critChanceBonus,
  );
  const hasCritSet = hasActiveCritSetBonus(state);

  if (hasCritSet) {
    return clampPercent(rawCritChance);
  }

  // Keep baseline crits rare unless the dedicated crit set is equipped.
  const softened = rawCritChance * 0.08 + Math.sqrt(rawCritChance) * 0.2;
  return Math.min(NON_CRIT_SET_CRIT_CHANCE_CAP, softened);
}

function hasActiveCritSetBonus(state: GameState): boolean {
  const equipped = [
    state.equipment.weapon,
    state.equipment.armor,
    state.equipment.accessory1,
    state.equipment.accessory2,
    state.equipment.pet,
  ];

  let pieces = 0;
  for (const uid of equipped) {
    if (!uid) continue;
    const inventoryItem = state.inventory.find((entry) => entry.uid === uid);
    if (!inventoryItem) continue;
    const itemDef = getItemDefSafe(inventoryItem.itemId);
    if (itemDef?.setId === "bloodletter") {
      pieces += 1;
    }
  }

  return pieces >= 2;
}

function rollInRange(rng: CombatRng, min: number, max: number): number {
  return min + rng() * (max - min);
}

export function getDamageAfterDefense(
  rawDamage: number,
  defense: number,
): number {
  const safeDamage = Math.max(1, rawDamage);
  const safeDefense = Math.max(0, defense);
  const mitigation = safeDefense / (safeDefense + 100);
  const reduced = safeDamage * (1 - mitigation);
  const minimumByRawDamage = Math.max(
    1,
    Math.round(safeDamage * MIN_DAMAGE_PORTION_AFTER_DEFENSE),
  );
  return Math.max(minimumByRawDamage, Math.round(reduced));
}

export function calculatePlayerHit(
  state: GameState,
  rng: CombatRng = Math.random,
  attackSource: CombatAttackSource = "auto",
): { damage: number; isCrit: boolean } {
  const stats = getTotalStats(state);
  const combatModifiers = getActiveClassCombatModifiers(state);
  const attack = Math.max(1, Math.round(stats.attack ?? 1));
  const critChance = getPlayerCritChance(state);
  const isCrit = rng() * 100 < critChance;
  const baseVariance = isCrit
    ? rollInRange(rng, CRIT_VARIANCE_MIN, CRIT_VARIANCE_MAX)
    : rollInRange(rng, NORMAL_HIT_VARIANCE_MIN, NORMAL_HIT_VARIANCE_MAX);
  const sourceCritMultiplier =
    isCrit && attackSource === "click" ? CLICK_CRIT_BONUS_MULTIPLIER : 1;
  const critMultiplier = isCrit ? CRIT_DAMAGE_MULTIPLIER : 1;
  const aps = getPlayerAttacksPerSecond(state);
  const archerHunterFocusRank = getActiveClassNodeRank(state, "archer_9");
  const apsDamageMultiplier =
    archerHunterFocusRank > 0
      ? 1 + Math.min(0.7, Math.max(0, aps - 1) * archerHunterFocusRank * 0.01)
      : 1;
  const sourceDamageMultiplier =
    attackSource === "click" ? combatModifiers.clickDamageMultiplier : 1;
  const damage = Math.max(
    1,
    Math.round(
      attack *
        baseVariance *
        critMultiplier *
        sourceCritMultiplier *
        combatModifiers.damageMultiplier *
        sourceDamageMultiplier *
        apsDamageMultiplier,
    ),
  );

  return { damage, isCrit };
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

export function createInitialCombatRuntime(
  state: GameState,
): CombatRuntimeState {
  return {
    currentLevel: 1,
    highestLevelReached: 1,
    lastBossCheckpointLevel: 0,
    playerCurrentHp: getPlayerMaxHp(state),
    enemy: createEnemyInstance(1),
    playerAttackRemainderMs: 0,
    enemyAttackRemainderMs: 0,
    spellCooldowns: {},
    consumableCooldowns: {},
  };
}

function resolvePlayerDefeat(
  runtime: CombatRuntimeState,
  state: GameState,
): CombatTickResult {
  const resetLevel = Math.max(1, runtime.lastBossCheckpointLevel || 1);
  return {
    runtime: {
      ...runtime,
      currentLevel: resetLevel,
      playerCurrentHp: getPlayerMaxHp(state),
      enemy: createEnemyInstance(resetLevel),
      playerAttackRemainderMs: 0,
      enemyAttackRemainderMs: 0,
    },
    state,
    events: [{ type: "playerDefeated" }],
  };
}

function applyPlayerAttack(
  runtime: CombatRuntimeState,
  state: GameState,
  rng: CombatRng,
  attackSource: CombatAttackSource = "auto",
): CombatTickResult {
  const combatModifiers = getActiveClassCombatModifiers(state);
  const { damage, isCrit } = calculatePlayerHit(state, rng, attackSource);
  const totalStats = getTotalStats(state);
  let nextEnemyHp = Math.max(0, runtime.enemy.currentHp - damage);
  let nextState = state;

  const lifeSteal = Math.max(
    0,
    Math.round(damage * (combatModifiers.lifeStealPercent / 100)),
  );
  const manaGain = Math.max(0, combatModifiers.manaOnHit);
  let healedRuntime = runtime;
  if (lifeSteal > 0) {
    const maxHp = getPlayerMaxHp(state);
    healedRuntime = {
      ...runtime,
      playerCurrentHp: Math.min(maxHp, runtime.playerCurrentHp + lifeSteal),
    };
  }
  if (manaGain > 0) {
    nextState = {
      ...nextState,
      resources: {
        ...nextState.resources,
        energy: Math.min(100, (nextState.resources.energy ?? 0) + manaGain),
      },
    };
  }

  const shouldTriggerPetProc =
    combatModifiers.petProcChance > 0 && rng() < combatModifiers.petProcChance;
  let petProcDamage = 0;
  if (shouldTriggerPetProc) {
    petProcDamage = Math.max(
      1,
      Math.round(
        ((totalStats.attack ?? 1) * 0.42 +
          (totalStats.petStrength ?? 0) * 0.22) *
          (1 + combatModifiers.petProcDamageMultiplier),
      ),
    );
    nextEnemyHp = Math.max(0, nextEnemyHp - petProcDamage);
  }

  const attackedRuntime: CombatRuntimeState = {
    ...healedRuntime,
    enemy: {
      ...healedRuntime.enemy,
      currentHp: nextEnemyHp,
    },
  };

  const events: CombatEvent[] = [
    { type: "playerHit", value: damage, isCrit, attackSource },
  ];
  if (petProcDamage > 0) {
    events.push({
      type: "playerHit",
      value: petProcDamage,
      attackSource: "pet",
    });
  }

  if (nextEnemyHp > 0) {
    return {
      runtime: attackedRuntime,
      state: nextState,
      events,
    };
  }

  const rewarded = applyEnemyReward(attackedRuntime, nextState, rng);
  return {
    runtime: rewarded.runtime,
    state: rewarded.state,
    events: events.concat(rewarded.events),
  };
}

function applyEnemyAttack(
  runtime: CombatRuntimeState,
  state: GameState,
  rng: CombatRng,
): CombatTickResult {
  const totalStats = getTotalStats(state);
  const combatModifiers = getActiveClassCombatModifiers(state);
  const defense = totalStats.defense ?? 0;
  const damage = Math.max(
    1,
    Math.round(
      getDamageAfterDefense(runtime.enemy.damage, defense) *
        combatModifiers.incomingDamageMultiplier,
    ),
  );
  const nextPlayerHp = Math.max(0, runtime.playerCurrentHp - damage);

  if (nextPlayerHp <= 0) {
    if (rng() < combatModifiers.lethalSaveChance) {
      const rescuedHp = Math.max(
        1,
        Math.round(getPlayerMaxHp(state) * combatModifiers.lethalSaveHpRatio),
      );
      return {
        runtime: {
          ...runtime,
          playerCurrentHp: rescuedHp,
        },
        state,
        events: [{ type: "enemyHit", value: damage }],
      };
    }

    const defeated = resolvePlayerDefeat(runtime, state);
    return {
      runtime: defeated.runtime,
      state: defeated.state,
      events: [{ type: "enemyHit", value: damage }, ...defeated.events],
    };
  }

  return {
    runtime: {
      ...runtime,
      playerCurrentHp: nextPlayerHp,
    },
    state,
    events: [{ type: "enemyHit", value: damage }],
  };
}

export function performClickAttack(
  runtime: CombatRuntimeState,
  state: GameState,
  rng: CombatRng = Math.random,
): CombatTickResult {
  return applyPlayerAttack(runtime, state, rng, "click");
}

export function useCombatConsumable(
  runtime: CombatRuntimeState,
  state: GameState,
  itemUid: string,
): CombatTickResult {
  const item = state.inventory.find((entry) => entry.uid === itemUid);
  if (!item) return { runtime, state, events: [] };

  const itemDef = getItemDefSafe(item.itemId);
  if (!itemDef || itemDef.type !== "potion") {
    return { runtime, state, events: [] };
  }

  const remainingCooldown = runtime.consumableCooldowns?.[item.itemId] ?? 0;
  if (remainingCooldown > 0) {
    return { runtime, state, events: [] };
  }

  const nextState = usePotion(state, itemUid);
  if (nextState === state) {
    return { runtime, state, events: [] };
  }

  const cooldownMs = getCombatConsumableCooldownMs(item.itemId);
  return {
    runtime: {
      ...runtime,
      consumableCooldowns: {
        ...(runtime.consumableCooldowns ?? {}),
        [item.itemId]: cooldownMs,
      },
    },
    state: nextState,
    events: [{ type: "consumableUsed", itemId: item.itemId }],
  };
}

export function castCombatSpell(
  runtime: CombatRuntimeState,
  state: GameState,
  spellId: string,
  rng: CombatRng = Math.random,
): CombatTickResult {
  const availableSpells = getAvailableCombatSpellsForState(state);
  const spell = availableSpells.find((entry) => entry.id === spellId) ?? null;
  if (!spell) {
    return { runtime, state, events: [] };
  }

  const mana = state.resources.energy ?? 100;
  const combatModifiers = getActiveClassCombatModifiers(state);
  const effectiveManaCost = Math.max(
    1,
    Math.round(spell.manaCost * combatModifiers.spellManaCostMultiplier),
  );
  const effectiveCooldownMs = Math.max(
    500,
    Math.round(spell.cooldownMs * combatModifiers.spellCooldownMultiplier),
  );
  const cooldownMs = runtime.spellCooldowns?.[spellId] ?? 0;
  if (mana < effectiveManaCost || cooldownMs > 0) {
    return { runtime, state, events: [] };
  }

  const events: CombatEvent[] = [{ type: "spellCast", spellId }];
  let nextState: GameState = {
    ...state,
    resources: {
      ...state.resources,
      energy: Math.max(0, mana - effectiveManaCost),
    },
  };
  let nextRuntime: CombatRuntimeState = {
    ...runtime,
    spellCooldowns: {
      ...(runtime.spellCooldowns ?? {}),
      [spellId]: effectiveCooldownMs,
    },
  };

  const applySpellHit = (
    rawDamage: number,
    attackSource: CombatAttackSource = "spell",
  ): boolean => {
    const damageScale =
      attackSource === "pet"
        ? combatModifiers.petDamageMultiplier
        : combatModifiers.spellDamageMultiplier;
    const damage = Math.max(1, Math.round(rawDamage * damageScale));
    const nextEnemyHp = Math.max(0, nextRuntime.enemy.currentHp - damage);
    nextRuntime = {
      ...nextRuntime,
      enemy: {
        ...nextRuntime.enemy,
        currentHp: nextEnemyHp,
      },
    };
    events.push({
      type: "playerHit",
      value: damage,
      attackSource,
      spellId,
    });

    if (nextEnemyHp <= 0) {
      const rewarded = applyEnemyReward(nextRuntime, nextState, rng);
      nextRuntime = rewarded.runtime;
      nextState = rewarded.state;
      events.push(...rewarded.events);
      return true;
    }

    return false;
  };

  const healPlayer = (rawHeal: number): void => {
    const maxHp = getPlayerMaxHp(nextState);
    const healAmount = Math.max(
      1,
      Math.round(rawHeal * combatModifiers.healMultiplier),
    );
    nextRuntime = {
      ...nextRuntime,
      playerCurrentHp: Math.min(
        maxHp,
        nextRuntime.playerCurrentHp + healAmount,
      ),
    };
    events[0].value = healAmount;
  };

  const restoreMana = (rawMana: number): number => {
    const manaRestore = Math.max(
      1,
      Math.round(rawMana * combatModifiers.manaRestoreMultiplier),
    );
    nextState = {
      ...nextState,
      resources: {
        ...nextState.resources,
        energy: Math.min(100, (nextState.resources.energy ?? 0) + manaRestore),
      },
    };
    return manaRestore;
  };

  const sorceressAegisRank = getActiveClassNodeRank(nextState, "sorceress_4");
  if (sorceressAegisRank > 0) {
    const shieldHeal = Math.max(2, sorceressAegisRank * 3);
    healPlayer(shieldHeal);
  }

  const sorceressRunicRecoveryRank = getActiveClassNodeRank(
    nextState,
    "sorceress_8",
  );
  if (sorceressRunicRecoveryRank > 0) {
    restoreMana(sorceressRunicRecoveryRank * 1.5);
  }

  if (spellId === "arcane_bolt") {
    const totalStats = getTotalStats(nextState);
    const baseDamage =
      (totalStats.attack ?? 1) * 1.2 + (totalStats.intelligence ?? 0) * 2.4;
    applySpellHit(baseDamage);
  } else if (spellId === "second_wind") {
    const totalStats = getTotalStats(nextState);
    const maxHp = getPlayerMaxHp(nextState);
    healPlayer(
      Math.max(12, maxHp * 0.3 + (totalStats.intelligence ?? 0) * 1.5),
    );
  } else if (spellId === "mana_surge") {
    events[0].value = restoreMana(42);
  } else if (spellId === "ember_lance") {
    const totalStats = getTotalStats(nextState);
    const baseDamage =
      (totalStats.attack ?? 1) * 0.7 + (totalStats.intelligence ?? 0) * 4.2;
    applySpellHit(baseDamage);
  } else if (spellId === "berserker_warcry") {
    const totalStats = getTotalStats(nextState);
    const roarRank = getActiveClassNodeRank(nextState, "berserker_7");
    const baseDamage = (totalStats.attack ?? 1) * (3.2 + roarRank * 0.18);
    applySpellHit(baseDamage);
  } else if (spellId === "berserker_execution") {
    const totalStats = getTotalStats(nextState);
    const missingHpRatio =
      1 - nextRuntime.enemy.currentHp / Math.max(1, nextRuntime.enemy.maxHp);
    const rankBonus =
      getActiveClassNodeRank(nextState, "berserker_10") * 0.12 +
      getActiveClassNodeRank(nextState, "berserker_9") * 0.04;
    const executionDamage =
      (totalStats.attack ?? 1) * (2.4 + missingHpRatio * 2.8 + rankBonus);
    applySpellHit(executionDamage);
  } else if (spellId === "farmer_regrowth") {
    const maxHp = getPlayerMaxHp(nextState);
    healPlayer(Math.max(20, maxHp * 0.35));
  } else if (spellId === "farmer_harvest_guard") {
    const totalStats = getTotalStats(nextState);
    const maxHp = getPlayerMaxHp(nextState);
    const sustainRank = getActiveClassNodeRank(nextState, "farmer_1");
    const healAmount =
      maxHp * (0.22 + sustainRank * 0.02) + (totalStats.defense ?? 0) * 0.8;
    healPlayer(healAmount);
    const manaRestore = restoreMana(8 + (totalStats.intelligence ?? 0) * 0.2);
    events.push({
      type: "spellCast",
      spellId,
      value: manaRestore,
    });
  } else if (spellId === "archer_hailfire") {
    const totalStats = getTotalStats(nextState);
    const rhythmRank = getActiveClassNodeRank(nextState, "archer_7");
    const baseDamage =
      (totalStats.attack ?? 1) * (1.6 + rhythmRank * 0.05) +
      (totalStats.agility ?? 0) * 12;
    applySpellHit(baseDamage);
  } else if (spellId === "archer_pinpoint") {
    const totalStats = getTotalStats(nextState);
    const stormQuiverRank = getActiveClassNodeRank(nextState, "archer_10");
    const volleyCount =
      3 +
      getActiveClassNodeRank(nextState, "archer_2") +
      Math.floor(stormQuiverRank / 2);
    const perVolleyDamage =
      (totalStats.attack ?? 1) * 0.5 + (totalStats.agility ?? 0) * 2.2;

    for (let index = 0; index < volleyCount; index += 1) {
      if (applySpellHit(perVolleyDamage)) {
        break;
      }
    }
  } else if (spellId === "sorceress_nova") {
    const totalStats = getTotalStats(nextState);
    const overchargeRank = getActiveClassNodeRank(nextState, "sorceress_5");
    const baseDamage =
      (totalStats.attack ?? 1) * (1.1 + overchargeRank * 0.03) +
      (totalStats.intelligence ?? 0) * 5.1;
    applySpellHit(baseDamage);
  } else if (spellId === "sorceress_hexfire") {
    const totalStats = getTotalStats(nextState);
    const ignitionRank = getActiveClassNodeRank(nextState, "sorceress_3");
    const detonationRank = getActiveClassNodeRank(nextState, "sorceress_10");
    const tickCount = 3 + Math.floor(ignitionRank / 2) + detonationRank;
    const tickDamage =
      (totalStats.attack ?? 1) * 0.35 +
      (totalStats.intelligence ?? 0) * (1.8 + ignitionRank * 0.12);

    for (let index = 0; index < tickCount; index += 1) {
      if (applySpellHit(tickDamage)) {
        break;
      }
    }
  } else if (spellId === "idler_dividend") {
    const totalStats = getTotalStats(nextState);
    const now = Date.now();
    const idleMs = Math.max(0, now - (nextState.meta.lastUpdate ?? now));
    const idleSeconds = Math.min(8 * 60 * 60, Math.floor(idleMs / 1000));
    const streakRank = getActiveClassNodeRank(nextState, "idler_7");
    const returnMomentumRank = getActiveClassNodeRank(nextState, "idler_9");
    const convertedDamage =
      (totalStats.attack ?? 1) * 0.8 +
      idleSeconds * (0.02 + streakRank * 0.004 + returnMomentumRank * 0.0025);
    applySpellHit(convertedDamage);
  } else if (spellId === "idler_timebank") {
    const momentumRank = getActiveClassNodeRank(nextState, "idler_9");
    const reserveRank = getActiveClassNodeRank(nextState, "idler_10");
    const manaRestore = restoreMana(24 + momentumRank * 4);
    events[0].value = manaRestore;

    const cooldownReductionMs = 6000 + momentumRank * 500 + reserveRank * 450;
    const reducedCooldowns: Record<string, number> = {};
    for (const [key, remaining] of Object.entries(
      nextRuntime.spellCooldowns ?? {},
    )) {
      const reduced = Math.max(0, remaining - cooldownReductionMs);
      if (reduced > 0) {
        reducedCooldowns[key] = reduced;
      }
    }
    nextRuntime = {
      ...nextRuntime,
      spellCooldowns: reducedCooldowns,
    };
  } else if (spellId === "tamer_pack_howl") {
    const totalStats = getTotalStats(nextState);
    const frenzyRank = getActiveClassNodeRank(nextState, "tamer_10");
    const petBurstDamage =
      (totalStats.attack ?? 1) * 1.3 +
      (totalStats.petStrength ?? 0) * (20 + frenzyRank * 1.5);
    applySpellHit(petBurstDamage, "pet");
  } else if (spellId === "tamer_beast_sync") {
    const totalStats = getTotalStats(nextState);
    const bondRank = getActiveClassNodeRank(nextState, "tamer_1");
    const alphaRank = getActiveClassNodeRank(nextState, "tamer_9");
    const petHit =
      (totalStats.attack ?? 1) * 0.95 +
      (totalStats.petStrength ?? 0) * (14 + bondRank * 2 + alphaRank * 0.8);
    const playerFollowup =
      (totalStats.attack ?? 1) * 1.05 + (totalStats.agility ?? 0) * 3.4;

    const defeatedOnFirst = applySpellHit(petHit, "pet");
    if (!defeatedOnFirst) {
      applySpellHit(playerFollowup, "spell");
    }
  } else if (spell.source === "class") {
    const totalStats = getTotalStats(nextState);
    const fallbackDamage =
      (totalStats.attack ?? 1) * 1.8 + (totalStats.intelligence ?? 0) * 1.6;
    applySpellHit(fallbackDamage);
  }

  return {
    runtime: nextRuntime,
    state: nextState,
    events,
  };
}

export function runCombatTick(
  runtime: CombatRuntimeState,
  state: GameState,
  deltaMs: number,
  rng: CombatRng = Math.random,
): CombatTickResult {
  if (deltaMs <= 0) {
    return { runtime, state, events: [] };
  }

  const playerAps = getPlayerAttacksPerSecond(state);
  const playerIntervalMs = 1000 / playerAps;
  const enemyIntervalMs = 1000 / Math.max(0.2, runtime.enemy.attacksPerSecond);

  let nextRuntime: CombatRuntimeState = reduceCombatCooldowns(
    {
      ...runtime,
      playerAttackRemainderMs: runtime.playerAttackRemainderMs + deltaMs,
      enemyAttackRemainderMs: runtime.enemyAttackRemainderMs + deltaMs,
    },
    deltaMs,
  );
  let nextState = state;
  const events: CombatEvent[] = [];

  let actions = 0;
  while (actions < MAX_COMBAT_ACTIONS_PER_TICK) {
    const playerReady = nextRuntime.playerAttackRemainderMs >= playerIntervalMs;
    const enemyReady = nextRuntime.enemyAttackRemainderMs >= enemyIntervalMs;
    if (!playerReady && !enemyReady) break;

    if (playerReady) {
      nextRuntime = {
        ...nextRuntime,
        playerAttackRemainderMs:
          nextRuntime.playerAttackRemainderMs - playerIntervalMs,
      };
      const attacked = applyPlayerAttack(nextRuntime, nextState, rng, "auto");
      nextRuntime = attacked.runtime;
      nextState = attacked.state;
      events.push(...attacked.events);
    }

    if (enemyReady) {
      nextRuntime = {
        ...nextRuntime,
        enemyAttackRemainderMs:
          nextRuntime.enemyAttackRemainderMs - enemyIntervalMs,
      };
      const attacked = applyEnemyAttack(nextRuntime, nextState, rng);
      nextRuntime = attacked.runtime;
      nextState = attacked.state;
      events.push(...attacked.events);

      if (attacked.events.some((event) => event.type === "playerDefeated")) {
        break;
      }
    }

    actions += 1;
  }

  return {
    runtime: nextRuntime,
    state: nextState,
    events,
  };
}

function getExpectedPlayerDamagePerSecond(state: GameState): number {
  const stats = getTotalStats(state);
  const attack = Math.max(1, stats.attack ?? 1);
  const aps = getPlayerAttacksPerSecond(state);
  const critChance = getPlayerCritChance(state) / 100;
  const critFactor = 1 + critChance * (CRIT_DAMAGE_MULTIPLIER - 1);
  return attack * aps * critFactor;
}

function getExpectedEnemyDamagePerSecond(
  runtime: CombatRuntimeState,
  state: GameState,
): number {
  const totalStats = getTotalStats(state);
  const combatModifiers = getActiveClassCombatModifiers(state);
  const defense = totalStats.defense ?? 0;
  const mitigatedDamage =
    getDamageAfterDefense(runtime.enemy.damage, defense) *
    combatModifiers.incomingDamageMultiplier;
  return mitigatedDamage * Math.max(0.2, runtime.enemy.attacksPerSecond);
}

export function resolveOfflineCombatExpected(
  runtime: CombatRuntimeState,
  state: GameState,
  offlineMs: number,
  rng: CombatRng = Math.random,
): CombatOfflineResult {
  let remainingMs = Math.max(0, offlineMs);
  if (remainingMs <= 0) {
    return {
      runtime,
      state,
      levelsCleared: 0,
      defeatedByEnemy: false,
      itemsGained: 0,
    };
  }

  let nextRuntime = { ...runtime };
  nextRuntime = reduceCombatCooldowns(nextRuntime, remainingMs);
  let nextState = state;
  let levelsCleared = 0;
  let defeatedByEnemy = false;
  let itemsGained = 0;

  while (remainingMs > 0) {
    const playerDps = getExpectedPlayerDamagePerSecond(nextState);
    const enemyDps = getExpectedEnemyDamagePerSecond(nextRuntime, nextState);

    if (playerDps <= 0) {
      defeatedByEnemy = true;
      break;
    }

    const timeToKillMs = (nextRuntime.enemy.currentHp / playerDps) * 1000;
    const timeToDieMs =
      enemyDps <= 0
        ? Number.POSITIVE_INFINITY
        : (nextRuntime.playerCurrentHp / enemyDps) * 1000;

    if (timeToDieMs <= timeToKillMs) {
      const defeated = resolvePlayerDefeat(nextRuntime, nextState);
      nextRuntime = defeated.runtime;
      defeatedByEnemy = true;
      break;
    }

    if (timeToKillMs > remainingMs) {
      break;
    }

    remainingMs -= timeToKillMs;

    nextRuntime = {
      ...nextRuntime,
      enemy: {
        ...nextRuntime.enemy,
        currentHp: 0,
      },
    };

    const rewarded = applyEnemyReward(nextRuntime, nextState, rng);
    nextRuntime = rewarded.runtime;
    nextState = rewarded.state;
    levelsCleared += 1;
    itemsGained += rewarded.events
      .filter((event) => event.type === "lootGranted")
      .reduce((sum, event) => sum + Math.max(0, event.quantity ?? 0), 0);
  }

  return {
    runtime: nextRuntime,
    state: nextState,
    levelsCleared,
    defeatedByEnemy,
    itemsGained,
  };
}
