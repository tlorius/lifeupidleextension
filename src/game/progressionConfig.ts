import type { PlayerProgress, Stats } from "./types";
import { getProgressionConfig } from "./config";

export const STARTING_PLAYER_STATS: Stats = {
  attack: 10,
  hp: 100,
  agility: 1,
  critChance: 1,
  intelligence: 10,
  defense: 10,
  gardening: 1,
  goldIncome: 0,
  energyRegeneration: 0,
  plantGrowth: 0,
  wateringDuration: 0,
};

export function getSTARTING_PLAYER_STATS(): Stats {
  const cfg = getProgressionConfig();
  return {
    attack: cfg.startingStats.attack,
    hp: cfg.startingStats.hp,
    agility: cfg.startingStats.agility,
    critChance: cfg.startingStats.critChance,
    intelligence: cfg.startingStats.intelligence,
    defense: cfg.startingStats.defense,
    gardening: cfg.startingStats.gardening,
    goldIncome: cfg.startingStats.goldIncome,
    energyRegeneration: cfg.startingStats.energyRegeneration,
    plantGrowth: cfg.startingStats.plantGrowth,
    wateringDuration: cfg.startingStats.wateringDuration,
  };
}

export const STARTING_PLAYER_PROGRESS: PlayerProgress = {
  level: 1,
  xp: 0,
  totalXpEarned: 0,
  unspentPoints: 0,
  unlockedSystems: {
    spells: false,
    classes: false,
  },
};

/**
 * Dynamic getter for progression configuration that pulls from runtime config system.
 * Enables balance changes without redeployment.
 */
export function getPROGRESSION_CONFIG() {
  const cfg = getProgressionConfig();
  return {
    levelCaps: {
      softCapLevel: cfg.levelCaps.softCapLevel,
      hardCapLevel: cfg.levelCaps.hardCapLevel,
    },
    xpFormula: {
      base: cfg.xpFormula.base,
      quadratic: cfg.xpFormula.quadratic,
      linear: cfg.xpFormula.linear,
      postTenLinearMultiplierPerLevel:
        cfg.xpFormula.postTenLinearMultiplierPerLevel,
      postSixtyLinearMultiplierPerLevel:
        cfg.xpFormula.postSixtyLinearMultiplierPerLevel,
      postSoftCapExponentialMultiplier:
        cfg.xpFormula.postSoftCapExponentialMultiplier,
    },
    unlocks: {
      spellsAtLevel: cfg.unlocks.spellsAtLevel,
      classesAtLevel: cfg.unlocks.classesAtLevel,
    },
    levelUpGains: {
      hpPerLevel: cfg.levelUpGains.hpPerLevel,
      attackPerLevel: cfg.levelUpGains.attackPerLevel,
      agilityEveryLevels: cfg.levelUpGains.agilityEveryLevels,
      agilityPerTrigger: cfg.levelUpGains.agilityPerTrigger,
      midgameBoostStartsAtLevel: cfg.levelUpGains.midgameBoostStartsAtLevel,
      midgameHpBonusPerLevel: cfg.levelUpGains.midgameHpBonusPerLevel,
      midgameAttackBonusPerLevel: cfg.levelUpGains.midgameAttackBonusPerLevel,
      endgameBoostStartsAtLevel: cfg.levelUpGains.endgameBoostStartsAtLevel,
      endgameHpBonusPerLevel: cfg.levelUpGains.endgameHpBonusPerLevel,
      endgameAttackBonusPerLevel: cfg.levelUpGains.endgameAttackBonusPerLevel,
      endgameDefenseBonusPerLevel: cfg.levelUpGains.endgameDefenseBonusPerLevel,
      endgameIntelligenceBonusPerLevel:
        cfg.levelUpGains.endgameIntelligenceBonusPerLevel,
      endgameAgilityBonusPerLevel: cfg.levelUpGains.endgameAgilityBonusPerLevel,
      milestoneEveryLevels: cfg.levelUpGains.milestoneEveryLevels,
      milestoneDefenseBonus: cfg.levelUpGains.milestoneDefenseBonus,
      milestoneIntelligenceBonus: cfg.levelUpGains.milestoneIntelligenceBonus,
    },
  };
}

// Legacy export for backward compatibility (no longer used after refactor)
export const PROGRESSION_CONFIG = {
  levelCaps: {
    softCapLevel: 100,
    hardCapLevel: 136,
  },
  xpFormula: {
    base: 60,
    quadratic: 12,
    linear: 28,
    postTenLinearMultiplierPerLevel: 0.025,
    postSixtyLinearMultiplierPerLevel: 0.06,
    postSoftCapExponentialMultiplier: 1.32,
  },
  unlocks: {
    spellsAtLevel: 8,
    classesAtLevel: 10,
  },
  levelUpGains: {
    hpPerLevel: 18,
    attackPerLevel: 4,
    agilityEveryLevels: 2,
    agilityPerTrigger: 0.8,
    midgameBoostStartsAtLevel: 50,
    midgameHpBonusPerLevel: 12,
    midgameAttackBonusPerLevel: 3,
    endgameBoostStartsAtLevel: 100,
    endgameHpBonusPerLevel: 30,
    endgameAttackBonusPerLevel: 8,
    endgameDefenseBonusPerLevel: 4,
    endgameIntelligenceBonusPerLevel: 6,
    endgameAgilityBonusPerLevel: 0.6,
    milestoneEveryLevels: 10,
    milestoneDefenseBonus: 2,
    milestoneIntelligenceBonus: 3,
  },
} as const;
