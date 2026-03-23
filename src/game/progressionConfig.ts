import type { PlayerProgress, Stats } from "./types";

export const STARTING_PLAYER_STATS: Stats = {
  attack: 10,
  hp: 100,
  agility: 1,
  critChance: 5,
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
  xpFormula: {
    base: 20,
    quadratic: 7,
    linear: 18,
  },
  levelUpGains: {
    hpPerLevel: 8,
    attackPerLevel: 1,
    agilityEveryLevels: 2,
    agilityPerTrigger: 0.4,
    critEveryLevels: 5,
    critPerTrigger: 0.5,
  },
} as const;
