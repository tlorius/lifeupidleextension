import type {
  CombatOfflineResult,
  CombatRng,
  CombatRuntimeState,
} from "./combat";
import type { GameState } from "./types";
import { reduceCombatCooldowns } from "./combatCooldowns";

interface OfflineSimulationDeps {
  getExpectedPlayerDps: (state: GameState) => number;
  getExpectedEnemyDps: (
    runtime: CombatRuntimeState,
    state: GameState,
  ) => number;
  getDamageAfterDefense: (rawDamage: number, defense: number) => number;
  getPlayerMaxHp: (state: GameState) => number;
  createEnemyInstance: (level: number) => any;
  applyEnemyReward: (
    runtime: CombatRuntimeState,
    state: GameState,
    rng: CombatRng,
  ) => { runtime: CombatRuntimeState; state: GameState; events: any[] };
}

const MAX_OFFLINE_COMBAT_STEPS = 25_000;

export function resolveOfflineCombatExpected(
  runtime: CombatRuntimeState,
  state: GameState,
  offlineMs: number,
  deps: OfflineSimulationDeps,
  rng: CombatRng = Math.random,
): CombatOfflineResult {
  let remainingMs = Math.max(0, offlineMs);
  if (remainingMs <= 0) {
    return {
      runtime,
      state,
      levelsCleared: 0,
      defeatedByEnemy: false,
      itemsGained: 0,
    };
  }

  let nextRuntime = { ...runtime };
  nextRuntime = reduceCombatCooldowns(nextRuntime, remainingMs);
  let nextState = state;
  let levelsCleared = 0;
  let defeatedByEnemy = false;
  let itemsGained = 0;
  let steps = 0;

  while (remainingMs > 0 && steps < MAX_OFFLINE_COMBAT_STEPS) {
    steps += 1;

    // Recover from a saved defeated-enemy state so offline initialization can
    // advance instead of spinning on a zero-time kill forever.
    if (
      !Number.isFinite(nextRuntime.enemy.currentHp) ||
      nextRuntime.enemy.currentHp <= 0
    ) {
      const rewarded = deps.applyEnemyReward(nextRuntime, nextState, rng);
      nextRuntime = rewarded.runtime;
      nextState = rewarded.state;
      levelsCleared += 1;
      itemsGained += rewarded.events
        .filter((event) => event.type === "lootGranted")
        .reduce((sum, event) => sum + Math.max(0, event.quantity ?? 0), 0);
      continue;
    }

    const playerDps = deps.getExpectedPlayerDps(nextState);
    const enemyDps = deps.getExpectedEnemyDps(nextRuntime, nextState);

    if (playerDps <= 0) {
      defeatedByEnemy = true;
      break;
    }

    const timeToKillMs = (nextRuntime.enemy.currentHp / playerDps) * 1000;
    const timeToDieMs =
      enemyDps <= 0
        ? Number.POSITIVE_INFINITY
        : (nextRuntime.playerCurrentHp / enemyDps) * 1000;

    if (timeToDieMs <= timeToKillMs) {
      const resetLevel =
        nextRuntime.fightMode === "farming"
          ? Math.max(
              1,
              nextRuntime.farmingTargetLevel ?? nextRuntime.currentLevel,
            )
          : Math.max(1, nextRuntime.lastBossCheckpointLevel || 1);
      nextRuntime = {
        ...nextRuntime,
        currentLevel: resetLevel,
        playerCurrentHp: deps.getPlayerMaxHp(nextState),
        enemy: deps.createEnemyInstance(resetLevel),
        playerAttackRemainderMs: 0,
        enemyAttackRemainderMs: 0,
      };
      defeatedByEnemy = true;
      break;
    }

    if (timeToKillMs > remainingMs) {
      break;
    }

    remainingMs -= timeToKillMs;

    nextRuntime = {
      ...nextRuntime,
      enemy: {
        ...nextRuntime.enemy,
        currentHp: 0,
      },
    };

    const rewarded = deps.applyEnemyReward(nextRuntime, nextState, rng);
    nextRuntime = rewarded.runtime;
    nextState = rewarded.state;
    levelsCleared += 1;
    itemsGained += rewarded.events
      .filter((event) => event.type === "lootGranted")
      .reduce((sum, event) => sum + Math.max(0, event.quantity ?? 0), 0);
  }

  return {
    runtime: nextRuntime,
    state: nextState,
    levelsCleared,
    defeatedByEnemy,
    itemsGained,
  };
}
