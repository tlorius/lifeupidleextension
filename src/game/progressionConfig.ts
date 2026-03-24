import type { PlayerProgress, Stats } from "./types";

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

export const STARTING_PLAYER_PROGRESS: PlayerProgress = {
  level: 1,
  xp: 0,
  totalXpEarned: 0,
  unspentPoints: 0,
  unlockedSystems: {
    spells: false,
  },
};

export const PROGRESSION_CONFIG = {
  levelCaps: {
    softCapLevel: 100,
    hardCapLevel: 136,
  },
  xpFormula: {
    base: 60,
    quadratic: 12,
    linear: 28,
    postSixtyLinearMultiplierPerLevel: 0.06,
    postSoftCapExponentialMultiplier: 1.32,
  },
  unlocks: {
    spellsAtLevel: 8,
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
