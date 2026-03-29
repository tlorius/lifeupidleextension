import { describe, it, expect, beforeEach } from "vitest";
import { createDefaultState, defaultState } from "./state";
import {
  plantCrop,
  harvestCrop,
  reduceCropGrowthTime,
  calculateYield,
  calculateYieldWithMastery,
  calculateGoldWithMastery,
  waterField,
  toggleSprinkler,
  setCropSprinkler,
  placeSprinklerOnField,
  removeSprinklerFromField,
  placeHarvesterOnField,
  placePlanterOnField,
  sprinklerCoversField,
  getSprinklerCoverageProfile,
  applyGardenIdle,
  prestigeCropType,
  getCropXpForNextLevel,
  getCropYieldMultiplier,
  getCropGoldMultiplier,
  moveCropArea,
  CROP_MAX_LEVEL,
  breakRock,
  getCropDef,
  cropDefinitions,
  getGrowthProgress,
  getFieldUnlockCost,
  hasRockPatternAtTile,
  generateRocksForGrid,
  unlockField,
  reconcileGardenRocksForPreview,
  craftSeedFromSeedMaker,
  canCraftSeedFromSeedMaker,
  getSeedMakerDurationMs,
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

    it("should allow deterministic plantedAt via explicit now", () => {
      const fixedNow = 123_456;
      const newState = plantCrop(testState, "sunflower_common", 2, 3, fixedNow);

      expect(newState.garden.crops["sunflower_common"][0].plantedAt).toBe(
        fixedNow,
      );
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

    it("should use explicit now when resetting perennial crop after harvest", () => {
      const initialNow = 1_000;
      let newState = plantCrop(testState, "grape_common", 0, 0, initialNow);
      newState.garden.crops["grape_common"][0].plantedAt = 0;

      const harvestNow = 2_000;
      newState = harvestCrop(newState, "grape_common", 0, harvestNow);

      expect(newState.garden.crops["grape_common"][0].plantedAt).toBe(
        harvestNow,
      );
    });

    it("should use explicit now when calculating growth-time reduction", () => {
      const plantedAt = 1_000;
      let newState = plantCrop(testState, "sunflower_common", 0, 0, plantedAt);
      newState.resources.gems = 1_000;

      const reduced = reduceCropGrowthTime(
        newState,
        "sunflower_common",
        0,
        10,
        100,
        plantedAt,
      );

      expect(reduced.garden.crops["sunflower_common"][0].plantedAt).toBe(
        plantedAt - 10 * 60 * 1000,
      );
      expect(reduced.resources.gems).toBe((newState.resources.gems ?? 0) - 100);
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

  describe("Automation Tools", () => {
    it("should enforce one automation tool per tile across sprinkler/harvester/planter", () => {
      let newState = placeHarvesterOnField(testState, 0, 0, "harvester_common");

      newState = placeSprinklerOnField(newState, 0, 0, "sprinkler_common");

      const hasHarvester =
        (newState.garden.harvesters?.harvester_common ?? []).length === 1;
      const hasSprinkler =
        (newState.garden.sprinklers?.sprinkler_common ?? []).length === 1;

      expect(hasHarvester).toBe(true);
      expect(hasSprinkler).toBe(false);
    });

    it("should auto-harvest finished crops within harvester range at interval", () => {
      let newState = plantCrop(testState, "sunflower_common", 0, 0);
      newState.garden.crops["sunflower_common"][0].plantedAt =
        Date.now() - 31 * 60 * 1000;

      newState = placeHarvesterOnField(newState, 0, 0, "harvester_common");
      const initialGold = newState.resources.gold;

      applyGardenIdle(newState, 5000);

      expect(newState.garden.crops["sunflower_common"]).toBeUndefined();
      expect(newState.resources.gold).toBeGreaterThan(initialGold);
    });

    it("should not run harvester cycle before configured interval", () => {
      let newState = plantCrop(testState, "sunflower_common", 0, 0);
      newState.garden.crops["sunflower_common"][0].plantedAt =
        Date.now() - 31 * 60 * 1000;
      newState = placeHarvesterOnField(newState, 0, 0, "harvester_common");

      applyGardenIdle(newState, 4000);

      expect(newState.garden.crops["sunflower_common"]).toBeDefined();
      expect(newState.garden.crops["sunflower_common"]).toHaveLength(1);
    });

    it("should auto-plant selected seed within planter range when seeds are available", () => {
      testState.inventory = [
        {
          uid: "seed-1",
          itemId: "sunflower_seed_common",
          quantity: 2,
          level: 1,
        },
      ];
      testState.garden.selectedPlanterSeedId = "sunflower_seed_common";

      let newState = placePlanterOnField(testState, 0, 0, "planter_common");
      applyGardenIdle(newState, 5000);

      expect(newState.garden.crops["sunflower_common"]).toBeDefined();
      expect(newState.garden.crops["sunflower_common"]).toHaveLength(1);
      expect(newState.inventory[0].quantity).toBe(1);
    });

    it("should plant around an occupied planter tile when planter range allows it", () => {
      testState.inventory = [
        {
          uid: "seed-1",
          itemId: "sunflower_seed_common",
          quantity: 4,
          level: 1,
        },
      ];
      testState.garden.selectedPlanterSeedId = "sunflower_seed_common";

      let newState = plantCrop(testState, "sunflower_common", 0, 0);
      newState = placePlanterOnField(newState, 0, 0, "planter_rare");
      applyGardenIdle(newState, 5000);

      expect(newState.garden.crops["sunflower_common"]).toBeDefined();
      expect(newState.garden.crops["sunflower_common"].length).toBeGreaterThan(
        1,
      );
    });

    it("should use per-planter seed assignment over global planter seed", () => {
      testState.inventory = [
        {
          uid: "seed-1",
          itemId: "sunflower_seed_common",
          quantity: 1,
          level: 1,
        },
        {
          uid: "seed-2",
          itemId: "carrot_seed_common",
          quantity: 1,
          level: 1,
        },
      ];
      testState.garden.selectedPlanterSeedId = "sunflower_seed_common";

      const newState = placePlanterOnField(
        testState,
        0,
        0,
        "planter_common",
        "carrot_seed_common",
      );
      applyGardenIdle(newState, 5000);

      expect(newState.garden.crops["carrot_common"]).toBeDefined();
      expect(newState.garden.crops["carrot_common"]).toHaveLength(1);
      expect(newState.garden.crops["sunflower_common"]).toBeUndefined();
    });
  });

  describe("Seedmaker Automation", () => {
    it("should craft one seed by consuming gems and matching crop resource", () => {
      testState.garden.cropStorage.current.vegetable = 10;
      testState.resources.gems = 10;

      const crafted = craftSeedFromSeedMaker(testState, "carrot_seed_common");

      expect(crafted).toBe(true);
      expect(testState.resources.gems).toBe(9);
      expect(testState.garden.cropStorage.current.vegetable).toBe(9);
      const seedEntry = testState.inventory.find(
        (item) => item.itemId === "carrot_seed_common",
      );
      expect(seedEntry?.quantity).toBe(1);
    });

    it("should not allow seedmaker craft when category resource is missing", () => {
      testState.garden.cropStorage.current.vegetable = 0;
      testState.resources.gems = 10;

      const canCraft = canCraftSeedFromSeedMaker(
        testState,
        "carrot_seed_common",
      );

      expect(canCraft).toBe(false);
    });

    it("should not allow seedmaker craft when gems are missing", () => {
      testState.garden.cropStorage.current.vegetable = 10;
      testState.resources.gems = 0;

      const canCraft = canCraftSeedFromSeedMaker(
        testState,
        "carrot_seed_common",
      );

      expect(canCraft).toBe(false);
    });

    it("should run seedmaker cycles during idle while auto mode is running", () => {
      testState.resources.gems = 100;
      testState.garden.cropStorage.current.flower = 100;
      testState.upgrades.push({
        id: "seedmaker_lab",
        name: "Seedmaker Lab",
        description: "",
        level: 1,
        baseCost: 0,
        scaling: 1,
        type: "plantGrowth",
        tree: "farming",
        bonuses: [],
      });
      testState.garden.seedMaker = {
        isRunning: true,
        selectedSeedId: "sunflower_seed_common",
      };

      applyGardenIdle(testState, 60_000);

      const craftedSeeds = testState.inventory.find(
        (item) => item.itemId === "sunflower_seed_common",
      );
      expect(craftedSeeds?.quantity).toBe(1);
      expect(testState.resources.gems).toBe(99);
      expect(testState.garden.cropStorage.current.flower).toBe(99);
    });

    it("should reduce seedmaker duration with higher seedmaker level", () => {
      const level1Duration = getSeedMakerDurationMs(1);
      const level5Duration = getSeedMakerDurationMs(5);

      expect(level5Duration).toBeLessThan(level1Duration);
    });

    it("should cap seedmaker duration at 1 second minimum", () => {
      const highLevelDuration = getSeedMakerDurationMs(999);

      expect(highLevelDuration).toBe(1000);
    });

    it("should use 5 minute base duration for special seeds", () => {
      // Inject a special-category crop definition for deterministic coverage.
      // This mirrors future special crops without coupling test to specific content.
      const tempCropId = "test_special_crop";
      cropDefinitions[tempCropId] = {
        id: tempCropId,
        name: "Test Special",
        seedItemId: "test_special_seed",
        category: "special",
        growthTimeMinutes: 1,
        baseYield: 1,
        baseXP: 1,
        baseGold: 1,
        isPerennial: false,
        rarity: "common",
        spriteStages: 1,
      };

      try {
        const duration = getSeedMakerDurationMs(1, "test_special_seed");
        expect(duration).toBe(300000);
      } finally {
        delete cropDefinitions[tempCropId];
      }
    });
  });

  describe("Rock Breaking", () => {
    it("should break small rock with adequate pickaxe", () => {
      testState.garden.rocks.small = [{ row: 0, col: 0 }];
      const result = breakRock(testState, 0, 0, "pickaxe_common");

      expect(result.success).toBe(true);
      expect(
        result.newState?.garden.rocks.small.some(
          (rock) => rock.row === 0 && rock.col === 0,
        ),
      ).toBe(false);
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
      expect(result.reason).toContain("mana");
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
    it("should never spawn rocks in the first 3x3 area", () => {
      const rocks = generateRocksForGrid(12, 12);
      const allRocks = [...rocks.small, ...rocks.medium, ...rocks.large];

      const anyInStarter = allRocks.some(
        (rock) => rock.row < 3 && rock.col < 3,
      );
      expect(anyInStarter).toBe(false);
    });

    it("should use the same predetermined rock pattern every time", () => {
      expect(hasRockPatternAtTile(0, 0)).toBe(false);
      expect(hasRockPatternAtTile(2, 2)).toBe(false);
      expect(hasRockPatternAtTile(3, 2)).toBe(true);
      expect(hasRockPatternAtTile(3, 3)).toBe(true);
      expect(hasRockPatternAtTile(3, 8)).toBe(true);
      expect(hasRockPatternAtTile(8, 5)).toBe(true);
      expect(hasRockPatternAtTile(7, 2)).toBe(false);

      const first = generateRocksForGrid(12, 12);
      const second = generateRocksForGrid(12, 12);
      expect(second).toEqual(first);
    });

    it("should reconcile missing preview rocks for existing non-empty rock saves", () => {
      const generated = generateRocksForGrid(8, 8);

      const allGenerated = [
        ...generated.small.map((r) => ({ ...r, tier: "small" as const })),
        ...generated.medium.map((r) => ({ ...r, tier: "medium" as const })),
        ...generated.large.map((r) => ({ ...r, tier: "large" as const })),
      ];
      expect(allGenerated.length).toBeGreaterThanOrEqual(2);

      const keepRock = allGenerated[0];
      const missingRock = allGenerated[1];

      const seededState: GameState = {
        ...testState,
        garden: {
          ...testState.garden,
          gridSize: { rows: 6, cols: 6 },
          rocks: {
            small:
              keepRock.tier === "small"
                ? [{ row: keepRock.row, col: keepRock.col }]
                : [],
            medium:
              keepRock.tier === "medium"
                ? [{ row: keepRock.row, col: keepRock.col }]
                : [],
            large:
              keepRock.tier === "large"
                ? [{ row: keepRock.row, col: keepRock.col }]
                : [],
          },
        },
      };

      const reconciled = reconcileGardenRocksForPreview(seededState);
      const missingNowExists =
        reconciled.garden.rocks.small.some(
          (r) => r.row === missingRock.row && r.col === missingRock.col,
        ) ||
        reconciled.garden.rocks.medium.some(
          (r) => r.row === missingRock.row && r.col === missingRock.col,
        ) ||
        reconciled.garden.rocks.large.some(
          (r) => r.row === missingRock.row && r.col === missingRock.col,
        );

      expect(missingNowExists).toBe(true);
    });

    it("should show at least one rock in the starting preview for a fresh save", () => {
      const freshState = createDefaultState();
      const reconciled = reconcileGardenRocksForPreview(freshState);
      const previewRocks = [
        ...reconciled.garden.rocks.small,
        ...reconciled.garden.rocks.medium,
        ...reconciled.garden.rocks.large,
      ].filter((rock) => rock.row < 4 && rock.col < 4);

      expect(previewRocks.length).toBeGreaterThan(0);
    });

    it("should recognize free fields accessible within grid", () => {
      const cost = getFieldUnlockCost(testState, 0, 0);
      expect(cost.type).toBe("free");
    });

    it("should identify rocks as blocking", () => {
      testState.garden.rocks.small = [{ row: 3, col: 3 }];
      const cost = getFieldUnlockCost(testState, 3, 3);

      expect(cost.type).toBe("rock");
      expect(cost.rockTier).toBe("small");
    });

    it("should cost diamonds for adjacent fields", () => {
      const cost = getFieldUnlockCost(testState, 3, 3); // Outside 2x2 grid
      expect(cost.type).toBe("diamond");
      expect(cost.cost).toBeGreaterThan(0);
    });

    it("should generate blocking rocks in newly visible preview tiles", () => {
      const previewRows = 5;
      const previewCols = 4;
      const expected = generateRocksForGrid(previewRows, previewCols);
      const unlockedSet = new Set(["0,0", "0,1", "1,0", "1,1", "2,0"]);
      const expectedRocks = [
        ...expected.small,
        ...expected.medium,
        ...expected.large,
      ].filter((r) => !unlockedSet.has(`${r.row},${r.col}`));

      expect(expectedRocks.length).toBeGreaterThan(0);

      const seededState: GameState = {
        ...testState,
      };

      const afterUnlock = unlockField(seededState, 2, 0);
      const firstRock = expectedRocks[0];
      const cost = getFieldUnlockCost(
        afterUnlock,
        firstRock.row,
        firstRock.col,
      );
      expect(cost.type).toBe("rock");
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

  describe("Crop Mastery & Prestige", () => {
    it("should increase yield with mastery helpers", () => {
      const cropDef = getCropDef("sunflower_common")!;
      const boostedState: GameState = {
        ...testState,
        garden: {
          ...testState.garden,
          cropMastery: {
            sunflower_common: {
              level: 25,
              xp: 0,
              prestige: 2,
            },
          },
        },
      };

      const baseYield = calculateYield(cropDef, 100);
      const masteryYield = calculateYieldWithMastery(
        boostedState,
        "sunflower_common",
        cropDef,
        100,
      );

      expect(masteryYield).toBeGreaterThan(baseYield);
    });

    it("should increase gold with prestige multiplier", () => {
      const cropDef = getCropDef("sunflower_common")!;
      const boostedState: GameState = {
        ...testState,
        garden: {
          ...testState.garden,
          cropMastery: {
            sunflower_common: {
              level: 1,
              xp: 0,
              prestige: 3,
            },
          },
        },
      };

      const baseGold = cropDef.baseGold;
      const masteryGold = calculateGoldWithMastery(
        boostedState,
        "sunflower_common",
        cropDef,
      );

      expect(masteryGold).toBeGreaterThan(baseGold);
    });

    it("should only prestige crops that reached max level", () => {
      const belowCapState: GameState = {
        ...testState,
        garden: {
          ...testState.garden,
          cropMastery: {
            sunflower_common: {
              level: CROP_MAX_LEVEL - 1,
              xp: 0,
              prestige: 1,
            },
          },
        },
      };
      const atCapState: GameState = {
        ...testState,
        garden: {
          ...testState.garden,
          cropMastery: {
            sunflower_common: {
              level: CROP_MAX_LEVEL,
              xp: 999,
              prestige: 1,
            },
          },
        },
      };

      const unchanged = prestigeCropType(belowCapState, "sunflower_common");
      const prestiged = prestigeCropType(atCapState, "sunflower_common");

      expect(unchanged).toBe(belowCapState);
      expect(prestiged.garden.cropMastery?.sunflower_common.level).toBe(1);
      expect(prestiged.garden.cropMastery?.sunflower_common.xp).toBe(0);
      expect(prestiged.garden.cropMastery?.sunflower_common.prestige).toBe(2);
    });

    it("should expose mastery progression formulas", () => {
      expect(getCropXpForNextLevel(1)).toBe(50);
      expect(getCropXpForNextLevel(5)).toBe(150);
      expect(getCropYieldMultiplier(1, 0)).toBe(1);
      expect(getCropYieldMultiplier(11, 1)).toBeCloseTo(1.3, 5);
      expect(getCropGoldMultiplier(0)).toBe(1);
      expect(getCropGoldMultiplier(4)).toBeCloseTo(1.4, 5);
    });
  });

  describe("Sprinkler Coverage Utilities", () => {
    it("should return expected coverage profile by rarity", () => {
      expect(getSprinklerCoverageProfile("sprinkler_common")).toEqual({
        crossRange: 0,
        diagonalRange: 0,
      });
      expect(getSprinklerCoverageProfile("sprinkler_rare")).toEqual({
        crossRange: 1,
        diagonalRange: 1,
      });
      expect(getSprinklerCoverageProfile("sprinkler_epic")).toEqual({
        crossRange: 2,
        diagonalRange: 2,
      });
      expect(getSprinklerCoverageProfile("sprinkler_legendary")).toEqual({
        crossRange: 2,
        diagonalRange: 2,
      });
      expect(getSprinklerCoverageProfile("sprinkler_unique")).toEqual({
        crossRange: 3,
        diagonalRange: 3,
      });
    });

    it("should compute coverage for cross and diagonal tiles", () => {
      const center = { row: 4, col: 4 };

      expect(
        sprinklerCoversField("sprinkler_rare", center, { row: 4, col: 5 }),
      ).toBe(true);
      expect(
        sprinklerCoversField("sprinkler_rare", center, { row: 5, col: 5 }),
      ).toBe(true);
      expect(
        sprinklerCoversField("sprinkler_epic", center, { row: 5, col: 5 }),
      ).toBe(true);
      expect(
        sprinklerCoversField("sprinkler_epic", center, { row: 6, col: 4 }),
      ).toBe(true);
      expect(
        sprinklerCoversField("sprinkler_legendary", center, { row: 4, col: 7 }),
      ).toBe(false);
    });

    it("should place and remove sprinklers on empty fields", () => {
      let state = placeSprinklerOnField(testState, 5, 5, "sprinkler_rare");
      expect(state.garden.sprinklers.sprinkler_rare).toContainEqual({
        row: 5,
        col: 5,
      });

      state = removeSprinklerFromField(state, 5, 5);
      expect(state.garden.sprinklers.sprinkler_rare).toEqual([]);
    });

    it("should sync crop sprinkler state with standalone map", () => {
      let state = plantCrop(testState, "sunflower_common", 1, 1);
      state = setCropSprinkler(state, 1, 1, "sprinkler_epic");

      expect(state.garden.crops["sunflower_common"][0].hasSprinkler).toBe(true);
      expect(state.garden.sprinklers.sprinkler_epic).toContainEqual({
        row: 1,
        col: 1,
      });

      state = setCropSprinkler(state, 1, 1, null);
      expect(state.garden.crops["sunflower_common"][0].hasSprinkler).toBe(
        false,
      );
      expect(state.garden.sprinklers.sprinkler_epic).toEqual([]);
    });
  });

  describe("Area Move", () => {
    it("should fail moving area when destination has a rock", () => {
      let state = plantCrop(testState, "sunflower_common", 0, 0);
      state.garden.unlockedFields = [
        ...(state.garden.unlockedFields ?? []),
        { row: 2, col: 2 },
      ];
      state.garden.rocks.small = [{ row: 2, col: 2 }];

      const result = moveCropArea(
        state,
        { row: 0, col: 0 },
        { row: 2, col: 2 },
        1,
        true,
      );

      expect(result.success).toBe(false);
      expect(result.reason).toContain("rocks");
    });
  });
});
