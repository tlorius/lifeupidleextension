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
import { formatCompactNumber } from "../game/numberFormat";
import { defaultState } from "../game/state";
import type { Stats } from "../game/types";

interface ResourcesDisplayProps {
  compact?: boolean;
}

export function ResourcesDisplay({ compact = false }: ResourcesDisplayProps) {
  const { state } = useGame();
  const [showStats, setShowStats] = useState(false);

  const total = getTotalStats(state);
  const baseStats = getBaseStats(state);
  const equipmentStats = getEquipmentStats(state);
  const upgradeStats = getUpgradeStats(state);
  const petStats = getPetStats(state);
  const now = Date.now();

  const activeGoldPotionBoost =
    (state.temporaryEffects?.goldIncomeBoostUntil ?? 0) > now
      ? (state.temporaryEffects?.goldIncomeBoostPercent ?? 0)
      : 0;
  const activePotionMsLeft = Math.max(
    0,
    (state.temporaryEffects?.goldIncomeBoostUntil ?? 0) - now,
  );

  const permanentPotionStatChanges: Partial<Stats> = {
    attack: (state.stats.attack ?? 0) - (defaultState.stats.attack ?? 0),
    defense: (state.stats.defense ?? 0) - (defaultState.stats.defense ?? 0),
    intelligence:
      (state.stats.intelligence ?? 0) - (defaultState.stats.intelligence ?? 0),
    gardening:
      (state.stats.gardening ?? 0) - (defaultState.stats.gardening ?? 0),
  };

  const hasPermanentPotionChanges = Object.values(
    permanentPotionStatChanges,
  ).some((value) => (value ?? 0) !== 0);

  const formatDuration = (ms: number): string => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes <= 0) return `${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  const formatSigned = (value: number | undefined): string => {
    const safeValue = value ?? 0;
    if (safeValue > 0) return `+${formatStat(safeValue)}`;
    return formatStat(safeValue);
  };

  const baseGoldPerSecond = state.stats.attack || 1;
  const upgradeGoldBonus = upgradeStats.goldIncome ?? 0;
  const petGoldBonus = petStats.goldIncome ?? 0;
  const tempGoldBonus = activeGoldPotionBoost;
  const totalGoldBonusPercent = upgradeGoldBonus + petGoldBonus + tempGoldBonus;
  const totalGoldMultiplier = 1 + totalGoldBonusPercent / 100;
  const calculatedGoldPerSecond = baseGoldPerSecond * totalGoldMultiplier;

  const formatStat = (value: number | undefined): string => {
    if (value === undefined) return "0";
    return formatCompactNumber(value, { minCompactValue: 1000, decimals: 2 });
  };

  const resourceChipStyle = {
    display: "flex",
    alignItems: "center",
    gap: compact ? 4 : 6,
    padding: compact ? "4px 8px" : "6px 10px",
    backgroundColor: "#1f2b38",
    border: "1px solid #3b4d60",
    borderRadius: 999,
    fontSize: compact ? 11 : 12,
    fontWeight: "bold",
    whiteSpace: "nowrap",
  };

  return (
    <div
      style={{
        backgroundColor: "#172330",
        padding: compact ? 6 : 10,
        marginBottom: compact ? 0 : 16,
        borderRadius: 6,
        border: "1px solid #2e4256",
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
          <span>{formatCompactNumber(state.resources.gold)}</span>
        </div>

        <div style={resourceChipStyle} title="Gems">
          <span>💎</span>
          <span>{formatCompactNumber(state.resources.gems ?? 0)}</span>
        </div>

        <div style={resourceChipStyle} title="Mana">
          <span>⚡</span>
          <span>{formatCompactNumber(state.resources.energy ?? 100)}</span>
        </div>

        <button
          className={showStats ? "btn-selected" : ""}
          style={{
            marginLeft: compact ? 2 : "auto",
            width: compact ? 28 : 32,
            height: compact ? 28 : 32,
            padding: 0,
            borderRadius: 999,
            fontSize: compact ? 12 : 14,
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
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(6, 10, 14, 0.72)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1400,
          }}
          onClick={() => setShowStats(false)}
        >
          <div
            style={{
              width: "min(720px, 92vw)",
              maxHeight: "88vh",
              overflowY: "auto",
              borderRadius: 10,
              border: "1px solid #35506a",
              backgroundColor: "#162433",
              padding: 14,
              boxShadow: "0 18px 40px rgba(0, 0, 0, 0.45)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <h4
                style={{
                  margin: 0,
                  fontSize: 14,
                  color: "#e6edf5",
                }}
              >
                Player Stats
              </h4>
              <button
                style={{ padding: "6px 10px", fontSize: 12 }}
                onClick={() => setShowStats(false)}
              >
                Close
              </button>
            </div>

            {/* Current Total Stats */}
            <div style={{ marginBottom: 16 }}>
              <h4
                style={{
                  margin: "0 0 8px 0",
                  fontSize: 13,
                  color: "#e6edf5",
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
                  <span style={{ color: "#9eb0c2" }}>Attack:</span>{" "}
                  <strong>{formatStat(total.attack)}</strong>
                </div>
                <div>
                  <span style={{ color: "#9eb0c2" }}>Defense:</span>{" "}
                  <strong>{formatStat(total.defense)}</strong>
                </div>
                <div>
                  <span style={{ color: "#9eb0c2" }}>Intelligence:</span>{" "}
                  <strong>{formatStat(total.intelligence)}</strong>
                </div>
                <div>
                  <span style={{ color: "#9eb0c2" }}>Gold Income:</span>{" "}
                  <strong style={{ color: "#FFD700" }}>
                    +{formatStat(total.goldIncome)}%
                  </strong>
                </div>
                {(total.energyRegeneration ?? 0) > 0 && (
                  <div>
                    <span style={{ color: "#9eb0c2" }}>Mana Regen:</span>{" "}
                    <strong>+{formatStat(total.energyRegeneration)}%</strong>
                  </div>
                )}
                {(total.plantGrowth ?? 0) > 0 && (
                  <div>
                    <span style={{ color: "#9eb0c2" }}>Plant Growth:</span>{" "}
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
                backgroundColor: "#29384a",
                borderRadius: 4,
                fontSize: 12,
              }}
            >
              <div style={{ fontWeight: "bold", marginBottom: 4 }}>
                Gold Income (per second):
              </div>
              <div
                style={{ fontSize: 14, color: "#FFD700", fontWeight: "bold" }}
              >
                {formatCompactNumber(getGoldIncome(state), {
                  minCompactValue: 1000,
                })}{" "}
                🪙
              </div>
              <div style={{ fontSize: 11, color: "#9eb0c2", marginTop: 4 }}>
                Base: {formatStat(baseGoldPerSecond)} × (1 +{" "}
                {formatStat(totalGoldBonusPercent)}%)
              </div>
              <div style={{ fontSize: 11, color: "#9eb0c2", marginTop: 6 }}>
                Formula: gold/s = base attack × (1 + total gold bonus / 100)
              </div>
              <div
                style={{
                  marginTop: 8,
                  padding: 8,
                  border: "1px solid #3b5268",
                  borderRadius: 6,
                  backgroundColor: "#223345",
                  display: "grid",
                  gap: 4,
                }}
              >
                <div style={{ color: "#d8e5f0", fontWeight: "bold" }}>
                  Gold Bonus Composition
                </div>
                <div>
                  Upgrades: <strong>+{formatStat(upgradeGoldBonus)}%</strong>
                </div>
                <div>
                  Pets: <strong>+{formatStat(petGoldBonus)}%</strong>
                </div>
                <div>
                  Temporary Buffs:{" "}
                  <strong>+{formatStat(tempGoldBonus)}%</strong>
                </div>
                <div style={{ borderTop: "1px dashed #45637d", paddingTop: 4 }}>
                  Total Bonus:{" "}
                  <strong>+{formatStat(totalGoldBonusPercent)}%</strong>
                </div>
                <div>
                  Multiplier:{" "}
                  <strong>{formatStat(totalGoldMultiplier)}x</strong>
                </div>
                <div>
                  Result: <strong>{formatStat(baseGoldPerSecond)}</strong> ×{" "}
                  <strong>{formatStat(totalGoldMultiplier)}</strong> ={" "}
                  <strong style={{ color: "#FFD700" }}>
                    {formatCompactNumber(calculatedGoldPerSecond, {
                      minCompactValue: 1000,
                      decimals: 2,
                    })}{" "}
                    gold/s
                  </strong>
                </div>
              </div>
            </div>

            {/* Potion Effects */}
            <div
              style={{
                marginBottom: 12,
                padding: 8,
                backgroundColor: "#2a3540",
                borderRadius: 4,
                fontSize: 12,
              }}
            >
              <div style={{ fontWeight: "bold", marginBottom: 6 }}>
                Active Potion Bonuses
              </div>
              {activeGoldPotionBoost > 0 ? (
                <div style={{ color: "#9fe3a8" }}>
                  Gold Income: +{formatStat(activeGoldPotionBoost)}% (
                  {formatDuration(activePotionMsLeft)} left)
                </div>
              ) : (
                <div style={{ color: "#9eb0c2" }}>
                  No active temporary potion bonuses
                </div>
              )}
            </div>

            <div
              style={{
                marginBottom: 12,
                padding: 8,
                backgroundColor: "#2a3540",
                borderRadius: 4,
                fontSize: 12,
              }}
            >
              <div style={{ fontWeight: "bold", marginBottom: 6 }}>
                Permanent Potion Stat Changes
              </div>
              {hasPermanentPotionChanges ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 4,
                  }}
                >
                  {(
                    Object.entries(permanentPotionStatChanges) as [
                      keyof Stats,
                      number | undefined,
                    ][]
                  )
                    .filter(([, value]) => (value ?? 0) !== 0)
                    .map(([key, value]) => (
                      <div key={key}>
                        <span
                          style={{
                            color: "#9eb0c2",
                            textTransform: "capitalize",
                          }}
                        >
                          {key}:
                        </span>{" "}
                        <strong
                          style={{
                            color: (value ?? 0) >= 0 ? "#9fe3a8" : "#ff9f9f",
                          }}
                        >
                          {formatSigned(value)}
                        </strong>
                      </div>
                    ))}
                </div>
              ) : (
                <div style={{ color: "#9eb0c2" }}>
                  No permanent potion stat changes
                </div>
              )}
            </div>

            {/* Stat Breakdown */}
            <div style={{ fontSize: 11, color: "#9eb0c2" }}>
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
                  {formatStat(petStats.goldIncome)}%) + Temporary(
                  {formatStat(activeGoldPotionBoost)}%)
                </span>
              </div>
              {(total.energyRegeneration ?? 0) > 0 && (
                <div style={{ marginBottom: 4 }}>
                  <span>
                    Mana Regen = Upgrades(
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
                borderTop: "1px solid #2e4256",
              }}
            >
              <StatSection title="Base" stats={baseStats} />
              <StatSection title="Items" stats={equipmentStats} />
              <StatSection title="Upgrades" stats={upgradeStats} />
              <StatSection title="Pets" stats={petStats} />
            </div>
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
          color: "#c7d3df",
          marginBottom: 4,
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 11, paddingLeft: 8, color: "#9eb0c2" }}>
        {keys.map((key) => (
          <div key={key}>
            {key}:{" "}
            {formatCompactNumber(stats[key] ?? 0, { minCompactValue: 1000 })}
          </div>
        ))}
      </div>
    </div>
  );
}
