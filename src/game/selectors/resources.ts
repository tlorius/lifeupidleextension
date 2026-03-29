import {
  getBaseStats,
  getEquipmentStats,
  getGoldIncome,
  getPetStats,
  getTotalStats,
  getUpgradeStats,
} from "../engine";
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
    goldIncomePerSecond: getGoldIncome(state),
    baseGoldPerSecond,
    upgradeGoldBonus,
    petGoldBonus,
    tempGoldBonus,
    totalGoldBonusPercent,
    totalGoldMultiplier,
    calculatedGoldPerSecond,
  };
}
