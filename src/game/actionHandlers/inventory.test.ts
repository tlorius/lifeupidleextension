import { describe, expect, it } from "vitest";
import { createDefaultState } from "../state";
import { reduceInventoryAction } from "./inventory";

describe("inventory action handler", () => {
  it("keeps equipped items when selling a selected batch", () => {
    const seeded = reduceInventoryAction(createDefaultState(), {
      type: "inventory/addDebugItems",
    });
    const weapon = seeded.inventory.find((entry) => entry.itemId === "sword_1");
    const armor = seeded.inventory.find((entry) => entry.itemId === "armor_1");
    expect(weapon).toBeTruthy();
    expect(armor).toBeTruthy();

    const equipped = reduceInventoryAction(seeded, {
      type: "inventory/equipItem",
      itemUid: weapon!.uid,
    });
    const next = reduceInventoryAction(equipped, {
      type: "inventory/sellSelectedItems",
      itemUids: [weapon!.uid, armor!.uid],
    });

    expect(next.inventory.some((entry) => entry.uid === weapon!.uid)).toBe(
      true,
    );
    expect(next.inventory.some((entry) => entry.uid === armor!.uid)).toBe(
      false,
    );
    expect(next.equipment.weapon).toBe(weapon!.uid);
  });

  it("returns the same state when the selected sell batch is empty", () => {
    const state = createDefaultState();

    const next = reduceInventoryAction(state, {
      type: "inventory/sellSelectedItems",
      itemUids: [],
    });

    expect(next).toBe(state);
  });
});
