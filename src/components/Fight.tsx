import { useEffect, useMemo, useRef, useState } from "react";
import { getCombatSpellDefinition } from "../game/combat";
import { getItemDefSafe } from "../game/items";
import { useGame } from "../game/GameContext";
import {
  selectFightCombatLog,
  selectFightConsumableModal,
  selectFightConsumablesPanel,
  selectFightDpsPanel,
  selectFightDpsMetrics,
  selectFightEncounterSummary,
  selectFightSpellPanel,
  selectFightView,
  type DamagePoint,
} from "../game/selectors/fight";
import { useGameActions } from "../game/useGameActions";
import { formatCompactNumber, formatCombatNumber } from "../game/numberFormat";
import { SpellSelectModal } from "./SpellSelectModal";
import {
  FightConsumableModal,
  FightConsumablesPanel,
} from "./FightConsumables";
import { FightDpsPanel } from "./FightDpsPanel";
import { FightCombatLogPanel, FightEncounterSummaryPanel } from "./FightPanels";
import { FightSpellsPanel } from "./FightSpellsPanel";
import playerPixel from "../assets/player-pixel.svg";
import enemyPixel from "../assets/enemy-pixel.svg";
import enemyBossPixel from "../assets/enemy-boss-pixel.svg";
import petCompanionPixel from "../assets/pet-companion-pixel.svg";

interface FloatingDamage {
  id: string;
  text: string;
  color: string;
  fontSize: number;
  top: number;
  left: number;
  anchor: "left" | "right" | "center";
}

interface CombatToast {
  id: string;
  text: string;
  color: string;
  isRubyDrop?: boolean;
}

interface DamageFontBracket {
  minDamage: number;
  desktopSize: number;
  mobileSize: number;
}

interface DamageTextFitConfig {
  baseCharsDesktop: number;
  baseCharsMobile: number;
  scaleDropPerExtraChar: number;
  minScale: number;
}

const PLAYER_DAMAGE_FONT_BRACKETS: DamageFontBracket[] = [
  { minDamage: 0, desktopSize: 16, mobileSize: 13 },
  { minDamage: 1_000, desktopSize: 18, mobileSize: 14 },
  { minDamage: 100_000, desktopSize: 20, mobileSize: 17 },
  { minDamage: 1_000_000, desktopSize: 26, mobileSize: 22 },
  { minDamage: 100_000_000, desktopSize: 30, mobileSize: 24 },
  { minDamage: 1_000_000_000, desktopSize: 56, mobileSize: 45 },
];

const ENEMY_DAMAGE_FONT_BRACKETS: DamageFontBracket[] = [
  { minDamage: 0, desktopSize: 14, mobileSize: 12 },
  { minDamage: 1_000, desktopSize: 16, mobileSize: 13 },
  { minDamage: 100_000, desktopSize: 19, mobileSize: 16 },
  { minDamage: 1_000_000, desktopSize: 25, mobileSize: 21 },
  { minDamage: 100_000_000, desktopSize: 28, mobileSize: 23 },
  { minDamage: 1_000_000_000, desktopSize: 52, mobileSize: 42 },
];

const DAMAGE_TEXT_FIT_CONFIG: DamageTextFitConfig = {
  baseCharsDesktop: 8,
  baseCharsMobile: 7,
  scaleDropPerExtraChar: 0.08,
  minScale: 0.52,
};

function getDamageFontSize(
  damage: number,
  isMobileViewport: boolean,
  isCrit: boolean,
  brackets: DamageFontBracket[],
): number {
  const safeDamage = Math.max(0, damage);
  let selected = brackets[0];

  for (const bracket of brackets) {
    if (safeDamage >= bracket.minDamage) {
      selected = bracket;
    }
  }

  const baseSize = isMobileViewport
    ? selected.mobileSize
    : selected.desktopSize;
  return isCrit ? Math.round(baseSize * 1.18) : baseSize;
}

function fitDamageTextSize(
  baseFontSize: number,
  text: string,
  isMobileViewport: boolean,
  config: DamageTextFitConfig,
): number {
  const baseChars = isMobileViewport
    ? config.baseCharsMobile
    : config.baseCharsDesktop;
  const extraChars = Math.max(0, text.length - baseChars);
  const scale = Math.max(
    config.minScale,
    1 - extraChars * config.scaleDropPerExtraChar,
  );
  return Math.max(11, Math.round(baseFontSize * scale));
}

function getDamagePopupLeftPercent(target: "enemy" | "player"): number {
  // Side-anchored ranges keep long values fully visible within the arena.
  return target === "enemy" ? 78 + Math.random() * 14 : 8 + Math.random() * 14;
}

export function Fight() {
  const { state, combatEvents } = useGame();
  const { combatCastSpell, combatClickAttack, combatUseConsumable } =
    useGameActions();
  const [floatingDamage, setFloatingDamage] = useState<FloatingDamage[]>([]);
  const [combatLog, setCombatLog] = useState<
    Array<{ id: string; text: string; color: string }>
  >([]);
  const [toasts, setToasts] = useState<CombatToast[]>([]);
  const [damageHistory, setDamageHistory] = useState<DamagePoint[]>([]);
  const [dpsWindowMs, setDpsWindowMs] = useState<number>(30_000);
  const [isDpsExpanded, setIsDpsExpanded] = useState(false);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [isPlayerStatsExpanded, setIsPlayerStatsExpanded] = useState(false);
  const [isPetPulseActive, setIsPetPulseActive] = useState(false);
  const [equippedConsumables, setEquippedConsumables] = useState<
    [string | null, string | null]
  >([null, null]);
  const [isConsumableModalOpen, setIsConsumableModalOpen] = useState(false);
  const [selectedConsumableSlot, setSelectedConsumableSlot] = useState<0 | 1>(
    0,
  );
  const [isSpellSelectOpen, setIsSpellSelectOpen] = useState(false);

  const combat = state.combat;
  const {
    totalStats,
    playerMaxHp,
    playerHpPercent,
    playerMana,
    attacksPerSecond,
    critChance,
    xpForNextLevel,
    xpProgressPercent,
    combatTitle,
    activeClassId,
    slottedSpells,
    manaRegenPerSecond,
    checkpointLevel,
  } = useMemo(() => selectFightView(state), [state]);

  const [visualEnemyHp, setVisualEnemyHp] = useState(
    () => combat.enemy.currentHp,
  );
  const enemyHpTickTimersRef = useRef<number[]>([]);
  const previousEnemyIdRef = useRef(combat.enemy.enemyId);

  const enemySprite =
    combat.enemy.kind === "boss" ? enemyBossPixel : enemyPixel;
  const enemyAlt =
    combat.enemy.kind === "boss" ? "Boss enemy pixel art" : "Enemy pixel art";

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClockNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (combatEvents.length === 0) return;

    const now = Date.now();
    const hits = combatEvents
      .filter((event) => event.type === "playerHit")
      .map((event) => ({
        timestamp: now,
        damage: Math.max(0, event.value ?? 0),
        source: (event.attackSource ?? "auto") as DamagePoint["source"],
      }));

    if (hits.length > 0) {
      setDamageHistory((prev) =>
        [...prev, ...hits].filter((entry) => now - entry.timestamp <= 300_000),
      );
    }
  }, [combatEvents]);

  useEffect(() => {
    setDamageHistory((prev) =>
      prev.filter((entry) => clockNow - entry.timestamp <= 300_000),
    );
  }, [clockNow]);

  // Keep visual HP aligned when the encounter swaps or HP increases.
  useEffect(() => {
    if (previousEnemyIdRef.current !== combat.enemy.enemyId) {
      previousEnemyIdRef.current = combat.enemy.enemyId;
      for (const timerId of enemyHpTickTimersRef.current) {
        window.clearTimeout(timerId);
      }
      enemyHpTickTimersRef.current = [];
      setVisualEnemyHp(combat.enemy.currentHp);
      return;
    }

    setVisualEnemyHp((current) =>
      combat.enemy.currentHp > current ? combat.enemy.currentHp : current,
    );
  }, [combat.enemy.currentHp, combat.enemy.enemyId]);

  // Replay each damage event so HP text/bar move per-hit instead of once per batch.
  useEffect(() => {
    if (combatEvents.length === 0) return;

    const hitDamages = combatEvents
      .filter((event) => event.type === "playerHit")
      .map((event) => Math.max(0, event.value ?? 0))
      .filter((value) => value > 0);
    if (hitDamages.length === 0) return;

    for (const timerId of enemyHpTickTimersRef.current) {
      window.clearTimeout(timerId);
    }
    enemyHpTickTimersRef.current = [];

    const maxHp = Math.max(1, combat.enemy.maxHp);
    const totalBatchDamage = hitDamages.reduce((sum, value) => sum + value, 0);
    let runningHp = Math.min(maxHp, combat.enemy.currentHp + totalBatchDamage);
    const intervalMs = Math.max(16, Math.round(1000 / hitDamages.length));

    hitDamages.forEach((damage, index) => {
      const timerId = window.setTimeout(() => {
        runningHp = Math.max(combat.enemy.currentHp, runningHp - damage);
        setVisualEnemyHp(runningHp);

        if (index === hitDamages.length - 1) {
          setVisualEnemyHp(combat.enemy.currentHp);
        }
      }, index * intervalMs);

      enemyHpTickTimersRef.current.push(timerId);
    });

    return () => {
      for (const timerId of enemyHpTickTimersRef.current) {
        window.clearTimeout(timerId);
      }
      enemyHpTickTimersRef.current = [];
    };
  }, [combat.enemy.currentHp, combat.enemy.maxHp, combatEvents]);

  useEffect(() => {
    if (combatEvents.length === 0) return;

    const hasPetHit = combatEvents.some(
      (event) => event.type === "playerHit" && event.attackSource === "pet",
    );
    if (!hasPetHit) return;

    setIsPetPulseActive(true);
    const timer = window.setTimeout(() => {
      setIsPetPulseActive(false);
    }, 260);

    return () => window.clearTimeout(timer);
  }, [combatEvents]);

  useEffect(() => {
    setEquippedConsumables((prev) => {
      const inventoryItemIds = new Set(
        state.inventory.map((item) => item.itemId),
      );
      const next: [string | null, string | null] = [
        prev[0] && inventoryItemIds.has(prev[0]) ? prev[0] : null,
        prev[1] && inventoryItemIds.has(prev[1]) ? prev[1] : null,
      ];
      if (next[0] === prev[0] && next[1] === prev[1]) return prev;
      return next;
    });
  }, [state.inventory]);

  const {
    currentDps,
    previousDps,
    currentAutoDps,
    currentClickDps,
    currentSpellDps,
    currentPetDps,
    dpsDelta,
    dpsDeltaPercent,
    dpsGraphPoints,
    yAxisTicks,
    maxDpsValue,
  } = useMemo(
    () => selectFightDpsMetrics(damageHistory, clockNow, dpsWindowMs),
    [clockNow, damageHistory, dpsWindowMs],
  );

  const spellPanel = useMemo(
    () => selectFightSpellPanel(state, slottedSpells),
    [state, slottedSpells],
  );

  const consumablesPanel = useMemo(
    () => selectFightConsumablesPanel(state, equippedConsumables),
    [state, equippedConsumables],
  );

  const consumableModal = useMemo(
    () =>
      selectFightConsumableModal(
        state,
        equippedConsumables,
        selectedConsumableSlot,
      ),
    [state, equippedConsumables, selectedConsumableSlot],
  );

  const dpsPanel = useMemo(
    () =>
      selectFightDpsPanel(
        {
          currentDps,
          previousDps,
          currentAutoDps,
          currentClickDps,
          currentSpellDps,
          currentPetDps,
          dpsDelta,
          dpsDeltaPercent,
          dpsGraphPoints,
          yAxisTicks,
          maxDpsValue,
        },
        dpsWindowMs,
        damageHistory.length > 0,
        isDpsExpanded,
      ),
    [
      currentAutoDps,
      currentClickDps,
      currentDps,
      currentPetDps,
      currentSpellDps,
      currentDps,
      previousDps,
      dpsDelta,
      dpsDeltaPercent,
      dpsGraphPoints,
      yAxisTicks,
      maxDpsValue,
      dpsWindowMs,
      damageHistory.length,
      isDpsExpanded,
    ],
  );

  const encounterSummary = useMemo(
    () => selectFightEncounterSummary(state),
    [state],
  );

  const combatLogPanel = useMemo(
    () => selectFightCombatLog(combatLog),
    [combatLog],
  );

  const handleOpenConsumableModal = (slotIndex?: 0 | 1) => {
    if (slotIndex !== undefined) {
      setSelectedConsumableSlot(slotIndex);
    }
    setIsConsumableModalOpen(true);
  };

  const handleClearSelectedConsumableSlot = () => {
    setEquippedConsumables((prev) => {
      const next: [string | null, string | null] = [...prev] as [
        string | null,
        string | null,
      ];
      next[selectedConsumableSlot] = null;
      return next;
    });
  };

  const handleEquipConsumable = (itemId: string) => {
    setEquippedConsumables((prev) => {
      const next: [string | null, string | null] = [...prev] as [
        string | null,
        string | null,
      ];
      const otherIndex = next.findIndex(
        (equippedId, index) =>
          equippedId === itemId && index !== selectedConsumableSlot,
      );
      if (otherIndex !== -1) {
        next[otherIndex as 0 | 1] = null;
      }
      next[selectedConsumableSlot] = itemId;
      return next;
    });
  };

  useEffect(() => {
    if (combatEvents.length === 0) return;

    const now = Date.now();
    const incoming = combatEvents
      .filter(
        (event) => event.type === "playerHit" || event.type === "enemyHit",
      )
      .map((event, index) => {
        const isMobileViewport = window.innerWidth <= 768;
        const damageText = formatCombatNumber(event.value ?? 0);
        if (event.type === "playerHit") {
          const isCrit = Boolean(event.isCrit);
          const isPetHit = event.attackSource === "pet";
          const baseFontSize = getDamageFontSize(
            event.value ?? 0,
            isMobileViewport,
            isCrit,
            PLAYER_DAMAGE_FONT_BRACKETS,
          );
          const fontSize = fitDamageTextSize(
            baseFontSize,
            damageText,
            isMobileViewport,
            DAMAGE_TEXT_FIT_CONFIG,
          );
          return {
            id: `${now}-p-${index}`,
            text: damageText,
            color: isPetHit ? "#ffb347" : isCrit ? "#ffffff" : "#47d16d",
            fontSize,
            top: 24 + Math.random() * 42,
            left: getDamagePopupLeftPercent("enemy"),
            anchor: "right",
          } as FloatingDamage;
        }

        const baseFontSize = getDamageFontSize(
          event.value ?? 0,
          isMobileViewport,
          false,
          ENEMY_DAMAGE_FONT_BRACKETS,
        );
        const fontSize = fitDamageTextSize(
          baseFontSize,
          damageText,
          isMobileViewport,
          DAMAGE_TEXT_FIT_CONFIG,
        );

        return {
          id: `${now}-e-${index}`,
          text: damageText,
          color: "#f45a5a",
          fontSize,
          top: 26 + Math.random() * 42,
          left: getDamagePopupLeftPercent("player"),
          anchor: "left",
        } as FloatingDamage;
      });

    if (incoming.length === 0) return;

    // Stagger hit popups based on attack speed so fast builds feel rapid,
    // but don't spawn all numbers in a single frame.
    const intervalMs = Math.max(
      70,
      Math.round(1000 / Math.max(1, attacksPerSecond)),
    );
    const lifespanMs = 650;
    const timers: number[] = [];

    incoming.forEach((entry, index) => {
      const startDelay = index * intervalMs;
      const spawnTimer = window.setTimeout(() => {
        setFloatingDamage((prev) => [...prev, entry]);
      }, startDelay);
      timers.push(spawnTimer);

      const cleanupTimer = window.setTimeout(() => {
        setFloatingDamage((prev) =>
          prev.filter((existing) => existing.id !== entry.id),
        );
      }, startDelay + lifespanMs);
      timers.push(cleanupTimer);
    });

    return () => {
      for (const timerId of timers) {
        window.clearTimeout(timerId);
      }
    };
  }, [attacksPerSecond, combatEvents]);

  useEffect(() => {
    if (combatEvents.length === 0) return;

    const now = Date.now();
    const entries = combatEvents
      .filter(
        (event) =>
          event.type === "enemyDefeated" ||
          event.type === "playerDefeated" ||
          event.type === "lootGranted" ||
          event.type === "levelUp" ||
          event.type === "systemUnlocked" ||
          event.type === "spellCast" ||
          event.type === "consumableUsed",
      )
      .map((event, index) => {
        if (event.type === "enemyDefeated") {
          return {
            id: `${now}-d-${index}`,
            text: `Defeated enemy at level ${Math.round(event.value ?? 0)}`,
            color: "#9ecbff",
          };
        }

        if (event.type === "playerDefeated") {
          return {
            id: `${now}-p-${index}`,
            text: "You were defeated and returned to your latest checkpoint",
            color: "#ff8d8d",
          };
        }

        if (event.type === "lootGranted") {
          if (event.itemId === "ruby_currency") {
            return {
              id: `${now}-l-${index}`,
              text: `RUBY DROP! +${event.quantity ?? 1} Ruby`,
              color: "#ff75d8",
            };
          }

          const itemName =
            getItemDefSafe(event.itemId ?? "")?.name ?? event.itemId;
          const itemLevelText =
            typeof event.itemLevel === "number" && event.itemLevel > 1
              ? ` Lv ${event.itemLevel}`
              : "";
          return {
            id: `${now}-l-${index}`,
            text: `Loot: ${itemName}${itemLevelText} x${event.quantity ?? 1}`,
            color: "#ffd670",
          };
        }

        if (event.type === "levelUp") {
          return {
            id: `${now}-u-${index}`,
            text: `Level Up! You are now level ${Math.round(event.value ?? 0)}`,
            color: "#74f5b3",
          };
        }

        if (event.type === "spellCast") {
          const spellName =
            getCombatSpellDefinition(event.spellId ?? "")?.name ??
            event.spellId;
          const petHits = combatEvents.filter(
            (hit) =>
              hit.type === "playerHit" &&
              hit.spellId === event.spellId &&
              hit.attackSource === "pet",
          ).length;
          const petTag =
            petHits > 0
              ? ` (${petHits} pet strike${petHits > 1 ? "s" : ""})`
              : "";
          return {
            id: `${now}-c-${index}`,
            text:
              event.spellId === "second_wind"
                ? `Cast ${spellName} and restored ${Math.round(event.value ?? 0)} HP`
                : `Cast ${spellName}${petTag}`,
            color: "#9fd2ff",
          };
        }

        if (event.type === "consumableUsed") {
          const itemName =
            getItemDefSafe(event.itemId ?? "")?.name ?? event.itemId;
          return {
            id: `${now}-cu-${index}`,
            text: `Used ${itemName}`,
            color: "#b9f7d8",
          };
        }

        return {
          id: `${now}-s-${index}`,
          text: `System unlocked: ${event.systemId}`,
          color: "#d6d0ff",
        };
      });

    if (entries.length === 0) return;

    setCombatLog((prev) => [...entries, ...prev].slice(0, 12));
  }, [combatEvents]);

  useEffect(() => {
    if (combatEvents.length === 0) return;

    const now = Date.now();
    const entries = combatEvents
      .filter(
        (event) =>
          event.type === "lootGranted" ||
          event.type === "levelUp" ||
          event.type === "systemUnlocked" ||
          event.type === "playerDefeated" ||
          event.type === "spellCast" ||
          event.type === "consumableUsed",
      )
      .map((event, index) => {
        if (event.type === "lootGranted") {
          if (event.itemId === "ruby_currency") {
            return {
              id: `${now}-toast-ruby-${index}`,
              text: `RUBY DROP! +${event.quantity ?? 1} Ruby`,
              color: "#ff75d8",
              isRubyDrop: true,
            } as CombatToast;
          }

          const itemName =
            getItemDefSafe(event.itemId ?? "")?.name ?? event.itemId;
          const itemLevelText =
            typeof event.itemLevel === "number" && event.itemLevel > 1
              ? ` Lv ${event.itemLevel}`
              : "";
          return {
            id: `${now}-toast-loot-${index}`,
            text: `Loot acquired: ${itemName}${itemLevelText} x${event.quantity ?? 1}`,
            color: "#ffd670",
          } as CombatToast;
        }

        if (event.type === "levelUp") {
          return {
            id: `${now}-toast-level-${index}`,
            text: `Level ${Math.round(event.value ?? 0)} reached`,
            color: "#7ff0c2",
          } as CombatToast;
        }

        if (event.type === "systemUnlocked") {
          return {
            id: `${now}-toast-unlock-${index}`,
            text: `Unlocked ${event.systemId}`,
            color: "#c9b7ff",
          } as CombatToast;
        }

        if (event.type === "spellCast") {
          const spellName =
            getCombatSpellDefinition(event.spellId ?? "")?.name ??
            event.spellId;
          return {
            id: `${now}-toast-spell-${index}`,
            text: `Cast ${spellName}`,
            color: "#9fd2ff",
          } as CombatToast;
        }

        if (event.type === "consumableUsed") {
          const itemName =
            getItemDefSafe(event.itemId ?? "")?.name ?? event.itemId;
          return {
            id: `${now}-toast-consumable-${index}`,
            text: `Used ${itemName}`,
            color: "#b9f7d8",
          } as CombatToast;
        }

        return {
          id: `${now}-toast-defeat-${index}`,
          text: "Defeat! Returned to your latest checkpoint",
          color: "#ff9999",
        } as CombatToast;
      });

    if (entries.length === 0) return;

    setToasts((prev) => [...entries, ...prev].slice(0, 4));
    const timer = window.setTimeout(() => {
      setToasts((prev) =>
        prev.filter(
          (existing) => !entries.some((entry) => entry.id === existing.id),
        ),
      );
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [combatEvents]);

  return (
    <div className="ui-fight-screen">
      {/* Player Header - Compact */}
      <div className="ui-fight-player-card">
        <div className="ui-fight-row ui-fight-row-with-bottom">
          <div>
            <div className="ui-fight-level-label">
              Level {state.playerProgress.level || 1}
            </div>
          </div>
          <button
            onClick={() => setIsPlayerStatsExpanded(!isPlayerStatsExpanded)}
            className="ui-fight-stats-toggle ui-touch-target"
          >
            {isPlayerStatsExpanded ? "Hide" : "Stats"}
          </button>
        </div>

        {/* HP Bar - Always Visible */}
        <div className="ui-fight-micro-label ui-fight-micro-label--below">
          HP: {Math.round(combat.playerCurrentHp)} / {playerMaxHp}
        </div>
        <div
          className="ui-fight-bar-shell ui-fight-player-hp-shell"
          style={{
            marginBottom: isPlayerStatsExpanded ? 10 : 0,
          }}
        >
          <div
            style={{
              width: `${playerHpPercent}%`,
              height: "100%",
              background:
                "linear-gradient(90deg, #3aa66b 0%, #57dc8c 65%, #a6ffd0 100%)",
              transition: "width 180ms linear",
            }}
          />
        </div>

        {/* XP Progress Bar - Always Visible */}
        <div className="ui-fight-micro-label ui-fight-micro-label--above">
          XP: {formatCompactNumber(state.playerProgress?.xp ?? 0)} /{" "}
          {Number.isFinite(xpForNextLevel)
            ? formatCompactNumber(xpForNextLevel)
            : "MAX"}
        </div>
        <div
          className="ui-fight-bar-shell ui-fight-player-xp-shell"
          style={{
            marginBottom: isPlayerStatsExpanded ? 10 : 0,
          }}
        >
          <div
            style={{
              width: `${xpProgressPercent}%`,
              height: "100%",
              background:
                "linear-gradient(90deg, #6d3fd3 0%, #9f62ff 65%, #cfb1ff 100%)",
              transition: "width 180ms linear",
            }}
          />
        </div>

        {/* Expandable Stats */}
        {isPlayerStatsExpanded && (
          <div className="ui-fight-expanded-grid">
            <div>ATK: {Math.round(totalStats.attack ?? 0)}</div>
            <div>DEF: {Math.round(totalStats.defense ?? 0)}</div>
            <div>AGI: {(totalStats.agility ?? 0).toFixed(2)}</div>
            <div>APS: {attacksPerSecond.toFixed(2)}</div>
            <div>Crit: {critChance.toFixed(1)}%</div>
            <div>Lvl: {combat.currentLevel}</div>
            <div className="ui-fight-grid-full-note">
              Mana: {formatCompactNumber(playerMana)} / 100 • Regen:{" "}
              {formatCompactNumber(manaRegenPerSecond, {
                smallValueDecimals: 1,
              })}
              /s
            </div>
            <div className="ui-fight-grid-full-note">
              Checkpoint: Lv {checkpointLevel}
            </div>
          </div>
        )}
      </div>

      {/* Fight Arena */}
      <div className="ui-fight-arena">
        <div className="ui-fight-arena-header">
          <h2 className="ui-fight-title">{combatTitle}</h2>
          <span
            className="ui-fight-kind-badge"
            style={{
              backgroundColor:
                combat.enemy.kind === "boss"
                  ? "rgba(235, 97, 79, 0.35)"
                  : "rgba(91, 144, 199, 0.28)",
            }}
          >
            {combat.enemy.kind === "boss" ? "Boss" : "Enemy"}
          </span>
        </div>

        <div className="ui-fight-enemy-hp">
          HP: {formatCombatNumber(Math.max(0, Math.round(visualEnemyHp)))} /{" "}
          {formatCombatNumber(combat.enemy.maxHp)}
        </div>
        <div className="ui-fight-enemy-hp-shell">
          <div
            style={{
              position: "absolute",
              left: 0,
              width: `${Math.max(
                0,
                Math.min(
                  100,
                  (visualEnemyHp / Math.max(1, combat.enemy.maxHp)) * 100,
                ),
              )}%`,
              height: "100%",
              background:
                "linear-gradient(90deg, #b83838 0%, #e65e5e 64%, #ffc4c4 100%)",
              transition: "width 36ms linear",
            }}
          />
        </div>

        <button
          onClick={combatClickAttack}
          className="ui-fight-attack-btn"
          style={{ overflow: "visible" }}
        >
          <div className="ui-fight-attack-top-labels">
            <span>Player</span>
            <span>Tap / Click To Strike</span>
            <span>Enemy</span>
          </div>

          <div className="ui-fight-sprite-row">
            <div className="ui-fight-sprite-stack">
              <img
                src={playerPixel}
                alt="Player pixel art"
                width={82}
                height={82}
                style={{
                  imageRendering: "pixelated",
                  filter: "drop-shadow(0 6px 4px rgba(0,0,0,0.45))",
                }}
              />
              {activeClassId === "tamer" && (
                <img
                  src={petCompanionPixel}
                  alt="Pet companion pixel art"
                  width={46}
                  height={46}
                  style={{
                    marginTop: -10,
                    imageRendering: "pixelated",
                    transform: isPetPulseActive ? "scale(1.12)" : "scale(1)",
                    transition: "transform 120ms ease-out",
                    filter: isPetPulseActive
                      ? "drop-shadow(0 0 8px rgba(255, 179, 71, 0.85))"
                      : "drop-shadow(0 4px 3px rgba(0,0,0,0.45))",
                  }}
                />
              )}
            </div>

            <div className="ui-fight-sprite-stack">
              <img
                src={enemySprite}
                alt={enemyAlt}
                width={82}
                height={82}
                style={{
                  imageRendering: "pixelated",
                  filter:
                    combat.enemy.kind === "boss"
                      ? "drop-shadow(0 0 8px rgba(246, 176, 82, 0.6)) drop-shadow(0 8px 5px rgba(0,0,0,0.55))"
                      : "drop-shadow(0 6px 4px rgba(0,0,0,0.5))",
                }}
              />
            </div>
          </div>

          {floatingDamage.map((entry) => (
            <span
              key={entry.id}
              style={{
                position: "absolute",
                top: `${entry.top}%`,
                left: `${entry.left}%`,
                transform:
                  entry.anchor === "right"
                    ? "translate(-100%, -50%)"
                    : entry.anchor === "left"
                      ? "translate(0, -50%)"
                      : "translate(-50%, -50%)",
                color: entry.color,
                fontSize: entry.fontSize,
                fontWeight: 800,
                textShadow: "0 2px 6px rgba(0,0,0,0.55)",
                pointerEvents: "none",
                whiteSpace: "nowrap",
                overflow: "visible",
                textAlign:
                  entry.anchor === "right"
                    ? "right"
                    : entry.anchor === "left"
                      ? "left"
                      : "center",
                animation: "fightFloatUp 650ms ease-out forwards",
              }}
            >
              {entry.text}
            </span>
          ))}
        </button>
      </div>

      <FightConsumablesPanel
        panel={consumablesPanel}
        onOpenModal={() => handleOpenConsumableModal()}
        onOpenSlot={handleOpenConsumableModal}
        onUseConsumable={combatUseConsumable}
      />

      <FightSpellsPanel
        isVisible={spellPanel.isVisible}
        classLabel={spellPanel.classLabel}
        showManageButton={spellPanel.showManageButton}
        unlockedSpellSlots={spellPanel.unlockedSpellSlots}
        maxSpellSlots={spellPanel.maxSpellSlots}
        emptyMessage={spellPanel.emptyMessage}
        spellActions={spellPanel.spellActions}
        spellPath={spellPanel.spellPath}
        onOpenManageSpells={() => setIsSpellSelectOpen(true)}
        onCastSpell={combatCastSpell}
      />

      <FightConsumableModal
        isOpen={isConsumableModalOpen}
        modal={consumableModal}
        onClose={() => setIsConsumableModalOpen(false)}
        onSelectSlot={setSelectedConsumableSlot}
        onClearSelectedSlot={handleClearSelectedConsumableSlot}
        onEquipConsumable={handleEquipConsumable}
      />

      {toasts.length > 0 && (
        <div className="ui-fight-toast-stack">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="ui-fight-toast"
              style={{
                color: toast.color,
                border: toast.isRubyDrop
                  ? "1px solid rgba(255, 117, 216, 0.85)"
                  : undefined,
                boxShadow: toast.isRubyDrop
                  ? "0 0 16px rgba(255, 117, 216, 0.45)"
                  : undefined,
                animation: toast.isRubyDrop
                  ? "fightRubyDropPulse 950ms ease-in-out 2"
                  : undefined,
              }}
            >
              {toast.text}
            </div>
          ))}
        </div>
      )}

      <FightEncounterSummaryPanel summary={encounterSummary} />

      <FightDpsPanel
        panel={dpsPanel}
        metrics={{
          currentDps,
          previousDps,
          currentAutoDps,
          currentClickDps,
          currentSpellDps,
          currentPetDps,
          dpsDelta,
          dpsDeltaPercent,
          dpsGraphPoints,
          yAxisTicks,
          maxDpsValue,
        }}
        isExpanded={isDpsExpanded}
        onToggleExpanded={() => setIsDpsExpanded((value) => !value)}
        onSelectWindow={setDpsWindowMs}
        isUnlocked={state.playerProgress.unlockedSystems?.dpsMeter ?? false}
      />

      <FightCombatLogPanel log={combatLogPanel} />

      <style>
        {`@keyframes fightFloatUp {
          0% { opacity: 0; transform: translate(-50%, -10%); }
          15% { opacity: 1; transform: translate(-50%, -50%); }
          100% { opacity: 0; transform: translate(-50%, -120%); }
        }

        @keyframes fightToastIn {
          0% { opacity: 0; transform: translateY(10px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes fightRubyDropPulse {
          0% { transform: translateY(0) scale(1); filter: brightness(1); }
          40% { transform: translateY(0) scale(1.03); filter: brightness(1.35); }
          100% { transform: translateY(0) scale(1); filter: brightness(1); }
        }`}
      </style>

      <SpellSelectModal
        isOpen={isSpellSelectOpen}
        onClose={() => setIsSpellSelectOpen(false)}
      />
    </div>
  );
}
