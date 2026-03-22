import { useState } from "react";
import { useGame } from "../game/GameContext";
import {
  getTotalStats,
  getBaseStats,
  getUpgradeStats,
  getEquipmentStats,
  getPetStats,
  getGoldIncome,
} from "../game/engine";
import type { Stats } from "../game/types";

export function ResourcesDisplay() {
  const { state } = useGame();
  const [showStats, setShowStats] = useState(false);

  const total = getTotalStats(state);
  const baseStats = getBaseStats(state);
  const equipmentStats = getEquipmentStats(state);
  const upgradeStats = getUpgradeStats(state);
  const petStats = getPetStats(state);

  const formatStat = (value: number | undefined): string => {
    if (value === undefined) return "0";
    return value.toFixed(1);
  };

  const resourceChipStyle = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    backgroundColor: "#ffffff",
    border: "1px solid #ddd",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "bold",
    whiteSpace: "nowrap",
  };

  return (
    <div
      style={{
        backgroundColor: "#f5f5f5",
        padding: 10,
        marginBottom: 16,
        borderRadius: 6,
      }}
    >
      {/* Compact Resource Row */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={resourceChipStyle} title="Gold">
          <span>🪙</span>
          <span>{Math.floor(state.resources.gold)}</span>
        </div>

        <div style={resourceChipStyle} title="Gems">
          <span>💎</span>
          <span>{state.resources.gems ?? 0}</span>
        </div>

        <div style={resourceChipStyle} title="Energy">
          <span>⚡</span>
          <span>{Math.floor(state.resources.energy ?? 100)}</span>
        </div>

        <button
          style={{
            marginLeft: "auto",
            width: 32,
            height: 32,
            padding: 0,
            backgroundColor: showStats ? "#51cf66" : "#e0e0e0",
            color: showStats ? "white" : "#333",
            border: "none",
            borderRadius: 999,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title={showStats ? "Hide player stats" : "Show player stats"}
          aria-label={showStats ? "Hide player stats" : "Show player stats"}
          onClick={() => setShowStats(!showStats)}
        >
          {showStats ? "▾" : "▸"}
        </button>
      </div>

      {/* Stats Display */}
      {showStats && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid #ddd",
          }}
        >
          {/* Current Total Stats */}
          <div style={{ marginBottom: 16 }}>
            <h4
              style={{
                margin: "0 0 8px 0",
                fontSize: 13,
                color: "#333",
              }}
            >
              Total Stats
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                fontSize: 12,
              }}
            >
              <div>
                <span style={{ color: "#666" }}>Attack:</span>{" "}
                <strong>{formatStat(total.attack)}</strong>
              </div>
              <div>
                <span style={{ color: "#666" }}>Defense:</span>{" "}
                <strong>{formatStat(total.defense)}</strong>
              </div>
              <div>
                <span style={{ color: "#666" }}>Intelligence:</span>{" "}
                <strong>{formatStat(total.intelligence)}</strong>
              </div>
              <div>
                <span style={{ color: "#666" }}>Gold Income:</span>{" "}
                <strong style={{ color: "#FFD700" }}>
                  +{formatStat(total.goldIncome)}%
                </strong>
              </div>
              {(total.energyRegeneration ?? 0) > 0 && (
                <div>
                  <span style={{ color: "#666" }}>Energy Regen:</span>{" "}
                  <strong>+{formatStat(total.energyRegeneration)}%</strong>
                </div>
              )}
              {(total.plantGrowth ?? 0) > 0 && (
                <div>
                  <span style={{ color: "#666" }}>Plant Growth:</span>{" "}
                  <strong>+{formatStat(total.plantGrowth)}%</strong>
                </div>
              )}
            </div>
          </div>

          {/* Gold Income Display */}
          <div
            style={{
              marginBottom: 12,
              padding: 8,
              backgroundColor: "#fffacd",
              borderRadius: 4,
              fontSize: 12,
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: 4 }}>
              Gold Income (per second):
            </div>
            <div style={{ fontSize: 14, color: "#FFD700", fontWeight: "bold" }}>
              {getGoldIncome(state).toFixed(2)} 🪙
            </div>
            <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>
              Base: {formatStat(state.stats.attack)} × (1 +{" "}
              {formatStat(total.goldIncome)}%)
            </div>
          </div>

          {/* Stat Breakdown */}
          <div style={{ fontSize: 11, color: "#666" }}>
            <div style={{ marginBottom: 8 }}>
              <strong>Calculation Breakdown (Combat Stats):</strong>
            </div>
            <div style={{ marginBottom: 4 }}>
              <span>
                Attack = Base({formatStat(baseStats.attack)}) + Items(
                {formatStat(equipmentStats.attack)}) + Upgrades(
                {formatStat(upgradeStats.attack)}) + Pets(
                {formatStat(petStats.attack)})
              </span>
            </div>
            <div style={{ marginBottom: 4 }}>
              <span>
                Defense = Items(
                {formatStat(equipmentStats.defense)}) + Upgrades(
                {formatStat(upgradeStats.defense)}) + Pets(
                {formatStat(petStats.defense)})
              </span>
            </div>
            <div style={{ marginBottom: 8 }}>
              <span>
                Intelligence = Items(
                {formatStat(equipmentStats.intelligence)}) + Upgrades(
                {formatStat(upgradeStats.intelligence)}) + Pets(
                {formatStat(petStats.intelligence)})
              </span>
            </div>

            <div style={{ marginBottom: 8 }}>
              <strong>Bonus Stats (% Additions):</strong>
            </div>
            <div style={{ marginBottom: 4 }}>
              <span>
                Gold Income = Upgrades(
                {formatStat(upgradeStats.goldIncome)}%) + Pets(
                {formatStat(petStats.goldIncome)}%)
              </span>
            </div>
            {(total.energyRegeneration ?? 0) > 0 && (
              <div style={{ marginBottom: 4 }}>
                <span>
                  Energy Regen = Upgrades(
                  {formatStat(upgradeStats.energyRegeneration)}%) + Pets(
                  {formatStat(petStats.energyRegeneration)}%)
                </span>
              </div>
            )}
            {(total.plantGrowth ?? 0) > 0 && (
              <div style={{ marginBottom: 4 }}>
                <span>
                  Plant Growth = Upgrades(
                  {formatStat(upgradeStats.plantGrowth)}%) + Pets(
                  {formatStat(petStats.plantGrowth)}%)
                </span>
              </div>
            )}
          </div>

          {/* Detailed Sections */}
          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: "1px solid #eee",
            }}
          >
            <StatSection title="Base" stats={baseStats} />
            <StatSection title="Items" stats={equipmentStats} />
            <StatSection title="Upgrades" stats={upgradeStats} />
            <StatSection title="Pets" stats={petStats} />
          </div>
        </div>
      )}
    </div>
  );
}

function StatSection({
  title,
  stats,
}: {
  title: string;
  stats: Partial<Stats>;
}) {
  const keys = (Object.keys(stats) as (keyof Stats)[]).filter(
    (key) => stats[key] !== undefined && stats[key] !== 0,
  );

  if (keys.length === 0) return null;

  return (
    <div style={{ marginBottom: 8 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: "bold",
          color: "#666",
          marginBottom: 4,
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 11, paddingLeft: 8, color: "#888" }}>
        {keys.map((key) => (
          <div key={key}>
            {key}: {(stats[key] ?? 0).toFixed(1)}
          </div>
        ))}
      </div>
    </div>
  );
}
