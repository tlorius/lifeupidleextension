import {
  equipItem,
  isItemEquipped,
  sellItem,
  upgradeItem,
  usePotion,
} from "../engine";
import { addDebugItems, getItemDefSafe } from "../items";
import type { GameState } from "../types";

export type InventoryAction =
  | {
      type: "inventory/equipItem";
      itemUid: string;
      slot?: "accessory1" | "accessory2";
    }
  | { type: "inventory/upgradeItem"; itemUid: string }
  | { type: "inventory/sellItem"; itemUid: string }
  | { type: "inventory/usePotion"; itemUid: string }
  | { type: "inventory/sellSelectedItems"; itemUids: string[] }
  | { type: "inventory/addDebugItems" };

export function reduceInventoryAction(
  state: GameState,
  action: InventoryAction,
): GameState {
  switch (action.type) {
    case "inventory/equipItem":
      return equipItem(state, action.itemUid, action.slot);

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
  }
}

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
