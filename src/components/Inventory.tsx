import { useState } from "react";
import { useGame } from "../game/GameContext";
import { getItemDefSafe } from "../game/items";
import { ItemDetail } from "./ItemDetail";
import { isItemEquipped, calculateItemStat } from "../game/engine";
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
        <p style={{ color: "#999" }}>No items</p>
      ) : (
        <div>
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
                  border: equipped ? "2px solid #51cf66" : "1px solid #ddd",
                  borderRadius: 6,
                  padding: 12,
                  marginBottom: 10,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  backgroundColor: equipped ? "#f0fff4" : "#fafafa",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
                onClick={() => setSelectedItemUid(item.uid)}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    "#f0f0f0";
                  (e.currentTarget as HTMLElement).style.borderColor =
                    rarityColors[def?.rarity || "common"];
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    equipped ? "#f0fff4" : "#fafafa";
                  (e.currentTarget as HTMLElement).style.borderColor = equipped
                    ? "#51cf66"
                    : "#ddd";
                }}
              >
                {/* Item Icon */}
                <div
                  style={{
                    fontSize: 28,
                    flexShrink: 0,
                    filter: `drop-shadow(0 0 4px ${rarityColors[def?.rarity || "common"]}80)`,
                  }}
                >
                  {getItemIcon(def?.type || "potion", def?.rarity || "common")}
                </div>

                {/* Item Details */}
                <div style={{ flex: 1 }}></div>

                {/* Equipped Badge */}
                {equipped && (
                  <div
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 8,
                      backgroundColor: "#51cf66",
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

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                    marginBottom: 8,
                  }}
                >
                  <div>
                    <strong
                      style={{ color: rarityColors[def?.rarity || "common"] }}
                    >
                      {def?.name}
                    </strong>
                    <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                      Lvl {item.level} • {def?.rarity}
                    </div>
                  </div>
                </div>

                {/* Stats Display */}
                {Object.keys(itemStats).length > 0 && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                      fontSize: 12,
                      marginBottom: 8,
                      padding: "8px 0",
                      borderTop: "1px solid #eee",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    {Object.entries(itemStats).map(([key, value]) => (
                      <div key={key} style={{ color: "#666" }}>
                        <span style={{ fontSize: 11, color: "#999" }}>
                          {key}:
                        </span>{" "}
                        <strong>{value.toFixed(1)}</strong>
                      </div>
                    ))}
                    <div
                      style={{
                        gridColumn: "1 / -1",
                        color: "#333",
                        fontWeight: "bold",
                        paddingTop: 4,
                      }}
                    >
                      Total: {totalStats.toFixed(1)}
                    </div>
                  </div>
                )}

                <div
                  style={{ fontSize: 12, color: "#999", textAlign: "right" }}
                >
                  Click to view details
                </div>
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
