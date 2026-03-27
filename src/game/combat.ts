import {
  COMBAT_LEVELS,
  COMBAT_PLAYER_CONFIG,
  COMBAT_PROGRESS_CONFIG,
  type CombatEncounterKind,
  type CombatLevelConfig,
} from "./combatConfig";
import { getActiveClassNodeRank, type ClassId } from "./classes";
import {
  getCombatConsumableCooldownMs as getCombatConsumableCooldownMsValue,
  reduceCombatCooldowns,
} from "./combatCooldowns";
import {
  applyEnemyReward as applyCombatEnemyReward,
  resolveBossLootDrops as resolveCombatBossLootDrops,
  type CombatLootDrop,
} from "./combatRewards";
import { executeCombatSpellEffect } from "./combatSpellEffects";
import {
  applyPlayerAttack as applyAttackPlayerAttack,
  applyEnemyAttack as applyAttackEnemyAttack,
} from "./combatAttacks";
import { orchestrateCombatTick } from "./combatTickOrchestration";
import { resolveOfflineCombatExpected as resolveOfflineCombatExpectedSimulation } from "./combatSimulation";
import {
  COMBAT_SPELL_DEFINITIONS,
  getAvailableCombatSpellsForState as getAvailableCombatSpellsForStateValue,
  getAvailableGeneralCombatSpells as getAvailableGeneralCombatSpellsValue,
  getClassCombatSpellsForClass as getClassCombatSpellsForClassValue,
  getCombatSpellDefinition as getCombatSpellDefinitionValue,
  getGeneralCombatSpellPath as getGeneralCombatSpellPathValue,
  type CombatSpellDefinition,
} from "./combatSpells";
import { getTotalStats, usePotion } from "./engine";
import { hasSetPieceThreshold, uniqueSetDefinitions } from "./itemSets";
import { getItemDefSafe } from "./items";
import type { GameState } from "./types";

export { COMBAT_SPELL_DEFINITIONS };

export type CombatRng = () => number;
export type CombatAttackSource = "auto" | "click" | "spell" | "pet";

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

const CRIT_DAMAGE_MULTIPLIER = 3.8;
const CLICK_CRIT_BONUS_MULTIPLIER = 1.25;
const BASE_CLICK_DAMAGE_MULTIPLIER = 1.45;
const NORMAL_HIT_VARIANCE_MIN = 0.92;
const NORMAL_HIT_VARIANCE_MAX = 1.08;
const CRIT_VARIANCE_MIN = 1.02;
const CRIT_VARIANCE_MAX = 1.34;
const NON_CRIT_SET_CRIT_CHANCE_CAP = 6;
const MIN_DAMAGE_PORTION_AFTER_DEFENSE = 0.05;
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
    modifiers.damageMultiplier += rank("berserker_13") * 0.025;
    modifiers.spellDamageMultiplier += rank("berserker_14") * 0.07;
    modifiers.manaOnHit += rank("berserker_14") * 0.6;
    modifiers.lifeStealPercent += rank("berserker_15") * 1.1;
    modifiers.clickDamageMultiplier += rank("berserker_16") * 0.04;
    modifiers.critChanceBonus += rank("berserker_17") * 1.5;
    modifiers.spellDamageMultiplier += rank("berserker_17") * 0.03;
    modifiers.manaOnHit += rank("berserker_18") * 1.2;
    modifiers.spellDamageMultiplier += rank("berserker_18") * 0.04;
    modifiers.incomingDamageMultiplier *= 1 - rank("berserker_19") * 0.015;
    modifiers.damageMultiplier += rank("berserker_19") * 0.02;
    modifiers.damageMultiplier += rank("berserker_20") * 0.05;
    modifiers.critChanceBonus += rank("berserker_20") * 1;
    modifiers.lifeStealPercent += rank("berserker_21") > 0 ? 3 : 0;
    modifiers.damageMultiplier += rank("berserker_21") > 0 ? 0.08 : 0;
    modifiers.damageMultiplier += rank("berserker_22") > 0 ? 0.18 : 0;
    modifiers.spellDamageMultiplier += rank("berserker_22") > 0 ? 0.12 : 0;
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
    modifiers.manaRestoreMultiplier += rank("sorceress_13") * 0.06;
    modifiers.spellDamageMultiplier += rank("sorceress_14") * 0.05;
    modifiers.spellCooldownMultiplier *= 1 - rank("sorceress_15") * 0.025;
    modifiers.critChanceBonus += rank("sorceress_16") * 1.8;
    modifiers.spellDamageMultiplier += rank("sorceress_16") * 0.02;
    modifiers.spellManaCostMultiplier *= 1 - rank("sorceress_17") * 0.03;
    modifiers.healMultiplier += rank("sorceress_18") * 0.05;
    modifiers.spellDamageMultiplier += rank("sorceress_18") * 0.025;
    modifiers.apsMultiplier += rank("sorceress_19") * 0.035;
    modifiers.spellDamageMultiplier += rank("sorceress_20") * 0.07;
    modifiers.manaRestoreMultiplier += rank("sorceress_20") * 0.04;
    modifiers.spellCooldownMultiplier *= rank("sorceress_21") > 0 ? 0.92 : 1;
    modifiers.spellDamageMultiplier += rank("sorceress_21") > 0 ? 0.08 : 0;
    modifiers.spellDamageMultiplier += rank("sorceress_22") > 0 ? 0.2 : 0;
    modifiers.critChanceBonus += rank("sorceress_22") > 0 ? 3 : 0;
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
    modifiers.damageMultiplier += rank("farmer_13") * 0.02;
    modifiers.healMultiplier += rank("farmer_14") * 0.05;
    modifiers.manaRestoreMultiplier += rank("farmer_15") * 0.04;
    modifiers.incomingDamageMultiplier *= 1 - rank("farmer_16") * 0.018;
    modifiers.damageMultiplier += rank("farmer_17") * 0.025;
    modifiers.healMultiplier += rank("farmer_17") * 0.02;
    modifiers.healMultiplier += rank("farmer_18") * 0.04;
    modifiers.manaRestoreMultiplier += rank("farmer_18") * 0.03;
    modifiers.damageMultiplier += rank("farmer_19") * 0.03;
    modifiers.incomingDamageMultiplier *= 1 - rank("farmer_19") * 0.01;
    modifiers.healMultiplier += rank("farmer_20") * 0.07;
    modifiers.damageMultiplier += rank("farmer_20") * 0.015;
    modifiers.healMultiplier += rank("farmer_21") > 0 ? 0.1 : 0;
    modifiers.damageMultiplier += rank("farmer_21") > 0 ? 0.06 : 0;
    modifiers.healMultiplier += rank("farmer_22") > 0 ? 0.12 : 0;
    modifiers.damageMultiplier += rank("farmer_22") > 0 ? 0.14 : 0;
    modifiers.manaRestoreMultiplier += rank("farmer_22") > 0 ? 0.08 : 0;
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
    modifiers.apsFlat += rank("archer_13") * 0.28;
    modifiers.critChanceBonus += rank("archer_14") * 1.2;
    modifiers.clickDamageMultiplier += rank("archer_15") * 0.04;
    modifiers.damageMultiplier += rank("archer_16") * 0.025;
    modifiers.critChanceBonus += rank("archer_16") * 0.5;
    modifiers.apsMultiplier += rank("archer_17") * 0.04;
    modifiers.petProcChance += rank("archer_18") * 0.015;
    modifiers.damageMultiplier += rank("archer_18") * 0.02;
    modifiers.critChanceBonus += rank("archer_19") * 1.5;
    modifiers.apsCapBonus += rank("archer_19") * 2;
    modifiers.apsMultiplier += rank("archer_20") * 0.05;
    modifiers.damageMultiplier += rank("archer_20") * 0.02;
    modifiers.apsCapBonus += rank("archer_21") > 0 ? 12 : 0;
    modifiers.damageMultiplier += rank("archer_21") > 0 ? 0.08 : 0;
    modifiers.damageMultiplier += rank("archer_22") > 0 ? 0.16 : 0;
    modifiers.critChanceBonus += rank("archer_22") > 0 ? 4 : 0;
    modifiers.apsMultiplier += rank("archer_22") > 0 ? 0.08 : 0;
  }

  if (activeClassId === "idler") {
    modifiers.manaRestoreMultiplier += rank("idler_5") * 0.06;
    modifiers.damageMultiplier += rank("idler_6") * 0.02;
    modifiers.damageMultiplier += rank("idler_9") * 0.02;
    modifiers.spellCooldownMultiplier *= 1 - rank("idler_10") * 0.02;
    modifiers.incomingDamageMultiplier *= 1 - rank("idler_11") * 0.04;
    modifiers.damageMultiplier += rank("idler_12") > 0 ? 0.08 : 0;
    modifiers.manaRestoreMultiplier += rank("idler_13") * 0.05;
    modifiers.damageMultiplier += rank("idler_14") * 0.025;
    modifiers.incomingDamageMultiplier *= 1 - rank("idler_15") * 0.015;
    modifiers.spellCooldownMultiplier *= 1 - rank("idler_16") * 0.025;
    modifiers.damageMultiplier += rank("idler_17") * 0.03;
    modifiers.manaRestoreMultiplier += rank("idler_18") * 0.05;
    modifiers.spellCooldownMultiplier *= 1 - rank("idler_18") * 0.015;
    modifiers.damageMultiplier += rank("idler_19") * 0.035;
    modifiers.incomingDamageMultiplier *= 1 - rank("idler_20") * 0.02;
    modifiers.damageMultiplier += rank("idler_20") * 0.015;
    modifiers.spellCooldownMultiplier *= rank("idler_21") > 0 ? 0.92 : 1;
    modifiers.manaRestoreMultiplier += rank("idler_21") > 0 ? 0.08 : 0;
    modifiers.damageMultiplier += rank("idler_22") > 0 ? 0.16 : 0;
    modifiers.incomingDamageMultiplier *= rank("idler_22") > 0 ? 0.94 : 1;
    modifiers.manaRestoreMultiplier += rank("idler_22") > 0 ? 0.08 : 0;
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
    modifiers.petDamageMultiplier += rank("tamer_13") * 0.06;
    modifiers.petProcChance += rank("tamer_14") * 0.025;
    modifiers.petProcDamageMultiplier += rank("tamer_15") * 0.1;
    modifiers.damageMultiplier += rank("tamer_16") * 0.02;
    modifiers.critChanceBonus += rank("tamer_17") * 1.2;
    modifiers.petDamageMultiplier += rank("tamer_17") * 0.02;
    modifiers.incomingDamageMultiplier *= 1 - rank("tamer_18") * 0.02;
    modifiers.petDamageMultiplier += rank("tamer_19") * 0.07;
    modifiers.petProcChance += rank("tamer_19") * 0.01;
    modifiers.petProcDamageMultiplier += rank("tamer_20") * 0.12;
    modifiers.damageMultiplier += rank("tamer_20") * 0.015;
    modifiers.petDamageMultiplier += rank("tamer_21") > 0 ? 0.1 : 0;
    modifiers.incomingDamageMultiplier *= rank("tamer_21") > 0 ? 0.94 : 1;
    modifiers.petDamageMultiplier += rank("tamer_22") > 0 ? 0.2 : 0;
    modifiers.petProcDamageMultiplier += rank("tamer_22") > 0 ? 0.15 : 0;
    modifiers.critChanceBonus += rank("tamer_22") > 0 ? 3 : 0;
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

export function getCombatConsumableCooldownMs(itemId: string): number {
  return getCombatConsumableCooldownMsValue(itemId);
}

export function getCombatSpellDefinition(
  spellId: string,
): CombatSpellDefinition | null {
  return getCombatSpellDefinitionValue(spellId);
}

export function getGeneralCombatSpellPath(): CombatSpellDefinition[] {
  return getGeneralCombatSpellPathValue();
}

export function getAvailableGeneralCombatSpells(
  level: number,
): CombatSpellDefinition[] {
  return getAvailableGeneralCombatSpellsValue(level);
}

export function getClassCombatSpellsForClass(
  classId: ClassId,
): CombatSpellDefinition[] {
  return getClassCombatSpellsForClassValue(classId);
}

export function getAvailableCombatSpellsForState(
  state: GameState,
): CombatSpellDefinition[] {
  return getAvailableCombatSpellsForStateValue(state);
}

function applyEnemyReward(
  runtime: CombatRuntimeState,
  state: GameState,
  rng: CombatRng,
): { runtime: CombatRuntimeState; state: GameState; events: CombatEvent[] } {
  return applyCombatEnemyReward(runtime, state, rng, {
    createEnemyInstance,
    getPlayerMaxHp,
    xpRewardMultiplier: COMBAT_XP_REWARD_MULTIPLIER,
  });
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
  const bloodletterSet = uniqueSetDefinitions.bloodletter;
  return (
    Boolean(bloodletterSet) && hasSetPieceThreshold(state, bloodletterSet, 2)
  );
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
    attackSource === "click"
      ? BASE_CLICK_DAMAGE_MULTIPLIER * combatModifiers.clickDamageMultiplier
      : 1;
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
  return resolveCombatBossLootDrops(enemy, rng);
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

export function performClickAttack(
  runtime: CombatRuntimeState,
  state: GameState,
  rng: CombatRng = Math.random,
): CombatTickResult {
  const combatModifiers = getActiveClassCombatModifiers(state);
  return applyAttackPlayerAttack(
    runtime,
    state,
    rng,
    "click",
    {
      damageMultiplier: combatModifiers.damageMultiplier,
      lifeStealPercent: combatModifiers.lifeStealPercent,
      manaOnHit: combatModifiers.manaOnHit,
      petProcChance: combatModifiers.petProcChance,
      petProcDamageMultiplier: combatModifiers.petProcDamageMultiplier,
      incomingDamageMultiplier: combatModifiers.incomingDamageMultiplier,
      lethalSaveChance: combatModifiers.lethalSaveChance,
      lethalSaveHpRatio: combatModifiers.lethalSaveHpRatio,
    },
    calculatePlayerHit,
    getPlayerMaxHp,
    applyEnemyReward,
  );
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

  const nextState: GameState = {
    ...state,
    resources: {
      ...state.resources,
      energy: Math.max(0, mana - effectiveManaCost),
    },
  };
  const nextRuntime: CombatRuntimeState = {
    ...runtime,
    spellCooldowns: {
      ...(runtime.spellCooldowns ?? {}),
      [spellId]: effectiveCooldownMs,
    },
  };

  return executeCombatSpellEffect({
    runtime: nextRuntime,
    state: nextState,
    spell,
    rng,
    combatModifiers: {
      spellDamageMultiplier: combatModifiers.spellDamageMultiplier,
      petDamageMultiplier: combatModifiers.petDamageMultiplier,
      healMultiplier: combatModifiers.healMultiplier,
      manaRestoreMultiplier: combatModifiers.manaRestoreMultiplier,
    },
    applyEnemyReward,
    getPlayerMaxHp,
  });
}

export function runCombatTick(
  runtime: CombatRuntimeState,
  state: GameState,
  deltaMs: number,
  rng: CombatRng = Math.random,
): CombatTickResult {
  const combatModifiers = getActiveClassCombatModifiers(state);
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

  const executePlayerAttack = (
    tickRuntime: CombatRuntimeState,
    tickState: GameState,
  ): CombatTickResult => {
    return applyAttackPlayerAttack(
      tickRuntime,
      tickState,
      rng,
      "auto",
      {
        damageMultiplier: combatModifiers.damageMultiplier,
        lifeStealPercent: combatModifiers.lifeStealPercent,
        manaOnHit: combatModifiers.manaOnHit,
        petProcChance: combatModifiers.petProcChance,
        petProcDamageMultiplier: combatModifiers.petProcDamageMultiplier,
        incomingDamageMultiplier: combatModifiers.incomingDamageMultiplier,
        lethalSaveChance: combatModifiers.lethalSaveChance,
        lethalSaveHpRatio: combatModifiers.lethalSaveHpRatio,
      },
      calculatePlayerHit,
      getPlayerMaxHp,
      applyEnemyReward,
    );
  };

  const executeEnemyAttack = (
    tickRuntime: CombatRuntimeState,
    tickState: GameState,
  ): CombatTickResult => {
    return applyAttackEnemyAttack(
      tickRuntime,
      tickState,
      rng,
      {
        damageMultiplier: combatModifiers.damageMultiplier,
        lifeStealPercent: combatModifiers.lifeStealPercent,
        manaOnHit: combatModifiers.manaOnHit,
        petProcChance: combatModifiers.petProcChance,
        petProcDamageMultiplier: combatModifiers.petProcDamageMultiplier,
        incomingDamageMultiplier: combatModifiers.incomingDamageMultiplier,
        lethalSaveChance: combatModifiers.lethalSaveChance,
        lethalSaveHpRatio: combatModifiers.lethalSaveHpRatio,
      },
      getDamageAfterDefense,
      getPlayerMaxHp,
      createEnemyInstance,
    );
  };

  const orchestrated = orchestrateCombatTick(nextRuntime, nextState, {
    playerIntervalMs,
    enemyIntervalMs,
    executePlayerAttack,
    executeEnemyAttack,
  });

  return orchestrated;
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
  return resolveOfflineCombatExpectedSimulation(
    runtime,
    state,
    offlineMs,
    {
      getExpectedPlayerDps: getExpectedPlayerDamagePerSecond,
      getExpectedEnemyDps: getExpectedEnemyDamagePerSecond,
      getDamageAfterDefense,
      getPlayerMaxHp,
      createEnemyInstance,
      applyEnemyReward,
    },
    rng,
  );
}
