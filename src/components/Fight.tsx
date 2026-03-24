import { useEffect, useMemo, useState } from "react";
import {
  COMBAT_SPELL_DEFINITIONS,
  getPlayerAttacksPerSecond,
  getPlayerCritChance,
} from "../game/combat";
import { getTotalStats } from "../game/engine";
import { getItemDefSafe } from "../game/items";
import { getXpForNextLevel } from "../game/progression";
import { useGame } from "../game/GameContext";
import { formatCompactNumber } from "../game/numberFormat";
import playerPixel from "../assets/player-pixel.svg";
import enemyPixel from "../assets/enemy-pixel.svg";
import enemyBossPixel from "../assets/enemy-boss-pixel.svg";

interface FloatingDamage {
  id: string;
  text: string;
  color: string;
  fontSize: number;
  top: number;
  left: number;
}

interface CombatLogEntry {
  id: string;
  text: string;
  color: string;
}

interface CombatToast {
  id: string;
  text: string;
  color: string;
}

interface DamagePoint {
  timestamp: number;
  damage: number;
  source: "auto" | "click" | "spell";
}

interface ConsumableSummary {
  itemId: string;
  itemUid: string;
  name: string;
  quantity: number;
  rarity: string;
}

function nextBossLevel(currentLevel: number): number {
  return Math.ceil(currentLevel / 5) * 5;
}

function getRarityTint(rarity: string): string {
  if (rarity === "unique") return "#ff9ad9";
  if (rarity === "legendary") return "#ffd36f";
  if (rarity === "epic") return "#8bc7ff";
  if (rarity === "rare") return "#7cf0c4";
  return "#d8e2ee";
}

function formatRemainingMs(remainingMs: number): string {
  const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(seconds / 60);
  const leftoverSeconds = seconds % 60;
  if (minutes <= 0) return `${leftoverSeconds}s`;
  return `${minutes}m ${leftoverSeconds}s`;
}

function getPotionIcon(itemId: string): string {
  if (itemId === "health_potion") return "🧪";
  if (itemId === "mana_potion") return "🔷";
  if (itemId === "elixir") return "✨";
  if (itemId === "immortal_brew") return "☀️";
  if (itemId === "swift_tonic") return "⚡";
  if (itemId === "fortitude_brew") return "🛡️";
  if (itemId === "scholars_draught") return "📘";
  if (itemId === "berserkers_tonic") return "🔥";
  if (itemId === "chaos_potion") return "🌌";
  return "🧴";
}

export function Fight() {
  const {
    state,
    combatEvents,
    performCombatClickAttack,
    useCombatConsumable,
    castCombatSpell,
  } = useGame();
  const [floatingDamage, setFloatingDamage] = useState<FloatingDamage[]>([]);
  const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([]);
  const [toasts, setToasts] = useState<CombatToast[]>([]);
  const [damageHistory, setDamageHistory] = useState<DamagePoint[]>([]);
  const [dpsWindowMs, setDpsWindowMs] = useState<number>(30_000);
  const [isDpsExpanded, setIsDpsExpanded] = useState(false);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [isPlayerStatsExpanded, setIsPlayerStatsExpanded] = useState(false);
  const [equippedConsumables, setEquippedConsumables] = useState<
    [string | null, string | null]
  >([null, null]);
  const [isConsumableModalOpen, setIsConsumableModalOpen] = useState(false);
  const [selectedConsumableSlot, setSelectedConsumableSlot] = useState<0 | 1>(
    0,
  );

  const combat = state.combat;
  const totalStats = getTotalStats(state);
  const playerMaxHp = Math.max(
    1,
    Math.round(totalStats.hp ?? state.stats.hp ?? 1),
  );
  const playerHpPercent = Math.max(
    0,
    Math.min(100, (combat.playerCurrentHp / playerMaxHp) * 100),
  );
  const playerMana = Math.max(0, Math.min(100, state.resources.energy ?? 100));
  const enemyHpPercent = Math.max(
    0,
    Math.min(
      100,
      (combat.enemy.currentHp / Math.max(1, combat.enemy.maxHp)) * 100,
    ),
  );

  const attacksPerSecond = getPlayerAttacksPerSecond(state);
  const critChance = getPlayerCritChance(state);
  const xpForNextLevel = getXpForNextLevel(state.playerProgress.level || 1);
  const xpProgressPercent =
    Number.isFinite(xpForNextLevel) && xpForNextLevel > 0
      ? Math.max(
          0,
          Math.min(
            100,
            ((state.playerProgress?.xp ?? 0) / xpForNextLevel) * 100,
          ),
        )
      : 100;

  const combatTitle = useMemo(
    () => `${combat.enemy.name} (Lv ${combat.enemy.level})`,
    [combat.enemy.level, combat.enemy.name],
  );
  const enemySprite =
    combat.enemy.kind === "boss" ? enemyBossPixel : enemyPixel;
  const enemyAlt =
    combat.enemy.kind === "boss" ? "Boss enemy pixel art" : "Enemy pixel art";
  const spellCooldowns = combat.spellCooldowns ?? {};
  const consumableCooldowns = combat.consumableCooldowns ?? {};
  const potionSummaries = useMemo(() => {
    const grouped = new Map<string, ConsumableSummary>();

    for (const item of state.inventory) {
      const itemDef = getItemDefSafe(item.itemId);
      if (!itemDef || itemDef.type !== "potion") continue;

      const existing = grouped.get(item.itemId);
      if (existing) {
        existing.quantity += item.quantity ?? 1;
        continue;
      }

      grouped.set(item.itemId, {
        itemId: item.itemId,
        itemUid: item.uid,
        name: itemDef.name,
        quantity: item.quantity ?? 1,
        rarity: itemDef.rarity,
      });
    }

    return Array.from(grouped.values()).sort((left, right) =>
      left.name.localeCompare(right.name),
    );
  }, [state.inventory]);

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
        source: event.attackSource ?? "auto",
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

  const dpsBuckets = useMemo(() => {
    const bucketCount = 12;
    const bucketWidthMs = dpsWindowMs / bucketCount;
    const start = clockNow - dpsWindowMs;
    const values = Array.from({ length: bucketCount }, () => 0);

    for (const point of damageHistory) {
      if (point.timestamp < start || point.timestamp > clockNow) continue;
      const offset = point.timestamp - start;
      const index = Math.min(
        bucketCount - 1,
        Math.max(0, Math.floor(offset / bucketWidthMs)),
      );
      values[index] += point.damage;
    }

    return values.map((value) => value / (bucketWidthMs / 1000));
  }, [clockNow, damageHistory, dpsWindowMs]);

  const currentDps = useMemo(() => {
    const windowStart = clockNow - dpsWindowMs;
    const totalDamage = damageHistory.reduce((sum, point) => {
      return point.timestamp >= windowStart ? sum + point.damage : sum;
    }, 0);
    return totalDamage / Math.max(1, dpsWindowMs / 1000);
  }, [clockNow, damageHistory, dpsWindowMs]);

  const getSourceDps = (
    source: DamagePoint["source"],
    start: number,
    end: number,
  ) => {
    const totalDamage = damageHistory.reduce((sum, point) => {
      return point.source === source &&
        point.timestamp >= start &&
        point.timestamp < end
        ? sum + point.damage
        : sum;
    }, 0);
    return totalDamage / Math.max(1, (end - start) / 1000);
  };

  const previousDps = useMemo(() => {
    const previousStart = clockNow - dpsWindowMs * 2;
    const previousEnd = clockNow - dpsWindowMs;
    const totalDamage = damageHistory.reduce((sum, point) => {
      return point.timestamp >= previousStart && point.timestamp < previousEnd
        ? sum + point.damage
        : sum;
    }, 0);
    return totalDamage / Math.max(1, dpsWindowMs / 1000);
  }, [clockNow, damageHistory, dpsWindowMs]);
  const currentAutoDps = useMemo(
    () => getSourceDps("auto", clockNow - dpsWindowMs, clockNow),
    [clockNow, damageHistory, dpsWindowMs],
  );
  const currentClickDps = useMemo(
    () => getSourceDps("click", clockNow - dpsWindowMs, clockNow),
    [clockNow, damageHistory, dpsWindowMs],
  );
  const currentSpellDps = useMemo(
    () => getSourceDps("spell", clockNow - dpsWindowMs, clockNow),
    [clockNow, damageHistory, dpsWindowMs],
  );

  const dpsDelta = currentDps - previousDps;
  const dpsDeltaPercent =
    previousDps > 0 ? (dpsDelta / previousDps) * 100 : currentDps > 0 ? 100 : 0;
  const dpsGraphPoints = useMemo(() => {
    const maxValue = Math.max(1, ...dpsBuckets);
    return dpsBuckets
      .map((value, index) => {
        const x = (index / Math.max(1, dpsBuckets.length - 1)) * 100;
        const y = 100 - (value / maxValue) * 100;
        return `${x},${y}`;
      })
      .join(" ");
  }, [dpsBuckets]);

  useEffect(() => {
    if (combatEvents.length === 0) return;

    const now = Date.now();
    const incoming = combatEvents
      .filter(
        (event) => event.type === "playerHit" || event.type === "enemyHit",
      )
      .map((event, index) => {
        if (event.type === "playerHit") {
          const isCrit = Boolean(event.isCrit);
          return {
            id: `${now}-p-${index}`,
            text: `${Math.round(event.value ?? 0)}`,
            color: isCrit ? "#ffffff" : "#47d16d",
            fontSize: isCrit ? 50 : 21,
            top: 24 + Math.random() * 42,
            left: 70 + Math.random() * 20,
          } as FloatingDamage;
        }

        return {
          id: `${now}-e-${index}`,
          text: `${Math.round(event.value ?? 0)}`,
          color: "#f45a5a",
          fontSize: 24,
          top: 26 + Math.random() * 42,
          left: 10 + Math.random() * 20,
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
            COMBAT_SPELL_DEFINITIONS.find((spell) => spell.id === event.spellId)
              ?.name ?? event.spellId;
          return {
            id: `${now}-c-${index}`,
            text:
              event.spellId === "second_wind"
                ? `Cast ${spellName} and restored ${Math.round(event.value ?? 0)} HP`
                : `Cast ${spellName}`,
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
            COMBAT_SPELL_DEFINITIONS.find((spell) => spell.id === event.spellId)
              ?.name ?? event.spellId;
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
    <div style={{ padding: 16, color: "#e8f0f8" }}>
      {/* Player Header - Compact */}
      <div
        style={{
          borderRadius: 12,
          border: "1px solid #30465b",
          background: "linear-gradient(150deg, #15202b 0%, #263748 100%)",
          padding: 12,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
            gap: 10,
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>
              Level {state.playerProgress.level || 1}
            </div>
          </div>
          <button
            onClick={() => setIsPlayerStatsExpanded(!isPlayerStatsExpanded)}
            style={{
              padding: "4px 12px",
              fontSize: 12,
              borderRadius: 6,
              border: "1px solid rgba(130, 167, 201, 0.35)",
              background: "rgba(20, 35, 50, 0.7)",
              color: "#a8c8ff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {isPlayerStatsExpanded ? "Hide" : "Stats"}
          </button>
        </div>

        {/* HP Bar - Always Visible */}
        <div style={{ fontSize: 11, marginBottom: 4, opacity: 0.85 }}>
          HP: {Math.round(combat.playerCurrentHp)} / {playerMaxHp}
        </div>
        <div
          style={{
            height: 12,
            borderRadius: 999,
            backgroundColor: "rgba(8, 13, 19, 0.6)",
            overflow: "hidden",
            border: "1px solid rgba(130, 167, 201, 0.3)",
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
        <div
          style={{ fontSize: 11, marginTop: 8, marginBottom: 4, opacity: 0.85 }}
        >
          XP: {formatCompactNumber(state.playerProgress?.xp ?? 0)} /{" "}
          {Number.isFinite(xpForNextLevel)
            ? formatCompactNumber(xpForNextLevel)
            : "MAX"}
        </div>
        <div
          style={{
            height: 10,
            borderRadius: 999,
            backgroundColor: "rgba(8, 13, 19, 0.6)",
            overflow: "hidden",
            border: "1px solid rgba(167, 130, 201, 0.35)",
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
          <div
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: "1px solid rgba(109, 144, 173, 0.2)",
              fontSize: 12,
              opacity: 0.92,
              lineHeight: 1.6,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px 12px",
            }}
          >
            <div>ATK: {Math.round(totalStats.attack ?? 0)}</div>
            <div>DEF: {Math.round(totalStats.defense ?? 0)}</div>
            <div>AGI: {(totalStats.agility ?? 0).toFixed(2)}</div>
            <div>APS: {attacksPerSecond.toFixed(2)}</div>
            <div>Crit: {critChance.toFixed(1)}%</div>
            <div>Lvl: {combat.currentLevel}</div>
            <div style={{ gridColumn: "1 / -1", fontSize: 11 }}>
              Mana: {formatCompactNumber(playerMana)} / 100 • Regen:{" "}
              {formatCompactNumber(
                2 * (1 + (totalStats.energyRegeneration ?? 0) / 100),
                { smallValueDecimals: 1 },
              )}
              /s
            </div>
            <div style={{ gridColumn: "1 / -1", fontSize: 11 }}>
              Checkpoint: Lv {Math.max(1, combat.lastBossCheckpointLevel || 1)}
            </div>
          </div>
        )}
      </div>

      {/* Fight Arena */}
      <div
        style={{
          borderRadius: 14,
          border: "1px solid #32485d",
          background:
            "radial-gradient(circle at 50% 18%, rgba(64, 98, 130, 0.4) 0%, rgba(22, 31, 41, 0.95) 55%)",
          padding: 16,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 10,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18 }}>{combatTitle}</h2>
          <span
            style={{
              fontSize: 12,
              padding: "3px 10px",
              borderRadius: 999,
              backgroundColor:
                combat.enemy.kind === "boss"
                  ? "rgba(235, 97, 79, 0.35)"
                  : "rgba(91, 144, 199, 0.28)",
            }}
          >
            {combat.enemy.kind === "boss" ? "Boss" : "Enemy"}
          </span>
        </div>

        <div style={{ fontSize: 13, marginBottom: 6 }}>
          HP: {Math.round(combat.enemy.currentHp)} /{" "}
          {Math.round(combat.enemy.maxHp)}
        </div>
        <div
          style={{
            height: 10,
            borderRadius: 999,
            backgroundColor: "rgba(10, 15, 20, 0.62)",
            overflow: "hidden",
            border: "1px solid rgba(155, 130, 130, 0.34)",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              width: `${enemyHpPercent}%`,
              height: "100%",
              background:
                "linear-gradient(90deg, #b83838 0%, #e65e5e 64%, #ffc4c4 100%)",
              transition: "width 140ms linear",
            }}
          />
        </div>

        <button
          onClick={performCombatClickAttack}
          style={{
            width: "100%",
            minHeight: 180,
            borderRadius: 12,
            border: "1px solid #46617a",
            background:
              "linear-gradient(180deg, rgba(46, 67, 86, 0.85) 0%, rgba(27, 41, 53, 0.9) 100%)",
            color: "#f3f8ff",
            fontSize: 16,
            fontWeight: 600,
            position: "relative",
            overflow: "hidden",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 10,
              left: 14,
              right: 14,
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              opacity: 0.92,
              letterSpacing: 0.2,
            }}
          >
            <span>Player</span>
            <span>Tap / Click To Strike</span>
            <span>Enemy</span>
          </div>

          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              gap: 38,
              alignItems: "flex-end",
              padding: "0 10px",
              pointerEvents: "none",
            }}
          >
            <div style={{ display: "grid", justifyItems: "center", gap: 4 }}>
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
            </div>

            <div style={{ display: "grid", justifyItems: "center", gap: 4 }}>
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
                transform: "translate(-50%, -50%)",
                color: entry.color,
                fontSize: entry.fontSize,
                fontWeight: 800,
                textShadow: "0 2px 6px rgba(0,0,0,0.55)",
                pointerEvents: "none",
                animation: "fightFloatUp 650ms ease-out forwards",
              }}
            >
              {entry.text}
            </span>
          ))}
        </button>
      </div>

      {/* Consumables - Right Above Spells */}
      <div
        style={{
          marginBottom: 14,
          borderRadius: 12,
          border: "1px solid #30465b",
          background: "linear-gradient(150deg, #162433 0%, #1f3248 100%)",
          padding: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
            marginBottom: 8,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 13 }}>🧴 Potions</div>
          <button
            onClick={() => setIsConsumableModalOpen(true)}
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
            Select
          </button>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          {[0, 1].map((slotIndex) => {
            const selectedItemId = equippedConsumables[slotIndex];
            const itemSummary = selectedItemId
              ? (potionSummaries.find((p) => p.itemId === selectedItemId) ??
                null)
              : null;
            const itemDef = itemSummary
              ? getItemDefSafe(itemSummary.itemId)
              : null;
            const cooldownMs = selectedItemId
              ? (consumableCooldowns[selectedItemId] ?? 0)
              : 0;
            const isOnCooldown = cooldownMs > 0;

            return (
              <div
                key={`potion-slot-${slotIndex}`}
                style={{
                  borderRadius: 8,
                  border: "1px solid rgba(109, 144, 173, 0.3)",
                  background: "rgba(13, 23, 34, 0.55)",
                  padding: 8,
                  display: "grid",
                  justifyItems: "center",
                  gap: 4,
                }}
              >
                <button
                  onClick={() => {
                    if (!selectedItemId) {
                      setSelectedConsumableSlot(slotIndex as 0 | 1);
                      setIsConsumableModalOpen(true);
                      return;
                    }
                    if (!isOnCooldown) {
                      const potionInstance = state.inventory.find(
                        (inv) =>
                          inv.itemId === selectedItemId &&
                          (inv.quantity ?? 0) > 0,
                      );
                      if (potionInstance) {
                        useCombatConsumable(potionInstance.uid);
                      }
                    }
                  }}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    setSelectedConsumableSlot(slotIndex as 0 | 1);
                    setIsConsumableModalOpen(true);
                  }}
                  disabled={isOnCooldown}
                  title={
                    itemDef
                      ? `${itemDef.name}${isOnCooldown ? ` (${formatRemainingMs(cooldownMs)})` : ""}`
                      : `Select potion for slot ${slotIndex + 1}`
                  }
                  style={{
                    width: 36,
                    height: 36,
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    lineHeight: 1,
                    borderRadius: 8,
                    border: `1px solid ${itemDef ? getRarityTint(itemDef.rarity) : "rgba(120,140,160,0.35)"}`,
                    background: isOnCooldown
                      ? "rgba(90, 90, 90, 0.45)"
                      : "rgba(22, 35, 50, 0.92)",
                    color: isOnCooldown ? "#8e8e8e" : "#f2f8ff",
                    cursor: isOnCooldown ? "not-allowed" : "pointer",
                    opacity: !selectedItemId ? 0.6 : 1,
                  }}
                >
                  <span
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      lineHeight: 1,
                    }}
                  >
                    {itemDef ? getPotionIcon(itemDef.id) : "+"}
                  </span>
                </button>

                <div style={{ fontSize: 10, opacity: 0.72 }}>
                  {itemSummary ? `x${itemSummary.quantity}` : "Empty"}
                </div>
                {isOnCooldown && (
                  <div style={{ fontSize: 10, color: "#f2a59f" }}>
                    {formatRemainingMs(cooldownMs)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Spells - Below Fight UI */}
      {state.playerProgress.unlockedSystems?.spells && (
        <div
          style={{
            marginBottom: 14,
            borderRadius: 12,
            border: "1px solid #30465b",
            background: "linear-gradient(150deg, #1c2233 0%, #2a3048 100%)",
            padding: 12,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
            ⚡ Spells
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {COMBAT_SPELL_DEFINITIONS.map((spell) => {
              const cooldownMs = spellCooldowns[spell.id] ?? 0;
              const canCast =
                cooldownMs <= 0 && (playerMana ?? 0) >= spell.manaCost;
              return (
                <button
                  key={spell.id}
                  onClick={() => castCombatSpell(spell.id)}
                  disabled={!canCast}
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
                    color: canCast ? "#f3f8ff" : "#666",
                    cursor: canCast ? "pointer" : "not-allowed",
                    opacity: canCast ? 1 : 0.6,
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
                    <div
                      style={{ fontSize: 10, opacity: 0.75, lineHeight: 1.4 }}
                    >
                      {spell.description}
                    </div>
                    <div style={{ fontSize: 10, opacity: 0.6, marginTop: 3 }}>
                      Mana {spell.manaCost} •{" "}
                      {cooldownMs > 0
                        ? `Cooldown ${formatRemainingMs(cooldownMs)}`
                        : "Ready"}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700 }}>Cast</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isConsumableModalOpen && (
        <div
          onClick={() => setIsConsumableModalOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            background: "rgba(6, 10, 16, 0.72)",
            display: "grid",
            placeItems: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(460px, 100%)",
              maxHeight: "80vh",
              overflowY: "auto",
              borderRadius: 12,
              border: "1px solid #3b5670",
              background: "linear-gradient(170deg, #111b27 0%, #1b2b3c 100%)",
              padding: 12,
              boxShadow: "0 16px 44px rgba(0, 0, 0, 0.45)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                marginBottom: 10,
              }}
            >
              <div style={{ fontWeight: 700 }}>Select Slot Potions</div>
              <button
                onClick={() => setIsConsumableModalOpen(false)}
                style={{
                  borderRadius: 6,
                  border: "1px solid rgba(130, 170, 204, 0.4)",
                  background: "rgba(20, 35, 50, 0.65)",
                  color: "#d8ecff",
                  padding: "4px 8px",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {[0, 1].map((slot) => (
                <button
                  key={`modal-slot-${slot}`}
                  onClick={() => setSelectedConsumableSlot(slot as 0 | 1)}
                  style={{
                    borderRadius: 8,
                    border:
                      selectedConsumableSlot === slot
                        ? "1px solid #9ad0ff"
                        : "1px solid rgba(125, 153, 179, 0.4)",
                    background:
                      selectedConsumableSlot === slot
                        ? "rgba(72, 120, 168, 0.4)"
                        : "rgba(16, 28, 40, 0.7)",
                    color: "#e2f2ff",
                    padding: "6px 10px",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Slot {slot + 1}
                </button>
              ))}
              <button
                onClick={() => {
                  setEquippedConsumables((prev) => {
                    const next: [string | null, string | null] = [...prev] as [
                      string | null,
                      string | null,
                    ];
                    next[selectedConsumableSlot] = null;
                    return next;
                  });
                }}
                style={{
                  marginLeft: "auto",
                  borderRadius: 8,
                  border: "1px solid rgba(207, 126, 126, 0.45)",
                  background: "rgba(58, 18, 18, 0.55)",
                  color: "#ffc7c7",
                  padding: "6px 10px",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Clear Slot
              </button>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {potionSummaries.length === 0 && (
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  No potions in inventory.
                </div>
              )}
              {potionSummaries.map((potion) => {
                const alreadyEquippedInOtherSlot = equippedConsumables.some(
                  (itemId, idx) =>
                    itemId === potion.itemId && idx !== selectedConsumableSlot,
                );

                return (
                  <button
                    key={potion.itemId}
                    onClick={() => {
                      setEquippedConsumables((prev) => {
                        const next: [string | null, string | null] = [
                          ...prev,
                        ] as [string | null, string | null];
                        if (alreadyEquippedInOtherSlot) {
                          const otherIndex = next.findIndex(
                            (itemId, idx) =>
                              itemId === potion.itemId &&
                              idx !== selectedConsumableSlot,
                          );
                          if (otherIndex !== -1)
                            next[otherIndex as 0 | 1] = null;
                        }
                        next[selectedConsumableSlot] = potion.itemId;
                        return next;
                      });
                    }}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto 1fr auto",
                      gap: 10,
                      alignItems: "center",
                      borderRadius: 8,
                      border: "1px solid rgba(124, 156, 183, 0.35)",
                      background: "rgba(16, 28, 40, 0.7)",
                      padding: "8px 10px",
                      color: "#ecf7ff",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ fontSize: 18 }}>
                      {getPotionIcon(potion.itemId)}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: getRarityTint(potion.rarity),
                      }}
                    >
                      {potion.name}
                    </span>
                    <span style={{ fontSize: 11, opacity: 0.75 }}>
                      x{potion.quantity}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {toasts.length > 0 && (
        <div
          style={{
            position: "fixed",
            right: 18,
            bottom: 20,
            display: "grid",
            gap: 8,
            zIndex: 30,
            width: "min(320px, calc(100vw - 36px))",
          }}
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              style={{
                borderRadius: 10,
                border: "1px solid rgba(137, 172, 206, 0.45)",
                background:
                  "linear-gradient(150deg, rgba(12,22,31,0.93) 0%, rgba(22,37,52,0.9) 100%)",
                color: toast.color,
                padding: "8px 10px",
                fontSize: 12,
                fontWeight: 700,
                boxShadow: "0 8px 28px rgba(0,0,0,0.38)",
                animation: "fightToastIn 220ms ease-out",
              }}
            >
              {toast.text}
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          borderRadius: 12,
          border: "1px solid #30465b",
          background: "linear-gradient(160deg, #18242f 0%, #223648 100%)",
          padding: 12,
          fontSize: 12,
          lineHeight: 1.55,
          opacity: 0.95,
        }}
      >
        <div style={{ marginBottom: 4 }}>
          Level {combat.currentLevel} • Highest {combat.highestLevelReached} •
          Next boss Lv {nextBossLevel(combat.currentLevel)}
        </div>
        <div>
          Enemy rewards: +{combat.enemy.goldReward} Gold, +
          {combat.enemy.gemsReward} Gems, +{combat.enemy.xpReward} XP
        </div>
      </div>

      <div
        style={{
          marginTop: 12,
          borderRadius: 12,
          border: "1px solid #30465b",
          background: "linear-gradient(160deg, #121c26 0%, #1e3141 100%)",
          padding: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>DPS Meter</div>
            <div style={{ fontSize: 12, opacity: 0.76 }}>
              {formatCompactNumber(currentDps)} DPS over the last{" "}
              {dpsWindowMs / 1000}s
            </div>
          </div>
          <button onClick={() => setIsDpsExpanded((value) => !value)}>
            {isDpsExpanded ? "Hide Graph" : "Show Graph"}
          </button>
        </div>

        <div
          style={{
            marginTop: 10,
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
            flexWrap: "wrap",
            fontSize: 12,
          }}
        >
          <div>
            Current: <strong>{formatCompactNumber(currentDps)}</strong>
          </div>
          <div>
            Previous: <strong>{formatCompactNumber(previousDps)}</strong>
          </div>
          <div style={{ color: dpsDelta >= 0 ? "#74f5b3" : "#ff9d9d" }}>
            {dpsDelta >= 0 ? "+" : ""}
            {formatCompactNumber(dpsDelta)} DPS ({dpsDelta >= 0 ? "+" : ""}
            {dpsDeltaPercent.toFixed(1)}%)
          </div>
        </div>

        <div
          style={{
            marginTop: 8,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 8,
            fontSize: 12,
          }}
        >
          <div>
            Auto DPS: <strong>{formatCompactNumber(currentAutoDps)}</strong>
          </div>
          <div>
            Click DPS: <strong>{formatCompactNumber(currentClickDps)}</strong>
          </div>
          <div>
            Spell DPS: <strong>{formatCompactNumber(currentSpellDps)}</strong>
          </div>
        </div>

        {isDpsExpanded && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {[10_000, 30_000, 60_000].map((windowMs) => (
                <button
                  key={windowMs}
                  className={dpsWindowMs === windowMs ? "btn-selected" : ""}
                  onClick={() => setDpsWindowMs(windowMs)}
                >
                  {windowMs / 1000}s
                </button>
              ))}
            </div>

            {damageHistory.length === 0 ? (
              <div style={{ fontSize: 12, opacity: 0.72 }}>
                No damage recorded yet. Start attacking to populate the meter.
              </div>
            ) : (
              <div
                style={{
                  borderRadius: 10,
                  border: "1px solid rgba(109, 144, 173, 0.3)",
                  background: "rgba(8, 14, 20, 0.45)",
                  padding: 10,
                }}
              >
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  style={{ width: "100%", height: 140, display: "block" }}
                >
                  <defs>
                    <linearGradient
                      id="fightDpsFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="rgba(86, 224, 153, 0.7)" />
                      <stop
                        offset="100%"
                        stopColor="rgba(86, 224, 153, 0.05)"
                      />
                    </linearGradient>
                  </defs>
                  <polyline
                    fill="none"
                    stroke="rgba(120, 208, 255, 0.25)"
                    strokeWidth="0.8"
                    points="0,100 100,100"
                  />
                  <polygon
                    fill="url(#fightDpsFill)"
                    points={`0,100 ${dpsGraphPoints} 100,100`}
                  />
                  <polyline
                    fill="none"
                    stroke="#72f2a4"
                    strokeWidth="1.8"
                    points={dpsGraphPoints}
                  />
                </svg>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 11,
                    opacity: 0.7,
                    marginTop: 6,
                  }}
                >
                  <span>{dpsWindowMs / 1000}s ago</span>
                  <span>now</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 12,
          borderRadius: 12,
          border: "1px solid #30465b",
          background: "linear-gradient(160deg, #131f29 0%, #1d2f3f 100%)",
          padding: 12,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
          Combat Log
        </div>
        {combatLog.length === 0 ? (
          <div style={{ fontSize: 12, opacity: 0.72 }}>
            Defeat enemies to generate loot and progression events.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 6,
              maxHeight: 220,
              overflowY: "auto",
            }}
          >
            {combatLog.map((entry) => (
              <div
                key={entry.id}
                style={{
                  fontSize: 12,
                  color: entry.color,
                  border: "1px solid rgba(139, 171, 198, 0.2)",
                  backgroundColor: "rgba(0,0,0,0.16)",
                  borderRadius: 8,
                  padding: "6px 8px",
                }}
              >
                {entry.text}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>
        {`@keyframes fightFloatUp {
          0% { opacity: 0; transform: translate(-50%, -10%); }
          15% { opacity: 1; transform: translate(-50%, -50%); }
          100% { opacity: 0; transform: translate(-50%, -120%); }
        }

        @keyframes fightToastIn {
          0% { opacity: 0; transform: translateY(10px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }`}
      </style>
    </div>
  );
}
