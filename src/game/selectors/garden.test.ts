import { describe, expect, it } from "vitest";
import {
  cropDefinitions,
  getSeedMakerDurationMs,
  placePlanterOnField,
  placeHarvesterOnField,
  plantCrop,
} from "../garden";
import { getItemDefSafe } from "../items";
import { createDefaultState } from "../state";
import { upgradeDefinitions } from "../upgrades";
import {
  formatGardenCategoryLabel,
  getGardenCategoryIcon,
  getGardenSeedPresentation,
  resolveGardenCropIdFromSeed,
  selectGardenCropTileDetailView,
  selectGardenEmptyTileAutomationView,
  selectGardenOwnedAutomationToolIds,
  selectGardenSeedView,
} from "./garden";

describe("garden selectors", () => {
  it("resolves crop ids from current and legacy seed ids", () => {
    const sunflowerSeedId = cropDefinitions.sunflower_common.seedItemId;

    expect(resolveGardenCropIdFromSeed(sunflowerSeedId)).toBe(
      "sunflower_common",
    );
    expect(resolveGardenCropIdFromSeed("sunflower_seed_common")).toBe(
      "sunflower_common",
    );
    expect(resolveGardenCropIdFromSeed("unknown_seed")).toBeNull();
  });

  it("groups plantable seed bag entries and exposes selected presentations", () => {
    const state = createDefaultState();
    const sunflowerSeedId = cropDefinitions.sunflower_common.seedItemId;
    const grapeSeedId = cropDefinitions.grape_common.seedItemId;

    state.inventory = [
      { uid: "seed-1", itemId: sunflowerSeedId, quantity: 2, level: 1 },
      { uid: "seed-2", itemId: sunflowerSeedId, quantity: 3, level: 1 },
      { uid: "seed-3", itemId: grapeSeedId, quantity: 1, level: 1 },
      { uid: "fake-seed", itemId: "unknown_seed", quantity: 9, level: 1 },
      { uid: "tool-1", itemId: "wateringcan_common", quantity: 1, level: 1 },
    ];
    state.garden.selectedPlanterSeedId = grapeSeedId;
    state.garden.seedMaker = {
      isRunning: false,
      selectedSeedId: sunflowerSeedId,
    };

    const view = selectGardenSeedView(state, {
      activeSeedBagSeedId: sunflowerSeedId,
    });

    expect(view.seedBag).toHaveLength(2);
    expect(
      view.seedBag.find((entry) => entry.seedId === sunflowerSeedId)?.count,
    ).toBe(5);
    expect(view.activeSeedBagSeedPresentation?.label).toBe(
      cropDefinitions.sunflower_common.name,
    );
    expect(view.selectedPlanterSeedPresentation?.label).toBe(
      cropDefinitions.grape_common.name,
    );
    expect(view.selectedSeedMakerPresentation?.icon).toBe(
      getGardenCategoryIcon(cropDefinitions.sunflower_common.category),
    );
  });

  it("builds seed maker recipes with availability and running selection rules", () => {
    const state = createDefaultState();
    const sunflowerSeedId = cropDefinitions.sunflower_common.seedItemId;
    const carrotSeedId = cropDefinitions.carrot_common.seedItemId;

    state.upgrades = [{ ...upgradeDefinitions.seedmaker_lab, level: 2 }];
    state.resources.gems = 12;
    state.garden.cropStorage.current.flower = 500;
    state.garden.cropStorage.current.vegetable = 0;
    state.garden.seedMaker = {
      isRunning: true,
      selectedSeedId: sunflowerSeedId,
    };
    state.garden.automationTimers = {
      ...state.garden.automationTimers,
      seedMakerRemainderMs: 1000,
    };

    const view = selectGardenSeedView(state);
    const sunflowerRecipe = view.seedMakerRecipes.find(
      (recipe) => recipe.seedId === sunflowerSeedId,
    );
    const carrotRecipe = view.seedMakerRecipes.find(
      (recipe) => recipe.seedId === carrotSeedId,
    );

    expect(view.isSeedMakerUnlocked).toBe(true);
    expect(view.seedMakerLevel).toBe(2);
    expect(view.seedMakerRemainingMs).toBe(
      getSeedMakerDurationMs(2, sunflowerSeedId) - 1000,
    );
    expect(sunflowerRecipe?.isSelected).toBe(true);
    expect(sunflowerRecipe?.canSelectRecipe).toBe(true);
    expect(sunflowerRecipe?.canCraft).toBe(true);
    expect(carrotRecipe?.canSelectRecipe).toBe(false);
    expect(carrotRecipe?.canCraft).toBe(false);
  });

  it("formats category and seed presentation fallbacks", () => {
    const herbSeedId = cropDefinitions.mint_common.seedItemId;
    const toolName = getItemDefSafe("wateringcan_common")?.name;

    expect(formatGardenCategoryLabel("grains")).toBe("Grains");
    expect(getGardenCategoryIcon("special")).toBe("✨");
    expect(getGardenSeedPresentation(herbSeedId).label).toBe(
      cropDefinitions.mint_common.name,
    );
    expect(getGardenSeedPresentation("wateringcan_common").label).toBe(
      toolName,
    );
  });

  it("builds crop tile detail view with progress, harvest values, and automation inventory", () => {
    const state = createDefaultState();
    const cropId = "sunflower_common";
    const planterSeedId = cropDefinitions.grape_common.seedItemId;

    state.inventory.push(
      { uid: "harv-1", itemId: "harvester_common", quantity: 1, level: 1 },
      { uid: "harv-2", itemId: "harvester_common", quantity: 1, level: 1 },
      { uid: "plant-1", itemId: "planter_common", quantity: 1, level: 1 },
      { uid: "sprink-1", itemId: "sprinkler_common", quantity: 1, level: 1 },
    );

    let nextState = plantCrop(state, cropId, 0, 0);
    nextState.garden.selectedPlanterSeedId = planterSeedId;
    nextState = placeHarvesterOnField(nextState, 0, 0, "harvester_common");
    nextState.garden.crops[cropId][0].waterLevel = 50;
    nextState.garden.crops[cropId][0].plantedAt = Date.now() - 30 * 60 * 1000;

    const view = selectGardenCropTileDetailView(nextState, {
      cropId,
      cropIndex: 0,
      row: 0,
      col: 0,
      now: Date.now(),
    });

    expect(view).not.toBeNull();
    expect(view?.cropDef.id).toBe(cropId);
    expect(view?.harvesterOnTile).toBe("harvester_common");
    expect(view?.planterOnTile).toBeNull();
    expect(view?.ownedHarvesterIds).toEqual(["harvester_common"]);
    expect(view?.ownedPlanterIds).toEqual(["planter_common"]);
    expect(view?.ownedSprinklerIds).toEqual(["sprinkler_common"]);
    expect(view?.planterSeedForTilePresentation?.label).toBe(
      cropDefinitions.grape_common.name,
    );
    expect(view?.yieldAtHarvest).toBeGreaterThan(0);
    expect(view?.goldYield).toBeGreaterThan(0);
    expect(view?.progress).toBeGreaterThan(0);
  });

  it("builds empty tile automation view with installed tool and per-tile planter seed", () => {
    const state = createDefaultState();
    const seedId = cropDefinitions.grape_common.seedItemId;

    state.inventory.push(
      { uid: "planter-a", itemId: "planter_common", quantity: 1, level: 1 },
      { uid: "planter-b", itemId: "planter_common", quantity: 1, level: 1 },
      { uid: "sprink-a", itemId: "sprinkler_common", quantity: 1, level: 1 },
    );
    state.garden.selectedPlanterSeedId =
      cropDefinitions.sunflower_common.seedItemId;
    state.garden.planterSeedSelections = { "1,1": seedId };

    const nextState = placePlanterOnField(
      state,
      1,
      1,
      "planter_common",
      seedId,
    );

    const toolIds = selectGardenOwnedAutomationToolIds(nextState);
    const view = selectGardenEmptyTileAutomationView(nextState, {
      row: 1,
      col: 1,
    });

    expect(toolIds.planterIds).toEqual(["planter_common"]);
    expect(toolIds.sprinklerIds).toEqual(["sprinkler_common"]);
    expect(view.fieldPlanterId).toBe("planter_common");
    expect(view.installedToolLabel).toContain("Planter");
    expect(view.selectedSeedForTile).toBe(seedId);
    expect(view.selectedSeedForTilePresentation?.label).toBe(
      cropDefinitions.grape_common.name,
    );
  });
});
