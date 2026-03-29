import { useMemo } from "react";
import { getLevelGainPreview, getXpForNextLevel } from "../game/progression";
import { useGame } from "../game/GameContext";
import { PanelSurface } from "./ui/PanelSurface";
import { ProgressBar } from "./ui/ProgressBar";

export function PlayerProgressTile() {
  const { state } = useGame();
  const level = state.playerProgress.level;
  const xp = state.playerProgress.xp;
  const xpToNext = getXpForNextLevel(level);
  const progressPercent = Math.max(
    0,
    Math.min(100, (xp / Math.max(1, xpToNext)) * 100),
  );

  const preview = useMemo(() => getLevelGainPreview(level), [level]);
  const spellsUnlocked = Boolean(state.playerProgress.unlockedSystems?.spells);

  return (
    <PanelSurface
      style={{
        color: "#edf5ff",
        ["--ui-panel-background" as string]:
          "linear-gradient(160deg, #1b2735 0%, #22374b 100%)",
        ["--ui-panel-border" as string]: "#3a5169",
        ["--ui-panel-padding" as string]: "14px",
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
        <strong style={{ fontSize: 16 }}>Player Progression</strong>
        <span
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.12)",
            borderRadius: 999,
            padding: "3px 10px",
            fontSize: 12,
            letterSpacing: 0.3,
          }}
        >
          Level {level}
        </span>
      </div>

      <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 6 }}>
        XP {xp.toFixed(0)} / {xpToNext.toFixed(0)}
      </div>
      <ProgressBar
        value={progressPercent}
        trackStyle={{
          height: 10,
          width: "100%",
          borderRadius: 999,
          backgroundColor: "rgba(8, 13, 19, 0.55)",
          border: "1px solid rgba(130, 167, 201, 0.28)",
          overflow: "hidden",
          marginBottom: 10,
        }}
        fillStyle={{
          height: "100%",
          background:
            "linear-gradient(90deg, #4cd17e 0%, #72f2a4 55%, #a4ffd4 100%)",
          transition: "width 220ms ease-out",
        }}
      />

      <div style={{ fontSize: 12, opacity: 0.92, lineHeight: 1.45 }}>
        <div style={{ marginBottom: 4 }}>
          Next level gains: +{preview.attack ?? 0} ATK, +{preview.hp ?? 0} HP, +
          {preview.agility ?? 0} AGI, +{preview.critChance ?? 0}% Crit
        </div>
        <div style={{ opacity: 0.78 }}>
          Spells: {spellsUnlocked ? "Unlocked" : "Locked"} • Future slot: spells
          and class perks
        </div>
      </div>
    </PanelSurface>
  );
}
