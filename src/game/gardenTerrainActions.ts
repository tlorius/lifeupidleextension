import { ROCK_CONFIG } from "./gameConfig";
import type { GameState } from "./types";

export type FieldUnlockCostResult = {
  type: "free" | "diamond" | "rock";
  cost?: number;
  rockTier?: "small" | "medium" | "large";
};

interface UnlockFieldHelpers {
  isAdjacentToUnlocked: (state: GameState, row: number, col: number) => boolean;
  isFieldUnlocked: (state: GameState, row: number, col: number) => boolean;
  ensureRocksForPreviewArea: (state: GameState) => void;
}

type BreakRockResult = {
  success: boolean;
  reason?: string;
  newState?: GameState;
};

function getRockTierAtPosition(
  state: GameState,
  row: number,
  col: number,
): "small" | "medium" | "large" | null {
  if (state.garden.rocks.small.some((r) => r.row === row && r.col === col)) {
    return "small";
  }
  if (state.garden.rocks.medium.some((r) => r.row === row && r.col === col)) {
    return "medium";
  }
  if (state.garden.rocks.large.some((r) => r.row === row && r.col === col)) {
    return "large";
  }
  return null;
}

export function getFieldUnlockCost(
  state: GameState,
  row: number,
  col: number,
  isFieldUnlocked: (state: GameState, row: number, col: number) => boolean,
): FieldUnlockCostResult {
  if (!isFieldUnlocked(state, row, col)) {
    const baseCost = 50;
    const unlockedCount = state.garden.unlockedFields?.length ?? 0;
    const cost = baseCost + unlockedCount * 10;

    const rockTier = getRockTierAtPosition(state, row, col);
    if (rockTier) {
      return { type: "rock", rockTier };
    }

    return {
      type: "diamond",
      cost,
    };
  }

  return { type: "free" };
}

export function unlockField(
  state: GameState,
  row: number,
  col: number,
  helpers: UnlockFieldHelpers,
): GameState {
  if (!helpers.isAdjacentToUnlocked(state, row, col)) {
    return state;
  }

  const cost = getFieldUnlockCost(state, row, col, helpers.isFieldUnlocked);

  if (cost.type === "diamond") {
    const diamondCost = cost.cost ?? 50;
    if ((state.resources.gems ?? 0) < diamondCost) return state;

    const newState = { ...state };
    newState.resources.gems = (newState.resources.gems ?? 0) - diamondCost;

    const unlocked = [...(newState.garden.unlockedFields ?? [])];
    if (!unlocked.some((f) => f.row === row && f.col === col)) {
      unlocked.push({ row, col });
    }
    newState.garden.unlockedFields = unlocked;

    const newRows = Math.max(newState.garden.gridSize.rows, row + 1);
    const newCols = Math.max(newState.garden.gridSize.cols, col + 1);
    newState.garden.gridSize = { rows: newRows, cols: newCols };
    helpers.ensureRocksForPreviewArea(newState);

    return newState;
  }

  if (cost.type === "rock") {
    const rockTier = cost.rockTier as "small" | "medium" | "large";
    const rockConfig = ROCK_CONFIG[rockTier];

    if ((state.resources.energy ?? 0) < rockConfig.energyCost) return state;

    const pickaxeToolId = Object.keys(state.garden.tools).find((t) =>
      t.startsWith("pickaxe"),
    );
    if (!pickaxeToolId) return state;

    const newState = { ...state };
    newState.resources.energy =
      (newState.resources.energy ?? 0) - rockConfig.energyCost;

    const newRocks = { ...newState.garden.rocks };
    newRocks[rockTier] = newRocks[rockTier].filter(
      (r) => !(r.row === row && r.col === col),
    );
    newState.garden.rocks = newRocks;

    const unlocked = [...(newState.garden.unlockedFields ?? [])];
    if (!unlocked.some((f) => f.row === row && f.col === col)) {
      unlocked.push({ row, col });
    }
    newState.garden.unlockedFields = unlocked;

    if (
      row >= newState.garden.gridSize.rows ||
      col >= newState.garden.gridSize.cols
    ) {
      const newRows = Math.max(newState.garden.gridSize.rows, row + 1);
      const newCols = Math.max(newState.garden.gridSize.cols, col + 1);
      newState.garden.gridSize = { rows: newRows, cols: newCols };
    }
    helpers.ensureRocksForPreviewArea(newState);

    return newState;
  }

  return state;
}

export function breakRock(
  state: GameState,
  row: number,
  col: number,
  pickaxeRef: string,
  ensureRocksForPreviewArea: (state: GameState) => void,
): BreakRockResult {
  const rockTier = getRockTierAtPosition(state, row, col);

  if (!rockTier) {
    return { success: false, reason: "No rock at this position" };
  }

  const config = ROCK_CONFIG[rockTier];
  const inventoryPickaxe = state.inventory.find(
    (item) => item.uid === pickaxeRef,
  );
  const pickaxeId = inventoryPickaxe?.itemId ?? pickaxeRef;
  const pickaxeLevel =
    inventoryPickaxe?.level ?? state.garden.tools[pickaxeId] ?? 0;

  if (pickaxeLevel < config.minPickaxeLevel) {
    return {
      success: false,
      reason: `Your pickaxe is level ${pickaxeLevel}. You need level ${config.minPickaxeLevel} to break ${rockTier} rocks.`,
    };
  }

  if ((state.resources.energy ?? 0) < config.energyCost) {
    return {
      success: false,
      reason: `Not enough mana. You need ${config.energyCost} mana, but only have ${state.resources.energy ?? 0}.`,
    };
  }

  const newState = { ...state };
  newState.resources.energy =
    (newState.resources.energy ?? 0) - config.energyCost;

  const newRocks = { ...newState.garden.rocks };
  newRocks[rockTier] = newRocks[rockTier].filter(
    (r) => !(r.row === row && r.col === col),
  );
  newState.garden.rocks = newRocks;

  const unlocked = [...(newState.garden.unlockedFields ?? [])];
  if (!unlocked.some((f) => f.row === row && f.col === col)) {
    unlocked.push({ row, col });
  }
  newState.garden.unlockedFields = unlocked;

  if (
    row >= newState.garden.gridSize.rows ||
    col >= newState.garden.gridSize.cols
  ) {
    const newRows = Math.max(newState.garden.gridSize.rows, row + 1);
    const newCols = Math.max(newState.garden.gridSize.cols, col + 1);
    newState.garden.gridSize = { rows: newRows, cols: newCols };
  }
  ensureRocksForPreviewArea(newState);

  return { success: true, newState };
}
