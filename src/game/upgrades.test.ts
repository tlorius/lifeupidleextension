import { beforeEach, describe, expect, it } from "vitest";
import { defaultState } from "./state";
import type { GameState } from "./types";
import {
  areUpgradePrerequisitesMet,
  buyUpgrade,
  getUpgradeDef,
  getUnlockedUpgrades,
  getUpgradesByTree,
  isUpgradeUnlocked,
} from "./upgrades";

describe("Upgrade System - Farming Branching", () => {
  let state: GameState;

  beforeEach(() => {
    state = JSON.parse(JSON.stringify(defaultState));
    state.resources.gold = 100000;
  });

  it("should include the second farming strand in definitions", () => {
    const farmingUpgrades = getUpgradesByTree("farming");
    const farmingIds = farmingUpgrades.map((upgrade) => upgrade.id);

    expect(farmingIds).toContain("better_watering");
    expect(farmingIds).toContain("composting");
    expect(farmingIds).toContain("soil_aeration");
  });

  it("should unlock both tier-2 farming upgrades from plant mastery at level 1", () => {
    state = buyUpgrade(state, "plant_mastery");

    const unlocked = getUnlockedUpgrades(state, "plant_mastery");

    expect(unlocked).toContain("better_watering");
    expect(unlocked).toContain("composting");
  });

  it("should require both tier-2 upgrades for soil aeration", () => {
    expect(areUpgradePrerequisitesMet(state, "soil_aeration")).toBe(false);

    state = buyUpgrade(state, "plant_mastery");
    state = buyUpgrade(state, "better_watering");
    expect(areUpgradePrerequisitesMet(state, "soil_aeration")).toBe(false);

    state = buyUpgrade(state, "composting");
    expect(areUpgradePrerequisitesMet(state, "soil_aeration")).toBe(true);
  });

  it("should treat soil aeration as locked until both prerequisites are bought", () => {
    state = buyUpgrade(state, "plant_mastery");
    state = buyUpgrade(state, "better_watering");

    expect(isUpgradeUnlocked(state, "soil_aeration")).toBe(false);

    state = buyUpgrade(state, "composting");
    expect(isUpgradeUnlocked(state, "soil_aeration")).toBe(true);
  });

  it("should respect unlock thresholds for later farming links", () => {
    state = buyUpgrade(state, "plant_mastery");
    state = buyUpgrade(state, "better_watering");
    state = buyUpgrade(state, "composting");

    state = buyUpgrade(state, "soil_aeration");
    let unlocked = getUnlockedUpgrades(state, "soil_aeration");
    expect(unlocked).not.toContain("greenhouse_design");

    state = buyUpgrade(state, "soil_aeration");
    unlocked = getUnlockedUpgrades(state, "soil_aeration");
    expect(unlocked).toContain("greenhouse_design");

    state = buyUpgrade(state, "greenhouse_design");
    state = buyUpgrade(state, "greenhouse_design");
    unlocked = getUnlockedUpgrades(state, "greenhouse_design");
    expect(unlocked).not.toContain("harvest_festival");

    state = buyUpgrade(state, "greenhouse_design");
    unlocked = getUnlockedUpgrades(state, "greenhouse_design");
    expect(unlocked).toContain("harvest_festival");
  });

  it("should keep farming tree metadata aligned for tier-3 dual prerequisite", () => {
    const plantMastery = getUpgradeDef("plant_mastery");
    const soilAeration = getUpgradeDef("soil_aeration");

    expect(plantMastery?.linkedUpgrades?.map((u) => u.upgradeId)).toEqual(
      expect.arrayContaining(["better_watering", "composting"]),
    );
    expect(soilAeration?.prerequisites).toEqual([
      "better_watering",
      "composting",
    ]);
  });
});
