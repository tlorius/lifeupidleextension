import type {
  CombatEvent,
  CombatRuntimeState,
  CombatTickResult,
} from "./combat";
import type { GameState } from "./types";

interface TickOrchestratorDeps {
  playerIntervalMs: number;
  enemyIntervalMs: number;
  executePlayerAttack: (
    runtime: CombatRuntimeState,
    state: GameState,
  ) => CombatTickResult;
  executeEnemyAttack: (
    runtime: CombatRuntimeState,
    state: GameState,
  ) => CombatTickResult;
}

const MAX_COMBAT_ACTIONS_PER_TICK = 5000;

export function orchestrateCombatTick(
  nextRuntime: CombatRuntimeState,
  nextState: GameState,
  deps: TickOrchestratorDeps,
): CombatTickResult {
  const events: CombatEvent[] = [];
  let runtime = nextRuntime;
  let state = nextState;

  let actions = 0;
  while (actions < MAX_COMBAT_ACTIONS_PER_TICK) {
    const playerReady =
      runtime.playerAttackRemainderMs >= deps.playerIntervalMs;
    const enemyReady = runtime.enemyAttackRemainderMs >= deps.enemyIntervalMs;
    if (!playerReady && !enemyReady) break;

    if (playerReady) {
      runtime = {
        ...runtime,
        playerAttackRemainderMs:
          runtime.playerAttackRemainderMs - deps.playerIntervalMs,
      };
      const attacked = deps.executePlayerAttack(runtime, state);
      runtime = attacked.runtime;
      state = attacked.state;
      events.push(...attacked.events);
    }

    if (enemyReady) {
      runtime = {
        ...runtime,
        enemyAttackRemainderMs:
          runtime.enemyAttackRemainderMs - deps.enemyIntervalMs,
      };
      const attacked = deps.executeEnemyAttack(runtime, state);
      runtime = attacked.runtime;
      state = attacked.state;
      events.push(...attacked.events);

      if (attacked.events.some((event) => event.type === "playerDefeated")) {
        break;
      }
    }

    actions += 1;
  }

  return {
    runtime,
    state,
    events,
  };
}
