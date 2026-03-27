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

type CombatConsumableAction = Extract<
  CombatAction,
  { type: "combat/useConsumable" }
>;
type CombatCastSpellAction = Extract<
  CombatAction,
  { type: "combat/castSpell" }
>;

function applyCombatClickAttackAction(state: GameState): CombatActionResult {
  return toCombatActionResult(performClickAttack(state.combat, state), state);
}

function applyCombatConsumableAction(
  state: GameState,
  action: CombatConsumableAction,
): CombatActionResult {
  return toCombatActionResult(
    useCombatConsumable(state.combat, state, action.itemUid),
    state,
  );
}

function applyCombatCastSpellAction(
  state: GameState,
  action: CombatCastSpellAction,
): CombatActionResult {
  return toCombatActionResult(
    castCombatSpell(state.combat, state, action.spellId),
    state,
  );
}

export function applyCombatAction(
  state: GameState,
  action: CombatAction,
): CombatActionResult {
  switch (action.type) {
    case "combat/clickAttack":
      return applyCombatClickAttackAction(state);

    case "combat/useConsumable":
      return applyCombatConsumableAction(state, action);

    case "combat/castSpell":
      return applyCombatCastSpellAction(state, action);
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
