import { useMemo } from "react";
import { useGame } from "../game/GameContext";
import {
  getClassCombatSpellsForClass,
  getGeneralCombatSpellPath,
} from "../game/combat";
import { getSpellSlotsForLevel, setClassSpellSlot } from "../game/classes";

interface SpellSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SpellSelectModal({ isOpen, onClose }: SpellSelectModalProps) {
  const { state, setState } = useGame();

  const activeClassId = state.character.activeClassId;
  const unlockedSpellSlots = getSpellSlotsForLevel(state.playerProgress.level);

  const availableSpells = useMemo(() => {
    if (!activeClassId) return [];

    const generalSpells = getGeneralCombatSpellPath().filter(
      (spell) => state.playerProgress.level >= spell.requiredLevel,
    );
    const classSpells = getClassCombatSpellsForClass(activeClassId).filter(
      (spell) => state.playerProgress.level >= spell.requiredLevel,
    );
    return [...generalSpells, ...classSpells];
  }, [activeClassId, state.playerProgress.level]);

  if (!isOpen || !activeClassId) return null;

  const classProgress = state.character.classProgress[activeClassId];
  const selectedSpellIds = classProgress.selectedSpellIds.slice(
    0,
    unlockedSpellSlots,
  );

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(6, 10, 16, 0.72)",
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "min(700px, 100%)",
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: 12,
          border: "1px solid #3b5670",
          background: "linear-gradient(170deg, #111b27 0%, #1b2b3c 100%)",
          padding: 16,
          boxShadow: "0 16px 44px rgba(0, 0, 0, 0.45)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 20, color: "#eaf3fb" }}>
            Spell Selection
          </h2>
          <button
            onClick={onClose}
            style={{
              borderRadius: 6,
              border: "1px solid rgba(130, 170, 204, 0.4)",
              background: "rgba(20, 35, 50, 0.65)",
              color: "#d8ecff",
              padding: "6px 12px",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            Close
          </button>
        </div>

        {unlockedSpellSlots <= 0 && (
          <div style={{ color: "#ffc0a0", fontSize: 12, marginBottom: 12 }}>
            ⚠ Spell slots unlock at level 10. Continue leveling!
          </div>
        )}

        {/* Spell Slots */}
        {unlockedSpellSlots > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                color: "#cfe1ef",
                fontWeight: 600,
                fontSize: 13,
                marginBottom: 10,
              }}
            >
              Your Spell Slots ({unlockedSpellSlots} total)
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {Array.from({ length: unlockedSpellSlots }).map(
                (_, slotIndex) => {
                  const selectedSpellId = selectedSpellIds[slotIndex] ?? null;
                  const selectedSpell = availableSpells.find(
                    (s) => s.id === selectedSpellId,
                  );

                  return (
                    <div
                      key={`slot-${slotIndex}`}
                      style={{
                        border: "1px solid rgba(109, 144, 173, 0.35)",
                        borderRadius: 8,
                        padding: 10,
                        background: "rgba(13, 23, 34, 0.55)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginBottom: 8,
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 600,
                            color: "#eaf3fb",
                            minWidth: 60,
                            fontSize: 12,
                          }}
                        >
                          Slot {slotIndex + 1}
                        </div>
                        <div style={{ flex: 1, fontSize: 12 }}>
                          {selectedSpell ? (
                            <span style={{ color: "#a8d5ff" }}>
                              {selectedSpell.name}
                            </span>
                          ) : (
                            <span style={{ color: "#7a8fa0" }}>Unassigned</span>
                          )}
                        </div>
                        {selectedSpell && (
                          <button
                            onClick={() => {
                              setState((prev) =>
                                setClassSpellSlot(
                                  prev,
                                  activeClassId,
                                  slotIndex,
                                  null,
                                ),
                              );
                            }}
                            style={{
                              borderRadius: 4,
                              border: "1px solid rgba(191, 126, 126, 0.4)",
                              background: "rgba(50, 18, 18, 0.55)",
                              color: "#ffc7c7",
                              padding: "4px 8px",
                              fontSize: 11,
                              cursor: "pointer",
                            }}
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {/* Spell Options */}
                      <div style={{ display: "grid", gap: 4 }}>
                        {availableSpells.map((spell) => {
                          const isSelected = selectedSpellId === spell.id;
                          const isAlreadySlotted = selectedSpellIds.includes(
                            spell.id,
                          );

                          return (
                            <button
                              key={spell.id}
                              onClick={() => {
                                setState((prev) =>
                                  setClassSpellSlot(
                                    prev,
                                    activeClassId,
                                    slotIndex,
                                    spell.id,
                                  ),
                                );
                              }}
                              style={{
                                textAlign: "left",
                                padding: "6px 8px",
                                borderRadius: 6,
                                border: isSelected
                                  ? "1px solid #9ad0ff"
                                  : "1px solid rgba(109, 144, 173, 0.2)",
                                background: isSelected
                                  ? "rgba(72, 120, 168, 0.4)"
                                  : "rgba(16, 28, 40, 0.5)",
                                color: isSelected ? "#e8f3ff" : "#a8d5ff",
                                cursor: "pointer",
                                fontSize: 11,
                                opacity:
                                  isAlreadySlotted && !isSelected ? 0.6 : 1,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <div>
                                  <strong>{spell.name}</strong>
                                  {isAlreadySlotted && !isSelected && (
                                    <span
                                      style={{
                                        marginLeft: 6,
                                        color: "#888",
                                        fontSize: 9,
                                      }}
                                    >
                                      (already slotted)
                                    </span>
                                  )}
                                </div>
                                {isSelected && (
                                  <span style={{ color: "#9ad0ff" }}>✓</span>
                                )}
                              </div>
                              <div
                                style={{
                                  fontSize: 10,
                                  opacity: 0.7,
                                  marginTop: 2,
                                }}
                              >
                                {spell.description}
                              </div>
                              <div
                                style={{
                                  fontSize: 9,
                                  opacity: 0.6,
                                  marginTop: 1,
                                }}
                              >
                                Mana {spell.manaCost} • Cooldown{" "}
                                {(spell.cooldownMs / 1000).toFixed(1)}s
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        )}

        {/* Available Spells */}
        {unlockedSpellSlots > 0 && (
          <div
            style={{
              paddingTop: 12,
              borderTop: "1px solid rgba(109, 144, 173, 0.25)",
            }}
          >
            <div
              style={{
                color: "#99b9d6",
                fontSize: 11,
                marginBottom: 8,
              }}
            >
              💡 <strong>Tip:</strong> All passives from your active class are
              always active. Only slot the spells you want to cast in combat.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
