import { useMemo, useRef, useState } from "react";
import { castCombatSpell, getCombatSpellDefinition } from "../game/combat";
import { getTotalStats } from "../game/engine";
import { formatCompactNumber } from "../game/numberFormat";
import type {
  FightSpellPathEntryViewModel,
  FightSpellSlotViewModel,
} from "../game/selectors/fight";
import type { GameState } from "../game/types";
import { SpellIconTile } from "./SpellIcon";
import { ModalShell } from "./ui/ModalShell";

interface FightSpellsPanelProps {
  isVisible: boolean;
  classLabel: string | null;
  showManageButton: boolean;
  unlockedSpellSlots: number;
  maxSpellSlots: number;
  emptyMessage: string | null;
  spellSlots: FightSpellSlotViewModel[];
  spellPath: FightSpellPathEntryViewModel[];
  state: GameState;
  onOpenManageSpells: () => void;
  onCastSpell: (spellId: string) => void;
}

interface SpellPreviewData {
  baseDamageLabel: string;
  damageRangeLabel: string;
  cooldownLabel: string;
  notes: string[];
}

function formatCooldownMs(cooldownMs: number): string {
  return `${(cooldownMs / 1000).toFixed(cooldownMs % 1000 === 0 ? 0 : 1)}s`;
}

function getSpellPreviewData(
  state: GameState,
  spellId: string,
): SpellPreviewData {
  const spell = getCombatSpellDefinition(spellId);
  if (!spell) {
    return {
      baseDamageLabel: "Unknown",
      damageRangeLabel: "Unknown",
      cooldownLabel: "Unknown",
      notes: [],
    };
  }

  const totalStats = getTotalStats(state);
  const playerMaxHp = Math.max(
    1,
    Math.round(totalStats.hp ?? state.stats.hp ?? 1),
  );
  const previewState: GameState = {
    ...state,
    resources: {
      ...state.resources,
      energy: 100,
    },
  };
  const previewRuntime = {
    ...state.combat,
    playerCurrentHp: Math.max(1, Math.round(playerMaxHp * 0.4)),
    enemy: {
      ...state.combat.enemy,
      currentHp: 1_000_000_000,
      maxHp: 1_000_000_000,
    },
    spellCooldowns: {},
  };
  const previewResult = castCombatSpell(
    previewRuntime,
    previewState,
    spellId,
    () => 0.5,
  );
  const hits = previewResult.events.filter(
    (event) => event.type === "playerHit" && event.spellId === spellId,
  );
  const hitValues = hits.map((event) =>
    Math.max(0, Math.round(event.value ?? 0)),
  );
  const totalDamage = hitValues.reduce((sum, value) => sum + value, 0);
  const minHit = hitValues.length > 0 ? Math.min(...hitValues) : null;
  const maxHit = hitValues.length > 0 ? Math.max(...hitValues) : null;
  const healAmount = Math.max(
    0,
    Math.round(
      previewResult.runtime.playerCurrentHp - previewRuntime.playerCurrentHp,
    ),
  );
  const petHits = hits.filter((event) => event.attackSource === "pet").length;
  const notes: string[] = [spell.description];

  if (spell.id.endsWith("_focus")) {
    notes.push(
      "Buff: empowers your next class spell cast with a major synergy damage bonus.",
    );
  }
  if (hitValues.length > 1) {
    notes.push(
      `Effect: ${hitValues.length}-hit sequence in the current build preview.`,
    );
  }
  if (petHits > 0) {
    notes.push(`Effect: ${petHits} hit(s) scale with pet damage.`);
  }
  if (healAmount > 0) {
    notes.push(
      `Effect: restores about ${formatCompactNumber(healAmount)} HP in the current build preview.`,
    );
  }
  if (/mana|surge|timebank|reserve|epoch|ledger/i.test(spell.id)) {
    notes.push("Effect: includes mana recovery and/or resource tempo utility.");
  }
  if (/timebank|echo_ledger|epoch_cashout/i.test(spell.id)) {
    notes.push("Effect: interacts with spell cooldown timing.");
  }
  if (/execution|ruin|horizon|doom|verdant_end/i.test(spell.id)) {
    notes.push(
      "Range note: damage shifts based on target state or follow-up conditions.",
    );
  }

  return {
    baseDamageLabel:
      totalDamage > 0 ? formatCompactNumber(totalDamage) : "No direct damage",
    damageRangeLabel:
      minHit !== null && maxHit !== null
        ? `${formatCompactNumber(minHit)} - ${formatCompactNumber(maxHit)} per hit`
        : "Utility / heal spell",
    cooldownLabel: formatCooldownMs(spell.cooldownMs),
    notes,
  };
}

export function FightSpellsPanel({
  isVisible,
  classLabel,
  showManageButton,
  unlockedSpellSlots,
  maxSpellSlots,
  emptyMessage,
  spellSlots,
  spellPath,
  state,
  onOpenManageSpells,
  onCastSpell,
}: FightSpellsPanelProps) {
  const [detailSpellId, setDetailSpellId] = useState<string | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressActiveRef = useRef(false);

  const detailSpell = detailSpellId
    ? getCombatSpellDefinition(detailSpellId)
    : null;
  const detailPreview = useMemo(
    () => (detailSpellId ? getSpellPreviewData(state, detailSpellId) : null),
    [detailSpellId, state],
  );

  if (!isVisible) return null;

  const clearLongPress = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const beginPress = (spellId: string | null) => {
    clearLongPress();
    longPressActiveRef.current = false;
    if (!spellId) return;
    longPressTimerRef.current = window.setTimeout(() => {
      longPressActiveRef.current = true;
      setDetailSpellId(spellId);
    }, 420);
  };

  const endPress = (spellId: string | null, canCast: boolean) => {
    clearLongPress();
    if (!spellId) return;
    if (longPressActiveRef.current) {
      longPressActiveRef.current = false;
      return;
    }
    if (canCast) {
      onCastSpell(spellId);
    }
  };

  return (
    <div className="ui-fight-spells-panel">
      <div className="ui-fight-spells-head">
        <div>
          <div className="ui-fight-spells-title">Spells {classLabel ?? ""}</div>
          <div className="ui-fight-spells-slot-note">
            Tap to cast. Hold for details. Slots unlocked: {unlockedSpellSlots}{" "}
            / {maxSpellSlots}
          </div>
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

      {emptyMessage && (
        <div className="ui-fight-spells-empty">{emptyMessage}</div>
      )}

      <div
        className="ui-fight-spell-slot-row"
        role="list"
        aria-label="Selected combat spells"
      >
        {spellSlots.map((slot) => {
          const spell = slot.spell;
          const isDimmed = !slot.isUnlocked || !spell || !spell.canCast;
          const showCooldown =
            spell?.unavailableReason === "cooldown" && spell.cooldownMs > 0;

          return (
            <div
              key={`spell-slot-${slot.slotIndex}`}
              role="listitem"
              className="ui-fight-spell-slot-shell"
            >
              <button
                type="button"
                className="ui-fight-spell-slot-btn"
                aria-label={
                  spell
                    ? `${spell.name}${spell.canCast ? "" : `, unavailable, ${spell.cooldownLabel}`}`
                    : slot.isUnlocked
                      ? `Empty spell slot ${slot.slotIndex + 1}`
                      : `Locked spell slot ${slot.slotIndex + 1}`
                }
                onPointerDown={() => beginPress(spell?.id ?? null)}
                onPointerUp={() =>
                  endPress(spell?.id ?? null, Boolean(spell?.canCast))
                }
                onPointerLeave={clearLongPress}
                onPointerCancel={clearLongPress}
                onContextMenu={(event) => {
                  event.preventDefault();
                  if (spell?.id) {
                    clearLongPress();
                    setDetailSpellId(spell.id);
                  }
                }}
                style={{
                  opacity: slot.isUnlocked ? 1 : 0.35,
                  cursor: spell?.canCast
                    ? "pointer"
                    : spell
                      ? "help"
                      : "default",
                  background: spell
                    ? "rgba(12, 20, 30, 0.78)"
                    : "rgba(16, 20, 28, 0.44)",
                }}
              >
                {spell ? (
                  <>
                    <SpellIconTile
                      spellId={spell.id}
                      tileSize={46}
                      size={20}
                      dimmed={isDimmed}
                    />
                    {showCooldown && (
                      <span className="ui-fight-spell-cooldown-badge">
                        {spell.cooldownLabel.replace("Cooldown ", "")}
                      </span>
                    )}
                    {!spell.canCast && spell.unavailableReason === "mana" && (
                      <span className="ui-fight-spell-state-badge">MP</span>
                    )}
                  </>
                ) : (
                  <span className="ui-fight-spell-slot-placeholder">
                    {slot.isUnlocked ? "-" : "LOCK"}
                  </span>
                )}
              </button>
              <div className="ui-fight-spell-slot-label">
                {spell ? spell.name : `Slot ${slot.slotIndex + 1}`}
              </div>
            </div>
          );
        })}
      </div>

      <div className="ui-fight-spells-path">
        <div className="ui-fight-spells-path-title">Default Spell Path</div>
        <div className="ui-fight-spells-path-list">
          {spellPath.map((spell) => (
            <div
              key={`path-${spell.id}`}
              className="ui-fight-spells-path-row"
              style={{
                color: spell.isUnlocked ? "#d9f0ff" : "#8ea4b7",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <SpellIconTile
                  spellId={spell.id}
                  tileSize={28}
                  size={14}
                  dimmed={!spell.isUnlocked}
                />
                <span>Lv {spell.requiredLevel}</span>
              </div>
              <div>{spell.name}</div>
              <div>{spell.isUnlocked ? "Unlocked" : "Locked"}</div>
            </div>
          ))}
        </div>
      </div>

      {detailSpell && detailPreview && (
        <ModalShell
          onClose={() => setDetailSpellId(null)}
          panelStyle={{ width: "min(540px, 100%)" }}
        >
          <div className="ui-modal-header" style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <SpellIconTile spellId={detailSpell.id} tileSize={48} size={22} />
              <div>
                <h2 className="ui-modal-title" style={{ marginBottom: 2 }}>
                  {detailSpell.name}
                </h2>
                <div style={{ fontSize: 12, color: "#9db2c8" }}>
                  {detailSpell.description}
                </div>
              </div>
            </div>
            <button
              className="ui-modal-close"
              onClick={() => setDetailSpellId(null)}
            >
              Close
            </button>
          </div>

          <div className="ui-fight-spell-detail-grid">
            <div className="ui-fight-spell-detail-card">
              <div className="ui-fight-spell-detail-label">Base Damage</div>
              <div className="ui-fight-spell-detail-value">
                {detailPreview.baseDamageLabel}
              </div>
            </div>
            <div className="ui-fight-spell-detail-card">
              <div className="ui-fight-spell-detail-label">Damage Range</div>
              <div className="ui-fight-spell-detail-value">
                {detailPreview.damageRangeLabel}
              </div>
            </div>
            <div className="ui-fight-spell-detail-card">
              <div className="ui-fight-spell-detail-label">Cooldown</div>
              <div className="ui-fight-spell-detail-value">
                {detailPreview.cooldownLabel}
              </div>
            </div>
            <div className="ui-fight-spell-detail-card">
              <div className="ui-fight-spell-detail-label">Mana Cost</div>
              <div className="ui-fight-spell-detail-value">
                {detailSpell.manaCost}
              </div>
            </div>
          </div>

          <div className="ui-fight-spell-detail-notes">
            {detailPreview.notes.map((note) => (
              <div key={note} className="ui-fight-spell-detail-note">
                {note}
              </div>
            ))}
          </div>
        </ModalShell>
      )}
    </div>
  );
}
