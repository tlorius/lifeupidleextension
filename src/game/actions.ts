import { addDebugItems } from "./items";
import { createDefaultState } from "./state";
import type { GameState } from "./types";
import {
  setClassSpellSlot,
  switchClass,
  upgradeClassNode,
  type ClassId,
} from "./classes";

export type GameAction =
  | { type: "resource/addGold"; amount: number }
  | { type: "resource/addGems"; amount: number }
  | { type: "resource/addEnergy"; amount: number }
  | {
      type: "resource/addGoldAndGems";
      goldAmount: number;
      gemsAmount: number;
    }
  | { type: "character/addSkillPoints"; amount: number }
  | { type: "class/switch"; classId: ClassId }
  | { type: "class/upgradeNode"; classId: ClassId; nodeId: string }
  | {
      type: "class/setSpellSlot";
      classId: ClassId;
      slotIndex: number;
      spellId: string | null;
    }
  | { type: "inventory/addDebugItems" }
  | { type: "state/resetToDefault" };

export function reduceGameAction(
  state: GameState,
  action: GameAction,
): GameState {
  switch (action.type) {
    case "resource/addGold":
      return {
        ...state,
        resources: {
          ...state.resources,
          gold: state.resources.gold + action.amount,
        },
      };

    case "resource/addGems":
      return {
        ...state,
        resources: {
          ...state.resources,
          gems: (state.resources.gems ?? 0) + action.amount,
        },
      };

    case "resource/addEnergy":
      return {
        ...state,
        resources: {
          ...state.resources,
          energy: (state.resources.energy ?? 0) + action.amount,
        },
      };

    case "resource/addGoldAndGems":
      return {
        ...state,
        resources: {
          ...state.resources,
          gold: state.resources.gold + action.goldAmount,
          gems: (state.resources.gems ?? 0) + action.gemsAmount,
        },
      };

    case "character/addSkillPoints":
      return {
        ...state,
        character: {
          ...state.character,
          availableSkillPoints:
            state.character.availableSkillPoints + action.amount,
        },
      };

    case "class/switch":
      return switchClass(state, action.classId);

    case "class/upgradeNode":
      return upgradeClassNode(state, action.classId, action.nodeId);

    case "class/setSpellSlot":
      return setClassSpellSlot(
        state,
        action.classId,
        action.slotIndex,
        action.spellId,
      );

    case "inventory/addDebugItems":
      return addDebugItems(state);

    case "state/resetToDefault":
      return createDefaultState();

    default:
      return state;
  }
}
