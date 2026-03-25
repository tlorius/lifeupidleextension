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
    <div
      style={{
        marginBottom: 14,
        borderRadius: 12,
        border: "1px solid #30465b",
        background: "linear-gradient(150deg, #1c2233 0%, #2a3048 100%)",
        padding: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 14 }}>
          ⚡ Spells {classLabel ?? ""}
        </div>
        {showManageButton && (
          <button
            onClick={onOpenManageSpells}
            style={{
              padding: "4px 8px",
              fontSize: 11,
              borderRadius: 7,
              border: "1px solid rgba(109, 144, 173, 0.35)",
              background: "rgba(20, 35, 50, 0.65)",
              color: "#9fc6ff",
              cursor: "pointer",
            }}
          >
            Manage Spells
          </button>
        )}
      </div>
      <div style={{ fontSize: 11, color: "#99b9d6", marginBottom: 8 }}>
        Slots unlocked: {unlockedSpellSlots} / {maxSpellSlots}
      </div>

      {emptyMessage && (
        <div style={{ fontSize: 12, color: "#c4d9ec", marginBottom: 8 }}>
          {emptyMessage}
        </div>
      )}

      <div style={{ display: "grid", gap: 8 }}>
        {spellActions.map((spell) => (
          <button
            key={spell.id}
            onClick={() => onCastSpell(spell.id)}
            disabled={!spell.canCast}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              alignItems: "center",
              gap: 8,
              textAlign: "left",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid rgba(109, 144, 173, 0.35)",
              background: "rgba(24, 32, 48, 0.6)",
              color: spell.canCast ? "#f3f8ff" : "#666",
              cursor: spell.canCast ? "pointer" : "not-allowed",
              opacity: spell.canCast ? 1 : 0.6,
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 12,
                  marginBottom: 3,
                }}
              >
                {spell.name}
              </div>
              <div style={{ fontSize: 10, opacity: 0.75, lineHeight: 1.4 }}>
                {spell.description}
              </div>
              <div style={{ fontSize: 10, opacity: 0.6, marginTop: 3 }}>
                Unlock Lv {spell.requiredLevel} • Mana {spell.manaCost} •{" "}
                {spell.cooldownLabel}
              </div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700 }}>Cast</div>
          </button>
        ))}
      </div>

      <div
        style={{
          marginTop: 12,
          borderTop: "1px solid rgba(109, 144, 173, 0.25)",
          paddingTop: 10,
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 6 }}>
          Default Spell Path (XP Progression)
        </div>
        <div style={{ display: "grid", gap: 5 }}>
          {spellPath.map((spell) => (
            <div
              key={`path-${spell.id}`}
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr auto",
                gap: 8,
                alignItems: "center",
                fontSize: 11,
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
