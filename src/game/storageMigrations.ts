import type { GameState } from "./types";
import { createDefaultState } from "./state";
import { ensureCharacterStateShape } from "./classes";

export const CURRENT_SAVE_VERSION = createDefaultState().meta.version;
const DEFAULT_GRAINS_CURRENT =
  createDefaultState().garden.cropStorage.current.grains;
const DEFAULT_GRAINS_LIMIT =
  createDefaultState().garden.cropStorage.limits.grains;

type MigrationStep = (state: GameState) => GameState;

function mergeWithDefaults(loadedVal: unknown, defaultVal: unknown): unknown {
  if (
    defaultVal === null ||
    typeof defaultVal !== "object" ||
    Array.isArray(defaultVal)
  ) {
    return loadedVal !== undefined ? loadedVal : defaultVal;
  }

  if (
    loadedVal === null ||
    typeof loadedVal !== "object" ||
    Array.isArray(loadedVal)
  ) {
    return defaultVal;
  }

  const merged: Record<string, unknown> = { ...defaultVal };
  for (const key in loadedVal) {
    const loadedKey = (loadedVal as Record<string, unknown>)[key];
    if (key in merged) {
      const defaultKey = (defaultVal as Record<string, unknown>)[key];
      merged[key] = mergeWithDefaults(loadedKey, defaultKey);
    } else {
      merged[key] = loadedKey;
    }
  }

  return merged;
}

function normalizeCropStorageCategoryKeys(state: GameState): GameState {
  const cropStorageCurrent = state.garden.cropStorage.current;
  const cropStorageLimits = state.garden.cropStorage.limits;

  if ("cereal" in cropStorageCurrent) {
    const hasExplicitGrainsValue =
      "grains" in cropStorageCurrent &&
      cropStorageCurrent.grains !== DEFAULT_GRAINS_CURRENT;
    if (!hasExplicitGrainsValue) {
      cropStorageCurrent.grains = cropStorageCurrent.cereal;
    }
    delete cropStorageCurrent.cereal;
  }

  if ("cereal" in cropStorageLimits) {
    const hasExplicitGrainsLimit =
      "grains" in cropStorageLimits &&
      cropStorageLimits.grains !== DEFAULT_GRAINS_LIMIT;
    if (!hasExplicitGrainsLimit) {
      cropStorageLimits.grains = cropStorageLimits.cereal;
    }
    delete cropStorageLimits.cereal;
  }

  return state;
}

const MIGRATION_STEPS: Record<number, MigrationStep> = {
  0: (state) => state,
  1: (state) => state,
  2: (state) => normalizeCropStorageCategoryKeys(state),
};

function getLoadedVersion(loadedObj: Record<string, unknown>): number {
  const meta = loadedObj.meta;
  if (!meta || typeof meta !== "object") return 0;

  const version = (meta as Record<string, unknown>).version;
  if (typeof version !== "number" || !Number.isFinite(version)) return 0;

  return Math.max(0, Math.floor(version));
}

function runVersionMigrations(
  state: GameState,
  fromVersion: number,
): GameState {
  const startVersion = Math.min(fromVersion, CURRENT_SAVE_VERSION);
  let next = state;

  for (let version = startVersion; version < CURRENT_SAVE_VERSION; version++) {
    const migrate = MIGRATION_STEPS[version] ?? ((s: GameState) => s);
    next = migrate(next);
    next.meta.version = version + 1;
  }

  next.meta.version = CURRENT_SAVE_VERSION;
  return next;
}

export function migrateState(loaded: unknown): GameState {
  const freshDefaultState = createDefaultState();

  if (!loaded || typeof loaded !== "object") {
    return freshDefaultState;
  }

  const loadedObj = loaded as Record<string, unknown>;
  const loadedVersion = getLoadedVersion(loadedObj);
  const merged = mergeWithDefaults(loadedObj, freshDefaultState) as GameState;
  merged.meta.version = loadedVersion;

  let migrated = runVersionMigrations(merged, loadedVersion);

  if (typeof migrated.meta.lastUpdate !== "number") {
    migrated.meta.lastUpdate = Date.now();
  }

  migrated = ensureCharacterStateShape(migrated);

  return migrated;
}
