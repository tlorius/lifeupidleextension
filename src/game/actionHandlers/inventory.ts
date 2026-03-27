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

type InventoryEquipItemAction = Extract<
  InventoryAction,
  { type: "inventory/equipItem" }
>;
type InventoryUpgradeItemAction = Extract<
  InventoryAction,
  { type: "inventory/upgradeItem" }
>;
type InventorySellItemAction = Extract<
  InventoryAction,
  { type: "inventory/sellItem" }
>;
type InventoryUsePotionAction = Extract<
  InventoryAction,
  { type: "inventory/usePotion" }
>;

function applyEquipItemAction(
  state: GameState,
  action: InventoryEquipItemAction,
): GameState {
  return equipItem(state, action.itemUid, action.slot);
}

function applyUpgradeItemAction(
  state: GameState,
  action: InventoryUpgradeItemAction,
): GameState {
  return upgradeItem(state, action.itemUid);
}

function applySellItemAction(
  state: GameState,
  action: InventorySellItemAction,
): GameState {
  return sellItem(state, action.itemUid);
}

function applyUsePotionAction(
  state: GameState,
  action: InventoryUsePotionAction,
): GameState {
  return usePotion(state, action.itemUid);
}

function applyAddDebugItemsAction(state: GameState): GameState {
  return addDebugItems(state);
}

export function reduceInventoryAction(
  state: GameState,
  action: InventoryAction,
): GameState {
  switch (action.type) {
    case "inventory/equipItem":
      return applyEquipItemAction(state, action);

    case "inventory/upgradeItem":
      return applyUpgradeItemAction(state, action);

    case "inventory/sellItem":
      return applySellItemAction(state, action);

    case "inventory/usePotion":
      return applyUsePotionAction(state, action);

    case "inventory/sellSelectedItems":
      return sellSelectedItems(state, action.itemUids);

    case "inventory/addDebugItems":
      return applyAddDebugItemsAction(state);
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
