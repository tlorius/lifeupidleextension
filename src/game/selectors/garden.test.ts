import { describe, expect, it } from "vitest";
import { cropDefinitions, getSeedMakerDurationMs } from "../garden";
import { getItemDefSafe } from "../items";
import { createDefaultState } from "../state";
import { upgradeDefinitions } from "../upgrades";
import {
  formatGardenCategoryLabel,
  getGardenCategoryIcon,
  getGardenSeedPresentation,
  resolveGardenCropIdFromSeed,
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
});
