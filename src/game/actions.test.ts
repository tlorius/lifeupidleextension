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

  it("max-upgrades an item through reducer action", () => {
    const seeded = reduceGameAction(createDefaultState(), {
      type: "inventory/addDebugItems",
    });
    const item = seeded.inventory.find((entry) => entry.itemId === "sword_1");
    expect(item).toBeTruthy();
    const richState = {
      ...seeded,
      resources: {
        ...seeded.resources,
        gems: 40,
      },
    };

    const next = reduceGameAction(richState, {
      type: "inventory/upgradeItemMax",
      itemUid: item!.uid,
    });
    const upgraded = next.inventory.find((entry) => entry.uid === item!.uid);

    expect(upgraded?.level).toBeGreaterThan((item?.level ?? 1) + 1);
    expect(next.resources.gems ?? 0).toBeLessThan(40);
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

  it("dismantles unique item through reducer action for ruby", () => {
    const seeded = reduceGameAction(createDefaultState(), {
      type: "inventory/addDebugItems",
    });
    const uniqueItem = seeded.inventory.find(
      (entry) => entry.itemId === "soul_edge",
    );
    expect(uniqueItem).toBeTruthy();

    const next = reduceGameAction(seeded, {
      type: "inventory/sellItem",
      itemUid: uniqueItem!.uid,
    });

    expect(next.inventory.some((entry) => entry.uid === uniqueItem!.uid)).toBe(
      false,
    );
    expect(next.resources.ruby).toBeGreaterThan(seeded.resources.ruby ?? 0);
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

  it("applies normalized token rewards through reducer action", () => {
    const state = createDefaultState();

    const next = reduceGameAction(state, {
      type: "rewards/applyTokenRewards",
      normalizedRewards: [{ itemId: "sword_1", quantity: 1 }],
    });

    expect(next.inventory.length).toBeGreaterThan(state.inventory.length);
  });

  it("configures playtime cap and unit with minimum guards", () => {
    const state = createDefaultState();
    const next = reduceGameAction(state, {
      type: "playtime/configure",
      capMs: 30_000,
      tokenUnitMs: 45_000,
    });

    expect(next.playtime.capMs).toBe(60_000);
    expect(next.playtime.tokenUnitMs).toBe(60_000);
    expect(next.playtime.remainingMs).toBeLessThanOrEqual(next.playtime.capMs);
  });

  it("adds playtime token units and stacks playtime", () => {
    const state = createDefaultState();
    state.playtime.remainingMs = 0;
    state.playtime.capMs = 10 * 60 * 1000;
    state.playtime.tokenUnitMs = 5 * 60 * 1000;

    const next = reduceGameAction(state, {
      type: "playtime/addTokenUnits",
      units: 3,
    });

    expect(next.playtime.remainingMs).toBe(15 * 60 * 1000);
  });

  it("consumes playtime in ms and floors at zero", () => {
    const state = createDefaultState();
    state.playtime.remainingMs = 1200;

    const next = reduceGameAction(state, {
      type: "playtime/consumeMs",
      amountMs: 5000,
    });

    expect(next.playtime.remainingMs).toBe(0);
  });

  it("enqueues reward bundles and redeems later", () => {
    const state = createDefaultState();
    const enqueued = reduceGameAction(state, {
      type: "rewards/enqueueTokenBundle",
      sourceToken: "starter-pack",
      rewards: [{ itemId: "health_potion", quantity: 2 }],
      receivedAt: Date.now(),
    });

    expect(enqueued.rewardInbox.bundles).toHaveLength(1);
    expect(enqueued.rewardInbox.nextBundleId).toBe(2);

    const bundleId = enqueued.rewardInbox.bundles[0].id;
    const redeemed = reduceGameAction(enqueued, {
      type: "rewards/redeemInboxBundle",
      bundleId,
    });

    expect(
      redeemed.inventory.some((item) => item.itemId === "health_potion"),
    ).toBe(true);
    expect(
      redeemed.rewardInbox.bundles.find((bundle) => bundle.id === bundleId),
    ).toBeUndefined();
  });

  it("routes garden sprinkler actions through reducer", () => {
    const state = createDefaultState();

    const withSprinkler = reduceGameAction(state, {
      type: "garden/placeSprinkler",
      row: 4,
      col: 5,
      sprinklerId: "sprinkler_common",
    });

    expect(withSprinkler.garden.sprinklers.sprinkler_common).toEqual([
      { row: 4, col: 5 },
    ]);

    const removed = reduceGameAction(withSprinkler, {
      type: "garden/removeSprinkler",
      row: 4,
      col: 5,
    });

    expect(removed.garden.sprinklers.sprinkler_common ?? []).toEqual([]);
  });

  it("routes garden growth reduction action through reducer", () => {
    const planted = reduceGameAction(createDefaultState(), {
      type: "garden/plantCrop",
      cropId: "sunflower_common",
      row: 0,
      col: 0,
    });
    planted.resources.gems = 500;
    const plantedAt = planted.garden.crops.sunflower_common[0].plantedAt;

    const reduced = reduceGameAction(planted, {
      type: "garden/reduceCropGrowthTime",
      cropId: "sunflower_common",
      cropIndex: 0,
      minutes: 5,
      gemCost: 50,
    });

    expect(reduced.garden.crops.sunflower_common[0].plantedAt).toBe(
      plantedAt - 5 * 60 * 1000,
    );
    expect(reduced.resources.gems).toBe(450);
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
