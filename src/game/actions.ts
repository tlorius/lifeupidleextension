import { addDebugItems } from "./items";
import { createDefaultState } from "./state";
import type { GameState } from "./types";
import {
  freeRespecClass,
  setClassSpellSlot,
  switchClass,
  upgradeClassNode,
  type ClassId,
} from "./classes";
import {
  equipItem,
  isItemEquipped,
  sellItem,
  upgradeItem,
  usePotion,
} from "./engine";
import { getItemDefSafe } from "./items";
import { buyUpgrade } from "./upgrades";

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
  | { type: "class/freeRespec"; classId: ClassId }
  | { type: "class/upgradeNode"; classId: ClassId; nodeId: string }
  | {
      type: "class/setSpellSlot";
      classId: ClassId;
      slotIndex: number;
      spellId: string | null;
    }
  | {
      type: "inventory/equipItem";
      itemUid: string;
      slot?: "accessory1" | "accessory2";
    }
  | { type: "inventory/upgradeItem"; itemUid: string }
  | { type: "inventory/sellItem"; itemUid: string }
  | { type: "inventory/usePotion"; itemUid: string }
  | { type: "inventory/sellSelectedItems"; itemUids: string[] }
  | { type: "inventory/addDebugItems" }
  | { type: "upgrade/buy"; upgradeId: string }
  | { type: "state/resetToDefault" };

function sellSelectedItems(state: GameState, itemUids: string[]): GameState {
  if (itemUids.length === 0) return state;

  const selectedSet = new Set(itemUids);
  const totalGold = state.inventory
    .filter(
      (item) => selectedSet.has(item.uid) && !isItemEquipped(state, item.uid),
    )
    .reduce((sum, item) => {
      const def = getItemDefSafe(item.itemId);
      return sum + (def?.sellPrice ?? 0);
    }, 0);

  return {
    ...state,
    resources: {
      ...state.resources,
      gold: state.resources.gold + totalGold,
    },
    inventory: state.inventory.filter(
      (item) => !selectedSet.has(item.uid) || isItemEquipped(state, item.uid),
    ),
  };
}

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

    case "class/freeRespec":
      return freeRespecClass(state, action.classId);

    case "class/upgradeNode":
      return upgradeClassNode(state, action.classId, action.nodeId);

    case "class/setSpellSlot":
      return setClassSpellSlot(
        state,
        action.classId,
        action.slotIndex,
        action.spellId,
      );

    case "inventory/equipItem": {
      return equipItem(state, action.itemUid, action.slot);
    }

    case "inventory/upgradeItem":
      return upgradeItem(state, action.itemUid);

    case "inventory/sellItem":
      return sellItem(state, action.itemUid);

    case "inventory/usePotion":
      return usePotion(state, action.itemUid);

    case "inventory/sellSelectedItems":
      return sellSelectedItems(state, action.itemUids);

    case "inventory/addDebugItems":
      return addDebugItems(state);

    case "upgrade/buy":
      return buyUpgrade(state, action.upgradeId);

    case "state/resetToDefault":
      return createDefaultState();

    default:
      return state;
  }
}
