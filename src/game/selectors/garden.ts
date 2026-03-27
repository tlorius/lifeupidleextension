import {
  calculateGoldWithMastery,
  calculateYieldWithMastery,
  cropDefinitions,
  getCropDef,
  getGrowthProgress,
  getSeedMakerCost,
  getSeedMakerDurationMs,
} from "../garden";
import { getItemDefSafe } from "../items";
import { getUpgradeLevel } from "../upgrades";
import type {
  CropCategory,
  CropDefinition,
  CropInstance,
  GameState,
} from "../types";

const SEED_MAKER_UPGRADE_ID = "seedmaker_lab";
const cropDefinitionList = Object.values(cropDefinitions);
const directCropIdBySeedId = new Map(
  cropDefinitionList.map((crop) => [crop.seedItemId, crop.id] as const),
);
const resolvedCropIdBySeedIdCache = new Map<string, string | null>();
const seedPresentationCache = new Map<string, GardenSeedPresentation>();

export interface GardenSeedPresentation {
  seedId: string;
  cropId: string | null;
  cropDef: CropDefinition | null;
  icon: string;
  label: string;
}

export interface GardenSeedBagEntry {
  seedId: string;
  count: number;
  presentation: GardenSeedPresentation;
}

export interface GardenSeedMakerRecipeView {
  seedId: string;
  cropName: string;
  category: CropCategory;
  categoryLabel: string;
  categoryIcon: string;
  cost: {
    gemCost: number;
    resourceCost: number;
  };
  availableResource: number;
  availableGems: number;
  canCraft: boolean;
  isSelected: boolean;
  canSelectRecipe: boolean;
  presentation: GardenSeedPresentation;
}

export interface GardenSeedViewModel {
  seedBag: GardenSeedBagEntry[];
  seedMakerRecipes: GardenSeedMakerRecipeView[];
  seedMakerLevel: number;
  isSeedMakerUnlocked: boolean;
  selectedSeedMakerSeedId: string | null;
  selectedSeedMakerPresentation: GardenSeedPresentation | null;
  selectedPlanterSeedPresentation: GardenSeedPresentation | null;
  activeSeedBagSeedPresentation: GardenSeedPresentation | null;
  seedMakerCycleMs: number;
  seedMakerRemainingMs: number;
  isSeedMakerRunning: boolean;
  defaultSeedMakerSeedId: string | null;
}

export interface GardenOwnedAutomationToolIds {
  sprinklerIds: string[];
  harvesterIds: string[];
  planterIds: string[];
}

export interface GardenCropTileDetailView {
  cropId: string;
  cropIndex: number;
  cropRow: number;
  cropCol: number;
  cropDef: CropDefinition;
  cropInstance: CropInstance;
  progress: number;
  isReady: boolean;
  timeRemainingMinutes: number;
  yieldAtHarvest: number;
  goldYield: number;
  harvesterOnTile: string | null;
  planterOnTile: string | null;
  ownedSprinklerIds: string[];
  ownedHarvesterIds: string[];
  ownedPlanterIds: string[];
  planterSeedForTile: string | null;
  planterSeedForTilePresentation: GardenSeedPresentation | null;
}

export interface GardenEmptyTileAutomationView {
  emptyRow: number;
  emptyCol: number;
  fieldSprinklerId: string | null;
  fieldHarvesterId: string | null;
  fieldPlanterId: string | null;
  installedToolLabel: string;
  ownedSprinklerIds: string[];
  ownedHarvesterIds: string[];
  ownedPlanterIds: string[];
  selectedSeedForTile: string | null;
  selectedSeedForTilePresentation: GardenSeedPresentation | null;
}

export function formatGardenCategoryLabel(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function getGardenCategoryIcon(category: string): string {
  switch (category) {
    case "flower":
      return "🌸";
    case "vegetable":
      return "🥕";
    case "fruit":
      return "🍎";
    case "herb":
      return "🌿";
    case "grains":
      return "🌾";
    case "grape":
      return "🍇";
    case "special":
      return "✨";
    default:
      return "📦";
  }
}

export function resolveGardenCropIdFromSeed(seedId: string): string | null {
  const cachedCropId = resolvedCropIdBySeedIdCache.get(seedId);
  if (cachedCropId !== undefined) {
    return cachedCropId;
  }

  const directCropId = directCropIdBySeedId.get(seedId);
  if (directCropId) {
    resolvedCropIdBySeedIdCache.set(seedId, directCropId);
    return directCropId;
  }

  const seedMatch = seedId.match(
    /^(.+)_seed(?:_(common|rare|epic|legendary|unique))?$/,
  );
  if (seedMatch) {
    const [, base, rarity] = seedMatch;
    if (rarity) {
      const directCrop = `${base}_${rarity}`;
      if (getCropDef(directCrop)) {
        resolvedCropIdBySeedIdCache.set(seedId, directCrop);
        return directCrop;
      }
    }

    const commonCrop = `${base}_common`;
    if (getCropDef(commonCrop)) {
      resolvedCropIdBySeedIdCache.set(seedId, commonCrop);
      return commonCrop;
    }

    const anyVariant = cropDefinitionList.find(
      (crop) =>
        crop.id.startsWith(`${base}_`) ||
        crop.seedItemId.startsWith(`${base}_seed`),
    );
    if (anyVariant) {
      resolvedCropIdBySeedIdCache.set(seedId, anyVariant.id);
      return anyVariant.id;
    }
  }

  const fallbackCropId = seedId.replace("_seed", "");
  const resolvedCropId = getCropDef(fallbackCropId) ? fallbackCropId : null;
  resolvedCropIdBySeedIdCache.set(seedId, resolvedCropId);
  return resolvedCropId;
}

export function getGardenSeedPresentation(
  seedId: string,
): GardenSeedPresentation {
  const cachedPresentation = seedPresentationCache.get(seedId);
  if (cachedPresentation) {
    return cachedPresentation;
  }

  const cropId = resolveGardenCropIdFromSeed(seedId);
  const cropDef = cropId ? getCropDef(cropId) : null;
  const itemDef = getItemDefSafe(seedId);

  const presentation = {
    seedId,
    cropId,
    cropDef,
    icon: cropDef ? getGardenCategoryIcon(cropDef.category) : "🌱",
    label: cropDef?.name ?? itemDef?.name ?? seedId,
  };

  seedPresentationCache.set(seedId, presentation);
  return presentation;
}

export function selectGardenSeedView(
  state: GameState,
  options?: {
    activeSeedBagSeedId?: string | null;
  },
): GardenSeedViewModel {
  const activeSeedBagSeedId = options?.activeSeedBagSeedId ?? null;
  const seedMakerLevel = getUpgradeLevel(state, SEED_MAKER_UPGRADE_ID);
  const selectedSeedMakerSeedId =
    state.garden.seedMaker?.selectedSeedId ?? null;
  const seedMakerCycleMs = getSeedMakerDurationMs(
    seedMakerLevel,
    selectedSeedMakerSeedId,
  );
  const seedMakerRemainderMs =
    state.garden.automationTimers?.seedMakerRemainderMs ?? 0;
  const isSeedMakerRunning = state.garden.seedMaker?.isRunning ?? false;
  const seedMakerRemainingMs = isSeedMakerRunning
    ? Math.max(0, seedMakerCycleMs - seedMakerRemainderMs)
    : seedMakerCycleMs;
  const availableGems = state.resources.gems ?? 0;

  const seedBagMap = new Map<string, number>();
  for (const item of state.inventory) {
    const definition = getItemDefSafe(item.itemId);
    const isSeedLike =
      definition?.type === "seed" || item.itemId.includes("_seed");
    const isPlantableSeed = resolveGardenCropIdFromSeed(item.itemId) !== null;
    if (!isSeedLike || !isPlantableSeed || item.quantity <= 0) {
      continue;
    }

    seedBagMap.set(
      item.itemId,
      (seedBagMap.get(item.itemId) ?? 0) + item.quantity,
    );
  }

  const seedBag = Array.from(seedBagMap.entries()).map(([seedId, count]) => ({
    seedId,
    count,
    presentation: getGardenSeedPresentation(seedId),
  }));

  const recipeMap = cropDefinitionList.reduce<
    Record<
      string,
      {
        seedId: string;
        cropName: string;
        category: CropCategory;
      }
    >
  >((acc, cropDef) => {
    if (!acc[cropDef.seedItemId]) {
      acc[cropDef.seedItemId] = {
        seedId: cropDef.seedItemId,
        cropName: cropDef.name,
        category: cropDef.category,
      };
    }
    return acc;
  }, {});

  const seedMakerRecipes = Object.values(recipeMap)
    .sort((left, right) => {
      const categoryDelta = left.category.localeCompare(right.category);
      if (categoryDelta !== 0) return categoryDelta;
      return left.cropName.localeCompare(right.cropName);
    })
    .map((recipe) => {
      const cost = getSeedMakerCost(recipe.seedId);
      const availableResource =
        state.garden.cropStorage.current[recipe.category] ?? 0;
      const isSelected = selectedSeedMakerSeedId === recipe.seedId;

      return {
        ...recipe,
        categoryLabel: formatGardenCategoryLabel(recipe.category),
        categoryIcon: getGardenCategoryIcon(recipe.category),
        cost,
        availableResource,
        availableGems,
        canCraft:
          availableResource >= cost.resourceCost &&
          availableGems >= cost.gemCost,
        isSelected,
        canSelectRecipe: !isSeedMakerRunning || isSelected,
        presentation: getGardenSeedPresentation(recipe.seedId),
      };
    });

  return {
    seedBag,
    seedMakerRecipes,
    seedMakerLevel,
    isSeedMakerUnlocked: seedMakerLevel > 0,
    selectedSeedMakerSeedId,
    selectedSeedMakerPresentation: selectedSeedMakerSeedId
      ? getGardenSeedPresentation(selectedSeedMakerSeedId)
      : null,
    selectedPlanterSeedPresentation: state.garden.selectedPlanterSeedId
      ? getGardenSeedPresentation(state.garden.selectedPlanterSeedId)
      : null,
    activeSeedBagSeedPresentation: activeSeedBagSeedId
      ? getGardenSeedPresentation(activeSeedBagSeedId)
      : null,
    seedMakerCycleMs,
    seedMakerRemainingMs,
    isSeedMakerRunning,
    defaultSeedMakerSeedId:
      selectedSeedMakerSeedId ?? seedMakerRecipes[0]?.seedId ?? null,
  };
}

export function selectGardenOwnedAutomationToolIds(
  state: GameState,
): GardenOwnedAutomationToolIds {
  const sprinklerIds = getOwnedAutomationToolIds(state, "sprinkler");
  const harvesterIds = getOwnedAutomationToolIds(state, "harvester");
  const planterIds = getOwnedAutomationToolIds(state, "planter");

  return {
    sprinklerIds,
    harvesterIds,
    planterIds,
  };
}

export function getGardenAutomationToolAtField(
  state: GameState,
  row: number,
  col: number,
): { type: "sprinkler" | "harvester" | "planter"; id: string } | null {
  const sprinklerId = getPlacedToolIdAtField(state.garden.sprinklers, row, col);
  if (sprinklerId) return { type: "sprinkler", id: sprinklerId };

  const harvesterId = getPlacedToolIdAtField(state.garden.harvesters, row, col);
  if (harvesterId) return { type: "harvester", id: harvesterId };

  const planterId = getPlacedToolIdAtField(state.garden.planters, row, col);
  if (planterId) return { type: "planter", id: planterId };

  return null;
}

export function selectGardenCropTileDetailView(
  state: GameState,
  options: {
    cropId: string;
    cropIndex: number;
    row: number;
    col: number;
    now?: number;
  },
): GardenCropTileDetailView | null {
  const cropInstance = state.garden.crops[options.cropId]?.[options.cropIndex];
  const cropDef = getCropDef(options.cropId);
  if (!cropInstance || !cropDef) return null;

  const now = options.now ?? Date.now();
  const progress = getGrowthProgress(cropInstance, cropDef);
  const ownedToolIds = selectGardenOwnedAutomationToolIds(state);
  const planterOnTile = getPlacedToolIdAtField(
    state.garden.planters,
    options.row,
    options.col,
  );
  const planterSeedForTile =
    state.garden.planterSeedSelections?.[`${options.row},${options.col}`] ??
    state.garden.selectedPlanterSeedId ??
    null;

  return {
    cropId: options.cropId,
    cropIndex: options.cropIndex,
    cropRow: options.row,
    cropCol: options.col,
    cropDef,
    cropInstance,
    progress,
    isReady: progress >= 100,
    timeRemainingMinutes: Math.max(
      0,
      cropDef.growthTimeMinutes - (now - cropInstance.plantedAt) / (60 * 1000),
    ),
    yieldAtHarvest: calculateYieldWithMastery(
      state,
      options.cropId,
      cropDef,
      cropInstance.waterLevel,
    ),
    goldYield: calculateGoldWithMastery(state, options.cropId, cropDef),
    harvesterOnTile: getPlacedToolIdAtField(
      state.garden.harvesters,
      options.row,
      options.col,
    ),
    planterOnTile,
    ownedSprinklerIds: ownedToolIds.sprinklerIds,
    ownedHarvesterIds: ownedToolIds.harvesterIds,
    ownedPlanterIds: ownedToolIds.planterIds,
    planterSeedForTile,
    planterSeedForTilePresentation: planterSeedForTile
      ? getGardenSeedPresentation(planterSeedForTile)
      : null,
  };
}

export function selectGardenEmptyTileAutomationView(
  state: GameState,
  options: {
    row: number;
    col: number;
  },
): GardenEmptyTileAutomationView {
  const automationTool = getGardenAutomationToolAtField(
    state,
    options.row,
    options.col,
  );
  const ownedToolIds = selectGardenOwnedAutomationToolIds(state);
  const fieldSprinklerId =
    automationTool?.type === "sprinkler" ? automationTool.id : null;
  const fieldHarvesterId =
    automationTool?.type === "harvester" ? automationTool.id : null;
  const fieldPlanterId =
    automationTool?.type === "planter" ? automationTool.id : null;
  const selectedSeedForTile = fieldPlanterId
    ? (state.garden.planterSeedSelections?.[`${options.row},${options.col}`] ??
      state.garden.selectedPlanterSeedId ??
      null)
    : null;

  return {
    emptyRow: options.row,
    emptyCol: options.col,
    fieldSprinklerId,
    fieldHarvesterId,
    fieldPlanterId,
    installedToolLabel: fieldSprinklerId
      ? `Installed: ${getItemDefSafe(fieldSprinklerId)?.name ?? fieldSprinklerId}`
      : fieldHarvesterId
        ? `Installed: ${getItemDefSafe(fieldHarvesterId)?.name ?? fieldHarvesterId}`
        : fieldPlanterId
          ? `Installed: ${getItemDefSafe(fieldPlanterId)?.name ?? fieldPlanterId}`
          : "No automation tool installed on this field",
    ownedSprinklerIds: ownedToolIds.sprinklerIds,
    ownedHarvesterIds: ownedToolIds.harvesterIds,
    ownedPlanterIds: ownedToolIds.planterIds,
    selectedSeedForTile,
    selectedSeedForTilePresentation: selectedSeedForTile
      ? getGardenSeedPresentation(selectedSeedForTile)
      : null,
  };
}

function getOwnedAutomationToolIds(
  state: GameState,
  toolName: "sprinkler" | "harvester" | "planter",
): string[] {
  const ids = state.inventory
    .filter((item) => {
      const def = getItemDefSafe(item.itemId);
      return def?.type === "tool" && item.itemId.includes(toolName);
    })
    .map((item) => item.itemId);

  return Array.from(new Set(ids));
}

function getPlacedToolIdAtField(
  placements: Record<string, { row: number; col: number }[]> | undefined,
  row: number,
  col: number,
): string | null {
  if (!placements) return null;

  for (const [toolId, positions] of Object.entries(placements)) {
    if (
      positions.some((position) => position.row === row && position.col === col)
    ) {
      return toolId;
    }
  }

  return null;
}
