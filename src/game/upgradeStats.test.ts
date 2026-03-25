import { describe, expect, it } from "vitest";
import type { GameState, Upgrade } from "./types";
import { defaultState } from "./state";
import { aggregateUpgradeBonuses, getUpgradeStats } from "./upgradeStats";

function makeStateWithUpgrades(upgrades: Upgrade[]): GameState {
  const state: GameState = JSON.parse(JSON.stringify(defaultState));
  state.upgrades = upgrades;
  return state;
}

describe("upgrade stats", () => {
  it("aggregates flat and percent bonuses per level", () => {
    const state = makeStateWithUpgrades([
      {
        id: "test_attack_flat",
        name: "Attack Flat",
        level: 3,
        baseCost: 10,
        scaling: 1.1,
        type: "attackBoost",
        tree: "combat",
        bonuses: [{ statsFlat: { attack: 2 } }],
      },
      {
        id: "test_gold_percent",
        name: "Gold Percent",
        level: 2,
        baseCost: 10,
        scaling: 1.1,
        type: "autoGold",
        tree: "resource",
        bonuses: [
          {
            percentBonusType: "goldIncome",
            percentBonusAmount: 0.1,
          },
        ],
      },
    ]);

    const stats = getUpgradeStats(state);

    expect(stats.attack).toBe(6);
    expect(stats.goldIncome).toBe(20);
  });

  it("combines multiple upgrades targeting the same stat", () => {
    const upgrades: Upgrade[] = [
      {
        id: "flat_1",
        name: "Flat 1",
        level: 2,
        baseCost: 10,
        scaling: 1.1,
        type: "attackBoost",
        tree: "combat",
        bonuses: [{ statsFlat: { defense: 1 } }],
      },
      {
        id: "flat_2",
        name: "Flat 2",
        level: 4,
        baseCost: 10,
        scaling: 1.1,
        type: "attackBoost",
        tree: "combat",
        bonuses: [{ statsFlat: { defense: 0.5 } }],
      },
    ];

    const stats = aggregateUpgradeBonuses(upgrades);

    expect(stats.defense).toBe(4);
  });
});
