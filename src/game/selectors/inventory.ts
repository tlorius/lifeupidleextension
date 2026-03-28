import { calculateItemStat, getSellRewardsForDefinition } from "../engine";
import { getItemDefSafe } from "../items";
import { formatCompactNumber } from "../numberFormat";
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
  isEmpty: boolean;
  emptyMessage: string;
  selectedSellCount: number;
  selectedSellTotalGold: number;
  selectedSellTotalRuby: number;
  selectedSellSummary: string;
  selectedUniqueItemNames: string[];
  sellConfirmationMessage: string;
}

export function selectInventoryView(
  state: GameState,
  filter: InventoryFilter,
  selectedSellUids: string[],
  selectedItemUid: string | null,
): InventoryViewModel {
  const selectedSellUidSet = new Set(selectedSellUids);
  const inventoryByUid = new Map(
    state.inventory.map((item) => [item.uid, item] as const),
  );
  const equippedUidSet = new Set(
    Object.values(state.equipment).filter(
      (uid): uid is string => typeof uid === "string",
    ),
  );
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
      buildInventoryDisplayEntry(item, {
        quantity: item.quantity,
        isGroupedSeed: false,
        selectableUids: [item.uid],
        selectedSellUidSet,
        equippedUidSet,
      }),
    );
  }

  const groupedSeedEntries = Array.from(seedGroups.values()).map((group) =>
    buildInventoryDisplayEntry(group.representative, {
      quantity: group.quantity,
      isGroupedSeed: true,
      selectableUids: group.selectableUids,
      selectedSellUidSet,
      equippedUidSet,
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
  const selectedSellCount = selectedSellUids.length;

  const {
    selectedSellTotalGold,
    selectedSellTotalRuby,
    selectedUniqueItemNames,
    sellConfirmationMessage,
  } = buildSellSelectionSummary(inventoryByUid, selectedSellUids);

  const summaryParts: string[] = [
    `${selectedSellCount} selected`,
    `+${formatCompactNumber(selectedSellTotalGold, { minCompactValue: 1000 })}🪙`,
  ];
  if (selectedSellTotalRuby > 0) {
    summaryParts.push(
      `+${formatCompactNumber(selectedSellTotalRuby, { minCompactValue: 1000 })}♦️`,
    );
  }

  return {
    displayInventory,
    selectedItem: selectedItemUid
      ? (inventoryByUid.get(selectedItemUid) ?? null)
      : null,
    selectableVisibleUids,
    allVisibleSelected,
    isEmpty: displayInventory.length === 0,
    emptyMessage: getInventoryEmptyMessage(filter),
    selectedSellCount,
    selectedSellTotalGold,
    selectedSellTotalRuby,
    selectedSellSummary: summaryParts.join(" • "),
    selectedUniqueItemNames,
    sellConfirmationMessage,
  };
}

function buildSellSelectionSummary(
  inventoryByUid: Map<string, ItemInstance>,
  selectedSellUids: string[],
): {
  selectedSellTotalGold: number;
  selectedSellTotalRuby: number;
  selectedUniqueItemNames: string[];
  sellConfirmationMessage: string;
} {
  const selectedItems = selectedSellUids
    .map((uid) => inventoryByUid.get(uid))
    .filter((item): item is ItemInstance => item !== undefined);

  const selectedDefinitions = selectedItems
    .map((item) => getItemDefSafe(item.itemId))
    .filter((def): def is ItemDefinition => def !== null);

  const selectedSellTotals = selectedDefinitions.reduce(
    (sum, def) => {
      const rewards = getSellRewardsForDefinition(def);
      return {
        gold: sum.gold + rewards.gold,
        ruby: sum.ruby + rewards.ruby,
      };
    },
    { gold: 0, ruby: 0 },
  );

  const selectedUniqueItemNames = Array.from(
    new Set(
      selectedDefinitions
        .filter((def) => def.rarity === "unique")
        .map((def) => def.name),
    ),
  );

  const sellConfirmationMessage = buildSellConfirmationMessage(
    selectedSellUids.length,
    selectedSellTotals.gold,
    selectedSellTotals.ruby,
    selectedUniqueItemNames,
  );

  return {
    selectedSellTotalGold: selectedSellTotals.gold,
    selectedSellTotalRuby: selectedSellTotals.ruby,
    selectedUniqueItemNames,
    sellConfirmationMessage,
  };
}

function buildSellConfirmationMessage(
  selectedSellCount: number,
  selectedSellTotalGold: number,
  selectedSellTotalRuby: number,
  selectedUniqueItemNames: string[],
): string {
  const rewardSegments = [
    `${formatCompactNumber(selectedSellTotalGold, { minCompactValue: 1000 })} gold`,
  ];
  if (selectedSellTotalRuby > 0) {
    rewardSegments.push(
      `${formatCompactNumber(selectedSellTotalRuby, { minCompactValue: 1000 })} ruby`,
    );
  }
  const baseMessage = `Sell ${selectedSellCount} selected item(s) for ${rewardSegments.join(" + ")}?`;
  if (selectedUniqueItemNames.length === 0) {
    return baseMessage;
  }

  return `${baseMessage}\n\nCareful are you sure you want to delete unique items ${selectedUniqueItemNames.join(", ")}`;
}

function getInventoryEmptyMessage(filter: InventoryFilter): string {
  if (filter === "all") {
    return "No items";
  }

  return `No ${filter} items`;
}

function buildInventoryDisplayEntry(
  item: ItemInstance,
  options: {
    quantity: number;
    isGroupedSeed: boolean;
    selectableUids: string[];
    selectedSellUidSet: Set<string>;
    equippedUidSet: Set<string>;
  },
): InventoryDisplayEntry {
  const definition = getItemDefSafe(item.itemId);
  const itemStats = getDisplayItemStats(item, definition);
  const sellableUids = options.selectableUids.filter(
    (uid) => !options.equippedUidSet.has(uid),
  );
  const equipped = options.equippedUidSet.has(item.uid);

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
    equipped,
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
