import type {
  GameState,
  CropDefinition,
  CropInstance,
  FieldPosition,
} from "./types";
import {
  CROP_CONFIG,
  TOOL_CONFIG,
  ROCK_CONFIG,
  ROCK_GENERATION_CONFIG,
  WATER_CONFIG,
} from "./gameConfig";

/**
 * CROP DEFINITIONS - Re-exported from game config
 */
export const cropDefinitions: Record<string, CropDefinition> =
  CROP_CONFIG as any;

/**
 * TOOL DEFINITIONS - Re-exported from game config
 */
export const toolDefinitions: Record<string, any> = TOOL_CONFIG as any;

/**
 * ROCK CONFIGURATION - Re-exported from game config
 */
export const rockConfig = ROCK_CONFIG;

function isProtectedStarterField(row: number, col: number): boolean {
  return row < 2 && col < 2;
}

function hasRockAtPosition(
  rocks: {
    small: FieldPosition[];
    medium: FieldPosition[];
    large: FieldPosition[];
  },
  row: number,
  col: number,
): boolean {
  return (
    rocks.small.some((r) => r.row === row && r.col === col) ||
    rocks.medium.some((r) => r.row === row && r.col === col) ||
    rocks.large.some((r) => r.row === row && r.col === col)
  );
}

export function sanitizeStarterZoneRocks(rocks: {
  small: FieldPosition[];
  medium: FieldPosition[];
  large: FieldPosition[];
}): {
  small: FieldPosition[];
  medium: FieldPosition[];
  large: FieldPosition[];
} {
  return {
    small: rocks.small.filter((r) => !isProtectedStarterField(r.row, r.col)),
    medium: rocks.medium.filter((r) => !isProtectedStarterField(r.row, r.col)),
    large: rocks.large.filter((r) => !isProtectedStarterField(r.row, r.col)),
  };
}

/**
 * Get a crop definition
 */
export function getCropDef(cropId: string): CropDefinition | null {
  return cropDefinitions[cropId] ?? null;
}

/**
 * Calculate field position from grid coordinates
 */
export function getFieldKey(row: number, col: number): string {
  return `${row},${col}`;
}

/**
 * Parse field key back to coordinates
 */
export function parseFieldKey(key: string): FieldPosition {
  const [row, col] = key.split(",").map(Number);
  return { row, col };
}

function isFieldUnlocked(state: GameState, row: number, col: number): boolean {
  const unlocked = state.garden.unlockedFields;
  if (unlocked && unlocked.length > 0) {
    return unlocked.some((f) => f.row === row && f.col === col);
  }
  // Backward compatibility for older saves.
  return row < state.garden.gridSize.rows && col < state.garden.gridSize.cols;
}

function isAdjacentToUnlocked(
  state: GameState,
  row: number,
  col: number,
): boolean {
  const unlocked = state.garden.unlockedFields;
  if (!unlocked || unlocked.length === 0) return true; // No restrictions if not using per-field tracking

  // Check if any unlocked field is adjacent (horizontally or vertically)
  return unlocked.some((f) => {
    return (
      (Math.abs(f.row - row) === 1 && f.col === col) || // Vertical neighbor
      (Math.abs(f.col - col) === 1 && f.row === row) // Horizontal neighbor
    );
  });
}

/**
 * Check if a position has a crop planted
 */
export function hasCropAtPosition(state: GameState): boolean {
  // Implementation would check all crops
  return Object.keys(state.garden.crops).length > 0;
}

/**
 * Get growth progress as percentage (0-100)
 */
export function getGrowthProgress(
  crop: CropInstance,
  cropDef: CropDefinition,
  now: number = Date.now(),
): number {
  const elapsed = now - crop.plantedAt;
  const growthMs = cropDef.growthTimeMinutes * 60 * 1000;
  return Math.min(100, (elapsed / growthMs) * 100);
}

/**
 * Check if a crop is ready to harvest
 */
export function isReadyToHarvest(
  crop: CropInstance,
  cropDef: CropDefinition,
  now: number = Date.now(),
): boolean {
  return getGrowthProgress(crop, cropDef, now) >= 100;
}

/**
 * Calculate yield with watering bonus
 * Formula: baseYield * (1 + wateringBonus)
 * wateringBonus maxes at 1.0 (= 2x yield) if fully watered entire cycle
 */
export function calculateYield(
  cropDef: CropDefinition,
  waterLevel: number,
): number {
  const waterBonus = Math.min(1, waterLevel / 100); // 0-1
  return Math.round(cropDef.baseYield * (1 + waterBonus));
}

export const CROP_MAX_LEVEL = 100;

export function getCropXpForNextLevel(level: number): number {
  return 25 + level * 25;
}

function getCropMasteryEntry(state: GameState, cropId: string) {
  const fromState = state.garden.cropMastery?.[cropId];
  if (fromState) {
    return {
      level: Math.max(1, Math.min(CROP_MAX_LEVEL, fromState.level ?? 1)),
      xp: Math.max(0, fromState.xp ?? 0),
      prestige: Math.max(0, fromState.prestige ?? 0),
    };
  }

  return {
    level: 1,
    xp: 0,
    prestige: 0,
  };
}

export function getCropYieldMultiplier(
  level: number,
  prestige: number,
): number {
  const levelBonus = (level - 1) * 0.01;
  const prestigeBonus = prestige * 0.2;
  return 1 + levelBonus + prestigeBonus;
}

export function getCropGoldMultiplier(prestige: number): number {
  return 1 + prestige * 0.1;
}

export function calculateYieldWithMastery(
  state: GameState,
  cropId: string,
  cropDef: CropDefinition,
  waterLevel: number,
): number {
  const mastery = getCropMasteryEntry(state, cropId);
  const base = calculateYield(cropDef, waterLevel);
  const multiplier = getCropYieldMultiplier(mastery.level, mastery.prestige);
  return Math.max(1, Math.round(base * multiplier));
}

export function calculateGoldWithMastery(
  state: GameState,
  cropId: string,
  cropDef: CropDefinition,
): number {
  const mastery = getCropMasteryEntry(state, cropId);
  const multiplier = getCropGoldMultiplier(mastery.prestige);
  return Math.max(1, Math.round(cropDef.baseGold * multiplier));
}

export function prestigeCropType(state: GameState, cropId: string): GameState {
  const cropDef = getCropDef(cropId);
  if (!cropDef) return state;

  const current = getCropMasteryEntry(state, cropId);
  if (current.level < CROP_MAX_LEVEL) return state;

  return {
    ...state,
    garden: {
      ...state.garden,
      cropMastery: {
        ...(state.garden.cropMastery ?? {}),
        [cropId]: {
          level: 1,
          xp: 0,
          prestige: current.prestige + 1,
        },
      },
    },
  };
}

/**
 * Water a field (increases water level, costs energy)
 */
export function waterField(
  state: GameState,
  row: number,
  col: number,
): GameState {
  const waterCost = WATER_CONFIG.waterCostEnergy;
  if ((state.resources.energy ?? 0) < waterCost) return state;

  let newState = { ...state };
  newState.resources.energy =
    (newState.resources.energy ?? 0) - WATER_CONFIG.waterCostEnergy;

  // Find the crop at this position and water it
  let found = false;
  for (const cropId in newState.garden.crops) {
    for (let i = 0; i < newState.garden.crops[cropId].length; i++) {
      const crop = newState.garden.crops[cropId][i];
      if (crop.position?.row === row && crop.position?.col === col) {
        // Water the field to 100%
        newState.garden.crops[cropId][i] = {
          ...crop,
          waterLevel: WATER_CONFIG.fullWaterThreshold,
        };
        found = true;
        break;
      }
    }
    if (found) break;
  }

  return newState;
}

function getSprinklerAtPosition(state: GameState, row: number, col: number) {
  for (const [sprinklerId, positions] of Object.entries(
    state.garden.sprinklers,
  )) {
    if (positions.some((p) => p.row === row && p.col === col)) {
      return sprinklerId;
    }
  }
  return null;
}

type SprinklerCoverageProfile = {
  crossRange: number;
  diagonalRange: number;
};

export function getSprinklerCoverageProfile(
  sprinklerId: string,
): SprinklerCoverageProfile {
  if (sprinklerId.includes("unique")) {
    return { crossRange: 3, diagonalRange: 3 };
  }
  if (sprinklerId.includes("legendary")) {
    return { crossRange: 2, diagonalRange: 2 };
  }
  if (sprinklerId.includes("epic")) {
    return { crossRange: 1, diagonalRange: 1 };
  }
  if (sprinklerId.includes("rare")) {
    return { crossRange: 1, diagonalRange: 0 };
  }
  // Common: only itself
  return { crossRange: 0, diagonalRange: 0 };
}

export function sprinklerCoversField(
  sprinklerId: string,
  sprinklerPos: FieldPosition,
  targetPos: FieldPosition,
): boolean {
  const dr = targetPos.row - sprinklerPos.row;
  const dc = targetPos.col - sprinklerPos.col;
  const absDr = Math.abs(dr);
  const absDc = Math.abs(dc);

  // A sprinkler always covers its own tile.
  if (absDr === 0 && absDc === 0) return true;

  const { crossRange, diagonalRange } =
    getSprinklerCoverageProfile(sprinklerId);

  // Cross coverage: up/down/left/right out to crossRange.
  const onCross = (dr === 0 || dc === 0) && absDr + absDc <= crossRange;
  if (onCross) return true;

  // Diagonal coverage: diagonal rays out to diagonalRange.
  const onDiagonal = absDr === absDc && absDr <= diagonalRange;
  if (onDiagonal) return true;

  return false;
}

function applySprinklerMapUpdate(
  sprinklers: Record<string, FieldPosition[]>,
  row: number,
  col: number,
  sprinklerId: string | null,
): Record<string, FieldPosition[]> {
  const updated: Record<string, FieldPosition[]> = {};
  for (const [id, positions] of Object.entries(sprinklers)) {
    updated[id] = positions.filter((p) => !(p.row === row && p.col === col));
  }
  if (sprinklerId) {
    if (!updated[sprinklerId]) updated[sprinklerId] = [];
    updated[sprinklerId] = [...updated[sprinklerId], { row, col }];
  }
  return updated;
}

/**
 * Set or remove sprinkler from a planted crop and sync standalone sprinkler map.
 */
export function setCropSprinkler(
  state: GameState,
  row: number,
  col: number,
  sprinklerId: string | null,
): GameState {
  const newCrops = { ...state.garden.crops };
  let found = false;

  for (const cropId in newCrops) {
    const list = newCrops[cropId];
    const idx = list.findIndex(
      (crop) => crop.position?.row === row && crop.position?.col === col,
    );
    if (idx >= 0) {
      const copy = [...list];
      const current = copy[idx];
      copy[idx] = {
        ...current,
        hasSprinkler: !!sprinklerId,
        sprinklerTier: sprinklerId ?? undefined,
        waterLevel: sprinklerId
          ? WATER_CONFIG.fullWaterThreshold
          : current.waterLevel,
      };
      newCrops[cropId] = copy;
      found = true;
      break;
    }
  }

  if (!found) return state;

  return {
    ...state,
    garden: {
      ...state.garden,
      crops: newCrops,
      sprinklers: applySprinklerMapUpdate(
        state.garden.sprinklers,
        row,
        col,
        sprinklerId,
      ),
    },
  };
}

/**
 * Place a sprinkler on any field (including empty fields).
 */
export function placeSprinklerOnField(
  state: GameState,
  row: number,
  col: number,
  sprinklerId: string,
): GameState {
  // If there is a crop here, use crop-aware setter to keep both sources in sync.
  const updatedCropState = setCropSprinkler(state, row, col, sprinklerId);
  if (updatedCropState !== state) return updatedCropState;

  return {
    ...state,
    garden: {
      ...state.garden,
      sprinklers: applySprinklerMapUpdate(
        state.garden.sprinklers,
        row,
        col,
        sprinklerId,
      ),
    },
  };
}

/**
 * Remove sprinkler from any field (including empty fields).
 */
export function removeSprinklerFromField(
  state: GameState,
  row: number,
  col: number,
): GameState {
  const updatedCropState = setCropSprinkler(state, row, col, null);
  if (updatedCropState !== state) return updatedCropState;

  return {
    ...state,
    garden: {
      ...state.garden,
      sprinklers: applySprinklerMapUpdate(
        state.garden.sprinklers,
        row,
        col,
        null,
      ),
    },
  };
}

/**
 * Toggle sprinkler on a field (place or remove)
 */
export function toggleSprinkler(
  state: GameState,
  row: number,
  col: number,
): GameState {
  for (const [, list] of Object.entries(state.garden.crops)) {
    const found = list.find(
      (crop) => crop.position?.row === row && crop.position?.col === col,
    );
    if (found) {
      if (found.hasSprinkler) {
        return setCropSprinkler(state, row, col, null);
      }
      const preferredTier =
        found.sprinklerTier ??
        getSprinklerAtPosition(state, row, col) ??
        "sprinkler_common";
      return setCropSprinkler(state, row, col, preferredTier);
    }
  }

  return state;
}

/**
 * Plant a seed at a position
 */
export function plantCrop(
  state: GameState,
  cropId: string,
  row: number,
  col: number,
): GameState {
  const cropDef = getCropDef(cropId);
  if (!cropDef) return state;

  const placedSprinklerId = getSprinklerAtPosition(state, row, col);

  const newCrop: CropInstance = {
    position: { row, col },
    seedId: cropId,
    plantedAt: Date.now(),
    waterLevel: placedSprinklerId ? WATER_CONFIG.fullWaterThreshold : 0,
    xpLevel: 1,
    prestige: 0,
    hasSprinkler: !!placedSprinklerId,
    sprinklerTier: placedSprinklerId ?? undefined,
  };

  const newGarden = { ...state.garden };
  if (!newGarden.crops[cropId]) {
    newGarden.crops[cropId] = [];
  }
  newGarden.crops[cropId].push(newCrop);

  return {
    ...state,
    garden: newGarden,
  };
}

/**
 * Harvest a crop
 */
export function harvestCrop(
  state: GameState,
  cropId: string,
  cropIndex: number,
): GameState {
  const cropDef = getCropDef(cropId);
  if (!cropDef) return state;

  const cropList = state.garden.crops[cropId];
  if (!cropList || !cropList[cropIndex]) return state;

  const crop = cropList[cropIndex];
  const mastery = getCropMasteryEntry(state, cropId);
  const yield_ = calculateYieldWithMastery(
    state,
    cropId,
    cropDef,
    crop.waterLevel,
  );
  const goldReward = calculateGoldWithMastery(state, cropId, cropDef);

  let nextLevel = mastery.level;
  let nextXp = mastery.xp + cropDef.baseXP;
  const prestige = mastery.prestige;

  while (
    nextLevel < CROP_MAX_LEVEL &&
    nextXp >= getCropXpForNextLevel(nextLevel)
  ) {
    nextXp -= getCropXpForNextLevel(nextLevel);
    nextLevel += 1;
  }

  if (nextLevel >= CROP_MAX_LEVEL) {
    nextLevel = CROP_MAX_LEVEL;
    nextXp = 0;
  }

  let newState = { ...state };

  // Add resources to crop storage
  const newStorage = { ...newState.garden.cropStorage.current };
  newStorage[cropDef.category] = (newStorage[cropDef.category] ?? 0) + yield_;
  newState.garden.cropStorage.current = newStorage;

  // Add gold
  newState.resources.gold += goldReward;

  // Update mastery progression
  newState.garden.cropMastery = {
    ...(newState.garden.cropMastery ?? {}),
    [cropId]: {
      level: nextLevel,
      xp: nextXp,
      prestige,
    },
  };

  // Remove crop from garden (for non-perennial)
  if (!cropDef.isPerennial) {
    const newCropList = [...cropList];
    newCropList.splice(cropIndex, 1);
    if (newCropList.length === 0) {
      const newCrops = { ...newState.garden.crops };
      delete newCrops[cropId];
      newState.garden.crops = newCrops;
    } else {
      newState.garden.crops[cropId] = newCropList;
    }
  } else {
    // Reset perennial for next cycle
    newState.garden.crops[cropId][cropIndex] = {
      ...crop,
      plantedAt: Date.now(),
      waterLevel: 0,
    };
  }

  return newState;
}

export function reduceCropGrowthTime(
  state: GameState,
  cropId: string,
  cropIndex: number,
  minutes: number,
  gemCost: number,
): GameState {
  const cropDef = getCropDef(cropId);
  if (!cropDef) return state;
  if ((state.resources.gems ?? 0) < gemCost) return state;

  const cropList = state.garden.crops[cropId];
  const crop = cropList?.[cropIndex];
  if (!crop) return state;

  const maxElapsedMs = cropDef.growthTimeMinutes * 60 * 1000;
  const currentElapsedMs = Date.now() - crop.plantedAt;
  const requestedReductionMs = minutes * 60 * 1000;
  const appliedReductionMs = Math.min(
    requestedReductionMs,
    Math.max(0, maxElapsedMs - currentElapsedMs),
  );
  if (appliedReductionMs <= 0) return state;

  const nextCropList = [...cropList];
  nextCropList[cropIndex] = {
    ...crop,
    plantedAt: crop.plantedAt - appliedReductionMs,
  };

  return {
    ...state,
    resources: {
      ...state.resources,
      gems: (state.resources.gems ?? 0) - gemCost,
    },
    garden: {
      ...state.garden,
      crops: {
        ...state.garden.crops,
        [cropId]: nextCropList,
      },
    },
  };
}

export function moveCropArea(
  state: GameState,
  sourceCenter: FieldPosition,
  targetCenter: FieldPosition,
  areaSize: number,
  moveSprinklers: boolean,
): { success: boolean; reason?: string; newState?: GameState } {
  const half = Math.floor(areaSize / 2);
  const sourcePositions = new Set<string>();
  const movedCrops: Array<{
    cropId: string;
    cropIndex: number;
    crop: CropInstance;
    target: FieldPosition;
  }> = [];

  for (const [cropId, cropList] of Object.entries(state.garden.crops)) {
    cropList.forEach((crop, cropIndex) => {
      const { row, col } = crop.position;
      if (
        row >= sourceCenter.row - half &&
        row <= sourceCenter.row + half &&
        col >= sourceCenter.col - half &&
        col <= sourceCenter.col + half
      ) {
        sourcePositions.add(getFieldKey(row, col));
        movedCrops.push({
          cropId,
          cropIndex,
          crop,
          target: {
            row: targetCenter.row + (row - sourceCenter.row),
            col: targetCenter.col + (col - sourceCenter.col),
          },
        });
      }
    });
  }

  if (movedCrops.length === 0) {
    return {
      success: false,
      reason: "No planted fields found in the selected area.",
    };
  }

  for (const moved of movedCrops) {
    if (!isFieldUnlocked(state, moved.target.row, moved.target.col)) {
      return {
        success: false,
        reason: "All destination tiles must already be unlocked.",
      };
    }
    if (
      hasRockAtPosition(state.garden.rocks, moved.target.row, moved.target.col)
    ) {
      return { success: false, reason: "You cannot move crops onto rocks." };
    }

    const occupiedByOtherCrop = Object.values(state.garden.crops).some(
      (cropList) =>
        cropList.some((crop) => {
          const key = getFieldKey(crop.position.row, crop.position.col);
          return (
            crop.position.row === moved.target.row &&
            crop.position.col === moved.target.col &&
            !sourcePositions.has(key)
          );
        }),
    );

    if (occupiedByOtherCrop) {
      return { success: false, reason: "Destination area must be empty." };
    }
  }

  const nextCrops: Record<string, CropInstance[]> = {};
  for (const [cropId, cropList] of Object.entries(state.garden.crops)) {
    nextCrops[cropId] = [...cropList];
  }

  const removalsByCrop = new Map<string, number[]>();
  for (const moved of movedCrops) {
    const removals = removalsByCrop.get(moved.cropId) ?? [];
    removals.push(moved.cropIndex);
    removalsByCrop.set(moved.cropId, removals);
  }

  for (const [cropId, removals] of removalsByCrop.entries()) {
    removals
      .sort((a, b) => b - a)
      .forEach((index) => {
        nextCrops[cropId].splice(index, 1);
      });
    if (nextCrops[cropId].length === 0) {
      delete nextCrops[cropId];
    }
  }

  for (const moved of movedCrops) {
    const nextCrop: CropInstance = {
      ...moved.crop,
      position: moved.target,
      hasSprinkler: moveSprinklers ? moved.crop.hasSprinkler : false,
      sprinklerTier: moveSprinklers ? moved.crop.sprinklerTier : undefined,
    };
    if (!nextCrops[moved.cropId]) {
      nextCrops[moved.cropId] = [];
    }
    nextCrops[moved.cropId].push(nextCrop);
  }

  return {
    success: true,
    newState: {
      ...state,
      garden: {
        ...state.garden,
        crops: nextCrops,
      },
    },
  };
}

/**
 * Apply garden idle tick (watering decay, growth progression)
 */
export function applyGardenIdle(state: GameState, deltaMs: number): void {
  const deltaMinutes = deltaMs / (60 * 1000);

  // Decay water level (water lasts 12 hours = 720 minutes)
  const waterDecayRate = WATER_CONFIG.waterDecayRate; // % per minute

  const isCoveredBySprinklerNetwork = (row: number, col: number): boolean => {
    for (const [sprinklerId, positions] of Object.entries(
      state.garden.sprinklers,
    )) {
      for (const pos of positions) {
        if (
          sprinklerCoversField(sprinklerId, pos, {
            row,
            col,
          })
        ) {
          return true;
        }
      }
    }
    return false;
  };

  for (const cropId in state.garden.crops) {
    for (const crop of state.garden.crops[cropId]) {
      const coveredByNetwork = isCoveredBySprinklerNetwork(
        crop.position.row,
        crop.position.col,
      );
      if (!crop.hasSprinkler && !coveredByNetwork) {
        crop.waterLevel = Math.max(
          0,
          crop.waterLevel - waterDecayRate * deltaMinutes,
        );
      } else {
        // Sprinklered fields and covered adjacent fields stay at 100%
        crop.waterLevel = WATER_CONFIG.fullWaterThreshold;
      }
    }
  }
}

/**
 * ROCK GENERATION & FIELD UNLOCKING
 */

/**
 * Configuration for rock generation based on distance from origin
 * Distance = max(abs(row - centerRow), abs(col - centerCol)) [Chebyshev distance]
 */
export const rockGenerationConfig = ROCK_GENERATION_CONFIG;

/**
 * Generate rocks for the garden grid using pseudorandom placement
 * based on distance from center
 */
export function generateRocksForGrid(
  gridRows: number,
  gridCols: number,
  seed: number = 12345,
): { small: FieldPosition[]; medium: FieldPosition[]; large: FieldPosition[] } {
  const rocks = {
    small: [] as FieldPosition[],
    medium: [] as FieldPosition[],
    large: [] as FieldPosition[],
  };
  const centerRow = Math.floor(gridRows / 2);
  const centerCol = Math.floor(gridCols / 2);

  // Seeded random number generator (simple)
  let rng = seed;
  const random = () => {
    rng = (rng * 9301 + 49297) % 233280;
    return rng / 233280;
  };

  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      // Skip corners in the preview area
      const isCorner =
        (row === 0 || row === gridRows - 1) &&
        (col === 0 || col === gridCols - 1);
      if (isCorner) continue;

      if (isProtectedStarterField(row, col)) continue;

      // Calculate distance from center (Chebyshev distance)
      const distance = Math.max(
        Math.abs(row - centerRow),
        Math.abs(col - centerCol),
      );

      // Determine rock configuration for this distance
      let config: any = rockGenerationConfig.nearby;
      if (distance <= 1) config = rockGenerationConfig.nearby;
      else if (distance <= 5) config = rockGenerationConfig.middle;
      else if (distance <= 10) config = rockGenerationConfig.far;
      else config = rockGenerationConfig.veryFar;

      // Determine if rock spawns here
      const rand = random();
      if (rand < config.smallChance) {
        rocks.small.push({ row, col });
      } else if (rand < config.smallChance + config.mediumChance) {
        rocks.medium.push({ row, col });
      } else if (
        rand <
        config.smallChance + config.mediumChance + config.largeChance
      ) {
        rocks.large.push({ row, col });
      }
    }
  }

  return rocks;
}

/**
 * Determine if a field is accessible and what it costs to unlock
 */
export function getFieldUnlockCost(
  state: GameState,
  row: number,
  col: number,
): {
  type: "free" | "diamond" | "rock";
  cost?: number;
  rockTier?: "small" | "medium" | "large";
} {
  if (!isFieldUnlocked(state, row, col)) {
    // Locked field - costs diamonds unless rock is present.
    const baseCost = 50; // Starting diamond cost
    const unlockedCount = state.garden.unlockedFields?.length ?? 0;
    const cost = baseCost + unlockedCount * 10;
    let result: {
      type: "diamond" | "rock";
      cost?: number;
      rockTier?: "small" | "medium" | "large";
    } = {
      type: "diamond",
      cost,
    };

    for (const rock of state.garden.rocks.small) {
      if (rock.row === row && rock.col === col) {
        result = { type: "rock", rockTier: "small" };
        break;
      }
    }
    for (const rock of state.garden.rocks.medium) {
      if (rock.row === row && rock.col === col) {
        result = { type: "rock", rockTier: "medium" };
        break;
      }
    }
    for (const rock of state.garden.rocks.large) {
      if (rock.row === row && rock.col === col) {
        result = { type: "rock", rockTier: "large" };
        break;
      }
    }

    return result;
  }

  // Otherwise it's free to access
  return { type: "free" };
}

/**
 * Get all fields adjacent to the current grid that could be unlocked
 */
export function getAccessibleAdjacentFields(
  state: GameState,
): Array<{ row: number; col: number }> {
  const { rows, cols } = state.garden.gridSize;
  const accessible: Array<{ row: number; col: number }> = [];
  const visited = new Set<string>();

  // Check all positions around the current grid (within preview area)
  for (let row = -1; row <= rows; row++) {
    for (let col = -1; col <= cols; col++) {
      const key = `${row},${col}`;
      if (visited.has(key)) continue;
      visited.add(key);

      // Skip if in current grid
      if (row >= 0 && row < rows && col >= 0 && col < cols) continue;

      // Skip corners
      if (row < 0 && col < 0) continue;
      if (row < 0 && col >= cols) continue;
      if (row >= rows && col < 0) continue;
      if (row >= rows && col >= cols) continue;

      accessible.push({ row, col });
    }
  }

  return accessible;
}

/**
 * Unlock a field (spend diamonds or clear rock)
 */
export function unlockField(
  state: GameState,
  row: number,
  col: number,
): GameState {
  // Check adjacency constraint
  if (!isAdjacentToUnlocked(state, row, col)) {
    return state; // Cannot unlock non-adjacent fields
  }

  const cost = getFieldUnlockCost(state, row, col);

  if (cost.type === "diamond") {
    const diamondCost = cost.cost ?? 50;
    if ((state.resources.gems ?? 0) < diamondCost) return state;

    let newState = { ...state };
    newState.resources.gems = (newState.resources.gems ?? 0) - diamondCost;

    const unlocked = [...(newState.garden.unlockedFields ?? [])];
    if (!unlocked.some((f) => f.row === row && f.col === col)) {
      unlocked.push({ row, col });
    }
    newState.garden.unlockedFields = unlocked;

    // Expand visual envelope only; fields remain locked until explicitly unlocked.
    const newRows = Math.max(newState.garden.gridSize.rows, row + 1);
    const newCols = Math.max(newState.garden.gridSize.cols, col + 1);
    newState.garden.gridSize = { rows: newRows, cols: newCols };

    return newState;
  }

  if (cost.type === "rock") {
    const rockTier = cost.rockTier as "small" | "medium" | "large";
    const rockConfig_ = rockConfig[rockTier];

    if ((state.resources.energy ?? 0) < rockConfig_.energyCost) return state;

    // Check if player has appropriate pickaxe level
    const pickaxeToolId = Object.keys(state.garden.tools).find((t) =>
      t.startsWith("pickaxe"),
    );
    if (!pickaxeToolId) return state;

    let newState = { ...state };
    newState.resources.energy =
      (newState.resources.energy ?? 0) - rockConfig_.energyCost;

    // Remove the rock
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

    // Expand visual envelope only; fields remain locked until explicitly unlocked.
    if (
      row >= newState.garden.gridSize.rows ||
      col >= newState.garden.gridSize.cols
    ) {
      const newRows = Math.max(newState.garden.gridSize.rows, row + 1);
      const newCols = Math.max(newState.garden.gridSize.cols, col + 1);
      newState.garden.gridSize = { rows: newRows, cols: newCols };
    }

    return newState;
  }

  // Already accessible
  return state;
}

/**
 * Break a rock with a pickaxe (requires pickaxe level check)
 */
export function breakRock(
  state: GameState,
  row: number,
  col: number,
  pickaxeRef: string,
): { success: boolean; reason?: string; newState?: GameState } {
  let rockTier: "small" | "medium" | "large" | null = null;

  // Find which tier of rock is at this position
  if (state.garden.rocks.small.some((r) => r.row === row && r.col === col)) {
    rockTier = "small";
  } else if (
    state.garden.rocks.medium.some((r) => r.row === row && r.col === col)
  ) {
    rockTier = "medium";
  } else if (
    state.garden.rocks.large.some((r) => r.row === row && r.col === col)
  ) {
    rockTier = "large";
  }

  if (!rockTier) {
    return { success: false, reason: "No rock at this position" };
  }

  const config = rockConfig[rockTier];
  const inventoryPickaxe = state.inventory.find(
    (item) => item.uid === pickaxeRef,
  );
  const pickaxeId = inventoryPickaxe?.itemId ?? pickaxeRef;
  const pickaxeLevel =
    inventoryPickaxe?.level ?? state.garden.tools[pickaxeId] ?? 0;

  // Check pickaxe level requirement
  if (pickaxeLevel < config.minPickaxeLevel) {
    return {
      success: false,
      reason: `Your pickaxe is level ${pickaxeLevel}. You need level ${config.minPickaxeLevel} to break ${rockTier} rocks.`,
    };
  }

  // Check energy cost
  if ((state.resources.energy ?? 0) < config.energyCost) {
    return {
      success: false,
      reason: `Not enough energy. You need ${config.energyCost} energy, but only have ${state.resources.energy ?? 0}.`,
    };
  }

  // Break the rock
  let newState = { ...state };
  newState.resources.energy =
    (newState.resources.energy ?? 0) - config.energyCost;

  // Remove the rock
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

  // If rock was at grid boundary, expand visual envelope.
  if (
    row >= newState.garden.gridSize.rows ||
    col >= newState.garden.gridSize.cols
  ) {
    const newRows = Math.max(newState.garden.gridSize.rows, row + 1);
    const newCols = Math.max(newState.garden.gridSize.cols, col + 1);
    newState.garden.gridSize = { rows: newRows, cols: newCols };
  }

  return { success: true, newState };
}
