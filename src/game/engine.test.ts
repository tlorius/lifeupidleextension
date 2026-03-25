import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultState } from "./state";
import type { GameState } from "./types";
import {
  addItem,
  applyIdle,
  calculateItemStat,
  equipItem,
  getGoldIncome,
  getManaRegenPerSecond,
  getPetStats,
  getTotalStats,
  upgradeItem,
  usePotion,
} from "./engine";

function makeState(): GameState {
  return JSON.parse(JSON.stringify(defaultState));
}

describe("engine", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("calculates gold income with upgrade and active temporary boost", () => {
    const now = 1_700_000_000_000;
    vi.spyOn(Date, "now").mockReturnValue(now);

    const state = makeState();
    state.stats.attack = 10;
    state.upgrades = [
      {
        id: "gold_upgrade",
        name: "Gold Upgrade",
        level: 2,
        baseCost: 10,
        scaling: 1.2,
        type: "autoGold",
        tree: "resource",
        bonuses: [
          {
            percentBonusType: "goldIncome",
            percentBonusAmount: 0.1,
          },
        ],
      },
    ];
    state.temporaryEffects = {
      goldIncomeBoostPercent: 30,
      goldIncomeBoostUntil: now + 1_000,
    };

    expect(getGoldIncome(state)).toBeCloseTo(15, 8);
  });

  it("includes equipped pet gold-income bonus in gold income", () => {
    const now = 1_700_000_000_000;
    vi.spyOn(Date, "now").mockReturnValue(now);

    const state = makeState();
    state.stats.attack = 10;
    state.inventory = [
      {
        uid: "pet-1",
        itemId: "fire_fox",
        quantity: 1,
        level: 2,
      },
    ];
    state.equipment.pet = "pet-1";

    expect(getGoldIncome(state)).toBeCloseTo(12, 8);
  });

  it("stacks upgrade, pet and active temporary gold-income modifiers", () => {
    const now = 1_700_000_000_000;
    vi.spyOn(Date, "now").mockReturnValue(now);

    const state = makeState();
    state.stats.attack = 10;
    state.upgrades = [
      {
        id: "gold_upgrade",
        name: "Gold Upgrade",
        level: 2,
        baseCost: 10,
        scaling: 1.2,
        type: "autoGold",
        tree: "resource",
        bonuses: [
          {
            percentBonusType: "goldIncome",
            percentBonusAmount: 0.1,
          },
        ],
      },
    ];
    state.inventory = [
      {
        uid: "pet-1",
        itemId: "fire_fox",
        quantity: 1,
        level: 3,
      },
    ];
    state.equipment.pet = "pet-1";
    state.temporaryEffects = {
      goldIncomeBoostPercent: 50,
      goldIncomeBoostUntil: now + 60_000,
    };

    expect(getGoldIncome(state)).toBeCloseTo(20, 8);
  });

  it("ignores expired temporary gold-income boost", () => {
    const now = 1_700_000_000_000;
    vi.spyOn(Date, "now").mockReturnValue(now);

    const state = makeState();
    state.stats.attack = 10;
    state.temporaryEffects = {
      goldIncomeBoostPercent: 200,
      goldIncomeBoostUntil: now - 1,
    };

    expect(getGoldIncome(state)).toBeCloseTo(10, 8);
  });

  it("evaluates temporary boost deterministically with explicit now", () => {
    const state = makeState();
    state.stats.attack = 10;
    state.temporaryEffects = {
      goldIncomeBoostPercent: 50,
      goldIncomeBoostUntil: 1_000,
    };

    expect(getGoldIncome(state, 900)).toBeCloseTo(15, 8);
    expect(getGoldIncome(state, 1_000)).toBeCloseTo(10, 8);
  });

  it("does not apply pet gold-income bonus when pet is not equipped", () => {
    const now = 1_700_000_000_000;
    vi.spyOn(Date, "now").mockReturnValue(now);

    const state = makeState();
    state.stats.attack = 10;
    state.inventory = [
      {
        uid: "pet-1",
        itemId: "fire_fox",
        quantity: 1,
        level: 4,
      },
    ];

    expect(getGoldIncome(state)).toBeCloseTo(10, 8);
  });

  it("applies idle gold gain based on elapsed milliseconds", () => {
    const state = makeState();
    state.stats.attack = 10;
    state.resources.gold = 5;

    applyIdle(state, 2_500);

    expect(state.resources.gold).toBeCloseTo(30, 8);
  });

  it("regenerates mana over time and respects mana regen bonuses", () => {
    const state = makeState();
    state.resources.energy = 50;
    state.upgrades = [
      {
        id: "mana_regen_test",
        name: "Mana Flow",
        level: 1,
        baseCost: 10,
        scaling: 1.1,
        type: "energyRegen",
        tree: "resource",
        bonuses: [
          {
            percentBonusType: "energyRegeneration",
            percentBonusAmount: 0.5,
          },
        ],
      },
    ];

    expect(getManaRegenPerSecond(state)).toBeCloseTo(3, 8);

    applyIdle(state, 5_000);

    expect(state.resources.energy).toBeCloseTo(65, 8);
  });

  it("calculates item stats with rarity and level scaling", () => {
    const stat = calculateItemStat(10, 11, "rare");

    expect(stat).toBeCloseTo(15, 8);
  });

  it("adds an item with generated uid and requested quantity", () => {
    const state = makeState();
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(
      "00000000-0000-4000-8000-000000000000",
    );

    const next = addItem(state, "mana_potion", 3);

    expect(next.inventory).toHaveLength(1);
    expect(next.inventory[0]).toEqual({
      uid: "00000000-0000-4000-8000-000000000000",
      itemId: "mana_potion",
      quantity: 3,
      level: 1,
    });
  });

  it("consumes mana potion and applies temporary gold boost", () => {
    const now = 1_700_000_000_000;
    vi.spyOn(Date, "now").mockReturnValue(now);

    const state = makeState();
    state.inventory = [
      {
        uid: "potion-1",
        itemId: "mana_potion",
        quantity: 1,
        level: 1,
      },
    ];

    const next = usePotion(state, "potion-1");

    expect(next.inventory).toHaveLength(0);
    expect(next.temporaryEffects?.goldIncomeBoostPercent).toBe(25);
    expect(next.temporaryEffects?.goldIncomeBoostUntil).toBe(
      now + 10 * 60 * 1000,
    );
  });

  it("consumes health potion and restores combat hp", () => {
    const state = makeState();
    state.inventory = [
      {
        uid: "potion-health",
        itemId: "health_potion",
        quantity: 1,
        level: 1,
      },
    ];
    state.combat.playerCurrentHp = 25;
    state.stats.hp = 100;

    const next = usePotion(state, "potion-health");

    expect(next.inventory).toHaveLength(0);
    expect(next.combat.playerCurrentHp).toBe(60);
    expect(next.resources.energy).toBe(100);
  });

  it("uses deterministic now/rng options for chaos potion effects", () => {
    const state = makeState();
    state.inventory = [
      {
        uid: "potion-chaos",
        itemId: "chaos_potion",
        quantity: 1,
        level: 1,
      },
    ];

    const next = usePotion(state, "potion-chaos", {
      now: 2_000,
      rng: () => 0.7, // floor(0.7 * 5) => 3, gold boost branch
    });

    expect(next.temporaryEffects?.goldIncomeBoostPercent).toBe(300);
    expect(next.temporaryEffects?.goldIncomeBoostUntil).toBe(
      2_000 + 10 * 60 * 1000,
    );
  });

  it("equips accessories into the first free accessory slot", () => {
    const state = makeState();
    state.inventory = [
      {
        uid: "ring-a",
        itemId: "ring_1",
        quantity: 1,
        level: 1,
      },
      {
        uid: "ring-b",
        itemId: "amulet_1",
        quantity: 1,
        level: 1,
      },
    ];

    const withFirst = equipItem(state, "ring-a");
    const withSecond = equipItem(withFirst, "ring-b");

    expect(withFirst.equipment.accessory1).toBe("ring-a");
    expect(withSecond.equipment.accessory2).toBe("ring-b");
  });

  it("does not equip sprinkler tools into equipment", () => {
    const state = makeState();
    state.inventory = [
      {
        uid: "sprinkler-1",
        itemId: "sprinkler_common",
        quantity: 1,
        level: 1,
      },
    ];

    const next = equipItem(state, "sprinkler-1");

    expect(next.equipment.tool).toBeNull();
  });

  it("upgrades an item when enough gems are available", () => {
    const state = makeState();
    state.resources.gems = 100;
    state.inventory = [
      {
        uid: "sword-1",
        itemId: "sword_1",
        quantity: 1,
        level: 1,
      },
    ];

    const next = upgradeItem(state, "sword-1");

    expect(next.inventory[0].level).toBe(2);
    expect(next.resources.gems).toBe(90);
  });

  it("returns unchanged state when gems are insufficient for upgrade", () => {
    const state = makeState();
    state.resources.gems = 5;
    state.inventory = [
      {
        uid: "sword-1",
        itemId: "sword_1",
        quantity: 1,
        level: 1,
      },
    ];

    const next = upgradeItem(state, "sword-1");

    expect(next.inventory[0].level).toBe(1);
    expect(next.resources.gems).toBe(5);
  });

  it("does not upgrade potions even when enough gems are available", () => {
    const state = makeState();
    state.resources.gems = 999;
    state.inventory = [
      {
        uid: "potion-1",
        itemId: "mana_potion",
        quantity: 1,
        level: 1,
      },
    ];

    const next = upgradeItem(state, "potion-1");

    expect(next.inventory[0].level).toBe(1);
    expect(next.resources.gems).toBe(999);
  });

  it("returns pet percentage stats from equipped pet", () => {
    const state = makeState();
    state.inventory = [
      {
        uid: "pet-1",
        itemId: "fire_fox",
        quantity: 1,
        level: 3,
      },
    ];
    state.equipment.pet = "pet-1";

    const petStats = getPetStats(state);

    expect(petStats.goldIncome).toBeCloseTo(30, 8);
  });

  it("aggregates total stats from base, equipment and upgrade bonuses", () => {
    const state = makeState();
    state.stats.attack = 10;
    state.inventory = [
      {
        uid: "weapon-1",
        itemId: "sword_1",
        quantity: 1,
        level: 1,
      },
    ];
    state.equipment.weapon = "weapon-1";
    state.upgrades = [
      {
        id: "flat_attack",
        name: "Flat Attack",
        level: 3,
        baseCost: 10,
        scaling: 1.1,
        type: "attackBoost",
        tree: "combat",
        bonuses: [{ statsFlat: { attack: 2 } }],
      },
    ];

    const total = getTotalStats(state);

    expect(total.attack).toBeCloseTo(21, 8);
  });
});
