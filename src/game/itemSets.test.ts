import { describe, expect, it } from "vitest";
import { defaultState } from "./state";
import type { GameState } from "./types";
import {
  getActiveSpellSetDamageMultiplier,
  getSetPieceCount,
  hasSetPieceThreshold,
  uniqueSetDefinitions,
} from "./itemSets";

function makeState(): GameState {
  return JSON.parse(JSON.stringify(defaultState));
}

describe("itemSets", () => {
  it("counts all five pieces when both accessory slots are set pieces", () => {
    const state = makeState();
    state.character.activeClassId = "idler";
    state.inventory = [
      { uid: "w", itemId: "soul_edge", quantity: 1, level: 1 },
      { uid: "a", itemId: "void_armor", quantity: 1, level: 1 },
      { uid: "x1", itemId: "chaos_emerald", quantity: 1, level: 1 },
      { uid: "x2", itemId: "voidborn_core", quantity: 1, level: 1 },
      { uid: "p", itemId: "void_beast", quantity: 1, level: 1 },
    ];
    state.equipment.weapon = "w";
    state.equipment.armor = "a";
    state.equipment.accessory1 = "x1";
    state.equipment.accessory2 = "x2";
    state.equipment.pet = "p";

    expect(getSetPieceCount(state, "voidborn")).toBe(5);
  });

  it("does not activate thresholds for the wrong class", () => {
    const state = makeState();
    state.character.activeClassId = "idler";
    state.inventory = [
      { uid: "w", itemId: "windrazor_blade", quantity: 1, level: 1 },
      { uid: "a", itemId: "windrazor_mail", quantity: 1, level: 1 },
      { uid: "x1", itemId: "windrazor_charm", quantity: 1, level: 1 },
      { uid: "x2", itemId: "windrazor_emblem", quantity: 1, level: 1 },
      { uid: "p", itemId: "windrazor_raptor", quantity: 1, level: 1 },
    ];
    state.equipment.weapon = "w";
    state.equipment.armor = "a";
    state.equipment.accessory1 = "x1";
    state.equipment.accessory2 = "x2";
    state.equipment.pet = "p";

    const setDef = uniqueSetDefinitions.windrazor;
    expect(hasSetPieceThreshold(state, setDef, 2)).toBe(false);
    expect(hasSetPieceThreshold(state, setDef, 4)).toBe(false);
    expect(hasSetPieceThreshold(state, setDef, 5)).toBe(false);
  });

  it("applies five-piece bespoke spell multiplier only with matching class", () => {
    const state = makeState();
    state.character.activeClassId = "idler";
    state.inventory = [
      { uid: "w", itemId: "epochveil_scepter", quantity: 1, level: 1 },
      { uid: "a", itemId: "epochveil_coat", quantity: 1, level: 1 },
      { uid: "x1", itemId: "epochveil_charm", quantity: 1, level: 1 },
      { uid: "x2", itemId: "epochveil_signet", quantity: 1, level: 1 },
      { uid: "p", itemId: "epochveil_wyrm", quantity: 1, level: 1 },
    ];
    state.equipment.weapon = "w";
    state.equipment.armor = "a";
    state.equipment.accessory1 = "x1";
    state.equipment.accessory2 = "x2";
    state.equipment.pet = "p";

    expect(
      getActiveSpellSetDamageMultiplier(state, "idler_epoch_cashout"),
    ).toBe(10);

    state.character.activeClassId = "archer";
    expect(
      getActiveSpellSetDamageMultiplier(state, "idler_epoch_cashout"),
    ).toBe(1);
  });
});
