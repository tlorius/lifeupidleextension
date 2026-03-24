import { useState } from "react";
import { useGame } from "../game/GameContext";
import {
  allClassDefinitions,
  canUpgradeClassNode,
  CLASS_SWITCH_GEM_COST,
  CLASS_UNLOCK_LEVEL,
  freeRespecClass,
  getClassNodeRank,
  getSpellSlotsForLevel,
  isClassSystemUnlocked,
  setClassSpellSlot,
  switchClass,
  type ClassId,
  upgradeClassNode,
} from "../game/classes";
import {
  getClassCombatSpellsForClass,
  getGeneralCombatSpellPath,
} from "../game/combat";
import { uniqueSetDefinitions } from "../game/itemSets";
import { getItemDefSafe } from "../game/items";
import { ItemDetail } from "./ItemDetail";
import type { ItemType } from "../game/types";
import archerPortrait from "../assets/classes/archer.svg";
import berserkerPortrait from "../assets/classes/berserker.svg";
import farmerPortrait from "../assets/classes/farmer.svg";
import idlerPortrait from "../assets/classes/idler.svg";
import sorceressPortrait from "../assets/classes/sorceress.svg";
import tamerPortrait from "../assets/classes/tamer.svg";

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

const classPortraits: Record<string, string> = {
  archer: archerPortrait,
  berserker: berserkerPortrait,
  farmer: farmerPortrait,
  idler: idlerPortrait,
  sorceress: sorceressPortrait,
  tamer: tamerPortrait,
};

export function Character() {
  const { state, setState } = useGame();
  const [selectedItemUid, setSelectedItemUid] = useState<string | null>(null);
  const [previewClassId, setPreviewClassId] = useState<ClassId | null>(null);

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
  const previewClass = allClassDefinitions.find(
    (classDef) => classDef.id === (previewClassId ?? activeClassId),
  );
  const unlockedSpellSlots = getSpellSlotsForLevel(state.playerProgress.level);
  const generalSpellPath = getGeneralCombatSpellPath();

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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 10,
          }}
        >
          {allClassDefinitions.map((classDef) => {
            const isActive = activeClassId === classDef.id;
            const notEnoughGems =
              (state.resources.gems ?? 0) < CLASS_SWITCH_GEM_COST;

            return (
              <div
                key={classDef.id}
                style={{
                  border: isActive ? "2px solid #67e8c6" : "1px solid #2f4459",
                  borderRadius: 10,
                  overflow: "hidden",
                  backgroundColor: "#11212f",
                  cursor: "pointer",
                }}
                onClick={() => setPreviewClassId(classDef.id)}
              >
                <img
                  src={classPortraits[classDef.id]}
                  alt={`${classDef.name} card art`}
                  style={{ width: "100%", height: 96, objectFit: "cover" }}
                />
                <div style={{ padding: 10 }}>
                  <div
                    style={{ color: "#eaf3fb", fontWeight: 700, fontSize: 14 }}
                  >
                    {classDef.name}
                  </div>
                  <div style={{ color: "#9fc2dc", fontSize: 12, marginTop: 4 }}>
                    {classDef.summary}
                  </div>
                  <div style={{ color: "#7fb7d8", fontSize: 11, marginTop: 6 }}>
                    {classDef.nodes.length} nodes |{" "}
                    {classDef.classSpells.length} class spells
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      disabled={
                        !classSystemUnlocked || isActive || notEnoughGems
                      }
                      onClick={(event) => {
                        event.stopPropagation();
                        setState((prev) => switchClass(prev, classDef.id));
                      }}
                    >
                      {isActive
                        ? "Active"
                        : `Select (${CLASS_SWITCH_GEM_COST} gems)`}
                    </button>
                    <button
                      disabled={!classSystemUnlocked}
                      onClick={(event) => {
                        event.stopPropagation();
                        setPreviewClassId(classDef.id);
                      }}
                    >
                      Preview
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {previewClass && (
          <div
            style={{
              marginTop: 12,
              borderTop: "1px solid #2f4459",
              paddingTop: 10,
            }}
          >
            <div style={{ color: "#eaf3fb", fontWeight: 700, marginBottom: 6 }}>
              {previewClass.name} preview
            </div>
            <div style={{ color: "#b6d6ea", fontSize: 12, marginBottom: 8 }}>
              {previewClass.fantasy}
            </div>
            <div style={{ color: "#8bc9e9", fontSize: 12, marginBottom: 8 }}>
              Class spells:{" "}
              {previewClass.classSpells.map((spell) => spell.name).join(", ")}
            </div>
            <div
              style={{
                color: "#cfdde8",
                fontSize: 12,
                maxHeight: 180,
                overflowY: "auto",
              }}
            >
              {previewClass.nodes.map((node) => (
                <div
                  key={node.id}
                  style={{
                    marginBottom: 6,
                    border: "1px solid rgba(107, 138, 166, 0.25)",
                    borderRadius: 8,
                    padding: 6,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <div style={{ flex: 1 }}>
                      {node.name} (Rank{" "}
                      {getClassNodeRank(state, previewClass.id, node.id)} /{" "}
                      {node.maxRank})
                    </div>
                    <button
                      disabled={
                        !canUpgradeClassNode(state, previewClass.id, node.id)
                      }
                      onClick={() =>
                        setState((prev) =>
                          upgradeClassNode(prev, previewClass.id, node.id),
                        )
                      }
                      style={{
                        borderRadius: 6,
                        border: "1px solid rgba(125, 168, 200, 0.5)",
                        background: "rgba(24, 40, 58, 0.8)",
                        color: "#d6ecff",
                        padding: "2px 8px",
                        cursor: "pointer",
                      }}
                    >
                      +
                    </button>
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
                    {node.description}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 10,
                borderTop: "1px solid #2f4459",
                paddingTop: 8,
              }}
            >
              <div
                style={{
                  color: "#eaf3fb",
                  fontWeight: 600,
                  fontSize: 12,
                  marginBottom: 6,
                }}
              >
                Spell Slots ({unlockedSpellSlots} unlocked)
              </div>
              {unlockedSpellSlots <= 0 && (
                <div style={{ fontSize: 11, color: "#b6d6ea" }}>
                  Spell slots unlock at level 10.
                </div>
              )}
              {unlockedSpellSlots > 0 && (
                <div style={{ display: "grid", gap: 6 }}>
                  {Array.from({ length: unlockedSpellSlots }).map(
                    (_, slotIndex) => {
                      const classProgress =
                        state.character.classProgress[previewClass.id];
                      const selectedSpellId =
                        classProgress.selectedSpellIds[slotIndex] ?? null;
                      const availableGeneral = generalSpellPath.filter(
                        (spell) =>
                          state.playerProgress.level >= spell.requiredLevel,
                      );
                      const availableClassSpells = getClassCombatSpellsForClass(
                        previewClass.id,
                      ).filter(
                        (spell) =>
                          state.playerProgress.level >= spell.requiredLevel,
                      );
                      const availableSpells = [
                        ...availableGeneral,
                        ...availableClassSpells,
                      ];

                      return (
                        <div
                          key={`slot-${slotIndex}`}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "90px 1fr auto",
                            gap: 6,
                            alignItems: "center",
                          }}
                        >
                          <div style={{ fontSize: 11 }}>
                            Slot {slotIndex + 1}
                          </div>
                          <select
                            value={selectedSpellId ?? ""}
                            onChange={(event) => {
                              const value = event.target.value || null;
                              setState((prev) =>
                                setClassSpellSlot(
                                  prev,
                                  previewClass.id,
                                  slotIndex,
                                  value,
                                ),
                              );
                            }}
                            style={{
                              borderRadius: 6,
                              border: "1px solid rgba(124, 155, 183, 0.35)",
                              background: "rgba(20, 34, 47, 0.8)",
                              color: "#e8f3ff",
                              padding: "4px 6px",
                              fontSize: 11,
                            }}
                          >
                            <option value="">Unassigned</option>
                            {availableSpells.map((spell) => (
                              <option
                                key={`${previewClass.id}-${slotIndex}-${spell.id}`}
                                value={spell.id}
                              >
                                {spell.name}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() =>
                              setState((prev) =>
                                setClassSpellSlot(
                                  prev,
                                  previewClass.id,
                                  slotIndex,
                                  null,
                                ),
                              )
                            }
                            style={{
                              borderRadius: 6,
                              border: "1px solid rgba(191, 126, 126, 0.4)",
                              background: "rgba(50, 18, 18, 0.55)",
                              color: "#ffd1d1",
                              padding: "3px 7px",
                              fontSize: 11,
                              cursor: "pointer",
                            }}
                          >
                            Clear
                          </button>
                        </div>
                      );
                    },
                  )}
                </div>
              )}
            </div>
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
    </div>
  );
}

export const Equipment = Character;
