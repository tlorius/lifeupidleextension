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
  WATER_CONFIG,
} from "./gameConfig";
import { addItem } from "./engine";
import {
  getSeedMakerCost as getSeedMakerCostImpl,
  getSeedMakerDurationMs as getSeedMakerDurationMsImpl,
  craftSeedFromSeedMaker as craftSeedFromSeedMakerImpl,
  canCraftSeedFromSeedMaker as canCraftSeedFromSeedMakerImpl,
} from "./gardenSeedMaker";
import {
  isProtectedStarterField as isProtectedStarterFieldImpl,
  getRockTierForTile as getRockTierForTileImpl,
  hasRockPatternAtTile as hasRockPatternAtTileImpl,
  generateRocksForGrid as generateRocksForGridImpl,
} from "./gardenTerrainPattern";
import {
  getFieldUnlockCost as getFieldUnlockCostImpl,
  unlockField as unlockFieldImpl,
  breakRock as breakRockImpl,
} from "./gardenTerrainActions";

/**
 * CROP DEFINITIONS - Re-exported from game config
 */
export const cropDefinitions: Record<string, CropDefinition> =
  CROP_CONFIG as any;

/**
 * TOOL DEFINITIONS - Re-exported from game config
 */
export const toolDefinitions: Record<string, any> = TOOL_CONFIG as any;

const HARVESTER_CHECK_INTERVAL_MS = 5000;
const PLANTER_CHECK_INTERVAL_MS = 5000;

const SPECIAL_DROP_POOLS: Record<
  "rare" | "epic" | "legendary" | "unique",
  string[]
> = {
  rare: ["hammer_1", "chainmail_aegis", "battle_charm"],
  epic: ["greataxe_1", "runesteel_plate", "dragon_ring"],
  legendary: ["titan_cleaver", "aegis_of_ages", "sovereign_signet"],
  unique: ["windrazor_blade", "windrazor_mail", "windrazor_charm"],
};

function getFarmerSpecialDropRank(state: GameState): number {
  if (state.character.activeClassId !== "farmer") return 0;
  const ranks = state.character.classProgress.farmer.unlockedNodeRanks;
  return Math.max(0, ranks.farmer_9 ?? 0);
}

function rollSpecialHarvestDrop(
  state: GameState,
  rng: () => number = Math.random,
): { itemId: string; itemLevel: number } | null {
  const rank = getFarmerSpecialDropRank(state);
  const farmerRanks = state.character.classProgress.farmer.unlockedNodeRanks;
  const bountifulHandsRank = Math.max(0, farmerRanks.farmer_4 ?? 0);
  const granaryMindRank = Math.max(0, farmerRanks.farmer_6 ?? 0);
  const vaultOfSeasonsRank = Math.max(0, farmerRanks.farmer_11 ?? 0);
  const verdantSovereignRank = Math.max(0, farmerRanks.farmer_12 ?? 0);

  // Base rare chance starts at 1%. Farmer tree can push higher tiers over time.
  const rareChance = Math.min(
    0.05,
    0.01 + rank * 0.006 + bountifulHandsRank * 0.0015,
  );
  const epicChance = Math.min(
    0.03,
    rank >= 2 ? 0.003 + (rank - 1) * 0.003 + granaryMindRank * 0.001 : 0,
  );
  const legendaryChance = Math.min(
    0.02,
    rank >= 3 ? 0.0015 + (rank - 2) * 0.0025 + vaultOfSeasonsRank * 0.0012 : 0,
  );
  const uniqueChance = Math.min(
    0.01,
    rank >= 4
      ? 0.002 +
          (rank - 3) * 0.002 +
          vaultOfSeasonsRank * 0.001 +
          verdantSovereignRank * 0.001
      : 0,
  );

  const roll = rng();
  const thresholds: Array<{
    rarity: "unique" | "legendary" | "epic" | "rare";
    chance: number;
  }> = [
    { rarity: "unique", chance: uniqueChance },
    { rarity: "legendary", chance: legendaryChance },
    { rarity: "epic", chance: epicChance },
    { rarity: "rare", chance: rareChance },
  ];

  let cursor = 0;
  for (const threshold of thresholds) {
    cursor += threshold.chance;
    if (roll > cursor) continue;

    const pool = SPECIAL_DROP_POOLS[threshold.rarity];
    if (pool.length === 0) return null;

    const pick = pool[Math.floor(rng() * pool.length)];
    const itemLevel =
      threshold.rarity === "unique"
        ? 4 + vaultOfSeasonsRank + verdantSovereignRank
        : threshold.rarity === "legendary"
          ? 3 + Math.floor((granaryMindRank + vaultOfSeasonsRank) / 3)
          : threshold.rarity === "epic"
            ? 2 + Math.floor(granaryMindRank / 4)
            : 1;

    return { itemId: pick, itemLevel };
  }

  return null;
}

/**
 * ROCK CONFIGURATION - Re-exported from game config
 */
export const rockConfig = ROCK_CONFIG;

function getUpgradeLevelInState(state: GameState, upgradeId: string): number {
  return state.upgrades.find((u) => u.id === upgradeId)?.level ?? 0;
}

export function getSeedMakerCost(seedId: string): {
  gemCost: number;
  resourceCost: number;
} {
  return getSeedMakerCostImpl(seedId);
}

export function getSeedMakerDurationMs(
  seedMakerLevel: number,
  seedId?: string | null,
): number {
  return getSeedMakerDurationMsImpl(seedMakerLevel, seedId);
}

export function craftSeedFromSeedMaker(
  state: GameState,
  seedId: string,
): boolean {
  return craftSeedFromSeedMakerImpl(state, seedId);
}

export function canCraftSeedFromSeedMaker(
  state: GameState,
  seedId: string,
): boolean {
  return canCraftSeedFromSeedMakerImpl(state, seedId);
}

function isProtectedStarterField(row: number, col: number): boolean {
  return isProtectedStarterFieldImpl(row, col);
}

export function hasRockPatternAtTile(row: number, col: number): boolean {
  return hasRockPatternAtTileImpl(row, col);
}

function getRockTierForTile(
  row: number,
  col: number,
): "small" | "medium" | "large" | null {
  return getRockTierForTileImpl(row, col);
}

function ensureRocksForPreviewArea(state: GameState): void {
  const previewRows = state.garden.gridSize.rows + 2;
  const previewCols = state.garden.gridSize.cols + 2;

  for (let row = 0; row < previewRows; row++) {
    for (let col = 0; col < previewCols; col++) {
      const isCorner =
        (row === 0 || row === previewRows - 1) &&
        (col === 0 || col === previewCols - 1);
      if (isCorner) continue;
      if (isProtectedStarterField(row, col)) continue;
      if (hasRockAtPosition(state.garden.rocks, row, col)) continue;
      if (isFieldUnlocked(state, row, col)) continue;

      const tier = getRockTierForTile(row, col);
      if (!tier) continue;

      state.garden.rocks[tier].push({ row, col });
    }
  }
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

export function reconcileGardenRocksForPreview(state: GameState): GameState {
  const sanitizedRocks = sanitizeStarterZoneRocks(state.garden.rocks);
  const removedStarterRocks =
    sanitizedRocks.small.length !== state.garden.rocks.small.length ||
    sanitizedRocks.medium.length !== state.garden.rocks.medium.length ||
    sanitizedRocks.large.length !== state.garden.rocks.large.length;

  const beforeSmallCount = sanitizedRocks.small.length;
  const beforeMediumCount = sanitizedRocks.medium.length;
  const beforeLargeCount = sanitizedRocks.large.length;

  const nextState: GameState = {
    ...state,
    garden: {
      ...state.garden,
      rocks: {
        small: [...sanitizedRocks.small],
        medium: [...sanitizedRocks.medium],
        large: [...sanitizedRocks.large],
      },
    },
  };

  ensureRocksForPreviewArea(nextState);

  const afterSmallCount = nextState.garden.rocks.small.length;
  const afterMediumCount = nextState.garden.rocks.medium.length;
  const afterLargeCount = nextState.garden.rocks.large.length;
  const rocksAdded =
    afterSmallCount !== beforeSmallCount ||
    afterMediumCount !== beforeMediumCount ||
    afterLargeCount !== beforeLargeCount;

  if (!removedStarterRocks && !rocksAdded) {
    return state;
  }

  return nextState;
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

function getAutomationToolAtPosition(
  map: Record<string, FieldPosition[]>,
  row: number,
  col: number,
) {
  for (const [toolId, positions] of Object.entries(map)) {
    if (positions.some((p) => p.row === row && p.col === col)) {
      return toolId;
    }
  }
  return null;
}

function getSprinklerAtPosition(state: GameState, row: number, col: number) {
  return getAutomationToolAtPosition(state.garden.sprinklers, row, col);
}

function getHarvesterAtPosition(state: GameState, row: number, col: number) {
  return getAutomationToolAtPosition(state.garden.harvesters ?? {}, row, col);
}

function getPlanterAtPosition(state: GameState, row: number, col: number) {
  return getAutomationToolAtPosition(state.garden.planters ?? {}, row, col);
}

function getAutomationPlacementOccupant(
  state: GameState,
  row: number,
  col: number,
): { type: "sprinkler" | "harvester" | "planter"; id: string } | null {
  const sprinkler = getSprinklerAtPosition(state, row, col);
  if (sprinkler) return { type: "sprinkler", id: sprinkler };

  const harvester = getHarvesterAtPosition(state, row, col);
  if (harvester) return { type: "harvester", id: harvester };

  const planter = getPlanterAtPosition(state, row, col);
  if (planter) return { type: "planter", id: planter };

  return null;
}

type SprinklerCoverageProfile = {
  crossRange: number;
  diagonalRange: number;
};

function normalizeAutomationToolId(toolId: string): string {
  return toolId
    .replace(/_variant\d+/g, "")
    .replace(/_\d+$/g, "")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();
}

function getAutomationToolRangeSize(toolId: string): number {
  const normalized = normalizeAutomationToolId(toolId);
  const toolDef =
    (toolDefinitions[toolId] as
      | { stats?: { waterRange?: number } }
      | undefined) ??
    (toolDefinitions[normalized] as
      | { stats?: { waterRange?: number } }
      | undefined);

  const configuredWaterRange = toolDef?.stats?.waterRange;
  if (
    typeof configuredWaterRange === "number" &&
    Number.isFinite(configuredWaterRange) &&
    configuredWaterRange > 0
  ) {
    return configuredWaterRange;
  }

  // Fallback for any ids not explicitly authored in TOOL_CONFIG.
  if (normalized.includes("unique")) return 7;
  if (normalized.includes("legendary")) return 5;
  if (normalized.includes("epic")) return 3;
  if (normalized.includes("rare")) return 3;
  return 1;
}

function getAutomationToolRadius(toolId: string): number {
  const rangeSize = getAutomationToolRangeSize(toolId);
  return Math.max(0, Math.floor((rangeSize - 1) / 2));
}

export function getSprinklerCoverageProfile(
  toolId: string,
): SprinklerCoverageProfile {
  const radius = getAutomationToolRadius(toolId);
  return { crossRange: radius, diagonalRange: radius };
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
  const radius = getAutomationToolRadius(sprinklerId);

  // Coverage is square-shaped and driven by tool-defined range size.
  return Math.max(absDr, absDc) <= radius;
}

function applySprinklerMapUpdate(
  map: Record<string, FieldPosition[]>,
  row: number,
  col: number,
  toolId: string | null,
): Record<string, FieldPosition[]> {
  const updated: Record<string, FieldPosition[]> = {};
  for (const [id, positions] of Object.entries(map)) {
    updated[id] = positions.filter((p) => !(p.row === row && p.col === col));
  }
  if (toolId) {
    if (!updated[toolId]) updated[toolId] = [];
    updated[toolId] = [...updated[toolId], { row, col }];
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
  if (sprinklerId) {
    const occupied = getAutomationPlacementOccupant(state, row, col);
    if (occupied && occupied.type !== "sprinkler") return state;
  }

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
  const occupied = getAutomationPlacementOccupant(state, row, col);
  if (occupied && occupied.type !== "sprinkler") return state;

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
  const occupied = getAutomationPlacementOccupant(state, row, col);
  if (occupied && occupied.type !== "sprinkler") return state;

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

export function placeHarvesterOnField(
  state: GameState,
  row: number,
  col: number,
  harvesterId: string,
): GameState {
  const occupied = getAutomationPlacementOccupant(state, row, col);
  if (occupied && occupied.type !== "harvester") return state;

  return {
    ...state,
    garden: {
      ...state.garden,
      harvesters: applySprinklerMapUpdate(
        state.garden.harvesters ?? {},
        row,
        col,
        harvesterId,
      ),
    },
  };
}

export function removeHarvesterFromField(
  state: GameState,
  row: number,
  col: number,
): GameState {
  return {
    ...state,
    garden: {
      ...state.garden,
      harvesters: applySprinklerMapUpdate(
        state.garden.harvesters ?? {},
        row,
        col,
        null,
      ),
    },
  };
}

export function placePlanterOnField(
  state: GameState,
  row: number,
  col: number,
  planterId: string,
  selectedSeedId?: string | null,
): GameState {
  const occupied = getAutomationPlacementOccupant(state, row, col);
  if (occupied && occupied.type !== "planter") return state;

  const planterSeedKey = `${row},${col}`;
  const resolvedSeedId =
    selectedSeedId ?? state.garden.selectedPlanterSeedId ?? null;
  const nextPlanterSeedSelections = {
    ...(state.garden.planterSeedSelections ?? {}),
  };
  if (resolvedSeedId) {
    nextPlanterSeedSelections[planterSeedKey] = resolvedSeedId;
  }

  return {
    ...state,
    garden: {
      ...state.garden,
      planters: applySprinklerMapUpdate(
        state.garden.planters ?? {},
        row,
        col,
        planterId,
      ),
      planterSeedSelections: nextPlanterSeedSelections,
    },
  };
}

export function removePlanterFromField(
  state: GameState,
  row: number,
  col: number,
): GameState {
  const planterSeedKey = `${row},${col}`;
  const nextPlanterSeedSelections = {
    ...(state.garden.planterSeedSelections ?? {}),
  };
  delete nextPlanterSeedSelections[planterSeedKey];

  return {
    ...state,
    garden: {
      ...state.garden,
      planters: applySprinklerMapUpdate(
        state.garden.planters ?? {},
        row,
        col,
        null,
      ),
      planterSeedSelections: nextPlanterSeedSelections,
    },
  };
}

function resolveCropIdFromSeedItem(seedId: string): string | null {
  const fromDefinition = Object.values(cropDefinitions).find(
    (crop) => crop.seedItemId === seedId,
  );
  if (fromDefinition) return fromDefinition.id;

  const seedMatch = seedId.match(
    /^(.+)_seed(?:_(common|rare|epic|legendary|unique))?$/,
  );
  if (seedMatch) {
    const [, base, rarity] = seedMatch;
    if (rarity) {
      const directCrop = `${base}_${rarity}`;
      if (getCropDef(directCrop)) return directCrop;
    }
    const commonCrop = `${base}_common`;
    if (getCropDef(commonCrop)) return commonCrop;
  }

  const fallbackCropId = seedId.replace("_seed", "");
  return getCropDef(fallbackCropId) ? fallbackCropId : null;
}

function hasCropAtExactPosition(
  state: GameState,
  row: number,
  col: number,
): boolean {
  for (const cropList of Object.values(state.garden.crops)) {
    if (
      cropList.some(
        (crop) => crop.position.row === row && crop.position.col === col,
      )
    ) {
      return true;
    }
  }
  return false;
}

function consumeOneSeedFromInventory(
  state: GameState,
  seedId: string,
): boolean {
  const idx = state.inventory.findIndex(
    (item) => item.itemId === seedId && item.quantity > 0,
  );
  if (idx < 0) return false;

  const item = state.inventory[idx];
  item.quantity -= 1;
  if (item.quantity <= 0) {
    state.inventory.splice(idx, 1);
  }
  return true;
}

function getToolCoverageTiles(
  center: FieldPosition,
  toolId: string,
): FieldPosition[] {
  const maxRange = getAutomationToolRadius(toolId);
  const tiles: FieldPosition[] = [];

  for (let dr = -maxRange; dr <= maxRange; dr++) {
    for (let dc = -maxRange; dc <= maxRange; dc++) {
      tiles.push({ row: center.row + dr, col: center.col + dc });
    }
  }

  tiles.sort((a, b) => {
    const ringA = Math.max(
      Math.abs(a.row - center.row),
      Math.abs(a.col - center.col),
    );
    const ringB = Math.max(
      Math.abs(b.row - center.row),
      Math.abs(b.col - center.col),
    );
    if (ringA !== ringB) return ringA - ringB;
    if (a.row !== b.row) return a.row - b.row;
    return a.col - b.col;
  });

  return tiles;
}

function applyHarvesterCycle(state: GameState): void {
  const targets: Array<{ cropId: string; index: number }> = [];

  for (const [cropId, cropList] of Object.entries(state.garden.crops)) {
    const cropDef = getCropDef(cropId);
    if (!cropDef) continue;

    cropList.forEach((crop, index) => {
      if (!isReadyToHarvest(crop, cropDef)) return;

      let covered = false;
      for (const [harvesterId, positions] of Object.entries(
        state.garden.harvesters ?? {},
      )) {
        if (
          positions.some((pos) =>
            sprinklerCoversField(harvesterId, pos, crop.position),
          )
        ) {
          covered = true;
          break;
        }
      }

      if (covered) {
        targets.push({ cropId, index });
      }
    });
  }

  const grouped = new Map<string, number[]>();
  for (const target of targets) {
    const list = grouped.get(target.cropId) ?? [];
    list.push(target.index);
    grouped.set(target.cropId, list);
  }

  for (const [cropId, indexes] of grouped.entries()) {
    indexes
      .sort((a, b) => b - a)
      .forEach((index) => {
        const next = harvestCrop(state, cropId, index);
        Object.assign(state, next);
      });
  }
}

function applyPlanterCycle(state: GameState): void {
  for (const [planterId, positions] of Object.entries(
    state.garden.planters ?? {},
  )) {
    for (const planterPos of positions) {
      const planterSeedKey = `${planterPos.row},${planterPos.col}`;
      const selectedSeedId =
        state.garden.planterSeedSelections?.[planterSeedKey] ??
        state.garden.selectedPlanterSeedId;
      if (!selectedSeedId) continue;

      const cropId = resolveCropIdFromSeedItem(selectedSeedId);
      if (!cropId) continue;

      const coverageTiles = getToolCoverageTiles(planterPos, planterId);

      for (const tile of coverageTiles) {
        if (!isFieldUnlocked(state, tile.row, tile.col)) continue;
        if (hasRockAtPosition(state.garden.rocks, tile.row, tile.col)) continue;
        if (hasCropAtExactPosition(state, tile.row, tile.col)) continue;
        const consumed = consumeOneSeedFromInventory(state, selectedSeedId);
        if (!consumed) {
          break;
        }

        const next = plantCrop(state, cropId, tile.row, tile.col);
        Object.assign(state, next);
      }
    }
  }
}

function applySeedMakerCycle(state: GameState): void {
  const seedMaker = state.garden.seedMaker;
  if (!seedMaker?.isRunning) return;

  const selectedSeedId = seedMaker.selectedSeedId;
  if (!selectedSeedId) return;

  // If resources are unavailable, keep running and wait for resources.
  craftSeedFromSeedMaker(state, selectedSeedId);
}

/**
 * Plant a seed at a position
 */
export function plantCrop(
  state: GameState,
  cropId: string,
  row: number,
  col: number,
  now: number = Date.now(),
): GameState {
  const cropDef = getCropDef(cropId);
  if (!cropDef) return state;

  const placedSprinklerId = getSprinklerAtPosition(state, row, col);

  const newCrop: CropInstance = {
    position: { row, col },
    seedId: cropId,
    plantedAt: now,
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
  now: number = Date.now(),
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

  if (cropDef.category === "special") {
    const specialDrop = rollSpecialHarvestDrop(newState);
    if (specialDrop) {
      newState = addItem(
        newState,
        specialDrop.itemId,
        1,
        specialDrop.itemLevel,
      );
    }
  }

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
      plantedAt: now,
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
  now: number = Date.now(),
): GameState {
  const cropDef = getCropDef(cropId);
  if (!cropDef) return state;
  if ((state.resources.gems ?? 0) < gemCost) return state;

  const cropList = state.garden.crops[cropId];
  const crop = cropList?.[cropIndex];
  if (!crop) return state;

  const maxElapsedMs = cropDef.growthTimeMinutes * 60 * 1000;
  const currentElapsedMs = now - crop.plantedAt;
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

export function clearCropAreaContents(
  state: GameState,
  sourceCenter: FieldPosition,
  areaSize: number,
): { success: boolean; reason?: string; newState?: GameState } {
  const half = Math.floor(areaSize / 2);
  const areaPositions = new Set<string>();

  for (
    let row = sourceCenter.row - half;
    row <= sourceCenter.row + half;
    row++
  ) {
    for (
      let col = sourceCenter.col - half;
      col <= sourceCenter.col + half;
      col++
    ) {
      areaPositions.add(getFieldKey(row, col));
    }
  }

  const nextCrops: Record<string, CropInstance[]> = {};
  let removedCropCount = 0;

  for (const [cropId, cropList] of Object.entries(state.garden.crops)) {
    const kept = cropList.filter((crop) => {
      const inArea = areaPositions.has(
        getFieldKey(crop.position.row, crop.position.col),
      );
      if (inArea) removedCropCount += 1;
      return !inArea;
    });

    if (kept.length > 0) {
      nextCrops[cropId] = kept;
    }
  }

  const removedAutomationItemIds: string[] = [];

  const filterToolPlacements = (
    placements: Record<string, FieldPosition[]>,
  ): Record<string, FieldPosition[]> => {
    const next: Record<string, FieldPosition[]> = {};
    for (const [toolId, positions] of Object.entries(placements)) {
      const kept = positions.filter((position) => {
        const inArea = areaPositions.has(
          getFieldKey(position.row, position.col),
        );
        if (inArea) {
          removedAutomationItemIds.push(toolId);
        }
        return !inArea;
      });
      next[toolId] = kept;
    }
    return next;
  };

  const nextSprinklers = filterToolPlacements(state.garden.sprinklers);
  const nextHarvesters = filterToolPlacements(state.garden.harvesters ?? {});
  const nextPlanters = filterToolPlacements(state.garden.planters ?? {});

  if (removedCropCount === 0 && removedAutomationItemIds.length === 0) {
    return {
      success: false,
      reason: "No crop or automation found in the selected area.",
    };
  }

  const nextPlanterSeedSelections = {
    ...(state.garden.planterSeedSelections ?? {}),
  };
  for (const key of Object.keys(nextPlanterSeedSelections)) {
    if (areaPositions.has(key)) {
      delete nextPlanterSeedSelections[key];
    }
  }

  let nextState: GameState = {
    ...state,
    garden: {
      ...state.garden,
      crops: nextCrops,
      sprinklers: nextSprinklers,
      harvesters: nextHarvesters,
      planters: nextPlanters,
      planterSeedSelections: nextPlanterSeedSelections,
    },
  };

  for (const toolId of removedAutomationItemIds) {
    nextState = addItem(nextState, toolId, 1);
  }

  return {
    success: true,
    newState: nextState,
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

  const timers = state.garden.automationTimers ?? {
    harvesterRemainderMs: 0,
    planterRemainderMs: 0,
    seedMakerRemainderMs: 0,
  };

  const harvesterTotalMs = (timers.harvesterRemainderMs ?? 0) + deltaMs;
  const planterTotalMs = (timers.planterRemainderMs ?? 0) + deltaMs;
  const isSeedMakerRunning = state.garden.seedMaker?.isRunning ?? false;
  const seedMakerTotalMs = isSeedMakerRunning
    ? (timers.seedMakerRemainderMs ?? 0) + deltaMs
    : (timers.seedMakerRemainderMs ?? 0);

  const harvesterCycles = Math.floor(
    harvesterTotalMs / HARVESTER_CHECK_INTERVAL_MS,
  );
  const planterCycles = Math.floor(planterTotalMs / PLANTER_CHECK_INTERVAL_MS);
  const seedMakerLevel = getUpgradeLevelInState(state, "seedmaker_lab");
  const selectedSeedId = state.garden.seedMaker?.selectedSeedId;
  const seedMakerIntervalMs = getSeedMakerDurationMs(
    seedMakerLevel,
    selectedSeedId,
  );
  const seedMakerCycles = isSeedMakerRunning
    ? Math.floor(seedMakerTotalMs / seedMakerIntervalMs)
    : 0;

  timers.harvesterRemainderMs = harvesterTotalMs % HARVESTER_CHECK_INTERVAL_MS;
  timers.planterRemainderMs = planterTotalMs % PLANTER_CHECK_INTERVAL_MS;
  timers.seedMakerRemainderMs = seedMakerTotalMs % seedMakerIntervalMs;
  state.garden.automationTimers = timers;

  if (harvesterCycles > 0) {
    const cyclesToRun = Math.min(harvesterCycles, 240);
    for (let i = 0; i < cyclesToRun; i++) {
      applyHarvesterCycle(state);
    }
  }

  if (planterCycles > 0) {
    const cyclesToRun = Math.min(planterCycles, 240);
    for (let i = 0; i < cyclesToRun; i++) {
      applyPlanterCycle(state);
    }
  }

  if (seedMakerCycles > 0) {
    const cyclesToRun = Math.min(seedMakerCycles, 240);
    for (let i = 0; i < cyclesToRun; i++) {
      applySeedMakerCycle(state);
    }
  }
}

/**
 * ROCK GENERATION & FIELD UNLOCKING
 */

/**
 * Generate rocks for the garden grid using a fixed coordinate pattern.
 */
export function generateRocksForGrid(
  gridRows: number,
  gridCols: number,
): { small: FieldPosition[]; medium: FieldPosition[]; large: FieldPosition[] } {
  return generateRocksForGridImpl(gridRows, gridCols);
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
  return getFieldUnlockCostImpl(state, row, col, isFieldUnlocked);
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
  return unlockFieldImpl(state, row, col, {
    isAdjacentToUnlocked,
    isFieldUnlocked,
    ensureRocksForPreviewArea,
  });
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
  return breakRockImpl(state, row, col, pickaxeRef, ensureRocksForPreviewArea);
}
