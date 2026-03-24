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

  it("free respecs a class through reducer action", () => {
    const state = createDefaultState();
    state.playerProgress.level = 10;
    state.resources.gems = 200;
    state.character.availableSkillPoints = 3;

    const switched = reduceGameAction(state, {
      type: "class/switch",
      classId: "berserker",
    });
    const upgraded = reduceGameAction(switched, {
      type: "class/upgradeNode",
      classId: "berserker",
      nodeId: "berserker_1",
    });

    const respecced = reduceGameAction(upgraded, {
      type: "class/freeRespec",
      classId: "berserker",
    });

    expect(respecced.character.classProgress.berserker.spentPoints).toBe(0);
    expect(
      respecced.character.classProgress.berserker.unlockedNodeRanks.berserker_1,
    ).toBeUndefined();
    expect(respecced.character.availableSkillPoints).toBe(
      upgraded.character.availableSkillPoints + 1,
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

  it("equips an item through reducer action", () => {
    const seeded = reduceGameAction(createDefaultState(), {
      type: "inventory/addDebugItems",
    });
    const weapon = seeded.inventory.find((item) => item.itemId === "sword_1");
    expect(weapon).toBeTruthy();

    const next = reduceGameAction(seeded, {
      type: "inventory/equipItem",
      itemUid: weapon!.uid,
    });

    expect(next.equipment.weapon).toBe(weapon!.uid);
  });

  it("upgrades an item through reducer action", () => {
    const seeded = reduceGameAction(createDefaultState(), {
      type: "inventory/addDebugItems",
    });
    const item = seeded.inventory.find((entry) => entry.itemId === "sword_1");
    expect(item).toBeTruthy();
    const richState = {
      ...seeded,
      resources: {
        ...seeded.resources,
        gems: 999999,
      },
    };

    const next = reduceGameAction(richState, {
      type: "inventory/upgradeItem",
      itemUid: item!.uid,
    });
    const upgraded = next.inventory.find((entry) => entry.uid === item!.uid);

    expect(upgraded?.level).toBe((item?.level ?? 1) + 1);
  });

  it("sells one item through reducer action", () => {
    const seeded = reduceGameAction(createDefaultState(), {
      type: "inventory/addDebugItems",
    });
    const item = seeded.inventory.find((entry) => entry.itemId === "sword_1");
    expect(item).toBeTruthy();

    const next = reduceGameAction(seeded, {
      type: "inventory/sellItem",
      itemUid: item!.uid,
    });

    expect(next.inventory.some((entry) => entry.uid === item!.uid)).toBe(false);
    expect(next.resources.gold).toBeGreaterThanOrEqual(seeded.resources.gold);
  });

  it("sells selected non-equipped items in batch", () => {
    const seeded = reduceGameAction(createDefaultState(), {
      type: "inventory/addDebugItems",
    });
    const candidates = seeded.inventory
      .filter(
        (entry) => entry.itemId === "sword_1" || entry.itemId === "armor_1",
      )
      .slice(0, 2)
      .map((entry) => entry.uid);
    expect(candidates.length).toBeGreaterThan(0);

    const next = reduceGameAction(seeded, {
      type: "inventory/sellSelectedItems",
      itemUids: candidates,
    });

    for (const uid of candidates) {
      expect(next.inventory.some((entry) => entry.uid === uid)).toBe(false);
    }
    expect(next.resources.gold).toBeGreaterThanOrEqual(seeded.resources.gold);
  });

  it("uses potion through reducer action", () => {
    const seeded = reduceGameAction(createDefaultState(), {
      type: "inventory/addDebugItems",
    });
    const potion = seeded.inventory.find(
      (entry) => entry.itemId === "mana_potion",
    );
    expect(potion).toBeTruthy();

    const next = reduceGameAction(seeded, {
      type: "inventory/usePotion",
      itemUid: potion!.uid,
    });

    expect(next.inventory.length).toBeLessThanOrEqual(seeded.inventory.length);
    expect(
      next.temporaryEffects?.goldIncomeBoostUntil ?? 0,
    ).toBeGreaterThanOrEqual(
      seeded.temporaryEffects?.goldIncomeBoostUntil ?? 0,
    );
  });

  it("buys an upgrade through reducer action", () => {
    const state = {
      ...createDefaultState(),
      resources: {
        ...createDefaultState().resources,
        gold: 1000,
      },
    };

    const next = reduceGameAction(state, {
      type: "upgrade/buy",
      upgradeId: "attack_i",
    });

    expect(
      next.upgrades.find((upgrade) => upgrade.id === "attack_i")?.level,
    ).toBe(1);
    expect(next.resources.gold).toBeLessThan(state.resources.gold);
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
