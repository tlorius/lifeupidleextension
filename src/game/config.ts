import { getConfig } from "./configLoader";
import type {
  CombatConfig,
  GardenConfig,
  ProgressionConfig,
  UpgradeConfig,
} from "./configSchema";

/**
 * Configuration module - single source of truth for accessing runtime config.
 * All game code should access config through these getters, not hardcoded constants.
 */

export function getCombatConfig(): CombatConfig {
  return getConfig().combat!;
}

export function getProgressionConfig(): ProgressionConfig {
  return getConfig().progression!;
}

export function getGardenConfig(): GardenConfig {
  return getConfig().garden!;
}

export function getUpgradeConfig(): UpgradeConfig {
  return getConfig().upgrades!;
}

/**
 * Convenience getters for frequently-used values
 */

export function getCombatPlayerConfig() {
  return getCombatConfig().player;
}

export function getCombatDamageFormulaConfig() {
  return getCombatConfig().damageFormula;
}

export function getCombatCritConfig() {
  return getCombatConfig().crit;
}

export function getProgressionXpFormulaConfig() {
  return getProgressionConfig().xpFormula;
}

export function getProgressionLevelCapsConfig() {
  return getProgressionConfig().levelCaps;
}

export function getProgressionLevelUpGainsConfig() {
  return getProgressionConfig().levelUpGains;
}

export function getProgressionStartingStatsConfig() {
  return getProgressionConfig().startingStats;
}
