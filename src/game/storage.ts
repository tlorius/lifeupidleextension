import type { GameState } from "./types";
import { defaultState } from "./state";

const KEY = "idle_save";

export function save(state: GameState): void {
  try {
    // Create a properly structured copy to avoid mutating the original
    const stateToSave: GameState = {
      ...state,
      meta: {
        ...state.meta,
        lastUpdate: Date.now(),
      },
    };
    const json = JSON.stringify(stateToSave);
    localStorage.setItem(KEY, json);
  } catch (e) {
    console.error("Failed to save game state:", e);
  }
}

/**
 * Safely merges a loaded state with the default state, filling in any missing fields.
 * This ensures backward compatibility when schema changes are made.
 */
function migrateState(loaded: unknown): GameState {
  // If we can't parse or load is invalid, return fresh default
  if (!loaded || typeof loaded !== "object") {
    return structuredClone(defaultState);
  }

  const loadedObj = loaded as Record<string, unknown>;

  /**
   * Recursively merge loaded values with defaults.
   * Loaded values take precedence, but missing fields come from defaults.
   */
  function mergeWithDefaults(loadedVal: unknown, defaultVal: unknown): unknown {
    // Handle primitives and arrays: use loaded if present, otherwise use default
    if (
      defaultVal === null ||
      typeof defaultVal !== "object" ||
      Array.isArray(defaultVal)
    ) {
      return loadedVal !== undefined ? loadedVal : defaultVal;
    }

    // If loaded is not an object, use the default
    if (
      loadedVal === null ||
      typeof loadedVal !== "object" ||
      Array.isArray(loadedVal)
    ) {
      return defaultVal;
    }

    // Both are objects: recursively merge them
    const merged: Record<string, unknown> = { ...defaultVal };
    for (const key in loadedVal) {
      const loadedKey = (loadedVal as Record<string, unknown>)[key];
      if (key in merged) {
        // Key exists in both - merge recursively
        const defaultKey = (defaultVal as Record<string, unknown>)[key];
        merged[key] = mergeWithDefaults(loadedKey, defaultKey);
      } else {
        // Key only in loaded state - preserve it
        merged[key] = loadedKey;
      }
    }
    return merged;
  }

  const migrated = mergeWithDefaults(loadedObj, defaultState) as GameState;

  const cropStorageCurrent = migrated.garden.cropStorage.current;
  const cropStorageLimits = migrated.garden.cropStorage.limits;
  if ("cereal" in cropStorageCurrent && !("grains" in cropStorageCurrent)) {
    cropStorageCurrent.grains = cropStorageCurrent.cereal;
    delete cropStorageCurrent.cereal;
  }
  if ("cereal" in cropStorageLimits && !("grains" in cropStorageLimits)) {
    cropStorageLimits.grains = cropStorageLimits.cereal;
    delete cropStorageLimits.cereal;
  }

  // Ensure version is up-to-date
  migrated.meta.version = defaultState.meta.version;
  if (typeof migrated.meta.lastUpdate !== "number") {
    migrated.meta.lastUpdate = Date.now();
  }

  return migrated;
}

export function load(): GameState | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;

  const parsed = JSON.parse(raw);
  return migrateState(parsed);
}
