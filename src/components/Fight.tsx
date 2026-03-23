import { useEffect, useMemo, useState } from "react";
import {
  COMBAT_SPELL_DEFINITIONS,
  getPlayerAttacksPerSecond,
  getPlayerCritChance,
} from "../game/combat";
import { getTotalStats } from "../game/engine";
import { getItemDefSafe } from "../game/items";
import { useGame } from "../game/GameContext";
import { formatCompactNumber } from "../game/numberFormat";
import { PlayerProgressTile } from "./PlayerProgressTile";
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

function getConsumableEffectText(itemId: string): string {
  if (itemId === "health_potion") return "Restore 35% combat HP and 50 mana";
  if (itemId === "mana_potion") return "25% gold income boost for 10m";
  if (itemId === "elixir")
    return "Restore 20% combat HP, 30 mana, and 60% gold income for 20m";
  if (itemId === "immortal_brew")
    return "Full heal, full mana, +2 all core stats, 100% gold income for 30m";
  if (itemId === "swift_tonic") return "200% gold income boost for 5m";
  if (itemId === "fortitude_brew") return "+3 defense and full mana";
  if (itemId === "scholars_draught")
    return "+5 intelligence and 50% gold income for 15m";
  if (itemId === "berserkers_tonic") return "+10 attack, -3 defense";
  if (itemId === "chaos_potion") return "Unstable effect with high upside";
  return "Consumable effect";
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
  const playerManaPercent = Math.max(0, Math.min(100, playerMana));
  const enemyHpPercent = Math.max(
    0,
    Math.min(
      100,
      (combat.enemy.currentHp / Math.max(1, combat.enemy.maxHp)) * 100,
    ),
  );

  const attacksPerSecond = getPlayerAttacksPerSecond(state);
  const critChance = getPlayerCritChance(state);

  const combatTitle = useMemo(
    () => `${combat.enemy.name} (Lv ${combat.enemy.level})`,
    [combat.enemy.level, combat.enemy.name],
  );
  const enemySprite =
    combat.enemy.kind === "boss" ? enemyBossPixel : enemyPixel;
  const enemyAlt =
    combat.enemy.kind === "boss" ? "Boss enemy pixel art" : "Enemy pixel art";
  const activeGoldBuffRemainingMs = Math.max(
    0,
    (state.temporaryEffects?.goldIncomeBoostUntil ?? 0) - clockNow,
  );
  const activeGoldBuffPercent =
    activeGoldBuffRemainingMs > 0
      ? (state.temporaryEffects?.goldIncomeBoostPercent ?? 0)
      : 0;
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
            fontSize: isCrit ? 36 : 24,
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

    setFloatingDamage((prev) => [...prev, ...incoming]);
    const timer = window.setTimeout(() => {
      setFloatingDamage((prev) =>
        prev.filter(
          (entry) =>
            !incoming.some((incomingEntry) => incomingEntry.id === entry.id),
        ),
      );
    }, 650);

    return () => window.clearTimeout(timer);
  }, [combatEvents]);

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
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 14,
          marginBottom: 14,
        }}
      >
        <PlayerProgressTile />

        <div
          style={{
            borderRadius: 12,
            border: "1px solid #30465b",
            background: "linear-gradient(150deg, #15202b 0%, #263748 100%)",
            padding: 14,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
            Player
          </div>
          <div style={{ fontSize: 13, marginBottom: 6 }}>
            HP: {Math.round(combat.playerCurrentHp)} / {playerMaxHp}
          </div>
          <div
            style={{
              height: 10,
              borderRadius: 999,
              backgroundColor: "rgba(8, 13, 19, 0.6)",
              overflow: "hidden",
              border: "1px solid rgba(130, 167, 201, 0.3)",
              marginBottom: 10,
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
          <div style={{ fontSize: 12, opacity: 0.92, lineHeight: 1.5 }}>
            <div>ATK: {Math.round(totalStats.attack ?? 0)}</div>
            <div>DEF: {Math.round(totalStats.defense ?? 0)}</div>
            <div>AGI: {(totalStats.agility ?? 0).toFixed(2)}</div>
            <div>APS: {attacksPerSecond.toFixed(2)}</div>
            <div>Crit: {critChance.toFixed(1)}%</div>
            <div>Mana: {formatCompactNumber(playerMana)} / 100</div>
            <div>
              Mana Regen:{" "}
              {formatCompactNumber(
                2 * (1 + (totalStats.energyRegeneration ?? 0) / 100),
                { smallValueDecimals: 1 },
              )}
              /s
            </div>
            <div>
              Checkpoint: Lv {Math.max(1, combat.lastBossCheckpointLevel || 1)}
            </div>
          </div>
          <div
            style={{
              marginTop: 10,
              height: 8,
              borderRadius: 999,
              backgroundColor: "rgba(8, 13, 19, 0.55)",
              overflow: "hidden",
              border: "1px solid rgba(120, 176, 236, 0.28)",
            }}
          >
            <div
              style={{
                width: `${playerManaPercent}%`,
                height: "100%",
                background:
                  "linear-gradient(90deg, #4c8cff 0%, #68c2ff 55%, #b1ebff 100%)",
                transition: "width 180ms linear",
              }}
            />
          </div>
        </div>

        <div
          style={{
            borderRadius: 12,
            border: "1px solid #30465b",
            background: "linear-gradient(155deg, #162432 0%, #223447 100%)",
            padding: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 15 }}>Consumables</div>
            <div style={{ fontSize: 11, opacity: 0.72 }}>Combat use</div>
          </div>
          {potionSummaries.length === 0 ? (
            <div style={{ fontSize: 12, opacity: 0.72 }}>
              No consumables in inventory.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {activeGoldBuffRemainingMs > 0 && (
                <div
                  style={{
                    borderRadius: 8,
                    border: "1px solid rgba(110, 154, 190, 0.28)",
                    background: "rgba(12, 23, 33, 0.5)",
                    padding: "8px 10px",
                    fontSize: 12,
                    color: "#f8d984",
                  }}
                >
                  Active buff: +{activeGoldBuffPercent}% gold income for{" "}
                  {formatRemainingMs(activeGoldBuffRemainingMs)}
                </div>
              )}
              {potionSummaries.map((potion) =>
                (() => {
                  const cooldownMs = consumableCooldowns[potion.itemId] ?? 0;
                  const isOnCooldown = cooldownMs > 0;
                  return (
                    <button
                      key={potion.itemUid}
                      onClick={() => useCombatConsumable(potion.itemUid)}
                      disabled={isOnCooldown}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        gap: 8,
                        alignItems: "center",
                        textAlign: "left",
                        background: "rgba(17, 29, 40, 0.78)",
                        border: "1px solid rgba(109, 144, 173, 0.35)",
                        padding: "10px 12px",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            color: getRarityTint(potion.rarity),
                            fontWeight: 700,
                            fontSize: 13,
                            marginBottom: 3,
                          }}
                        >
                          {potion.name}
                        </div>
                        <div style={{ fontSize: 11, opacity: 0.78 }}>
                          {getConsumableEffectText(potion.itemId)}
                        </div>
                        <div
                          style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}
                        >
                          {isOnCooldown
                            ? `Cooldown: ${formatRemainingMs(cooldownMs)}`
                            : "Ready"}
                        </div>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>
                        x{potion.quantity}
                      </div>
                    </button>
                  );
                })(),
              )}
            </div>
          )}
        </div>

        <div
          style={{
            borderRadius: 12,
            border: "1px solid #30465b",
            background: "linear-gradient(150deg, #1c2233 0%, #2a3048 100%)",
            padding: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 15 }}>Spell System</div>
            <div style={{ fontSize: 11, opacity: 0.72 }}>
              {state.playerProgress.unlockedSystems?.spells
                ? "Unlocked"
                : "Locked"}
            </div>
          </div>
          <div style={{ fontSize: 12, opacity: 0.84, lineHeight: 1.5 }}>
            {state.playerProgress.unlockedSystems?.spells
              ? "Starter spells are live. Future spell slots and specializations can extend this panel."
              : "Spells unlock through progression. The UI is in place and will activate once unlocked."}
          </div>
          {state.playerProgress.unlockedSystems?.spells ? (
            <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
              {COMBAT_SPELL_DEFINITIONS.map((spell) => {
                const cooldownMs = spellCooldowns[spell.id] ?? 0;
                const canCast = cooldownMs <= 0 && playerMana >= spell.manaCost;
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
                      background: "rgba(24, 32, 48, 0.78)",
                      borderColor: "rgba(109, 144, 173, 0.32)",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          marginBottom: 3,
                        }}
                      >
                        {spell.name}
                      </div>
                      <div style={{ fontSize: 11, opacity: 0.76 }}>
                        {spell.description}
                      </div>
                      <div
                        style={{ fontSize: 11, opacity: 0.62, marginTop: 4 }}
                      >
                        Mana {spell.manaCost} •{" "}
                        {cooldownMs > 0
                          ? `Cooldown ${formatRemainingMs(cooldownMs)}`
                          : "Ready"}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>Cast</div>
                  </button>
                );
              })}
            </div>
          ) : (
            <button
              disabled
              style={{
                marginTop: 10,
                width: "100%",
                background: "rgba(28, 38, 52, 0.78)",
                borderColor: "rgba(109, 144, 173, 0.28)",
              }}
            >
              Spellbook Locked
            </button>
          )}
        </div>
      </div>

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
              justifyContent: "space-between",
              alignItems: "flex-end",
              padding: "0 18px",
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
