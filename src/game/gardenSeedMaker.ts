import type { GameState } from "./types";
import { CROP_CONFIG, SEED_MAKER_CONFIG } from "./gameConfig";

function getSeedCropDef(seedId: string) {
  return Object.values(CROP_CONFIG).find((crop) => crop.seedItemId === seedId);
}

export function getSeedMakerCost(seedId: string): {
  gemCost: number;
  resourceCost: number;
} {
  const configured =
    SEED_MAKER_CONFIG.costsBySeed[
      seedId as keyof typeof SEED_MAKER_CONFIG.costsBySeed
    ];
  if (configured) {
    return {
      gemCost: configured.gemCost,
      resourceCost: configured.resourceCost,
    };
  }

  return {
    gemCost: SEED_MAKER_CONFIG.defaultCost.gemCost,
    resourceCost: SEED_MAKER_CONFIG.defaultCost.resourceCost,
  };
}

export function getSeedMakerDurationMs(
  seedMakerLevel: number,
  seedId?: string | null,
): number {
  const seedCropDef = seedId ? getSeedCropDef(seedId) : null;
  const baseDurationMs =
    seedCropDef?.category === "special"
      ? SEED_MAKER_CONFIG.baseSpecialDurationMs
      : SEED_MAKER_CONFIG.baseDurationMs;

  const effectiveLevel = Math.max(1, seedMakerLevel);
  const reductionMultiplier = Math.max(
    0,
    1 - (effectiveLevel - 1) * SEED_MAKER_CONFIG.durationReductionPerLevel,
  );
  const reducedDuration = Math.round(baseDurationMs * reductionMultiplier);
  return Math.max(SEED_MAKER_CONFIG.minDurationMs, reducedDuration);
}

function addSeedToInventory(state: GameState, seedId: string): void {
  const existing = state.inventory.find((item) => item.itemId === seedId);
  if (existing) {
    existing.quantity += 1;
    return;
  }

  state.inventory.push({
    uid: crypto.randomUUID(),
    itemId: seedId,
    quantity: 1,
    level: 1,
  });
}

export function canCraftSeedFromSeedMaker(
  state: GameState,
  seedId: string,
): boolean {
  const cropDef = getSeedCropDef(seedId);
  if (!cropDef) return false;

  const cost = getSeedMakerCost(seedId);
  const currentGems = state.resources.gems ?? 0;
  const currentCategoryAmount =
    state.garden.cropStorage.current[cropDef.category] ?? 0;

  if (currentGems < cost.gemCost) return false;
  if (currentCategoryAmount < cost.resourceCost) return false;
  return true;
}

export function craftSeedFromSeedMaker(
  state: GameState,
  seedId: string,
): boolean {
  if (!canCraftSeedFromSeedMaker(state, seedId)) return false;

  const cropDef = getSeedCropDef(seedId);
  if (!cropDef) return false;

  const cost = getSeedMakerCost(seedId);
  const currentGems = state.resources.gems ?? 0;
  const currentCategoryAmount =
    state.garden.cropStorage.current[cropDef.category] ?? 0;

  state.resources.gems = currentGems - cost.gemCost;
  state.garden.cropStorage.current[cropDef.category] =
    currentCategoryAmount - cost.resourceCost;
  addSeedToInventory(state, seedId);

  return true;
}
