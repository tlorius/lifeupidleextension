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

  it("does not reduce crop growth time when gems are insufficient", () => {
    const state = createDefaultState();
    const planted = applyGardenAction(state, {
      type: "garden/plantCrop",
      cropId: "sunflower_common",
      row: 0,
      col: 0,
    });
    planted.resources.gems = 0;

    const next = applyGardenAction(planted, {
      type: "garden/reduceCropGrowthTime",
      cropId: "sunflower_common",
      cropIndex: 0,
      minutes: 10,
      gemCost: 100,
    });

    expect(next).toBe(planted);
  });

  it("places and removes sprinklers on empty fields via explicit actions", () => {
    const state = createDefaultState();

    const withSprinkler = applyGardenAction(state, {
      type: "garden/placeSprinkler",
      row: 2,
      col: 2,
      sprinklerId: "sprinkler_common",
    });

    expect(withSprinkler.garden.sprinklers.sprinkler_common).toEqual([
      { row: 2, col: 2 },
    ]);

    const withoutSprinkler = applyGardenAction(withSprinkler, {
      type: "garden/removeSprinkler",
      row: 2,
      col: 2,
    });

    expect(withoutSprinkler.garden.sprinklers.sprinkler_common ?? []).toEqual(
      [],
    );
  });

  it("does not place sprinkler when another automation tool occupies the tile", () => {
    const state = createDefaultState();
    const withHarvester = applyGardenAction(state, {
      type: "garden/placeHarvester",
      row: 1,
      col: 1,
      harvesterId: "harvester_common",
    });

    const next = applyGardenAction(withHarvester, {
      type: "garden/placeSprinkler",
      row: 1,
      col: 1,
      sprinklerId: "sprinkler_common",
    });

    expect(next).toBe(withHarvester);
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

  it("produces identical state for identical deterministic action sequences", () => {
    const base = createDefaultState();

    const sequence = [
      { type: "garden/selectPlanterSeed", seedId: "seed_corn" } as const,
      {
        type: "garden/assignPlanterTileSeed",
        row: 1,
        col: 2,
        seedId: "seed_wheat",
      } as const,
      {
        type: "garden/startSeedMaker",
        seedId: "seed_carrot",
      } as const,
      {
        type: "garden/selectSeedMakerRecipe",
        seedId: "seed_corn",
      } as const,
      { type: "garden/stopSeedMaker" } as const,
      {
        type: "garden/equipTool",
        toolUid: "deterministic_tool_uid",
      } as const,
      { type: "garden/unequipTool" } as const,
    ];

    const runSequence = () =>
      sequence.reduce(
        (next, action) => applyGardenAction(next, action),
        structuredClone(base),
      );

    const first = runSequence();
    const second = runSequence();

    expect(first).toEqual(second);
  });
});
