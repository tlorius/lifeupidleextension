import {
  addItem,
  equipItem,
  isItemEquipped,
  sellItem,
  upgradeItem,
  upgradeItemMax,
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
  | { type: "inventory/upgradeItemMax"; itemUid: string }
  | { type: "inventory/sellItem"; itemUid: string }
  | { type: "inventory/usePotion"; itemUid: string }
  | { type: "inventory/sellSelectedItems"; itemUids: string[] }
  | { type: "inventory/addDebugItems" }
  | {
      type: "inventory/buyShopItem";
      itemId: string;
      quantity?: number;
      currency: "gold" | "gems" | "ruby";
      costPerItem: number;
    };

type InventoryEquipItemAction = Extract<
  InventoryAction,
  { type: "inventory/equipItem" }
>;
type InventoryUpgradeItemAction = Extract<
  InventoryAction,
  { type: "inventory/upgradeItem" }
>;
type InventoryUpgradeItemMaxAction = Extract<
  InventoryAction,
  { type: "inventory/upgradeItemMax" }
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

function applyUpgradeItemMaxAction(
  state: GameState,
  action: InventoryUpgradeItemMaxAction,
): GameState {
  return upgradeItemMax(state, action.itemUid);
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

function applyBuyShopItemAction(
  state: GameState,
  action: Extract<InventoryAction, { type: "inventory/buyShopItem" }>,
): GameState {
  const itemDef = getItemDefSafe(action.itemId);
  if (!itemDef) return state;

  const quantity = Math.max(1, Math.floor(action.quantity ?? 1));
  const costPerItem = Math.max(0, Math.floor(action.costPerItem));
  const totalCost = quantity * costPerItem;
  const currencyAmount =
    action.currency === "gold"
      ? state.resources.gold
      : action.currency === "gems"
        ? (state.resources.gems ?? 0)
        : (state.resources.ruby ?? 0);

  if (currencyAmount < totalCost) return state;

  let next = state;
  for (let index = 0; index < quantity; index += 1) {
    next = addItem(next, action.itemId);
  }

  if (action.currency === "gold") {
    return {
      ...next,
      resources: {
        ...next.resources,
        gold: next.resources.gold - totalCost,
      },
    };
  }

  if (action.currency === "gems") {
    return {
      ...next,
      resources: {
        ...next.resources,
        gems: (next.resources.gems ?? 0) - totalCost,
      },
    };
  }

  return {
    ...next,
    resources: {
      ...next.resources,
      ruby: (next.resources.ruby ?? 0) - totalCost,
    },
  };
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

    case "inventory/upgradeItemMax":
      return applyUpgradeItemMaxAction(state, action);

    case "inventory/sellItem":
      return applySellItemAction(state, action);

    case "inventory/usePotion":
      return applyUsePotionAction(state, action);

    case "inventory/sellSelectedItems":
      return sellSelectedItems(state, action.itemUids);

    case "inventory/addDebugItems":
      return applyAddDebugItemsAction(state);

    case "inventory/buyShopItem":
      return applyBuyShopItemAction(state, action);
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
