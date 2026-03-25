import { describe, expect, it } from "vitest";
import { createDefaultState } from "../state";
import { selectInventoryView } from "./inventory";

describe("inventory selectors", () => {
  it("groups seed stacks and keeps the highest-level representative", () => {
    const state = createDefaultState();
    state.inventory = [
      {
        uid: "seed-low",
        itemId: "sunflower_seed_common",
        quantity: 2,
        level: 1,
      },
      {
        uid: "seed-high",
        itemId: "sunflower_seed_common",
        quantity: 3,
        level: 4,
      },
      {
        uid: "weapon-1",
        itemId: "sword_1",
        quantity: 1,
        level: 2,
      },
    ];

    const result = selectInventoryView(state, "all", [], "seed-high");
    const groupedSeed = result.displayInventory.find(
      (entry) => entry.itemId === "sunflower_seed_common",
    );

    expect(result.displayInventory).toHaveLength(2);
    expect(groupedSeed).not.toBeUndefined();
    expect(groupedSeed?.uid).toBe("seed-high");
    expect(groupedSeed?.quantity).toBe(5);
    expect(groupedSeed?.isGroupedSeed).toBe(true);
    expect(groupedSeed?.selectableUids).toEqual(["seed-low", "seed-high"]);
    expect(result.selectedItem?.uid).toBe("seed-high");
  });

  it("computes visible sell targets, selection totals, and unique warnings", () => {
    const state = createDefaultState();
    state.inventory = [
      {
        uid: "equipped-weapon",
        itemId: "sword_1",
        quantity: 1,
        level: 1,
      },
      {
        uid: "unique-weapon",
        itemId: "soul_edge",
        quantity: 1,
        level: 1,
      },
      {
        uid: "ring",
        itemId: "ring_1",
        quantity: 1,
        level: 1,
      },
    ];
    state.equipment.weapon = "equipped-weapon";

    const result = selectInventoryView(
      state,
      "all",
      ["unique-weapon", "ring"],
      null,
    );

    expect(result.selectableVisibleUids).toEqual(["unique-weapon", "ring"]);
    expect(result.allVisibleSelected).toBe(true);
    expect(result.selectedSellTotalGold).toBe(780);
    expect(result.selectedUniqueItemNames).toEqual(["Voidborn Fang"]);
    expect(
      result.displayInventory.find((entry) => entry.uid === "equipped-weapon")
        ?.isSelectable,
    ).toBe(false);
    expect(
      result.displayInventory.find((entry) => entry.uid === "unique-weapon")
        ?.isFullySelected,
    ).toBe(true);
  });
});
