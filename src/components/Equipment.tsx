import { useState } from "react";
import { useGame } from "../game/GameContext";
import { getItemDefSafe } from "../game/items";
import { ItemDetail } from "./ItemDetail";
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

export function Equipment() {
  const { state } = useGame();
  const [selectedItemUid, setSelectedItemUid] = useState<string | null>(null);

  function renderSlot(slot: keyof typeof state.equipment) {
    const uid = state.equipment[slot];

    if (!uid)
      return <div style={{ padding: 12, color: "#999" }}>{slot}: Empty</div>;

    const item = state.inventory.find((i) => i.uid === uid);
    if (!item)
      return <div style={{ padding: 12, color: "#999" }}>{slot}: Missing</div>;

    const def = getItemDefSafe(item.itemId);
    if (!def)
      return (
        <div style={{ padding: 12, color: "#999" }}>{slot}: Unknown Item</div>
      );

    const rarityColors: Record<string, string> = {
      common: "#999999",
      rare: "#4169E1",
      epic: "#9932CC",
      legendary: "#FFD700",
      unique: "#FF8C00",
    };

    return (
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 6,
          padding: 12,
          marginBottom: 10,
          cursor: "pointer",
          backgroundColor: "#fafafa",
          transition: "all 0.2s",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
        onClick={() => setSelectedItemUid(item.uid)}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = "#f0f0f0";
          (e.currentTarget as HTMLElement).style.borderColor =
            rarityColors[def.rarity];
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = "#fafafa";
          (e.currentTarget as HTMLElement).style.borderColor = "#ddd";
        }}
      >
        {/* Item Icon */}
        <div
          style={{
            fontSize: 32,
            flexShrink: 0,
            filter: `drop-shadow(0 0 4px ${rarityColors[def.rarity]}80)`,
          }}
        >
          {getItemIcon(def.type, def.rarity)}
        </div>

        {/* Slot Info */}
        <div>
          <div style={{ fontSize: 12, color: "#999", marginBottom: 4 }}>
            {slot}
          </div>
          <div style={{ color: rarityColors[def.rarity] }}>
            <strong>{def.name}</strong>
          </div>
          <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
            Lvl {item.level}
          </div>
        </div>
      </div>
    );
  }

  const selectedItem = state.inventory.find((i) => i.uid === selectedItemUid);

  return (
    <div>
      <h2>Equipment</h2>
      {renderSlot("weapon")}
      {renderSlot("armor")}
      {renderSlot("accessory1")}
      {renderSlot("accessory2")}
      {renderSlot("pet")}
      {renderSlot("tool")}

      {selectedItem && (
        <ItemDetail
          item={selectedItem}
          onClose={() => setSelectedItemUid(null)}
        />
      )}
    </div>
  );
}
