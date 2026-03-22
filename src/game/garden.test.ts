import { describe, it, expect, beforeEach } from "vitest";
import { defaultState } from "./state";
import {
  plantCrop,
  harvestCrop,
  calculateYield,
  waterField,
  toggleSprinkler,
  breakRock,
  getCropDef,
  getGrowthProgress,
  getFieldUnlockCost,
} from "./garden";
import type { GameState } from "./types";
import { WATER_CONFIG } from "./gameConfig";

describe("Garden System - Unit Tests", () => {
  let testState: GameState;

  beforeEach(() => {
    testState = JSON.parse(JSON.stringify(defaultState));
  });

  describe("Planting Crops", () => {
    it("should plant a crop at a valid position", () => {
      const newState = plantCrop(testState, "sunflower_common", 0, 0);

      expect(newState.garden.crops["sunflower_common"]).toBeDefined();
      expect(newState.garden.crops["sunflower_common"].length).toBe(1);
      expect(newState.garden.crops["sunflower_common"][0].position).toEqual({
        row: 0,
        col: 0,
      });
    });

    it("should set initial water level to 0 for newly planted crops", () => {
      const newState = plantCrop(testState, "carrot_common", 0, 0);
      expect(newState.garden.crops["carrot_common"][0].waterLevel).toBe(0);
    });

    it("should set plantedAt timestamp to current time", () => {
      const beforePlanting = Date.now();
      const newState = plantCrop(testState, "mint_common", 1, 1);
      const afterPlanting = Date.now();

      const plantedTime = newState.garden.crops["mint_common"][0].plantedAt;
      expect(plantedTime).toBeGreaterThanOrEqual(beforePlanting);
      expect(plantedTime).toBeLessThanOrEqual(afterPlanting);
    });

    it("should allow multiple crops at different positions", () => {
      let newState = plantCrop(testState, "sunflower_common", 0, 0);
      newState = plantCrop(newState, "sunflower_common", 0, 1);
      newState = plantCrop(newState, "carrot_common", 1, 0);

      expect(newState.garden.crops["sunflower_common"].length).toBe(2);
      expect(newState.garden.crops["carrot_common"].length).toBe(1);
    });
  });

  describe("Crop Growth & Yield Calculation", () => {
    it("should calculate yield based on water level", () => {
      const cropDef = getCropDef("sunflower_common")!;
      const yieldWithoutWater = calculateYield(cropDef, 0);
      const yieldWithFullWater = calculateYield(cropDef, 100);

      expect(yieldWithFullWater).toBe(yieldWithoutWater * 2);
    });

    it("should cap water bonus to 100% (2x yield)", () => {
      const cropDef = getCropDef("rose_rare")!;
      const baseYield = cropDef.baseYield;
      const yieldFull = calculateYield(cropDef, 100);

      expect(yieldFull).toBeLessThanOrEqual(baseYield * 2);
    });

    it("should calculate growth progress correctly", () => {
      const newState = plantCrop(testState, "sunflower_common", 0, 0);
      const crop = newState.garden.crops["sunflower_common"][0];
      const cropDef = getCropDef("sunflower_common")!;

      const progress = getGrowthProgress(crop, cropDef);

      // Just planted, should be near 0%
      expect(progress).toBeCloseTo(0, 0);
    });

    it("should show 100% progress when growth time has elapsed", () => {
      const newState = plantCrop(testState, "sunflower_common", 0, 0);
      let crop = newState.garden.crops["sunflower_common"][0];
      const cropDef = getCropDef("sunflower_common")!;

      // Manipulate plantedAt to be in the past
      crop.plantedAt =
        Date.now() - cropDef.growthTimeMinutes * 60 * 1000 - 1000;

      const progress = getGrowthProgress(crop, cropDef);
      expect(progress).toBeGreaterThanOrEqual(100);
    });
  });

  describe("Harvesting Crops", () => {
    it("should remove non-perennial crops after harvest", () => {
      let newState = plantCrop(testState, "sunflower_common", 0, 0);
      let crop = newState.garden.crops["sunflower_common"][0];
      crop.plantedAt = Date.now() - 61 * 60 * 1000; // Past growth time

      newState = harvestCrop(newState, "sunflower_common", 0);

      expect(newState.garden.crops["sunflower_common"]).toBeUndefined();
    });

    it("should reset perennial crops instead of removing them", () => {
      let newState = plantCrop(testState, "grape_common", 0, 0);
      let crop = newState.garden.crops["grape_common"][0];
      crop.plantedAt = Date.now() - 181 * 60 * 1000; // Past growth time

      newState = harvestCrop(newState, "grape_common", 0);

      // Grape is perennial (based on gameConfig), should still exist
      expect(newState.garden.crops["grape_common"]).toBeDefined();
      expect(newState.garden.crops["grape_common"][0].plantedAt).not.toBe(
        crop.plantedAt,
      );
    });

    it("should add resources to crop storage", () => {
      let newState = plantCrop(testState, "carrot_common", 0, 0);
      let crop = newState.garden.crops["carrot_common"][0];
      crop.plantedAt = Date.now() - 50 * 60 * 1000; // Past growth time
      const cropDef = getCropDef("carrot_common")!;
      const expectedYield = calculateYield(cropDef, 0);

      const initialStorage = newState.garden.cropStorage.current.vegetable;
      newState = harvestCrop(newState, "carrot_common", 0);
      const finalStorage = newState.garden.cropStorage.current.vegetable;

      expect(finalStorage).toBe(initialStorage + expectedYield);
    });

    it("should add gold on harvest", () => {
      let newState = plantCrop(testState, "sunflower_common", 0, 0);
      let crop = newState.garden.crops["sunflower_common"][0];
      crop.plantedAt = Date.now() - 61 * 60 * 1000;
      const cropDef = getCropDef("sunflower_common")!;

      const initialGold = newState.resources.gold;
      newState = harvestCrop(newState, "sunflower_common", 0);
      const finalGold = newState.resources.gold;

      expect(finalGold).toBe(initialGold + cropDef.baseGold);
    });
  });

  describe("Water Mechanics", () => {
    it("should increase water level when watered", () => {
      let newState = plantCrop(testState, "sunflower_common", 0, 0);
      const initialWaterLevel =
        newState.garden.crops["sunflower_common"][0].waterLevel;

      newState = waterField(newState, 0, 0);
      const newWaterLevel =
        newState.garden.crops["sunflower_common"][0].waterLevel;

      expect(newWaterLevel).toBe(WATER_CONFIG.fullWaterThreshold);
      expect(newWaterLevel).toBeGreaterThan(initialWaterLevel);
    });

    it("should cost energy to water", () => {
      const newState = plantCrop(testState, "sunflower_common", 0, 0);
      const initialEnergy = newState.resources.energy ?? 0;

      const afterWater = waterField(newState, 0, 0);
      const finalEnergy = afterWater.resources.energy;

      expect(finalEnergy).toBe(initialEnergy - WATER_CONFIG.waterCostEnergy);
    });

    it("should not water if insufficient energy", () => {
      testState.resources.energy = 5;
      const newState = plantCrop(testState, "sunflower_common", 0, 0);

      const afterAttemptWater = waterField(newState, 0, 0);
      const crop = afterAttemptWater.garden.crops["sunflower_common"][0];

      expect(crop.waterLevel).toBe(0);
      expect(afterAttemptWater.resources.energy).toBe(5);
    });
  });

  describe("Sprinkler System", () => {
    it("should place sprinkler on crop", () => {
      let newState = plantCrop(testState, "sunflower_common", 0, 0);
      newState = toggleSprinkler(newState, 0, 0);

      const crop = newState.garden.crops["sunflower_common"][0];
      expect(crop.hasSprinkler).toBe(true);
    });

    it("should set water level to 100 when sprinkler placed", () => {
      let newState = plantCrop(testState, "sunflower_common", 0, 0);
      newState = toggleSprinkler(newState, 0, 0);

      const crop = newState.garden.crops["sunflower_common"][0];
      expect(crop.waterLevel).toBe(100);
    });

    it("should remove sprinkler when toggled again", () => {
      let newState = plantCrop(testState, "sunflower_common", 0, 0);
      newState = toggleSprinkler(newState, 0, 0);
      newState = toggleSprinkler(newState, 0, 0);

      const crop = newState.garden.crops["sunflower_common"][0];
      expect(crop.hasSprinkler).toBe(false);
    });
  });

  describe("Rock Breaking", () => {
    it("should break small rock with adequate pickaxe", () => {
      testState.garden.rocks.small = [{ row: 0, col: 0 }];
      const result = breakRock(testState, 0, 0, "pickaxe_common");

      expect(result.success).toBe(true);
      expect(result.newState?.garden.rocks.small).toHaveLength(0);
    });

    it("should cost energy to break rock", () => {
      testState.garden.rocks.small = [{ row: 0, col: 0 }];
      const initialEnergy = testState.resources.energy ?? 0;

      const result = breakRock(testState, 0, 0, "pickaxe_common");

      expect(result.newState?.resources.energy).toBeLessThan(initialEnergy);
    });

    it("should fail if pickaxe level too low for medium rock", () => {
      testState.garden.rocks.medium = [{ row: 0, col: 0 }];
      const result = breakRock(testState, 0, 0, "pickaxe_common"); // Level 1 pickaxe

      expect(result.success).toBe(false);
      expect(result.reason).toContain("level");
    });

    it("should fail if insufficient energy", () => {
      testState.resources.energy = 5;
      testState.garden.rocks.small = [{ row: 0, col: 0 }];
      const result = breakRock(testState, 0, 0, "pickaxe_common");

      expect(result.success).toBe(false);
      expect(result.reason).toContain("energy");
    });

    it("should expand grid when breaking rock at boundary", () => {
      testState.garden.gridSize = { rows: 2, cols: 2 };
      testState.garden.rocks.small = [{ row: 2, col: 2 }];

      const result = breakRock(testState, 2, 2, "pickaxe_common");

      expect(result.newState?.garden.gridSize.rows).toBeGreaterThanOrEqual(3);
      expect(result.newState?.garden.gridSize.cols).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Field Unlocking", () => {
    it("should recognize free fields accessible within grid", () => {
      const cost = getFieldUnlockCost(testState, 0, 0);
      expect(cost.type).toBe("free");
    });

    it("should identify rocks as blocking", () => {
      testState.garden.rocks.small = [{ row: 1, col: 1 }];
      const cost = getFieldUnlockCost(testState, 1, 1);

      expect(cost.type).toBe("rock");
      expect(cost.rockTier).toBe("small");
    });

    it("should cost diamonds for adjacent fields", () => {
      const cost = getFieldUnlockCost(testState, 3, 3); // Outside 2x2 grid
      expect(cost.type).toBe("diamond");
      expect(cost.cost).toBeGreaterThan(0);
    });
  });

  describe("Definition Lookups", () => {
    it("should return crop definition for valid crop ID", () => {
      const def = getCropDef("sunflower_common");
      expect(def).toBeDefined();
      expect(def?.name).toBe("Sunflower");
    });

    it("should return null for invalid crop ID", () => {
      const def = getCropDef("nonexistent_crop");
      expect(def).toBeNull();
    });

    it("should have correct seed item IDs", () => {
      const def = getCropDef("rose_rare");
      expect(def?.seedItemId).toBe("rose_seed_rare");
    });
  });
});
