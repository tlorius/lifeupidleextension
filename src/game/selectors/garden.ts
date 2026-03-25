import {
  cropDefinitions,
  getCropDef,
  getSeedMakerCost,
  getSeedMakerDurationMs,
} from "../garden";
import { getItemDefSafe } from "../items";
import { getUpgradeLevel } from "../upgrades";
import type { CropCategory, CropDefinition, GameState } from "../types";

const SEED_MAKER_UPGRADE_ID = "seedmaker_lab";

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

    const anyVariant = Object.values(cropDefinitions).find(
      (crop) =>
        crop.id.startsWith(`${base}_`) ||
        crop.seedItemId.startsWith(`${base}_seed`),
    );
    if (anyVariant) return anyVariant.id;
  }

  const fallbackCropId = seedId.replace("_seed", "");
  return getCropDef(fallbackCropId) ? fallbackCropId : null;
}

export function getGardenSeedPresentation(
  seedId: string,
): GardenSeedPresentation {
  const cropId = resolveGardenCropIdFromSeed(seedId);
  const cropDef = cropId ? getCropDef(cropId) : null;
  const itemDef = getItemDefSafe(seedId);

  return {
    seedId,
    cropId,
    cropDef,
    icon: cropDef ? getGardenCategoryIcon(cropDef.category) : "🌱",
    label: cropDef?.name ?? itemDef?.name ?? seedId,
  };
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

  const recipeMap = Object.values(cropDefinitions).reduce<
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
