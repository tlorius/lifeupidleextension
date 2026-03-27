import type {
  FightSpellActionViewModel,
  FightSpellPathEntryViewModel,
} from "../game/selectors/fight";

interface FightSpellsPanelProps {
  isVisible: boolean;
  classLabel: string | null;
  showManageButton: boolean;
  unlockedSpellSlots: number;
  maxSpellSlots: number;
  emptyMessage: string | null;
  spellActions: FightSpellActionViewModel[];
  spellPath: FightSpellPathEntryViewModel[];
  onOpenManageSpells: () => void;
  onCastSpell: (spellId: string) => void;
}

export function FightSpellsPanel({
  isVisible,
  classLabel,
  showManageButton,
  unlockedSpellSlots,
  maxSpellSlots,
  emptyMessage,
  spellActions,
  spellPath,
  onOpenManageSpells,
  onCastSpell,
}: FightSpellsPanelProps) {
  if (!isVisible) return null;

  return (
    <div className="ui-fight-spells-panel">
      <div className="ui-fight-spells-head">
        <div className="ui-fight-spells-title">
          ⚡ Spells {classLabel ?? ""}
        </div>
        {showManageButton && (
          <button
            onClick={onOpenManageSpells}
            className="ui-fight-spells-manage-btn"
          >
            Manage Spells
          </button>
        )}
      </div>
      <div className="ui-fight-spells-slot-note">
        Slots unlocked: {unlockedSpellSlots} / {maxSpellSlots}
      </div>

      {emptyMessage && (
        <div className="ui-fight-spells-empty">{emptyMessage}</div>
      )}

      <div className="ui-fight-spells-list">
        {spellActions.map((spell) => (
          <button
            key={spell.id}
            onClick={() => onCastSpell(spell.id)}
            disabled={!spell.canCast}
            className="ui-fight-spell-action-btn"
            style={{
              color: spell.canCast ? "#f3f8ff" : "#666",
              cursor: spell.canCast ? "pointer" : "not-allowed",
              opacity: spell.canCast ? 1 : 0.6,
            }}
          >
            <div>
              <div className="ui-fight-spell-name">{spell.name}</div>
              <div className="ui-fight-spell-desc">{spell.description}</div>
              <div className="ui-fight-spell-meta">
                Unlock Lv {spell.requiredLevel} • Mana {spell.manaCost} •{" "}
                {spell.cooldownLabel}
              </div>
            </div>
            <div className="ui-fight-spell-cast-label">Cast</div>
          </button>
        ))}
      </div>

      <div className="ui-fight-spells-path">
        <div className="ui-fight-spells-path-title">
          Default Spell Path (XP Progression)
        </div>
        <div className="ui-fight-spells-path-list">
          {spellPath.map((spell) => (
            <div
              key={`path-${spell.id}`}
              className="ui-fight-spells-path-row"
              style={{
                color: spell.isUnlocked ? "#d9f0ff" : "#8ea4b7",
              }}
            >
              <div>Lv {spell.requiredLevel}</div>
              <div>{spell.name}</div>
              <div>{spell.isUnlocked ? "Unlocked" : "Locked"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
