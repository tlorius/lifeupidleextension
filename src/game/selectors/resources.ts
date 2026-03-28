import {
  getBaseStats,
  getEquipmentStats,
  getGoldIncome,
  getPetStats,
  getTotalStats,
  getUpgradeStats,
} from "../engine";
import { getDamageAfterDefense, getPlayerAttacksPerSecond } from "../combat";
import { COMBAT_PLAYER_CONFIG } from "../combatConfig";
import {
  getIdleGoldSurgeMultiplier,
  getPassiveGemRatePerSecond,
} from "../upgrades";
import { defaultState } from "../state";
import type { GameState, Stats } from "../types";

export interface ResourcesDisplayViewModel {
  total: ReturnType<typeof getTotalStats>;
  baseStats: ReturnType<typeof getBaseStats>;
  equipmentStats: ReturnType<typeof getEquipmentStats>;
  upgradeStats: ReturnType<typeof getUpgradeStats>;
  petStats: ReturnType<typeof getPetStats>;
  activeGoldPotionBoost: number;
  activePotionMsLeft: number;
  permanentPotionStatChanges: Partial<Stats>;
  hasPermanentPotionChanges: boolean;
  goldIncomePerSecond: number;
  baseGoldPerSecond: number;
  upgradeGoldBonus: number;
  petGoldBonus: number;
  tempGoldBonus: number;
  totalGoldBonusPercent: number;
  totalGoldMultiplier: number;
  calculatedGoldPerSecond: number;
  attacksPerSecond: number;
  agilityBaselineAttacksPerSecond: number;
  defenseMitigationPercent: number;
  enemyRawDamage: number;
  enemyDamageTakenPerHit: number;
  passiveGemRatePerSecond: number;
  passiveGemsPerTick: number;
  passiveGemsPerMinute: number;
  passiveGemFoundryLevel: number;
  passiveGemFinderLevels: number;
  passiveGemBaseRatePerSecond: number;
  passiveGemRateMultiplier: number;
  idleGoldSurgeMultiplier: number;
  arcaneBoltBaseDamage: number;
}

export function selectResourcesDisplayView(
  state: GameState,
  now = Date.now(),
): ResourcesDisplayViewModel {
  const total = getTotalStats(state);
  const baseStats = getBaseStats(state);
  const equipmentStats = getEquipmentStats(state);
  const upgradeStats = getUpgradeStats(state);
  const petStats = getPetStats(state);

  const activeGoldPotionBoost =
    (state.temporaryEffects?.goldIncomeBoostUntil ?? 0) > now
      ? (state.temporaryEffects?.goldIncomeBoostPercent ?? 0)
      : 0;
  const activePotionMsLeft = Math.max(
    0,
    (state.temporaryEffects?.goldIncomeBoostUntil ?? 0) - now,
  );

  const permanentPotionStatChanges: Partial<Stats> = {
    attack: (state.stats.attack ?? 0) - (defaultState.stats.attack ?? 0),
    defense: (state.stats.defense ?? 0) - (defaultState.stats.defense ?? 0),
    intelligence:
      (state.stats.intelligence ?? 0) - (defaultState.stats.intelligence ?? 0),
    gardening:
      (state.stats.gardening ?? 0) - (defaultState.stats.gardening ?? 0),
  };

  const hasPermanentPotionChanges = Object.values(
    permanentPotionStatChanges,
  ).some((value) => (value ?? 0) !== 0);

  const baseGoldPerSecond = state.stats.attack || 1;
  const upgradeGoldBonus = upgradeStats.goldIncome ?? 0;
  const petGoldBonus = petStats.goldIncome ?? 0;
  const tempGoldBonus = activeGoldPotionBoost;
  const totalGoldBonusPercent = upgradeGoldBonus + petGoldBonus + tempGoldBonus;
  const totalGoldMultiplier = 1 + totalGoldBonusPercent / 100;
  const calculatedGoldPerSecond = baseGoldPerSecond * totalGoldMultiplier;
  const attacksPerSecond = getPlayerAttacksPerSecond(state);
  const agilityBaselineAttacksPerSecond =
    COMBAT_PLAYER_CONFIG.baseAttacksPerSecond +
    Math.max(0, total.agility ?? 0) * COMBAT_PLAYER_CONFIG.agilityToApsScale;
  const defense = Math.max(0, total.defense ?? 0);
  const defenseMitigationPercent = (defense / (defense + 100)) * 100;
  const enemyRawDamage = Math.max(1, state.combat.enemy.damage ?? 1);
  const enemyDamageTakenPerHit = getDamageAfterDefense(enemyRawDamage, defense);
  const passiveGemRatePerSecond = getPassiveGemRatePerSecond(state);
  const passiveGemFoundryLevel =
    state.upgrades.find((upgrade) => upgrade.id === "chaos_gem_foundry")
      ?.level ?? 0;
  const passiveGemFinderLevels = state.upgrades.reduce((sum, upgrade) => {
    const isGemFinderType = upgrade.type === "gemFinder";
    return isGemFinderType ? sum + Math.max(0, upgrade.level) : sum;
  }, 0);
  const passiveGemBaseRatePerSecond = passiveGemFoundryLevel * 0.35;
  const passiveGemRateMultiplier = 1 + passiveGemFinderLevels * 0.08;
  const passiveGemsPerTick =
    passiveGemRatePerSecond > 0 ? Math.ceil(passiveGemRatePerSecond) : 0;
  const passiveGemsPerMinute =
    passiveGemRatePerSecond > 0 ? Math.ceil(passiveGemRatePerSecond * 60) : 0;
  const idleGoldSurgeMultiplier = getIdleGoldSurgeMultiplier(state);
  const arcaneBoltBaseDamage = Math.max(
    1,
    (total.attack ?? 1) * 2 + (total.intelligence ?? 0) * 5,
  );

  return {
    total,
    baseStats,
    equipmentStats,
    upgradeStats,
    petStats,
    activeGoldPotionBoost,
    activePotionMsLeft,
    permanentPotionStatChanges,
    hasPermanentPotionChanges,
    goldIncomePerSecond: getGoldIncome(state, now),
    baseGoldPerSecond,
    upgradeGoldBonus,
    petGoldBonus,
    tempGoldBonus,
    totalGoldBonusPercent,
    totalGoldMultiplier,
    calculatedGoldPerSecond,
    attacksPerSecond,
    agilityBaselineAttacksPerSecond,
    defenseMitigationPercent,
    enemyRawDamage,
    enemyDamageTakenPerHit,
    passiveGemRatePerSecond,
    passiveGemsPerTick,
    passiveGemsPerMinute,
    passiveGemFoundryLevel,
    passiveGemFinderLevels,
    passiveGemBaseRatePerSecond,
    passiveGemRateMultiplier,
    idleGoldSurgeMultiplier,
    arcaneBoltBaseDamage,
  };
}
