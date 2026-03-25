import { describe, expect, it } from "vitest";
import { createDefaultState } from "../state";
import { applyGardenAction } from "./garden";

describe("garden action handler", () => {
  it("sets and removes crop sprinkler through explicit actions", () => {
    const state = createDefaultState();
    const withCrop = applyGardenAction(state, {
      type: "garden/plantCrop",
      cropId: "sunflower_common",
      row: 0,
      col: 0,
    });

    const withSprinkler = applyGardenAction(withCrop, {
      type: "garden/setCropSprinkler",
      row: 0,
      col: 0,
      sprinklerId: "sprinkler_common",
    });

    expect(withSprinkler.garden.crops.sunflower_common[0].hasSprinkler).toBe(
      true,
    );

    const withoutSprinkler = applyGardenAction(withSprinkler, {
      type: "garden/setCropSprinkler",
      row: 0,
      col: 0,
      sprinklerId: null,
    });

    expect(withoutSprinkler.garden.crops.sunflower_common[0].hasSprinkler).toBe(
      false,
    );
  });

  it("reduces crop growth time through explicit action", () => {
    const state = createDefaultState();
    const planted = applyGardenAction(state, {
      type: "garden/plantCrop",
      cropId: "sunflower_common",
      row: 0,
      col: 0,
    });
    planted.resources.gems = 500;
    const plantedAt = planted.garden.crops.sunflower_common[0].plantedAt;

    const reduced = applyGardenAction(planted, {
      type: "garden/reduceCropGrowthTime",
      cropId: "sunflower_common",
      cropIndex: 0,
      minutes: 10,
      gemCost: 100,
    });

    expect(reduced.garden.crops.sunflower_common[0].plantedAt).toBe(
      plantedAt - 10 * 60 * 1000,
    );
    expect(reduced.resources.gems).toBe(400);
  });

  it("starts and stops seed maker with timer reset", () => {
    const state = createDefaultState();

    const started = applyGardenAction(state, {
      type: "garden/startSeedMaker",
      seedId: "seed_carrot",
    });

    expect(started.garden.seedMaker?.isRunning).toBe(true);
    expect(started.garden.seedMaker?.selectedSeedId).toBe("seed_carrot");
    expect(started.garden.automationTimers?.seedMakerRemainderMs).toBe(0);

    const stopped = applyGardenAction(started, {
      type: "garden/stopSeedMaker",
    });

    expect(stopped.garden.seedMaker?.isRunning).toBe(false);
    expect(stopped.garden.automationTimers?.seedMakerRemainderMs).toBe(0);
  });

  it("updates planter seed defaults and per-tile overrides", () => {
    const state = createDefaultState();

    const withDefaultSeed = applyGardenAction(state, {
      type: "garden/selectPlanterSeed",
      seedId: "seed_corn",
    });

    expect(withDefaultSeed.garden.selectedPlanterSeedId).toBe("seed_corn");

    const withTileOverride = applyGardenAction(withDefaultSeed, {
      type: "garden/assignPlanterTileSeed",
      row: 2,
      col: 3,
      seedId: "seed_wheat",
    });

    expect(withTileOverride.garden.planterSeedSelections?.["2,3"]).toBe(
      "seed_wheat",
    );
  });

  it("equips and unequips tool through actions", () => {
    const state = createDefaultState();

    const equipped = applyGardenAction(state, {
      type: "garden/equipTool",
      toolUid: "tool_uid_123",
    });
    expect(equipped.equipment.tool).toBe("tool_uid_123");

    const unequipped = applyGardenAction(equipped, {
      type: "garden/unequipTool",
    });
    expect(unequipped.equipment.tool).toBeNull();
  });
});
