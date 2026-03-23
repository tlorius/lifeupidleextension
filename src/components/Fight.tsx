import { useEffect, useMemo, useState } from "react";
import { getPlayerAttacksPerSecond, getPlayerCritChance } from "../game/combat";
import { getTotalStats } from "../game/engine";
import { getItemDefSafe } from "../game/items";
import { useGame } from "../game/GameContext";
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

function nextBossLevel(currentLevel: number): number {
  return Math.ceil(currentLevel / 5) * 5;
}

export function Fight() {
  const { state, combatEvents, performCombatClickAttack } = useGame();
  const [floatingDamage, setFloatingDamage] = useState<FloatingDamage[]>([]);
  const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([]);
  const [toasts, setToasts] = useState<CombatToast[]>([]);

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
          event.type === "systemUnlocked",
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
          event.type === "playerDefeated",
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
            <div>
              Checkpoint: Lv {Math.max(1, combat.lastBossCheckpointLevel || 1)}
            </div>
          </div>
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
