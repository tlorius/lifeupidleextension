import { GameConfigSchema, type GameConfig } from "./configSchema";

/**
 * Runtime configuration loader with fallback cascade:
 * 1. Environment variables (VITE_GAME_CONFIG_*)
 * 2. JSON files from /public/config/
 * 3. Hardcoded defaults
 *
 * Validates configuration with Zod schemas, logs errors, and silently falls back.
 */

const HARDCODED_DEFAULTS: GameConfig = {
  combat: {
    player: {
      baseAttacksPerSecond: 1,
      agilityToApsScale: 0.2,
      maxAttacksPerSecond: 100,
      autoAdvanceAfterVictory: true,
      deathCheckpointMode: "boss",
      offlineResolutionMode: "expected-value",
    },
    progression: {
      bossIntervalLevels: 5,
      majorDifficultySpikeIntervalLevels: 20,
    },
    damageFormula: {
      minDamagePortionAfterDefense: 0.05,
    },
    crit: {
      damageMultiplier: 3.8,
      clickBonusMultiplier: 1.25,
      nonCritSetCap: 6,
      normalHitVarianceMin: 0.92,
      normalHitVarianceMax: 1.08,
      critVarianceMin: 1.02,
      critVarianceMax: 1.34,
    },
    click: {
      baseDamageMultiplier: 1.45,
    },
  },
  progression: {
    startingStats: {
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
    },
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
  },
  garden: {
    seedmaker: {
      defaultGemCost: 1,
      defaultResourceCost: 1,
    },
    terrain: {
      diamondCost: 100,
      breakChance: 0.25,
    },
    watering: {
      baseWaterAmount: 1,
      baseDuration: 0.15,
      baseDurationHours: 1,
    },
  },
  upgrades: {
    idleSurgeMultiplier: 10,
    overclock: {
      overclockMultiplierPerLevel: 0.25,
    },
    gemFinder: {
      gemRateMultiplierPerLevel: 0.08,
    },
  },
};

let cachedConfig: GameConfig = HARDCODED_DEFAULTS;
let hasLoaded = false;

/**
 * Load config from environment variables.
 * Env vars use format: VITE_GAME_CONFIG_<DOMAIN>_<KEY>=value
 * Example: VITE_GAME_CONFIG_COMBAT_PLAYER_BASE_ATTACKS_PER_SECOND=2
 */
function loadConfigFromEnv(): Partial<GameConfig> {
  const envConfig: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(import.meta.env)) {
    if (!key.startsWith("VITE_GAME_CONFIG_")) continue;
    const pathStr = key.substring("VITE_GAME_CONFIG_".length).toLowerCase();
    const parts = pathStr.split("_");
    let current = envConfig;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]] as Record<string, unknown>;
    }
    const lastKey = parts[parts.length - 1];
    try {
      current[lastKey] = JSON.parse(value as string);
    } catch {
      current[lastKey] = value;
    }
  }
  return envConfig;
}

/**
 * Load config from JSON files in /public/config/
 */
async function loadConfigFromJson(): Promise<Partial<GameConfig>> {
  const domains = ["combat", "progression", "garden", "upgrades"];
  const loadedConfig: Partial<GameConfig> = {};

  for (const domain of domains) {
    try {
      const response = await fetch(`/config/${domain}.config.json`);
      if (!response.ok) {
        if (response.status !== 404) {
          console.warn(
            `Failed to load ${domain}.config.json: ${response.statusText}`,
          );
        }
        continue;
      }
      const data = await response.json();
      (loadedConfig as Record<string, unknown>)[domain] = data;
    } catch (error) {
      console.warn(`Error loading ${domain}.config.json:`, error);
    }
  }

  return loadedConfig;
}

/**
 * Merge config objects, with later sources overriding earlier ones.
 */
function mergeConfigs(
  ...configs: (Partial<GameConfig> | undefined)[]
): GameConfig {
  const merged: Record<string, unknown> = JSON.parse(
    JSON.stringify(HARDCODED_DEFAULTS),
  );

  for (const config of configs) {
    if (!config) continue;
    for (const [key, value] of Object.entries(config)) {
      if (
        typeof value === "object" &&
        value !== null &&
        typeof merged[key] === "object"
      ) {
        merged[key] = { ...merged[key], ...value };
      } else {
        merged[key] = value;
      }
    }
  }

  return merged as GameConfig;
}

/**
 * Load and validate config from all sources with fallback chain.
 */
export async function initializeConfig(): Promise<GameConfig> {
  try {
    const envConfig = loadConfigFromEnv();
    const jsonConfig = await loadConfigFromJson();
    const merged = mergeConfigs(HARDCODED_DEFAULTS, jsonConfig, envConfig);
    const validated = GameConfigSchema.parse(merged);
    cachedConfig = validated;
    hasLoaded = true;
    return validated;
  } catch (error) {
    console.error("Config validation failed, using hardcoded defaults:", error);
    cachedConfig = HARDCODED_DEFAULTS;
    hasLoaded = true;
    return HARDCODED_DEFAULTS;
  }
}

/**
 * Get current cached config (call initializeConfig first)
 */
export function getConfig(): GameConfig {
  if (!hasLoaded) {
    console.warn(
      "Config not initialized—using hardcoded defaults. Call initializeConfig() first.",
    );
  }
  return cachedConfig;
}

/**
 * Hot-reload config from JSON files and environment variables.
 */
export async function reloadConfig(): Promise<GameConfig> {
  return initializeConfig();
}
