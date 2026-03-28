import type { GameState } from "./types";
import { createEnemyInstance } from "./combat";
import { createDefaultCharacterState } from "./classes";
import {
  STARTING_PLAYER_PROGRESS,
  STARTING_PLAYER_STATS,
} from "./progressionConfig";

export function createDefaultState(): GameState {
  const now = Date.now();

  return {
    meta: {
      version: 4,
      lastUpdate: now,
    },
    resources: {
      gold: 0,
      gems: 100,
      energy: 100,
      ruby: 0,
    },
    inventory: [],
    equipment: {
      weapon: null,
      armor: null,
      accessory1: null,
      accessory2: null,
      pet: null,
      tool: null,
    },
    character: createDefaultCharacterState(),
    upgrades: [],
    pets: [],
    stats: { ...STARTING_PLAYER_STATS },
    playerProgress: { ...STARTING_PLAYER_PROGRESS },
    combat: {
      currentLevel: 1,
      highestLevelReached: 1,
      lastBossCheckpointLevel: 0,
      playerCurrentHp: STARTING_PLAYER_STATS.hp ?? 1,
      enemy: createEnemyInstance(1),
      playerAttackRemainderMs: 0,
      enemyAttackRemainderMs: 0,
      spellCooldowns: {},
      consumableCooldowns: {},
      fightMode: "progression",
      farmingTargetLevel: 1,
    },
    temporaryEffects: {
      goldIncomeBoostPercent: 0,
      goldIncomeBoostUntil: 0,
    },
    playtime: {
      remainingMs: 1000 * 60 * 5,
      capMs: 1000 * 60 * 5,
      tokenUnitMs: 1000 * 60 * 5,
    },
    rewardInbox: {
      bundles: [],
      nextBundleId: 1,
    },
    garden: {
      gridSize: { rows: 2, cols: 2 },
      unlockedFields: [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 1, col: 0 },
        { row: 1, col: 1 },
      ],
      crops: {},
      trees: {},
      rocks: {
        small: [],
        medium: [],
        large: [],
      },
      tools: {
        pickaxe_common: 1,
        wateringcan_common: 1,
      },
      cropStorage: {
        limits: {
          flower: 1000,
          vegetable: 1000,
          fruit: 1000,
          herb: 1000,
          grape: 1000,
          grains: 1000,
          special: 1000,
        },
        current: {
          flower: 0,
          vegetable: 0,
          fruit: 0,
          herb: 0,
          grape: 0,
          grains: 0,
          special: 0,
        },
      },
      cropMastery: {},
      sprinklers: {},
      harvesters: {},
      planters: {},
      selectedPlanterSeedId: null,
      planterSeedSelections: {},
      automationTimers: {
        harvesterRemainderMs: 0,
        planterRemainderMs: 0,
        seedMakerRemainderMs: 0,
      },
      seedMaker: {
        isRunning: false,
        selectedSeedId: null,
      },
    },
  };
}

export const defaultState: GameState = createDefaultState();
