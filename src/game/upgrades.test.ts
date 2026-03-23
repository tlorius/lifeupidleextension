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
    state.resources.gold = 1_000_000_000;
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

    for (let i = 0; i < 9; i += 1) {
      state = buyUpgrade(state, "harvest_festival");
    }
    unlocked = getUnlockedUpgrades(state, "harvest_festival");
    expect(unlocked).not.toContain("seedmaker_lab");
    expect(isUpgradeUnlocked(state, "seedmaker_lab")).toBe(false);

    state = buyUpgrade(state, "harvest_festival");
    unlocked = getUnlockedUpgrades(state, "harvest_festival");
    expect(unlocked).toContain("seedmaker_lab");
    expect(isUpgradeUnlocked(state, "seedmaker_lab")).toBe(true);
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

describe("Upgrade System - Modern Tree Graph", () => {
  let state: GameState;

  beforeEach(() => {
    state = JSON.parse(JSON.stringify(defaultState));
    state.resources.gold = 1_000_000_000_000;
  });

  it("includes newly added trees and capstone upgrades", () => {
    const expeditionIds = getUpgradesByTree("expedition").map((u) => u.id);
    const resourceIds = getUpgradesByTree("resource").map((u) => u.id);

    expect(expeditionIds).toContain("scouting_network");
    expect(expeditionIds).toContain("void_contracts");
    expect(resourceIds).toContain("singularity_bank");
  });

  it("enforces linked level thresholds and cross-tree prerequisite for void contracts", () => {
    state = buyUpgrade(state, "scouting_network");
    expect(isUpgradeUnlocked(state, "caravan_raids")).toBe(false);

    state = buyUpgrade(state, "scouting_network");
    expect(isUpgradeUnlocked(state, "caravan_raids")).toBe(true);

    state = buyUpgrade(state, "caravan_raids");
    state = buyUpgrade(state, "caravan_raids");
    state = buyUpgrade(state, "caravan_raids");
    state = buyUpgrade(state, "caravan_raids");

    state = buyUpgrade(state, "scouting_network");
    state = buyUpgrade(state, "scouting_network");
    expect(isUpgradeUnlocked(state, "map_fog_crusher")).toBe(true);

    state = buyUpgrade(state, "map_fog_crusher");
    state = buyUpgrade(state, "map_fog_crusher");
    state = buyUpgrade(state, "map_fog_crusher");

    expect(isUpgradeUnlocked(state, "bounty_syndicate")).toBe(true);
    state = buyUpgrade(state, "bounty_syndicate");
    state = buyUpgrade(state, "bounty_syndicate");
    state = buyUpgrade(state, "bounty_syndicate");
    state = buyUpgrade(state, "bounty_syndicate");
    state = buyUpgrade(state, "bounty_syndicate");

    expect(isUpgradeUnlocked(state, "void_contracts")).toBe(false);

    for (let i = 0; i < 6; i += 1) {
      state = buyUpgrade(state, "gem_hunter");
    }

    expect(isUpgradeUnlocked(state, "void_contracts")).toBe(true);
  });

  it("requires dual resource branches before singularity bank", () => {
    for (let i = 0; i < 4; i += 1) {
      state = buyUpgrade(state, "gold_rush");
    }
    for (let i = 0; i < 4; i += 1) {
      state = buyUpgrade(state, "gold_efficiency");
    }
    for (let i = 0; i < 4; i += 1) {
      state = buyUpgrade(state, "wealth");
    }

    expect(isUpgradeUnlocked(state, "compound_interest")).toBe(true);
    expect(isUpgradeUnlocked(state, "treasure_cartography")).toBe(true);

    for (let i = 0; i < 5; i += 1) {
      state = buyUpgrade(state, "compound_interest");
    }
    for (let i = 0; i < 4; i += 1) {
      state = buyUpgrade(state, "treasure_cartography");
    }

    expect(isUpgradeUnlocked(state, "market_domination")).toBe(true);

    for (let i = 0; i < 3; i += 1) {
      state = buyUpgrade(state, "energy_conservation");
    }
    for (let i = 0; i < 4; i += 1) {
      state = buyUpgrade(state, "leyline_tapping");
    }
    for (let i = 0; i < 4; i += 1) {
      state = buyUpgrade(state, "gem_hunter");
    }
    for (let i = 0; i < 3; i += 1) {
      state = buyUpgrade(state, "prism_sieves");
    }

    expect(isUpgradeUnlocked(state, "transmutation_engine")).toBe(true);

    for (let i = 0; i < 6; i += 1) {
      state = buyUpgrade(state, "market_domination");
    }
    for (let i = 0; i < 5; i += 1) {
      state = buyUpgrade(state, "transmutation_engine");
    }

    expect(isUpgradeUnlocked(state, "singularity_bank")).toBe(true);
  });
});
