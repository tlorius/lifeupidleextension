import type { GameState } from "./types";
import { migrateState } from "./storageMigrations";

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

export function load(): GameState | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return migrateState(parsed);
  } catch (e) {
    console.error("Failed to load game state:", e);
    return null;
  }
}
