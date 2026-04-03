import {
  getActiveClassNodeStatBonuses,
  getBaseStats,
  getEquipmentStats,
  getGoldIncome,
  getPetStats,
  getTotalStats,
  getUniqueSetStats,
  getUpgradeStats,
} from "../engine";
import {
  getCombatSpellDamageBreakdown,
  getDamageAfterDefense,
  getDefenseMitigationRatio,
  getPlayerAttackSpeedBreakdown,
} from "../combat";
import { getActiveSpellSetDamageMultiplier } from "../itemSets";
import { defaultState } from "../state";
import {
  getPassiveGemRatePerSecond,
  getUpgradeDef,
  getUpgradeLevel,
} from "../upgrades";
import type { GameState, Stats } from "../types";

export interface ResourcesDisplayViewModel {
  total: ReturnType<typeof getTotalStats>;
  baseStats: ReturnType<typeof getBaseStats>;
  equipmentStats: ReturnType<typeof getEquipmentStats>;
  upgradeStats: ReturnType<typeof getUpgradeStats>;
  petStats: ReturnType<typeof getPetStats>;
  setStats: ReturnType<typeof getUniqueSetStats>;
  classNodeStats: ReturnType<typeof getActiveClassNodeStatBonuses>;
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
  passiveGemRatePerSecond: number;
  basePassiveGemRatePerSecond: number;
  totalGemFinderLevels: number;
  gemRateMultiplier: number;
  attackSpeed: ReturnType<typeof getPlayerAttackSpeedBreakdown>;
  defenseRawMitigationPercent: number;
  defenseEffectiveMitigationPercent: number;
  defenseSampleRawDamage: number;
  defenseSampleDamageAfterMitigation: number;
  intelligenceSpellBonus: {
    intelligence: number;
    arcaneBoltBaseCoefficient: number;
    arcaneBoltBaseBonusDamage: number;
    arcaneBoltEffectiveBonusDamage: number;
    emberLanceBaseCoefficient: number;
    emberLanceBaseBonusDamage: number;
    emberLanceEffectiveBonusDamage: number;
    classSpellDamageMultiplier: number;
    arcaneBoltSetMultiplier: number;
    emberLanceSetMultiplier: number;
  };
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
  const setStats = getUniqueSetStats(state);
  const classNodeStats = getActiveClassNodeStatBonuses(state);

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

  const passiveGemRatePerSecond = getPassiveGemRatePerSecond(state);
  const chaosGemFoundryLevel = getUpgradeLevel(state, "chaos_gem_foundry");
  const basePassiveGemRatePerSecond = Math.max(0, chaosGemFoundryLevel) * 0.35;
  const totalGemFinderLevels = state.upgrades.reduce((sum, upgrade) => {
    const def = getUpgradeDef(upgrade.id);
    if (!def || def.type !== "gemFinder") {
      return sum;
    }
    return sum + Math.max(0, upgrade.level);
  }, 0);
  const gemRateMultiplier = 1 + totalGemFinderLevels * 0.08;

  const attackSpeed = getPlayerAttackSpeedBreakdown(state);

  const defenseValue = Math.max(0, total.defense ?? 0);
  const defenseRawMitigationPercent =
    getDefenseMitigationRatio(defenseValue) * 100;
  const defenseSampleRawDamage = Math.max(1, state.combat.enemy.damage);
  const defenseSampleDamageAfterMitigation = getDamageAfterDefense(
    defenseSampleRawDamage,
    defenseValue,
  );
  const defenseEffectiveMitigationPercent =
    (1 - defenseSampleDamageAfterMitigation / defenseSampleRawDamage) * 100;

  const intelligence = Math.max(0, total.intelligence ?? 0);
  const arcaneBoltBaseCoefficient = 5;
  const emberLanceBaseCoefficient = 7;
  const spellBreakdown = getCombatSpellDamageBreakdown(state);
  const arcaneBoltSetMultiplier = getActiveSpellSetDamageMultiplier(
    state,
    "arcane_bolt",
  );
  const emberLanceSetMultiplier = getActiveSpellSetDamageMultiplier(
    state,
    "ember_lance",
  );
  const arcaneBoltBaseBonusDamage = intelligence * arcaneBoltBaseCoefficient;
  const emberLanceBaseBonusDamage = intelligence * emberLanceBaseCoefficient;
  const arcaneBoltEffectiveBonusDamage =
    arcaneBoltBaseBonusDamage *
    spellBreakdown.classSpellDamageMultiplier *
    arcaneBoltSetMultiplier;
  const emberLanceEffectiveBonusDamage =
    emberLanceBaseBonusDamage *
    spellBreakdown.classSpellDamageMultiplier *
    emberLanceSetMultiplier;

  return {
    total,
    baseStats,
    equipmentStats,
    upgradeStats,
    petStats,
    setStats,
    classNodeStats,
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
    passiveGemRatePerSecond,
    basePassiveGemRatePerSecond,
    totalGemFinderLevels,
    gemRateMultiplier,
    attackSpeed,
    defenseRawMitigationPercent,
    defenseEffectiveMitigationPercent,
    defenseSampleRawDamage,
    defenseSampleDamageAfterMitigation,
    intelligenceSpellBonus: {
      intelligence,
      arcaneBoltBaseCoefficient,
      arcaneBoltBaseBonusDamage,
      arcaneBoltEffectiveBonusDamage,
      emberLanceBaseCoefficient,
      emberLanceBaseBonusDamage,
      emberLanceEffectiveBonusDamage,
      classSpellDamageMultiplier: spellBreakdown.classSpellDamageMultiplier,
      arcaneBoltSetMultiplier,
      emberLanceSetMultiplier,
    },
  };
}
