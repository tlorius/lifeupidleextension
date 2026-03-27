import { useEffect, useRef, useState } from "react";
import { useGame } from "../game/GameContext";
import { useGameActions } from "../game/useGameActions";
import { uniqueSetDefinitions } from "../game/itemSets";
import {
  selectInventoryView,
  type InventoryDisplayEntry,
  type InventoryFilter,
} from "../game/selectors/inventory";
import { ItemDetail } from "./ItemDetail";
import type { PotionToastPayload, PotionToastTone } from "./ItemDetail";
import { formatCompactNumber } from "../game/numberFormat";
import type { ItemType } from "../game/types";

function getItemIcon(itemType: ItemType, _rarity: string): string {
  // Clear icon per type (same for all rarities of a type)
  // Can easily be expanded later to use different icons per rarity
  const typeIcons: Record<ItemType, string> = {
    weapon: "⚔️",
    armor: "🛡️",
    accessory: "💍",
    tool: "🔧",
    potion: "🧪",
    seed: "🌱",
    pet: "🐕",
  };

  return typeIcons[itemType] || "📦";
}

export function Inventory() {
  const { state } = useGame();
  const { sellSelectedItems: dispatchSellSelectedItems } = useGameActions();
  const [selectedItemUid, setSelectedItemUid] = useState<string | null>(null);
  const [selectedSellUids, setSelectedSellUids] = useState<string[]>([]);
  const [isMassSelectMode, setIsMassSelectMode] = useState(false);
  const [filter, setFilter] = useState<InventoryFilter>("all");
  const [potionToast, setPotionToast] = useState<PotionToastPayload | null>(
    null,
  );
  const toastTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current !== null) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const showPotionToast = (payload: PotionToastPayload) => {
    setPotionToast(payload);
    if (toastTimeoutRef.current !== null) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setPotionToast(null);
      toastTimeoutRef.current = null;
    }, 3000);
  };

  const itemTypes: (ItemType | "all")[] = [
    "all",
    "weapon",
    "armor",
    "accessory",
    "potion",
    "seed",
    "pet",
    "tool",
  ];

  // Keep selection in sync when inventory changes (sold/used/upgraded items).
  useEffect(() => {
    const existingUids = new Set(state.inventory.map((item) => item.uid));
    setSelectedSellUids((prev) => prev.filter((uid) => existingUids.has(uid)));
  }, [state.inventory]);

  useEffect(() => {
    if (!isMassSelectMode && selectedSellUids.length > 0) {
      setSelectedSellUids([]);
    }
  }, [isMassSelectMode, selectedSellUids.length]);

  const {
    displayInventory,
    selectedItem,
    selectableVisibleUids,
    allVisibleSelected,
    isEmpty,
    emptyMessage,
    selectedSellCount,
    selectedSellSummary,
    sellConfirmationMessage,
  } = selectInventoryView(state, filter, selectedSellUids, selectedItemUid);

  const toggleEntrySelection = (entry: InventoryDisplayEntry): void => {
    const selectable = entry.sellableUids;
    if (selectable.length === 0) return;

    setSelectedSellUids((prev) => {
      const allSelected = selectable.every((uid) => prev.includes(uid));
      if (allSelected) {
        return prev.filter((uid) => !selectable.includes(uid));
      }

      const merged = new Set(prev);
      for (const uid of selectable) merged.add(uid);
      return Array.from(merged);
    });
  };

  const toggleSelectAllVisible = () => {
    if (selectableVisibleUids.length === 0) return;

    setSelectedSellUids((prev) => {
      if (allVisibleSelected) {
        return prev.filter((uid) => !selectableVisibleUids.includes(uid));
      }

      const merged = new Set(prev);
      for (const uid of selectableVisibleUids) merged.add(uid);
      return Array.from(merged);
    });
  };

  const handleSellSelectedItems = () => {
    if (selectedSellUids.length === 0) return;

    const confirmed = window.confirm(sellConfirmationMessage);
    if (!confirmed) return;

    dispatchSellSelectedItems(selectedSellUids);

    if (selectedItemUid && selectedSellUids.includes(selectedItemUid)) {
      setSelectedItemUid(null);
    }
    setSelectedSellUids([]);
  };

  const toastToneStyles: Record<
    PotionToastTone,
    { border: string; background: string; color: string }
  > = {
    positive: {
      border: "1px solid #3f7c55",
      background: "#183524",
      color: "#ddf6e5",
    },
    mixed: {
      border: "1px solid #8a6a3f",
      background: "#3a2d1a",
      color: "#f5e7ce",
    },
    negative: {
      border: "1px solid #8a3f3f",
      background: "#3a1c1c",
      color: "#f8dcdc",
    },
    neutral: {
      border: "1px solid #4b6a84",
      background: "#183044",
      color: "#e8f2fb",
    },
  };

  const activeToastStyle = potionToast
    ? toastToneStyles[potionToast.tone]
    : toastToneStyles.neutral;

  return (
    <div>
      <h2>Inventory</h2>

      {/* Filter Tabs */}
      <div className="ui-filter-row">
        {itemTypes.map((type) => (
          <button
            key={type}
            className={`${filter === type ? "btn-selected" : ""} ui-filter-btn`}
            onClick={() => setFilter(type)}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
        <button
          className={`${isMassSelectMode ? "btn-selected" : ""} ui-filter-btn`}
          onClick={() => setIsMassSelectMode((prev) => !prev)}
        >
          {isMassSelectMode ? "Exit Mass Select" : "Mass Select"}
        </button>
      </div>

      {/* Inventory Items */}
      {isEmpty ? (
        <p className="ui-empty-message">{emptyMessage}</p>
      ) : (
        <div className="ui-list-stack">
          {isMassSelectMode && (
            <div className="ui-mass-toolbar">
              <label
                className="ui-mass-toolbar-label"
                style={{
                  cursor:
                    selectableVisibleUids.length > 0
                      ? "pointer"
                      : "not-allowed",
                  opacity: selectableVisibleUids.length > 0 ? 1 : 0.6,
                }}
              >
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleSelectAllVisible}
                  disabled={selectableVisibleUids.length === 0}
                  style={{ width: 18, height: 18 }}
                />
                Select all non-equipped (visible)
              </label>

              <div className="ui-mass-toolbar-actions">
                <span className="ui-summary-muted">{selectedSellSummary}</span>
                <button
                  className="btn-danger ui-btn-compact-danger ui-touch-target"
                  style={{
                    opacity: selectedSellCount > 0 ? 1 : 0.6,
                    cursor: selectedSellCount > 0 ? "pointer" : "not-allowed",
                  }}
                  onClick={handleSellSelectedItems}
                  disabled={selectedSellCount === 0}
                >
                  Sell Selected
                </button>
              </div>
            </div>
          )}

          {displayInventory.map((item) => {
            const def = item.definition;
            const equipped = item.equipped;
            const totalStats = item.totalStats;
            const entrySelectable = item.isSelectable;
            const entrySelected = item.isFullySelected;
            const itemStats = item.itemStats;

            const rarityColors: Record<string, string> = {
              common: "#999999",
              rare: "#4169E1",
              epic: "#9932CC",
              legendary: "#FFD700",
              unique: "#FF8C00",
            };

            return (
              <div
                key={item.uid}
                className="ui-inventory-card"
                style={{
                  border: equipped ? "1px solid #2c8f84" : "1px solid #2f4459",
                  backgroundColor: equipped ? "#182f3a" : "#172533",
                }}
                onClick={() => setSelectedItemUid(item.uid)}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    "#1d3142";
                  (e.currentTarget as HTMLElement).style.borderColor =
                    rarityColors[def?.rarity || "common"];
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    equipped ? "#182f3a" : "#172533";
                  (e.currentTarget as HTMLElement).style.borderColor = equipped
                    ? "#2c8f84"
                    : "#2f4459";
                }}
              >
                {isMassSelectMode && (
                  <div
                    style={{
                      marginTop: 1,
                      flexShrink: 0,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={entrySelected}
                      disabled={!entrySelectable}
                      onChange={() => toggleEntrySelection(item)}
                      aria-label={`Select ${def?.name ?? item.itemId} for selling`}
                      style={{
                        width: 20,
                        height: 20,
                        cursor: entrySelectable ? "pointer" : "not-allowed",
                      }}
                    />
                  </div>
                )}

                {/* Item Icon */}
                <div
                  className="ui-item-icon"
                  style={{
                    filter: `drop-shadow(0 0 4px ${rarityColors[def?.rarity || "common"]}80)`,
                  }}
                >
                  {getItemIcon(def?.type || "potion", def?.rarity || "common")}
                </div>

                {/* Item Details */}
                <div className="ui-item-content">
                  <div className="ui-item-header-row">
                    <div>
                      <strong
                        style={{ color: rarityColors[def?.rarity || "common"] }}
                      >
                        {def?.name}
                      </strong>
                      <div className="ui-item-meta">
                        Lvl {item.level} • {def?.rarity}
                      </div>
                      {def?.setId && (
                        <div className="ui-item-set-meta">
                          Set:{" "}
                          {uniqueSetDefinitions[def.setId]?.name ?? def.setId}
                        </div>
                      )}
                    </div>
                    <div className="ui-item-total">
                      {item.isGroupedSeed
                        ? `x${formatCompactNumber(item.quantity, { minCompactValue: 1000 })}`
                        : `Total ${formatCompactNumber(totalStats, { minCompactValue: 1000 })}`}
                    </div>
                  </div>

                  {/* Stats Display */}
                  {item.isGroupedSeed && (
                    <div className="ui-grouped-seed-note">
                      Grouped seed stack from all matching seed entries.
                    </div>
                  )}
                  {Object.keys(itemStats).length > 0 && (
                    <div className="ui-item-stat-chip-row">
                      {Object.entries(itemStats).map(([key, value]) => (
                        <div key={key} className="ui-item-stat-chip">
                          <span style={{ color: "#9eb0c2" }}>{key}:</span>{" "}
                          <strong>
                            {formatCompactNumber(value, {
                              minCompactValue: 1000,
                            })}
                          </strong>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="ui-item-hint">
                    {item.isGroupedSeed
                      ? "Click to view one seed entry"
                      : "Click to view details"}
                  </div>
                  {!entrySelectable && (
                    <div className="ui-item-warning">
                      Equipped items cannot be selected for mass sell.
                    </div>
                  )}
                </div>

                {/* Equipped Badge */}
                {equipped && (
                  <div className="ui-equipped-badge">✓ EQUIPPED</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedItem && (
        <ItemDetail
          item={selectedItem}
          onClose={() => setSelectedItemUid(null)}
          onPotionUsed={showPotionToast}
        />
      )}

      {potionToast && (
        <div
          className="ui-toast-fixed"
          style={{
            border: activeToastStyle.border,
            backgroundColor: activeToastStyle.background,
            color: activeToastStyle.color,
          }}
          role="status"
          aria-live="polite"
        >
          {potionToast.message}
        </div>
      )}
    </div>
  );
}
