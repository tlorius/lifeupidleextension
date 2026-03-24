import { useState } from "react";
import { useGame } from "../game/GameContext";
import { uniqueSetDefinitions } from "../game/itemSets";
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
      return (
        <div
          style={{
            padding: 12,
            color: "#9eb0c2",
            backgroundColor: "#172533",
            border: "1px solid #2f4459",
            borderRadius: 8,
            marginBottom: 10,
            fontSize: 13,
          }}
        >
          {slot}: Empty
        </div>
      );

    const item = state.inventory.find((i) => i.uid === uid);
    if (!item)
      return (
        <div
          style={{
            padding: 12,
            color: "#9eb0c2",
            backgroundColor: "#172533",
            border: "1px solid #2f4459",
            borderRadius: 8,
            marginBottom: 10,
            fontSize: 13,
          }}
        >
          {slot}: Missing
        </div>
      );

    const def = getItemDefSafe(item.itemId);
    if (!def)
      return (
        <div
          style={{
            padding: 12,
            color: "#9eb0c2",
            backgroundColor: "#172533",
            border: "1px solid #2f4459",
            borderRadius: 8,
            marginBottom: 10,
            fontSize: 13,
          }}
        >
          {slot}: Unknown Item
        </div>
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
          border: "1px solid #2f4459",
          borderRadius: 8,
          padding: 10,
          marginBottom: 10,
          cursor: "pointer",
          backgroundColor: "#172533",
          transition: "all 0.2s",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
        onClick={() => setSelectedItemUid(item.uid)}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = "#1d3142";
          (e.currentTarget as HTMLElement).style.borderColor =
            rarityColors[def.rarity];
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = "#172533";
          (e.currentTarget as HTMLElement).style.borderColor = "#2f4459";
        }}
      >
        {/* Item Icon */}
        <div
          style={{
            width: 30,
            minWidth: 30,
            height: 30,
            fontSize: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            filter: `drop-shadow(0 0 4px ${rarityColors[def.rarity]}80)`,
          }}
        >
          {getItemIcon(def.type, def.rarity)}
        </div>

        {/* Slot Info */}
        <div>
          <div style={{ fontSize: 11, color: "#9eb0c2", marginBottom: 3 }}>
            {slot}
          </div>
          <div style={{ color: rarityColors[def.rarity] }}>
            <strong>{def.name}</strong>
          </div>
          <div style={{ fontSize: 12, color: "#c7d3df", marginTop: 3 }}>
            Lvl {item.level}
          </div>
          {def.setId && (
            <div style={{ fontSize: 11, color: "#7bd7c6", marginTop: 2 }}>
              Set: {uniqueSetDefinitions[def.setId]?.name ?? def.setId}
            </div>
          )}
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
