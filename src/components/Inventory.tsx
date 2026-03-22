import { useState } from "react";
import { useGame } from "../game/GameContext";
import { getItemDefSafe } from "../game/items";
import { ItemDetail } from "./ItemDetail";
import { isItemEquipped, calculateItemStat } from "../game/engine";
import { formatCompactNumber } from "../game/numberFormat";
import type { ItemType, Stats } from "../game/types";

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

function calculateItemTotalStats(item: any, def: any): number {
  if (!def?.stats) return 0;
  let total = 0;
  for (const [, value] of Object.entries(def.stats)) {
    if (value !== undefined && typeof value === "number") {
      const stat = calculateItemStat(value, item.level, def.rarity || "common");
      total += stat;
    }
  }
  return total;
}

export function Inventory() {
  const { state } = useGame();
  const [selectedItemUid, setSelectedItemUid] = useState<string | null>(null);
  const [filter, setFilter] = useState<ItemType | "all">("all");

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

  let filteredInventory = state.inventory.filter((item) => {
    if (filter === "all") return true;
    const def = getItemDefSafe(item.itemId);
    return def?.type === filter;
  });

  // Sort by level descending, then by total stats descending
  filteredInventory = [...filteredInventory].sort((a, b) => {
    if (a.level !== b.level) return b.level - a.level;
    const defA = getItemDefSafe(a.itemId);
    const defB = getItemDefSafe(b.itemId);
    const statsA = calculateItemTotalStats(a, defA);
    const statsB = calculateItemTotalStats(b, defB);
    return statsB - statsA;
  });

  const selectedItem = state.inventory.find((i) => i.uid === selectedItemUid);

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
      </div>

      {/* Inventory Items */}
      {filteredInventory.length === 0 ? (
        <p style={{ color: "#9eb0c2" }}>No items</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {filteredInventory.map((item) => {
            const def = getItemDefSafe(item.itemId);
            const equipped = isItemEquipped(state, item.uid);
            const totalStats = calculateItemTotalStats(item, def);

            const itemStats: Partial<Stats> = {};
            if (def?.stats) {
              for (const [key, value] of Object.entries(def.stats)) {
                if (value !== undefined && typeof value === "number") {
                  itemStats[key as keyof Stats] = calculateItemStat(
                    value,
                    item.level,
                    def.rarity || "common",
                  );
                }
              }
            }

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
                    </div>
                    <div style={{ fontSize: 11, color: "#8fa3b7" }}>
                      Total{" "}
                      {formatCompactNumber(totalStats, {
                        minCompactValue: 1000,
                      })}
                    </div>
                  </div>

                  {/* Stats Display */}
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
                    Click to view details
                  </div>
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
        />
      )}
    </div>
  );
}
