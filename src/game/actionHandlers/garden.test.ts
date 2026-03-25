import { describe, expect, it } from "vitest";
import { createDefaultState } from "../state";
import { applyGardenAction } from "./garden";

describe("garden action handler", () => {
  it("replaces state when explicitly requested", () => {
    const state = createDefaultState();
    const nextState = {
      ...state,
      resources: {
        ...state.resources,
        gold: state.resources.gold + 123,
      },
    };

    const next = applyGardenAction(state, {
      type: "garden/replaceState",
      nextState,
    });

    expect(next).toBe(nextState);
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
