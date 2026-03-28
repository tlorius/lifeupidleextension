import {
  reconcileGardenRocksForPreview,
  craftSeedFromSeedMaker,
  plantCrop,
  harvestCrop,
  reduceCropGrowthTime,
  prestigeCropType,
  unlockField,
  breakRock,
  moveCropArea,
  setCropSprinkler,
  placeSprinklerOnField,
  removeSprinklerFromField,
  toggleSprinkler,
  placeHarvesterOnField,
  removeHarvesterFromField,
  placePlanterOnField,
  removePlanterFromField,
  waterField,
  getCropDef,
  getGrowthProgress,
} from "../garden";
import { TOOL_CONFIG } from "../gameConfig";
import { resolveGardenCropIdFromSeed } from "../selectors/garden";
import type { GameState, FieldPosition } from "../types";

export type GardenAction =
  | { type: "garden/reconcileRocks" }
  | { type: "garden/craftSeed"; seedId: string }
  | { type: "garden/startSeedMaker"; seedId: string }
  | { type: "garden/stopSeedMaker" }
  | { type: "garden/selectSeedMakerRecipe"; seedId: string }
  | { type: "garden/selectPlanterSeed"; seedId: string }
  | {
      type: "garden/assignPlanterTileSeed";
      row: number;
      col: number;
      seedId: string;
    }
  | {
      type: "garden/plantCrop";
      row: number;
      col: number;
      cropId: string;
      consumeSeedId?: string;
    }
  | { type: "garden/harvestCrop"; cropId: string; cropIndex: number }
  | { type: "garden/prestigeCrop"; cropId: string }
  | { type: "garden/unlockField"; row: number; col: number }
  | {
      type: "garden/reduceCropGrowthTime";
      cropId: string;
      cropIndex: number;
      minutes: number;
      gemCost: number;
    }
  | {
      type: "garden/breakRock";
      row: number;
      col: number;
      pickaxeId: string;
    }
  | {
      type: "garden/setCropSprinkler";
      row: number;
      col: number;
      sprinklerId: string | null;
    }
  | {
      type: "garden/placeSprinkler";
      row: number;
      col: number;
      sprinklerId: string;
    }
  | { type: "garden/removeSprinkler"; row: number; col: number }
  | {
      type: "garden/moveCropArea";
      sourceRow: number;
      sourceCol: number;
      targetRow: number;
      targetCol: number;
      areaSize: number;
      moveSprinklers: boolean;
    }
  | { type: "garden/toggleSprinkler"; row: number; col: number }
  | {
      type: "garden/placeHarvester";
      row: number;
      col: number;
      harvesterId: string;
    }
  | { type: "garden/removeHarvester"; row: number; col: number }
  | {
      type: "garden/placePlanter";
      row: number;
      col: number;
      planterId: string;
      seedId: string | null;
    }
  | { type: "garden/removePlanter"; row: number; col: number }
  | {
      type: "garden/scytheHarvestArea";
      centerRow: number;
      centerCol: number;
      toolId: string;
    }
  | {
      type: "garden/waterArea";
      centerRow: number;
      centerCol: number;
      toolId: string;
    }
  | {
      type: "garden/seedBagPlantArea";
      centerRow: number;
      centerCol: number;
      toolId: string;
      seedId: string;
      seedBagPlantEnergyCost: number;
    }
  | { type: "garden/equipTool"; toolUid: string }
  | { type: "garden/unequipTool" };

// ---------------------------------------------------------------------------
// Exported area-computation helpers
// Garden.tsx calls these directly when it needs feedback (alert) before/after
// applying the resulting state.
// ---------------------------------------------------------------------------

export interface WaterAreaResult {
  nextState: GameState;
  wateredTiles: number;
  lackedEnergy: boolean;
}

export interface SeedBagPlantResult {
  nextState: GameState;
  plantedTiles: number;
  lackedEnergy: boolean;
  lackedSeeds: boolean;
}

type StartSeedMakerAction = Extract<
  GardenAction,
  { type: "garden/startSeedMaker" }
>;
type SelectSeedMakerRecipeAction = Extract<
  GardenAction,
  { type: "garden/selectSeedMakerRecipe" }
>;
type SelectPlanterSeedAction = Extract<
  GardenAction,
  { type: "garden/selectPlanterSeed" }
>;
type AssignPlanterTileSeedAction = Extract<
  GardenAction,
  { type: "garden/assignPlanterTileSeed" }
>;
type PlantCropAction = Extract<GardenAction, { type: "garden/plantCrop" }>;
type EquipToolAction = Extract<GardenAction, { type: "garden/equipTool" }>;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function normalizeToolId(toolId: string | null | undefined): string {
  if (!toolId) return "";
  return toolId
    .replace(/_variant\d+/g, "")
    .replace(/_\d+$/g, "")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();
}

function getToolRangeSize(toolId: string): number {
  const normalized = normalizeToolId(toolId);
  const toolDef =
    (TOOL_CONFIG[toolId as keyof typeof TOOL_CONFIG] as
      | { stats?: { waterRange?: number; harvestRange?: number } }
      | undefined) ??
    (TOOL_CONFIG[normalized as keyof typeof TOOL_CONFIG] as
      | { stats?: { waterRange?: number; harvestRange?: number } }
      | undefined);

  const configuredRange =
    toolDef?.stats?.harvestRange && toolDef.stats.harvestRange > 0
      ? toolDef.stats.harvestRange
      : toolDef?.stats?.waterRange;

  if (
    typeof configuredRange === "number" &&
    Number.isFinite(configuredRange) &&
    configuredRange > 0
  ) {
    return configuredRange;
  }

  // Fallback for ids without authored ranges.
  if (normalized.includes("unique")) return 7;
  if (normalized.includes("legendary")) return 5;
  if (normalized.includes("epic")) return 3;
  if (normalized.includes("rare")) return 3;
  return 1;
}

function getToolCoverageTiles(
  centerRow: number,
  centerCol: number,
  toolId: string,
): FieldPosition[] {
  const rangeSize = getToolRangeSize(toolId);
  const squareRadius = Math.max(0, Math.floor((rangeSize - 1) / 2));

  const tilesWithDistance: Array<{
    row: number;
    col: number;
    dr: number;
    dc: number;
  }> = [];

  for (let dr = -squareRadius; dr <= squareRadius; dr++) {
    for (let dc = -squareRadius; dc <= squareRadius; dc++) {
      tilesWithDistance.push({
        row: centerRow + dr,
        col: centerCol + dc,
        dr,
        dc,
      });
    }
  }

  tilesWithDistance.sort((a, b) => {
    const ringA = Math.max(Math.abs(a.dr), Math.abs(a.dc));
    const ringB = Math.max(Math.abs(b.dr), Math.abs(b.dc));
    if (ringA !== ringB) return ringA - ringB;

    const manhattanA = Math.abs(a.dr) + Math.abs(a.dc);
    const manhattanB = Math.abs(b.dr) + Math.abs(b.dc);
    if (manhattanA !== manhattanB) return manhattanA - manhattanB;

    if (a.dr !== b.dr) return a.dr - b.dr;
    return a.dc - b.dc;
  });

  return tilesWithDistance.map((tile) => ({ row: tile.row, col: tile.col }));
}

function isFieldUnlockedInState(
  state: GameState,
  row: number,
  col: number,
): boolean {
  const unlocked = state.garden.unlockedFields;
  if (unlocked && unlocked.length > 0) {
    return unlocked.some((f) => f.row === row && f.col === col);
  }
  return row < state.garden.gridSize.rows && col < state.garden.gridSize.cols;
}

function hasRockAtPositionInState(
  state: GameState,
  row: number,
  col: number,
): boolean {
  const rocks = state.garden.rocks;
  return (
    rocks.small.some((r) => r.row === row && r.col === col) ||
    rocks.medium.some((r) => r.row === row && r.col === col) ||
    rocks.large.some((r) => r.row === row && r.col === col)
  );
}

function hasCropAtPositionInState(
  state: GameState,
  row: number,
  col: number,
): boolean {
  for (const cropList of Object.values(state.garden.crops)) {
    if (
      cropList.some((c) => c.position?.row === row && c.position?.col === col)
    )
      return true;
  }
  return false;
}

function consumeOneSeedFromInventory(
  inventory: GameState["inventory"],
  seedId: string,
): { inventory: GameState["inventory"]; consumed: boolean } {
  const idx = inventory.findIndex(
    (item) => item.itemId === seedId && item.quantity > 0,
  );
  if (idx < 0) return { inventory, consumed: false };

  const nextInventory = [...inventory];
  const nextItem = { ...nextInventory[idx] };
  nextItem.quantity -= 1;

  if (nextItem.quantity <= 0) {
    nextInventory.splice(idx, 1);
  } else {
    nextInventory[idx] = nextItem;
  }

  return { inventory: nextInventory, consumed: true };
}

function applySeedMakerStart(
  state: GameState,
  action: StartSeedMakerAction,
): GameState {
  return {
    ...state,
    garden: {
      ...state.garden,
      automationTimers: {
        ...(state.garden.automationTimers ?? {}),
        seedMakerRemainderMs: 0,
      },
      seedMaker: {
        ...(state.garden.seedMaker ?? {}),
        isRunning: true,
        selectedSeedId: action.seedId,
      },
    },
  };
}

function applySeedMakerStop(state: GameState): GameState {
  return {
    ...state,
    garden: {
      ...state.garden,
      automationTimers: {
        ...(state.garden.automationTimers ?? {}),
        seedMakerRemainderMs: 0,
      },
      seedMaker: {
        ...(state.garden.seedMaker ?? {}),
        isRunning: false,
      },
    },
  };
}

function applySeedMakerRecipeSelect(
  state: GameState,
  action: SelectSeedMakerRecipeAction,
): GameState {
  return {
    ...state,
    garden: {
      ...state.garden,
      seedMaker: {
        ...(state.garden.seedMaker ?? {}),
        selectedSeedId: action.seedId,
      },
    },
  };
}

function applyPlanterSeedSelect(
  state: GameState,
  action: SelectPlanterSeedAction,
): GameState {
  return {
    ...state,
    garden: {
      ...state.garden,
      selectedPlanterSeedId: action.seedId,
    },
  };
}

function applyPlanterTileSeedAssign(
  state: GameState,
  action: AssignPlanterTileSeedAction,
): GameState {
  const key = `${action.row},${action.col}`;
  return {
    ...state,
    garden: {
      ...state.garden,
      planterSeedSelections: {
        ...(state.garden.planterSeedSelections ?? {}),
        [key]: action.seedId,
      },
    },
  };
}

function applyPlantCropAction(
  state: GameState,
  action: PlantCropAction,
): GameState {
  let next = plantCrop(state, action.cropId, action.row, action.col);
  if (!action.consumeSeedId) return next;

  next = {
    ...next,
    inventory: next.inventory.map((item) =>
      item.itemId === action.consumeSeedId
        ? { ...item, quantity: item.quantity - 1 }
        : item,
    ),
  };
  return next;
}

function applyToolEquip(state: GameState, action: EquipToolAction): GameState {
  return {
    ...state,
    equipment: {
      ...state.equipment,
      tool: action.toolUid,
    },
  };
}

function applyToolUnequip(state: GameState): GameState {
  return {
    ...state,
    equipment: {
      ...state.equipment,
      tool: null,
    },
  };
}

// ---------------------------------------------------------------------------
// Exported area computation helpers (used by Garden.tsx for feedback paths)
// ---------------------------------------------------------------------------

export function computeWaterAreaResult(
  state: GameState,
  centerRow: number,
  centerCol: number,
  toolId: string,
): WaterAreaResult {
  const tiles = getToolCoverageTiles(centerRow, centerCol, toolId);
  let nextState = state;
  let wateredTiles = 0;
  let lackedEnergy = false;

  for (const tile of tiles) {
    let cropAtTile = null;
    for (const cropList of Object.values(nextState.garden.crops)) {
      const found = cropList.find(
        (crop) =>
          crop.position?.row === tile.row && crop.position?.col === tile.col,
      );
      if (found) {
        cropAtTile = found;
        break;
      }
    }

    if (!cropAtTile || cropAtTile.hasSprinkler) continue;

    const beforeEnergy = nextState.resources.energy ?? 0;
    const updatedState = waterField(nextState, tile.row, tile.col);
    const afterEnergy = updatedState.resources.energy ?? 0;

    if (afterEnergy < beforeEnergy) {
      wateredTiles += 1;
      nextState = updatedState;
    } else {
      lackedEnergy = true;
    }
  }

  return { nextState, wateredTiles, lackedEnergy };
}

export function computeSeedBagPlantResult(
  state: GameState,
  centerRow: number,
  centerCol: number,
  toolId: string,
  seedId: string,
  seedBagPlantEnergyCost: number,
): SeedBagPlantResult {
  const cropId = resolveGardenCropIdFromSeed(seedId);
  if (!cropId) {
    return {
      nextState: state,
      plantedTiles: 0,
      lackedEnergy: false,
      lackedSeeds: false,
    };
  }

  const tiles = getToolCoverageTiles(centerRow, centerCol, toolId);
  let nextState = state;
  let plantedTiles = 0;
  let lackedEnergy = false;
  let lackedSeeds = false;

  for (const tile of tiles) {
    if (!isFieldUnlockedInState(nextState, tile.row, tile.col)) continue;
    if (hasRockAtPositionInState(nextState, tile.row, tile.col)) continue;
    if (hasCropAtPositionInState(nextState, tile.row, tile.col)) continue;

    const energy = nextState.resources.energy ?? 0;
    if (energy < seedBagPlantEnergyCost) {
      lackedEnergy = true;
      break;
    }

    const consumed = consumeOneSeedFromInventory(nextState.inventory, seedId);
    if (!consumed.consumed) {
      lackedSeeds = true;
      break;
    }

    let plantedState = plantCrop(nextState, cropId, tile.row, tile.col);
    plantedState = {
      ...plantedState,
      inventory: consumed.inventory,
      resources: {
        ...plantedState.resources,
        energy: energy - seedBagPlantEnergyCost,
      },
    };

    nextState = plantedState;
    plantedTiles += 1;
  }

  return { nextState, plantedTiles, lackedEnergy, lackedSeeds };
}

// ---------------------------------------------------------------------------
// Internal scythe area helper (used by applyGardenAction below)
// ---------------------------------------------------------------------------

function applyScytheHarvestArea(
  state: GameState,
  centerRow: number,
  centerCol: number,
  toolId: string,
): GameState {
  const tiles = getToolCoverageTiles(centerRow, centerCol, toolId);
  const tileKeySet = new Set(tiles.map((t) => `${t.row},${t.col}`));
  const targetsByCropId: Record<string, number[]> = {};

  for (const [cId, cropList] of Object.entries(state.garden.crops)) {
    const cropDef = getCropDef(cId);
    if (!cropDef) continue;

    cropList.forEach((crop, index) => {
      const key = `${crop.position.row},${crop.position.col}`;
      if (!tileKeySet.has(key)) return;
      if (getGrowthProgress(crop, cropDef) < 100) return;

      if (!targetsByCropId[cId]) targetsByCropId[cId] = [];
      targetsByCropId[cId].push(index);
    });
  }

  let nextState = state;
  for (const [cId, indexes] of Object.entries(targetsByCropId)) {
    const sortedDesc = [...indexes].sort((a, b) => b - a);
    for (const idx of sortedDesc) {
      nextState = harvestCrop(nextState, cId, idx);
    }
  }

  return nextState;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export function applyGardenAction(
  state: GameState,
  action: GardenAction,
): GameState {
  switch (action.type) {
    case "garden/reconcileRocks":
      return reconcileGardenRocksForPreview(state);

    case "garden/craftSeed": {
      const next = structuredClone(state);
      craftSeedFromSeedMaker(next, action.seedId);
      return next;
    }

    case "garden/startSeedMaker":
      return applySeedMakerStart(state, action);

    case "garden/stopSeedMaker":
      return applySeedMakerStop(state);

    case "garden/selectSeedMakerRecipe":
      return applySeedMakerRecipeSelect(state, action);

    case "garden/selectPlanterSeed":
      return applyPlanterSeedSelect(state, action);

    case "garden/assignPlanterTileSeed":
      return applyPlanterTileSeedAssign(state, action);

    case "garden/plantCrop":
      return applyPlantCropAction(state, action);

    case "garden/harvestCrop":
      return harvestCrop(state, action.cropId, action.cropIndex);

    case "garden/prestigeCrop":
      return prestigeCropType(state, action.cropId);

    case "garden/unlockField":
      return unlockField(state, action.row, action.col);

    case "garden/reduceCropGrowthTime":
      return reduceCropGrowthTime(
        state,
        action.cropId,
        action.cropIndex,
        action.minutes,
        action.gemCost,
      );

    case "garden/setCropSprinkler":
      return setCropSprinkler(
        state,
        action.row,
        action.col,
        action.sprinklerId,
      );

    case "garden/placeSprinkler":
      return placeSprinklerOnField(
        state,
        action.row,
        action.col,
        action.sprinklerId,
      );

    case "garden/removeSprinkler":
      return removeSprinklerFromField(state, action.row, action.col);

    case "garden/breakRock": {
      const result = breakRock(state, action.row, action.col, action.pickaxeId);
      return result.success && result.newState ? result.newState : state;
    }

    case "garden/moveCropArea": {
      const result = moveCropArea(
        state,
        { row: action.sourceRow, col: action.sourceCol },
        { row: action.targetRow, col: action.targetCol },
        action.areaSize,
        action.moveSprinklers,
      );
      return result.success && result.newState ? result.newState : state;
    }

    case "garden/toggleSprinkler":
      return toggleSprinkler(state, action.row, action.col);

    case "garden/placeHarvester":
      return placeHarvesterOnField(
        state,
        action.row,
        action.col,
        action.harvesterId,
      );

    case "garden/removeHarvester":
      return removeHarvesterFromField(state, action.row, action.col);

    case "garden/placePlanter":
      return placePlanterOnField(
        state,
        action.row,
        action.col,
        action.planterId,
        action.seedId,
      );

    case "garden/removePlanter":
      return removePlanterFromField(state, action.row, action.col);

    case "garden/scytheHarvestArea":
      return applyScytheHarvestArea(
        state,
        action.centerRow,
        action.centerCol,
        action.toolId,
      );

    case "garden/waterArea":
      return computeWaterAreaResult(
        state,
        action.centerRow,
        action.centerCol,
        action.toolId,
      ).nextState;

    case "garden/seedBagPlantArea":
      return computeSeedBagPlantResult(
        state,
        action.centerRow,
        action.centerCol,
        action.toolId,
        action.seedId,
        action.seedBagPlantEnergyCost,
      ).nextState;

    case "garden/equipTool":
      return applyToolEquip(state, action);

    case "garden/unequipTool":
      return applyToolUnequip(state);
  }
}
