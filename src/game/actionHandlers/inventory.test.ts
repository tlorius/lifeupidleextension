import { describe, expect, it } from "vitest";
import { createDefaultState } from "../state";
import { reduceInventoryAction, type InventoryAction } from "./inventory";

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

  it("produces identical inventory state for identical sell action sequences", () => {
    const base = createDefaultState();
    const seeded = reduceInventoryAction(base, {
      type: "inventory/addDebugItems",
    });

    const weapon = seeded.inventory.find((entry) => entry.itemId === "sword_1");
    if (!weapon) return;

    const sequence: InventoryAction[] = [
      { type: "inventory/equipItem", itemUid: weapon.uid },
      { type: "inventory/sellSelectedItems", itemUids: [] },
    ];

    const runSequence = () =>
      sequence.reduce(
        (next, action) => reduceInventoryAction(next, action),
        structuredClone(seeded),
      );

    const first = runSequence();
    const second = runSequence();

    expect(first).toEqual(second);
  });

  it("buys shop items with ruby and deducts ruby balance", () => {
    const state = createDefaultState();
    state.resources.ruby = 25;

    const next = reduceInventoryAction(state, {
      type: "inventory/buyShopItem",
      itemId: "gorelord_cleaver",
      currency: "ruby",
      costPerItem: 10,
      quantity: 2,
    });

    expect(next.resources.ruby).toBe(5);
    expect(
      next.inventory.filter((entry) => entry.itemId === "gorelord_cleaver")
        .length,
    ).toBe(2);
  });

  it("does not buy shop items when ruby is insufficient", () => {
    const state = createDefaultState();
    state.resources.ruby = 9;

    const next = reduceInventoryAction(state, {
      type: "inventory/buyShopItem",
      itemId: "gorelord_cleaver",
      currency: "ruby",
      costPerItem: 10,
      quantity: 1,
    });

    expect(next).toBe(state);
  });

  it("buys shop items with gems and deducts gem balance", () => {
    const state = createDefaultState();
    state.resources.gems = 20;

    const next = reduceInventoryAction(state, {
      type: "inventory/buyShopItem",
      itemId: "starlime_seed_rare",
      currency: "gems",
      costPerItem: 4,
      quantity: 3,
    });

    expect(next.resources.gems).toBe(8);
    expect(
      next.inventory.filter((entry) => entry.itemId === "starlime_seed_rare")
        .length,
    ).toBe(3);
  });
});
