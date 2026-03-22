import { describe, it, expect, beforeEach } from "vitest";
import { defaultState } from "./state";
import {
  plantCrop,
  harvestCrop,
  calculateYield,
  waterField,
  toggleSprinkler,
  getCropDef,
  getGrowthProgress,
  applyGardenIdle,
} from "./garden";
import type { GameState } from "./types";
import { WATER_CONFIG } from "./gameConfig";

describe("Garden System - Integration Tests", () => {
  let testState: GameState;

  beforeEach(() => {
    testState = JSON.parse(JSON.stringify(defaultState));
  });

  describe("Complete Crop Lifecycle", () => {
    it("should complete full lifecycle: plant -> grow -> water -> harvest", () => {
      // 1. Plant crop
      let state = plantCrop(testState, "sunflower_common", 0, 0);
      let crop = state.garden.crops["sunflower_common"][0];
      const cropDef = getCropDef("sunflower_common")!;

      expect(crop.waterLevel).toBe(0);
      expect(getGrowthProgress(crop, cropDef)).toBeCloseTo(0);

      // 2. Water the crop
      state = waterField(state, 0, 0);
      crop = state.garden.crops["sunflower_common"][0];
      expect(crop.waterLevel).toBe(WATER_CONFIG.fullWaterThreshold);

      // 3. Simulate growth (time passing)
      crop.plantedAt =
        Date.now() - cropDef.growthTimeMinutes * 60 * 1000 - 1000;

      // 4. Harvest
      const goldBefore = state.resources.gold;
      const storageBefore = state.garden.cropStorage.current.flower;

      state = harvestCrop(state, "sunflower_common", 0);

      const goldAfter = state.resources.gold;
      const storageAfter = state.garden.cropStorage.current.flower;

      expect(goldAfter).toBeGreaterThan(goldBefore);
      expect(storageAfter).toBeGreaterThan(storageBefore);
    });

    it("should respect water bonus during yield calculation", () => {
      let state = plantCrop(testState, "carrot_common", 0, 0);
      let crop = state.garden.crops["carrot_common"][0];
      const cropDef = getCropDef("carrot_common")!;

      // Simulate dry crop
      crop.plantedAt =
        Date.now() - cropDef.growthTimeMinutes * 60 * 1000 - 1000;
      crop.waterLevel = 0;
      const dryYield = calculateYield(cropDef, crop.waterLevel);

      // Reset and try with water
      state = plantCrop(testState, "carrot_common", 0, 1);
      crop = state.garden.crops["carrot_common"][0];
      crop.plantedAt =
        Date.now() - cropDef.growthTimeMinutes * 60 * 1000 - 1000;
      crop.waterLevel = 100;
      const wetYield = calculateYield(cropDef, crop.waterLevel);

      expect(wetYield).toBeGreaterThan(dryYield);
      expect(wetYield).toBe(dryYield * 2);
    });

    it("should handle perennial crop reset correctly", () => {
      // Plant grape (perennial)
      let state = plantCrop(testState, "grape_common", 0, 0);
      let crop = state.garden.crops["grape_common"][0];
      const cropDef = getCropDef("grape_common")!;
      const originalPlantTime = crop.plantedAt;

      // Advance time
      crop.plantedAt =
        Date.now() - cropDef.growthTimeMinutes * 60 * 1000 - 1000;

      // Harvest (perennial resets)
      state = harvestCrop(state, "grape_common", 0);
      crop = state.garden.crops["grape_common"][0];

      // Should still exist but have new plant time
      expect(crop.plantedAt).not.toBe(originalPlantTime);
      expect(crop.plantedAt).toBeCloseTo(Date.now(), 100);
    });
  });

  describe("Water Decay Over Time", () => {
    it("should decay water level during idle", () => {
      let state = plantCrop(testState, "sunflower_common", 0, 0);
      state = waterField(state, 0, 0);

      let crop = state.garden.crops["sunflower_common"][0];
      expect(crop.waterLevel).toBe(100);

      // Simulate 1 minute of idle
      const timeElapsed = 60 * 1000;
      applyGardenIdle(state, timeElapsed);

      crop = state.garden.crops["sunflower_common"][0];
      const expectedDecay =
        (timeElapsed / (WATER_CONFIG.waterDecayRate * 1000)) * 100;
      const expectedWaterLevel = 100 - expectedDecay;

      expect(crop.waterLevel).toBeCloseTo(expectedWaterLevel, 0);
    });

    it("should not go below 0 water level", () => {
      let state = plantCrop(testState, "sunflower_common", 0, 0);

      // Simulate long idle without water
      const longTime = 1000 * 60 * 60; // 1 hour
      applyGardenIdle(state, longTime);

      const crop = state.garden.crops["sunflower_common"][0];
      expect(crop.waterLevel).toBeGreaterThanOrEqual(0);
    });

    it("should maintain water with active sprinkler", () => {
      let state = plantCrop(testState, "sunflower_common", 0, 0);
      state = toggleSprinkler(state, 0, 0);

      let crop = state.garden.crops["sunflower_common"][0];
      const waterBefore = crop.waterLevel;

      // Simulate idle time
      applyGardenIdle(state, 60 * 1000);

      crop = state.garden.crops["sunflower_common"][0];
      // With sprinkler, should maintain high water
      expect(crop.waterLevel).toBeCloseTo(waterBefore, 0);
    });
  });

  describe("Multiple Crops Interaction", () => {
    it("should track multiple different crops independently", () => {
      let state = plantCrop(testState, "sunflower_common", 0, 0);
      state = plantCrop(state, "carrot_common", 0, 1);
      state = plantCrop(state, "mint_common", 1, 0);

      expect(state.garden.crops["sunflower_common"]).toHaveLength(1);
      expect(state.garden.crops["carrot_common"]).toHaveLength(1);
      expect(state.garden.crops["mint_common"]).toHaveLength(1);
    });

    it("should allow multiple instances of same crop", () => {
      let state = plantCrop(testState, "sunflower_common", 0, 0);
      state = plantCrop(state, "sunflower_common", 0, 1);
      state = plantCrop(state, "sunflower_common", 1, 0);

      expect(state.garden.crops["sunflower_common"]).toHaveLength(3);
    });

    it("should water only the specified crop", () => {
      let state = plantCrop(testState, "sunflower_common", 0, 0);
      state = plantCrop(state, "carrot_common", 0, 1);

      state = waterField(state, 0, 0);

      const sunflower = state.garden.crops["sunflower_common"][0];
      const carrot = state.garden.crops["carrot_common"][0];

      expect(sunflower.waterLevel).toBe(100);
      expect(carrot.waterLevel).toBe(0);
    });

    it("should harvest only specified crop at position", () => {
      let state = plantCrop(testState, "sunflower_common", 0, 0);
      state = plantCrop(state, "sunflower_common", 0, 1);

      let sunflowers = state.garden.crops["sunflower_common"];
      sunflowers[0].plantedAt = Date.now() - 61 * 60 * 1000;
      sunflowers[1].plantedAt = Date.now() - 61 * 60 * 1000;

      state = harvestCrop(state, "sunflower_common", 0);

      expect(state.garden.crops["sunflower_common"]).toHaveLength(1);
      expect(state.garden.crops["sunflower_common"][0].position.col).toBe(1);
    });
  });

  describe("Resource Management Integration", () => {
    it("should track energy usage across multiple actions", () => {
      const initialEnergy = testState.resources.energy ?? 0;

      let state = plantCrop(testState, "sunflower_common", 0, 0);
      state = waterField(state, 0, 0); // Costs 10 energy
      state = waterField(state, 0, 0); // Costs 10 more

      const expectedFinalEnergy =
        initialEnergy - WATER_CONFIG.waterCostEnergy * 2;
      expect(state.resources.energy).toBe(expectedFinalEnergy);
    });

    it("should accumulate resources across multiple harvests", () => {
      let state = plantCrop(testState, "sunflower_common", 0, 0);
      state = plantCrop(state, "sunflower_common", 0, 1);

      let crop1 = state.garden.crops["sunflower_common"][0];
      let crop2 = state.garden.crops["sunflower_common"][1];
      const cropDef = getCropDef("sunflower_common")!;

      crop1.plantedAt = Date.now() - 61 * 60 * 1000;
      crop2.plantedAt = Date.now() - 61 * 60 * 1000;

      const goldBefore = state.resources.gold;
      state = harvestCrop(state, "sunflower_common", 0);
      state = harvestCrop(state, "sunflower_common", 0); // Second at index 0 after first removed

      const expectedGoldIncrease = cropDef.baseGold * 2;
      expect(state.resources.gold).toBe(goldBefore + expectedGoldIncrease);
    });

    it("should respect storage limits when harvesting", () => {
      let state = plantCrop(testState, "carrot_common", 0, 0);
      const storageMax = state.garden.cropStorage.limits.vegetable;

      // Fill storage to max
      state.garden.cropStorage.current.vegetable = storageMax - 1;

      let crop = state.garden.crops["carrot_common"][0];
      crop.plantedAt = Date.now() - 50 * 60 * 1000;

      state = harvestCrop(state, "carrot_common", 0);

      // Should not exceed max (likely capped)
      expect(state.garden.cropStorage.current.vegetable).toBeLessThanOrEqual(
        storageMax,
      );
    });
  });

  describe("Growth State Management", () => {
    it("should track growth progress accurately over time", () => {
      let state = plantCrop(testState, "sunflower_common", 0, 0);
      const cropDef = getCropDef("sunflower_common")!;

      let crop = state.garden.crops["sunflower_common"][0];
      // Check at 50% growth
      crop.plantedAt = Date.now() - (cropDef.growthTimeMinutes * 60 * 1000) / 2;
      let progress = getGrowthProgress(crop, cropDef);
      expect(progress).toBeCloseTo(50, 5);

      // Check at 100% growth
      crop.plantedAt =
        Date.now() - cropDef.growthTimeMinutes * 60 * 1000 - 1000;
      progress = getGrowthProgress(crop, cropDef);
      expect(progress).toBeGreaterThanOrEqual(100);
    });

    it("should allow harvesting only after growth complete", () => {
      let state = plantCrop(testState, "sunflower_common", 0, 0);
      const cropDef = getCropDef("sunflower_common")!;
      const goldBefore = state.resources.gold;
      const storageBefore = state.garden.cropStorage.current.flower;

      // Try to harvest immediately (before growth)
      // Yield will be 0 because it's not old enough
      state = harvestCrop(state, "sunflower_common", 0);
      const cropExists = state.garden.crops["sunflower_common"] !== undefined;

      // Crop should still exist if harvest didn't complete growth
      if (cropExists) {
        const progress = getGrowthProgress(
          state.garden.crops["sunflower_common"][0],
          cropDef,
        );
        expect(progress).toBeLessThan(100);
      }

      expect(state.resources.gold).toBe(goldBefore);
      expect(state.garden.cropStorage.current.flower).toBe(storageBefore);
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle watered crop + sprinkler interaction", () => {
      let state = plantCrop(testState, "sunflower_common", 0, 0);
      state = waterField(state, 0, 0);

      let crop = state.garden.crops["sunflower_common"][0];
      expect(crop.waterLevel).toBe(100);

      // Add sprinkler after watering
      state = toggleSprinkler(state, 0, 0);

      crop = state.garden.crops["sunflower_common"][0];
      expect(crop.hasSprinkler).toBe(true);
      expect(crop.waterLevel).toBe(100);
    });

    it("should handle rapid watering without exceeding maximum", () => {
      let state = plantCrop(testState, "sunflower_common", 0, 0);

      state = waterField(state, 0, 0);
      state = waterField(state, 0, 0);
      state = waterField(state, 0, 0);

      const crop = state.garden.crops["sunflower_common"][0];
      expect(crop.waterLevel).toBe(WATER_CONFIG.fullWaterThreshold);
    });

    it("should recover from dry conditions when watered", () => {
      let state = plantCrop(testState, "sunflower_common", 0, 0);

      // Let it dry out
      applyGardenIdle(state, 5 * 60 * 1000);
      const dryWaterLevel =
        state.garden.crops["sunflower_common"][0].waterLevel;
      expect(dryWaterLevel).toBeLessThan(100);

      // Water it
      state = waterField(state, 0, 0);
      expect(state.garden.crops["sunflower_common"][0].waterLevel).toBe(100);
    });
  });
});
