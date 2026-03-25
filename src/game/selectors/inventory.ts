import { calculateItemStat, isItemEquipped } from "../engine";
import { getItemDefSafe } from "../items";
import type {
  GameState,
  ItemDefinition,
  ItemInstance,
  ItemType,
  Stats,
} from "../types";

export type InventoryFilter = ItemType | "all";

export interface InventoryDisplayEntry {
  uid: string;
  itemId: string;
  level: number;
  quantity: number;
  isGroupedSeed: boolean;
  selectableUids: string[];
  sellableUids: string[];
  isSelectable: boolean;
  isFullySelected: boolean;
  equipped: boolean;
  totalStats: number;
  itemStats: Partial<Stats>;
  definition: ItemDefinition | null;
}

export interface InventoryViewModel {
  displayInventory: InventoryDisplayEntry[];
  selectedItem: ItemInstance | null;
  selectableVisibleUids: string[];
  allVisibleSelected: boolean;
  selectedSellTotalGold: number;
  selectedUniqueItemNames: string[];
}

export function selectInventoryView(
  state: GameState,
  filter: InventoryFilter,
  selectedSellUids: string[],
  selectedItemUid: string | null,
): InventoryViewModel {
  const selectedSellUidSet = new Set(selectedSellUids);
  const filteredInventory = state.inventory.filter((item) => {
    if (filter === "all") return true;
    const def = getItemDefSafe(item.itemId);
    return def?.type === filter;
  });

  const seedGroups = new Map<
    string,
    {
      representative: ItemInstance;
      quantity: number;
      selectableUids: string[];
    }
  >();
  const nonSeedEntries: InventoryDisplayEntry[] = [];

  for (const item of filteredInventory) {
    const def = getItemDefSafe(item.itemId);

    if (def?.type === "seed") {
      const existing = seedGroups.get(item.itemId);
      if (existing) {
        existing.quantity += item.quantity;
        existing.selectableUids.push(item.uid);
        if (item.level > existing.representative.level) {
          existing.representative = item;
        }
      } else {
        seedGroups.set(item.itemId, {
          representative: item,
          quantity: item.quantity,
          selectableUids: [item.uid],
        });
      }
      continue;
    }

    nonSeedEntries.push(
      buildInventoryDisplayEntry(state, item, {
        quantity: item.quantity,
        isGroupedSeed: false,
        selectableUids: [item.uid],
        selectedSellUidSet,
      }),
    );
  }

  const groupedSeedEntries = Array.from(seedGroups.values()).map((group) =>
    buildInventoryDisplayEntry(state, group.representative, {
      quantity: group.quantity,
      isGroupedSeed: true,
      selectableUids: group.selectableUids,
      selectedSellUidSet,
    }),
  );

  const displayInventory = [...nonSeedEntries, ...groupedSeedEntries].sort(
    (left, right) => {
      if (left.level !== right.level) return right.level - left.level;
      return right.totalStats - left.totalStats;
    },
  );

  const selectableVisibleUids = Array.from(
    new Set(displayInventory.flatMap((entry) => entry.sellableUids)),
  );
  const allVisibleSelected =
    selectableVisibleUids.length > 0 &&
    selectableVisibleUids.every((uid) => selectedSellUidSet.has(uid));

  const selectedSellTotalGold = selectedSellUids.reduce((sum, uid) => {
    const item = state.inventory.find((entry) => entry.uid === uid);
    if (!item) return sum;
    const def = getItemDefSafe(item.itemId);
    return sum + (def?.sellPrice ?? 0);
  }, 0);

  const selectedUniqueItemNames = Array.from(
    new Set(
      selectedSellUids
        .map((uid) => state.inventory.find((entry) => entry.uid === uid))
        .filter((item): item is ItemInstance => item !== undefined)
        .map((item) => getItemDefSafe(item.itemId))
        .filter((def): def is ItemDefinition => def !== null)
        .filter((def) => def.rarity === "unique")
        .map((def) => def.name),
    ),
  );

  return {
    displayInventory,
    selectedItem:
      state.inventory.find((item) => item.uid === selectedItemUid) ?? null,
    selectableVisibleUids,
    allVisibleSelected,
    selectedSellTotalGold,
    selectedUniqueItemNames,
  };
}

function buildInventoryDisplayEntry(
  state: GameState,
  item: ItemInstance,
  options: {
    quantity: number;
    isGroupedSeed: boolean;
    selectableUids: string[];
    selectedSellUidSet: Set<string>;
  },
): InventoryDisplayEntry {
  const definition = getItemDefSafe(item.itemId);
  const itemStats = getDisplayItemStats(item, definition);
  const sellableUids = options.selectableUids.filter(
    (uid) => !isItemEquipped(state, uid),
  );

  return {
    uid: item.uid,
    itemId: item.itemId,
    level: item.level,
    quantity: options.quantity,
    isGroupedSeed: options.isGroupedSeed,
    selectableUids: options.selectableUids,
    sellableUids,
    isSelectable: sellableUids.length > 0,
    isFullySelected:
      sellableUids.length > 0 &&
      sellableUids.every((uid) => options.selectedSellUidSet.has(uid)),
    equipped: isItemEquipped(state, item.uid),
    totalStats: Object.values(itemStats).reduce(
      (sum, value) => sum + (value ?? 0),
      0,
    ),
    itemStats,
    definition,
  };
}

function getDisplayItemStats(
  item: ItemInstance,
  definition: ItemDefinition | null,
): Partial<Stats> {
  const itemStats: Partial<Stats> = {};

  if (!definition?.stats) {
    return itemStats;
  }

  for (const [key, value] of Object.entries(definition.stats)) {
    if (value !== undefined && typeof value === "number") {
      itemStats[key as keyof Stats] = calculateItemStat(
        value,
        item.level,
        definition.rarity || "common",
      );
    }
  }

  return itemStats;
}
