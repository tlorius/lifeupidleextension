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
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        {itemTypes.map((type) => (
          <button
            key={type}
            className={filter === type ? "btn-selected" : ""}
            style={{
              padding: "8px 12px",
              fontSize: "12px",
              borderRadius: 4,
              transition: "all 0.2s",
            }}
            onClick={() => setFilter(type)}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
        <button
          className={isMassSelectMode ? "btn-selected" : ""}
          style={{
            padding: "8px 12px",
            fontSize: "12px",
            borderRadius: 4,
            transition: "all 0.2s",
          }}
          onClick={() => setIsMassSelectMode((prev) => !prev)}
        >
          {isMassSelectMode ? "Exit Mass Select" : "Mass Select"}
        </button>
      </div>

      {/* Inventory Items */}
      {isEmpty ? (
        <p style={{ color: "#9eb0c2" }}>{emptyMessage}</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {isMassSelectMode && (
            <div
              style={{
                border: "1px solid #345068",
                borderRadius: 8,
                backgroundColor: "#142332",
                padding: 10,
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <label
                style={{
                  cursor:
                    selectableVisibleUids.length > 0
                      ? "pointer"
                      : "not-allowed",
                  opacity: selectableVisibleUids.length > 0 ? 1 : 0.6,
                  userSelect: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  color: "#dce6f0",
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

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "#9eb0c2" }}>
                  {selectedSellSummary}
                </span>
                <button
                  className="btn-danger"
                  style={{
                    padding: "10px 12px",
                    fontSize: 13,
                    borderRadius: 6,
                    minHeight: 40,
                    minWidth: 130,
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
                style={{
                  border: equipped ? "1px solid #2c8f84" : "1px solid #2f4459",
                  borderRadius: 8,
                  padding: 10,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  backgroundColor: equipped ? "#182f3a" : "#172533",
                  position: "relative",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
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
                  style={{
                    width: 28,
                    minWidth: 28,
                    height: 28,
                    fontSize: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    filter: `drop-shadow(0 0 4px ${rarityColors[def?.rarity || "common"]}80)`,
                  }}
                >
                  {getItemIcon(def?.type || "potion", def?.rarity || "common")}
                </div>

                {/* Item Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <div>
                      <strong
                        style={{ color: rarityColors[def?.rarity || "common"] }}
                      >
                        {def?.name}
                      </strong>
                      <div
                        style={{ fontSize: 11, color: "#9eb0c2", marginTop: 3 }}
                      >
                        Lvl {item.level} • {def?.rarity}
                      </div>
                      {def?.setId && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "#7bd7c6",
                            marginTop: 3,
                          }}
                        >
                          Set:{" "}
                          {uniqueSetDefinitions[def.setId]?.name ?? def.setId}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "#8fa3b7" }}>
                      {item.isGroupedSeed
                        ? `x${formatCompactNumber(item.quantity, { minCompactValue: 1000 })}`
                        : `Total ${formatCompactNumber(totalStats, { minCompactValue: 1000 })}`}
                    </div>
                  </div>

                  {/* Stats Display */}
                  {item.isGroupedSeed && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "#9eb0c2",
                        marginBottom: 6,
                      }}
                    >
                      Grouped seed stack from all matching seed entries.
                    </div>
                  )}
                  {Object.keys(itemStats).length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 6,
                        fontSize: 11,
                        marginBottom: 6,
                      }}
                    >
                      {Object.entries(itemStats).map(([key, value]) => (
                        <div
                          key={key}
                          style={{
                            color: "#dce6f0",
                            backgroundColor: "#223447",
                            border: "1px solid #345068",
                            borderRadius: 999,
                            padding: "2px 8px",
                          }}
                        >
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

                  <div style={{ fontSize: 11, color: "#8ea3b8" }}>
                    {item.isGroupedSeed
                      ? "Click to view one seed entry"
                      : "Click to view details"}
                  </div>
                  {!entrySelectable && (
                    <div
                      style={{ fontSize: 11, color: "#b9c7d6", marginTop: 6 }}
                    >
                      Equipped items cannot be selected for mass sell.
                    </div>
                  )}
                </div>

                {/* Equipped Badge */}
                {equipped && (
                  <div
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 8,
                      backgroundColor: "#2c8f84",
                      color: "white",
                      fontSize: "10px",
                      padding: "2px 6px",
                      borderRadius: 3,
                      fontWeight: "bold",
                    }}
                  >
                    ✓ EQUIPPED
                  </div>
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
          style={{
            position: "fixed",
            right: 16,
            bottom: 16,
            zIndex: 1600,
            maxWidth: "min(380px, calc(100vw - 32px))",
            padding: "10px 12px",
            borderRadius: 8,
            border: activeToastStyle.border,
            backgroundColor: activeToastStyle.background,
            color: activeToastStyle.color,
            fontSize: 12,
            boxShadow: "0 10px 20px rgba(0, 0, 0, 0.35)",
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
