import { useState } from "react";
import { useGame } from "../game/GameContext";
import {
  CLASS_UNLOCK_LEVEL,
  freeRespecClass,
  isClassSystemUnlocked,
} from "../game/classes";
import { uniqueSetDefinitions } from "../game/itemSets";
import { getItemDefSafe } from "../game/items";
import { ItemDetail } from "./ItemDetail";
import { ClassSelectModal } from "./ClassSelectModal";
import { SkillTreeModal } from "./SkillTreeModal";
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

export function Character() {
  const { state, setState } = useGame();
  const [selectedItemUid, setSelectedItemUid] = useState<string | null>(null);
  const [isClassSelectOpen, setIsClassSelectOpen] = useState(false);
  const [isSkillTreeOpen, setIsSkillTreeOpen] = useState(false);

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
  const activeClassId = state.character.activeClassId;
  const classSystemUnlocked = isClassSystemUnlocked(state.playerProgress.level);

  return (
    <div>
      <h2>Character</h2>

      <div
        style={{
          border: "1px solid #2f4459",
          borderRadius: 10,
          background: "linear-gradient(135deg, #112131 0%, #18354b 100%)",
          padding: 12,
          marginBottom: 14,
        }}
      >
        <div style={{ marginBottom: 8, fontSize: 13, color: "#b8d5ea" }}>
          Class unlock: Level {CLASS_UNLOCK_LEVEL}
        </div>
        <div style={{ marginBottom: 10, fontSize: 13, color: "#cfe1ef" }}>
          Current class: {activeClassId ?? "None"} | Skill points:{" "}
          {state.character.availableSkillPoints}
        </div>
        {!classSystemUnlocked && (
          <div style={{ color: "#ffd9a3", fontSize: 12 }}>
            Reach level {CLASS_UNLOCK_LEVEL} to select a class.
          </div>
        )}

        {classSystemUnlocked && (
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 10,
            }}
          >
            <button onClick={() => setIsClassSelectOpen(true)}>
              Switch Class
            </button>
            <button onClick={() => setIsSkillTreeOpen(true)}>
              Open Skill Tree
            </button>
          </div>
        )}

        {activeClassId && (
          <div style={{ marginTop: 12 }}>
            <button
              onClick={() =>
                setState((prev) => freeRespecClass(prev, activeClassId))
              }
            >
              Free Respec Active Class
            </button>
          </div>
        )}
      </div>

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

      <ClassSelectModal
        isOpen={isClassSelectOpen}
        onClose={() => setIsClassSelectOpen(false)}
      />

      <SkillTreeModal
        isOpen={isSkillTreeOpen}
        onClose={() => setIsSkillTreeOpen(false)}
      />
    </div>
  );
}

export const Equipment = Character;
