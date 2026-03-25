import {
  castCombatSpell,
  performClickAttack,
  useCombatConsumable,
  type CombatEvent,
} from "../combat";
import type { GameState } from "../types";

export type CombatAction =
  | { type: "combat/clickAttack" }
  | { type: "combat/useConsumable"; itemUid: string }
  | { type: "combat/castSpell"; spellId: string };

export interface CombatActionResult {
  state: GameState;
  combatEvents: CombatEvent[];
}

export function applyCombatAction(
  state: GameState,
  action: CombatAction,
): CombatActionResult {
  switch (action.type) {
    case "combat/clickAttack":
      return toCombatActionResult(
        performClickAttack(state.combat, state),
        state,
      );

    case "combat/useConsumable":
      return toCombatActionResult(
        useCombatConsumable(state.combat, state, action.itemUid),
        state,
      );

    case "combat/castSpell":
      return toCombatActionResult(
        castCombatSpell(state.combat, state, action.spellId),
        state,
      );
  }
}

function toCombatActionResult(
  result: {
    runtime: GameState["combat"];
    state: GameState;
    events: CombatEvent[];
  },
  previousState: GameState,
): CombatActionResult {
  if (
    result.state === previousState &&
    result.runtime === previousState.combat
  ) {
    return {
      state: previousState,
      combatEvents: result.events,
    };
  }

  return {
    state: {
      ...result.state,
      combat: result.runtime,
    },
    combatEvents: result.events,
  };
}
