import { useMemo } from "react";
import { useGame } from "../game/GameContext";
import { useGameActions } from "../game/useGameActions";
import {
  getClassCombatSpellsForClass,
  getGeneralCombatSpellPath,
} from "../game/combat";
import { getSpellSlotsForLevel } from "../game/classes";
import { SpellIconTile } from "./SpellIcon";
import { ModalShell } from "./ui/ModalShell";

interface SpellSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SpellSelectModal({ isOpen, onClose }: SpellSelectModalProps) {
  const { state } = useGame();
  const { setClassSpellSlot } = useGameActions();

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
    <ModalShell
      onClose={onClose}
      panelStyle={{
        width: "min(700px, 100%)",
      }}
    >
      {/* Header */}
      <div className="ui-modal-header">
        <h2 className="ui-modal-title">Spell Selection</h2>
        <button className="ui-modal-close" onClick={onClose}>
          Close
        </button>
      </div>

      {unlockedSpellSlots <= 0 && (
        <div className="ui-spell-warning">
          ⚠ Spell slots unlock at level 10. Continue leveling!
        </div>
      )}

      {/* Spell Slots */}
      {unlockedSpellSlots > 0 && (
        <div className="ui-spell-section">
          <div className="ui-spell-section-title">
            Your Spell Slots ({unlockedSpellSlots} total)
          </div>
          <div className="ui-grid-gap-8">
            {Array.from({ length: unlockedSpellSlots }).map((_, slotIndex) => {
              const selectedSpellId = selectedSpellIds[slotIndex] ?? null;
              const selectedSpell = availableSpells.find(
                (s) => s.id === selectedSpellId,
              );

              return (
                <div key={`slot-${slotIndex}`} className="ui-spell-slot-card">
                  <div className="ui-spell-slot-head">
                    <div className="ui-spell-slot-label">
                      Slot {slotIndex + 1}
                    </div>
                    <div className="ui-spell-slot-value">
                      {selectedSpell ? (
                        <span
                          style={{
                            color: "#a8d5ff",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <SpellIconTile
                            spellId={selectedSpell.id}
                            tileSize={26}
                            size={13}
                          />
                          {selectedSpell.name}
                        </span>
                      ) : (
                        <span style={{ color: "#7a8fa0" }}>Unassigned</span>
                      )}
                    </div>
                    {selectedSpell && (
                      <button
                        className="ui-spell-clear-btn ui-touch-target"
                        onClick={() => {
                          setClassSpellSlot(activeClassId, slotIndex, null);
                        }}
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Spell Options */}
                  <div className="ui-grid-gap-4">
                    {availableSpells.map((spell) => {
                      const isSelected = selectedSpellId === spell.id;
                      const isAlreadySlotted = selectedSpellIds.includes(
                        spell.id,
                      );

                      return (
                        <button
                          key={spell.id}
                          className="ui-spell-option-btn"
                          onClick={() => {
                            setClassSpellSlot(
                              activeClassId,
                              slotIndex,
                              spell.id,
                            );
                          }}
                          style={{
                            border: isSelected
                              ? "1px solid #9ad0ff"
                              : "1px solid rgba(109, 144, 173, 0.2)",
                            background: isSelected
                              ? "rgba(72, 120, 168, 0.4)"
                              : "rgba(16, 28, 40, 0.5)",
                            color: isSelected ? "#e8f3ff" : "#a8d5ff",
                            opacity: isAlreadySlotted && !isSelected ? 0.6 : 1,
                          }}
                        >
                          <div className="ui-spell-option-head">
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <SpellIconTile
                                spellId={spell.id}
                                tileSize={30}
                                size={15}
                                dimmed={isAlreadySlotted && !isSelected}
                              />
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
                          <div className="ui-spell-option-desc">
                            {spell.description}
                          </div>
                          <div className="ui-spell-option-meta">
                            Mana {spell.manaCost} • Cooldown{" "}
                            {(spell.cooldownMs / 1000).toFixed(1)}s
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Spells */}
      {unlockedSpellSlots > 0 && (
        <div className="ui-tip-strip">
          <div className="ui-tip-text">
            💡 <strong>Tip:</strong> All passives from your active class are
            always active. Only slot the spells you want to cast in combat.
          </div>
        </div>
      )}
    </ModalShell>
  );
}
