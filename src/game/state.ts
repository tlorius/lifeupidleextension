import type { GameState } from "./types";

export const defaultState: GameState = {
  meta: {
    version: 1,
    lastUpdate: Date.now(),
  },
  resources: {
    gold: 0,
    gems: 100,
    energy: 100,
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
  upgrades: [],
  pets: [],
  stats: {
    attack: 10,
  },
  temporaryEffects: {
    goldIncomeBoostPercent: 0,
    goldIncomeBoostUntil: 0,
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
      pickaxe_common: 1, // Start with basic pickaxe
      wateringcan_common: 1, // Start with basic watering can
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
    },
  },
};
