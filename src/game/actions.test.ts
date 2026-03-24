import { describe, expect, it } from "vitest";
import { reduceGameAction } from "./actions";
import { createDefaultState } from "./state";

describe("actions reducer", () => {
  it("adds gold", () => {
    const state = createDefaultState();
    const next = reduceGameAction(state, {
      type: "resource/addGold",
      amount: 42,
    });

    expect(next.resources.gold).toBe(state.resources.gold + 42);
  });

  it("adds gems and supports missing optional gems", () => {
    const state = createDefaultState();
    state.resources.gems = undefined;

    const next = reduceGameAction(state, {
      type: "resource/addGems",
      amount: 9,
    });

    expect(next.resources.gems).toBe(9);
  });

  it("adds energy and supports missing optional energy", () => {
    const state = createDefaultState();
    state.resources.energy = undefined;

    const next = reduceGameAction(state, {
      type: "resource/addEnergy",
      amount: 11,
    });

    expect(next.resources.energy).toBe(11);
  });

  it("adds both gold and gems in one action", () => {
    const state = createDefaultState();
    const next = reduceGameAction(state, {
      type: "resource/addGoldAndGems",
      goldAmount: 100,
      gemsAmount: 7,
    });

    expect(next.resources.gold).toBe(state.resources.gold + 100);
    expect(next.resources.gems).toBe((state.resources.gems ?? 0) + 7);
  });

  it("adds class skill points", () => {
    const state = createDefaultState();
    const next = reduceGameAction(state, {
      type: "character/addSkillPoints",
      amount: 5,
    });

    expect(next.character.availableSkillPoints).toBe(
      state.character.availableSkillPoints + 5,
    );
  });

  it("switches class through reducer action", () => {
    const state = createDefaultState();
    state.playerProgress.level = 10;
    state.resources.gems = 200;

    const next = reduceGameAction(state, {
      type: "class/switch",
      classId: "berserker",
    });

    expect(next.character.activeClassId).toBe("berserker");
    expect(next.resources.gems).toBe((state.resources.gems ?? 0) - 100);
  });

  it("upgrades a class node through reducer action", () => {
    const state = createDefaultState();
    state.playerProgress.level = 10;
    state.character.availableSkillPoints = 3;

    const switched = reduceGameAction(state, {
      type: "class/switch",
      classId: "berserker",
    });
    const next = reduceGameAction(switched, {
      type: "class/upgradeNode",
      classId: "berserker",
      nodeId: "berserker_1",
    });

    expect(
      next.character.classProgress.berserker.unlockedNodeRanks.berserker_1,
    ).toBe(1);
    expect(next.character.availableSkillPoints).toBe(
      switched.character.availableSkillPoints - 1,
    );
  });

  it("sets class spell slot through reducer action", () => {
    const state = createDefaultState();
    const next = reduceGameAction(state, {
      type: "class/setSpellSlot",
      classId: "berserker",
      slotIndex: 0,
      spellId: "arcane_bolt",
    });

    expect(next.character.classProgress.berserker.selectedSpellIds[0]).toBe(
      "arcane_bolt",
    );
  });

  it("adds debug items", () => {
    const state = createDefaultState();
    const next = reduceGameAction(state, {
      type: "inventory/addDebugItems",
    });

    expect(next.inventory.length).toBeGreaterThan(state.inventory.length);
  });

  it("resets to default state", () => {
    const state = reduceGameAction(createDefaultState(), {
      type: "resource/addGold",
      amount: 999,
    });

    const reset = reduceGameAction(state, { type: "state/resetToDefault" });
    const fresh = createDefaultState();

    expect(reset.resources.gold).toBe(fresh.resources.gold);
    expect(reset.inventory.length).toBe(fresh.inventory.length);
    expect(reset.character.availableSkillPoints).toBe(
      fresh.character.availableSkillPoints,
    );
  });
});
