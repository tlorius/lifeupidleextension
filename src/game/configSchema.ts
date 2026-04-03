import { z } from "zod";

/**
 * Zod schema definitions for runtime game configuration.
 * Enables strict validation of config files with fallback to hardcoded defaults.
 */

export const CombatConfigSchema = z.object({
  player: z.object({
    baseAttacksPerSecond: z.number().default(1),
    agilityToApsScale: z.number().default(0.2),
    maxAttacksPerSecond: z.number().default(100),
    autoAdvanceAfterVictory: z.boolean().default(true),
    deathCheckpointMode: z.enum(["boss", "level"]).default("boss"),
    offlineResolutionMode: z
      .enum(["expected-value", "deterministic"])
      .default("expected-value"),
  }),
  progression: z.object({
    bossIntervalLevels: z.number().default(5),
    majorDifficultySpikeIntervalLevels: z.number().default(20),
  }),
  damageFormula: z.object({
    minDamagePortionAfterDefense: z.number().default(0.05),
  }),
  crit: z.object({
    damageMultiplier: z.number().default(3.8),
    clickBonusMultiplier: z.number().default(1.25),
    nonCritSetCap: z.number().default(6),
    normalHitVarianceMin: z.number().default(0.92),
    normalHitVarianceMax: z.number().default(1.08),
    critVarianceMin: z.number().default(1.02),
    critVarianceMax: z.number().default(1.34),
  }),
  click: z.object({
    baseDamageMultiplier: z.number().default(1.45),
  }),
});

export const ProgressionConfigSchema = z.object({
  startingStats: z.object({
    attack: z.number().default(10),
    hp: z.number().default(100),
    agility: z.number().default(1),
    critChance: z.number().default(1),
    intelligence: z.number().default(10),
    defense: z.number().default(10),
    gardening: z.number().default(1),
    goldIncome: z.number().default(0),
    energyRegeneration: z.number().default(0),
    plantGrowth: z.number().default(0),
    wateringDuration: z.number().default(0),
  }),
  levelCaps: z.object({
    softCapLevel: z.number().default(100),
    hardCapLevel: z.number().default(136),
  }),
  xpFormula: z.object({
    base: z.number().default(60),
    quadratic: z.number().default(12),
    linear: z.number().default(28),
    postTenLinearMultiplierPerLevel: z.number().default(0.025),
    postSixtyLinearMultiplierPerLevel: z.number().default(0.06),
    postSoftCapExponentialMultiplier: z.number().default(1.32),
  }),
  unlocks: z.object({
    spellsAtLevel: z.number().default(8),
    classesAtLevel: z.number().default(10),
  }),
  levelUpGains: z.object({
    hpPerLevel: z.number().default(18),
    attackPerLevel: z.number().default(4),
    agilityEveryLevels: z.number().default(2),
    agilityPerTrigger: z.number().default(0.8),
    midgameBoostStartsAtLevel: z.number().default(50),
    midgameHpBonusPerLevel: z.number().default(12),
    midgameAttackBonusPerLevel: z.number().default(3),
    endgameBoostStartsAtLevel: z.number().default(100),
    endgameHpBonusPerLevel: z.number().default(30),
    endgameAttackBonusPerLevel: z.number().default(8),
    endgameDefenseBonusPerLevel: z.number().default(4),
    endgameIntelligenceBonusPerLevel: z.number().default(6),
    endgameAgilityBonusPerLevel: z.number().default(0.6),
    milestoneEveryLevels: z.number().default(10),
    milestoneDefenseBonus: z.number().default(2),
    milestoneIntelligenceBonus: z.number().default(3),
  }),
});

export const GardenConfigSchema = z.object({
  seedmaker: z.object({
    defaultGemCost: z.number().default(1),
    defaultResourceCost: z.number().default(1),
  }),
  terrain: z.object({
    diamondCost: z.number().default(100),
    breakChance: z.number().default(0.25),
  }),
  watering: z.object({
    baseWaterAmount: z.number().default(1),
    baseDuration: z.number().default(0.15),
    baseDurationHours: z.number().default(1),
  }),
});

export const UpgradeConfigSchema = z.object({
  idleSurgeMultiplier: z.number().default(10),
  overclock: z.object({
    overclockMultiplierPerLevel: z.number().default(0.25),
  }),
  gemFinder: z.object({
    gemRateMultiplierPerLevel: z.number().default(0.08),
  }),
});

export const GameConfigSchema = z.object({
  combat: CombatConfigSchema.optional(),
  progression: ProgressionConfigSchema.optional(),
  garden: GardenConfigSchema.optional(),
  upgrades: UpgradeConfigSchema.optional(),
});

export type GameConfig = z.infer<typeof GameConfigSchema>;
export type CombatConfig = z.infer<typeof CombatConfigSchema>;
export type ProgressionConfig = z.infer<typeof ProgressionConfigSchema>;
export type GardenConfig = z.infer<typeof GardenConfigSchema>;
export type UpgradeConfig = z.infer<typeof UpgradeConfigSchema>;
