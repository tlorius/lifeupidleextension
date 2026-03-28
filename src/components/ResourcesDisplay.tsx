import { useState } from "react";
import { useGame } from "../game/GameContext";
import { formatCompactNumber } from "../game/numberFormat";
import { selectResourcesDisplayView } from "../game/selectors/resources";
import type { Stats } from "../game/types";
import { ModalShell } from "./ui/ModalShell";
import { RewardInboxModal } from "./RewardInboxModal";

interface ResourcesDisplayProps {
  compact?: boolean;
}

export function ResourcesDisplay({ compact = false }: ResourcesDisplayProps) {
  const { state, unreadRewardBundleCount } = useGame();
  const [showStats, setShowStats] = useState(false);
  const [showRewardInbox, setShowRewardInbox] = useState(false);
  const hasRubyResourceUnlocked = state.combat.highestLevelReached > 50;

  const {
    total,
    baseStats,
    equipmentStats,
    upgradeStats,
    petStats,
    activeGoldPotionBoost,
    activePotionMsLeft,
    permanentPotionStatChanges,
    hasPermanentPotionChanges,
    goldIncomePerSecond,
    baseGoldPerSecond,
    upgradeGoldBonus,
    petGoldBonus,
    tempGoldBonus,
    totalGoldBonusPercent,
    totalGoldMultiplier,
    calculatedGoldPerSecond,
  } = selectResourcesDisplayView(state);

  const formatDuration = (ms: number): string => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes <= 0) return `${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  const formatPlaytime = (ms: number): string => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const formatSigned = (value: number | undefined): string => {
    const safeValue = value ?? 0;
    if (safeValue > 0) return `+${formatStat(safeValue)}`;
    return formatStat(safeValue);
  };

  const formatStat = (value: number | undefined): string => {
    if (value === undefined) return "0";
    return formatCompactNumber(value, { minCompactValue: 1000, decimals: 2 });
  };

  const resourceChipStyle = {
    ["--chip-gap" as string]: compact ? "4px" : "6px",
    ["--chip-padding" as string]: compact ? "4px 8px" : "6px 10px",
    ["--chip-font-size" as string]: compact ? "11px" : "12px",
  };

  return (
    <div
      className="ui-resource-wrap"
      style={{
        padding: compact ? 6 : 10,
        marginBottom: compact ? 0 : 16,
      }}
    >
      {/* Compact Resource Row */}
      <div className="ui-resource-row">
        <div
          className="ui-resource-chip"
          style={resourceChipStyle}
          title="Gold"
        >
          <span>🪙</span>
          <span>{formatCompactNumber(state.resources.gold)}</span>
        </div>

        <div
          className="ui-resource-chip"
          style={resourceChipStyle}
          title="Gems"
        >
          <span>💎</span>
          <span>{formatCompactNumber(state.resources.gems ?? 0)}</span>
        </div>

        <div
          className="ui-resource-chip"
          style={resourceChipStyle}
          title="Mana"
        >
          <span>⚡</span>
          <span>{formatCompactNumber(state.resources.energy ?? 100)}</span>
        </div>

        {hasRubyResourceUnlocked ? (
          <div
            className="ui-resource-chip"
            style={resourceChipStyle}
            title="Ruby"
          >
            <span>♦️</span>
            <span>{formatCompactNumber(state.resources.ruby ?? 0)}</span>
          </div>
        ) : null}

        <button
          type="button"
          className="ui-resource-mail-btn"
          title="Reward Inbox"
          aria-label="Open reward inbox"
          onClick={() => setShowRewardInbox(true)}
        >
          <span aria-hidden="true">✉</span>
          {unreadRewardBundleCount > 0 ? (
            <span className="ui-resource-mail-badge">
              {unreadRewardBundleCount}
            </span>
          ) : null}
        </button>

        <button
          style={{
            marginLeft: compact ? 2 : "auto",
            width: compact ? 28 : 32,
            height: compact ? 28 : 32,
            fontSize: compact ? 12 : 14,
          }}
          className={`ui-resource-toggle ${showStats ? "btn-selected" : ""}`}
          title={showStats ? "Hide player stats" : "Show player stats"}
          aria-label={showStats ? "Hide player stats" : "Show player stats"}
          onClick={() => setShowStats(!showStats)}
        >
          {showStats ? "▾" : "▸"}
        </button>
      </div>

      {/* Stats Display */}
      {showStats && (
        <ModalShell
          onClose={() => setShowStats(false)}
          overlayStyle={{ zIndex: 1400 }}
          panelStyle={{
            ["--modal-width" as string]: "720px",
            ["--modal-width-mobile" as string]: "92vw",
            ["--modal-max-height" as string]: "88vh",
            ["--modal-padding" as string]: "14px",
          }}
        >
          <div className="ui-stats-modal-header">
            <h4 className="ui-stats-heading" style={{ fontSize: 14 }}>
              Player Stats
            </h4>
            <button
              style={{ padding: "6px 10px", fontSize: 12 }}
              onClick={() => setShowStats(false)}
            >
              Close
            </button>
          </div>

          <div className="ui-card-tonal" style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: "bold", marginBottom: 4 }}>
              Session Playtime Remaining
            </div>
            <div style={{ fontSize: 14, color: "#9fe3a8", fontWeight: "bold" }}>
              {formatPlaytime(state.playtime.remainingMs)} /{" "}
              {formatPlaytime(state.playtime.capMs)}
            </div>
            <div className="ui-text-meta" style={{ marginTop: 4 }}>
              Token unit adds{" "}
              {Math.max(1, Math.floor(state.playtime.tokenUnitMs / 60000))}{" "}
              minute(s)
            </div>
          </div>

          {/* Current Total Stats */}
          <div style={{ marginBottom: 16 }}>
            <h4
              className="ui-stats-heading"
              style={{ marginBottom: 8, fontSize: 13 }}
            >
              Total Stats
            </h4>
            <div className="ui-stats-grid">
              <div>
                <span className="ui-label-muted">Attack:</span>{" "}
                <strong>{formatStat(total.attack)}</strong>
              </div>
              <div>
                <span className="ui-label-muted">Defense:</span>{" "}
                <strong>{formatStat(total.defense)}</strong>
              </div>
              <div>
                <span className="ui-label-muted">Intelligence:</span>{" "}
                <strong>{formatStat(total.intelligence)}</strong>
              </div>
              <div>
                <span className="ui-label-muted">Gold Income:</span>{" "}
                <strong style={{ color: "#FFD700" }}>
                  +{formatStat(total.goldIncome)}%
                </strong>
              </div>
              {(total.energyRegeneration ?? 0) > 0 && (
                <div>
                  <span className="ui-label-muted">Mana Regen:</span>{" "}
                  <strong>+{formatStat(total.energyRegeneration)}%</strong>
                </div>
              )}
              {(total.plantGrowth ?? 0) > 0 && (
                <div>
                  <span className="ui-label-muted">Plant Growth:</span>{" "}
                  <strong>+{formatStat(total.plantGrowth)}%</strong>
                </div>
              )}
            </div>
          </div>

          {/* Gold Income Display */}
          <div className="ui-card-tonal">
            <div style={{ fontWeight: "bold", marginBottom: 4 }}>
              Gold Income (per second):
            </div>
            <div style={{ fontSize: 14, color: "#FFD700", fontWeight: "bold" }}>
              {formatCompactNumber(goldIncomePerSecond, {
                minCompactValue: 1000,
              })}{" "}
              🪙
            </div>
            <div className="ui-text-meta" style={{ marginTop: 4 }}>
              Base: {formatStat(baseGoldPerSecond)} × (1 +{" "}
              {formatStat(totalGoldBonusPercent)}%)
            </div>
            <div className="ui-text-meta" style={{ marginTop: 6 }}>
              Formula: gold/s = base attack × (1 + total gold bonus / 100)
            </div>
            <div className="ui-composition-card">
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
                Temporary Buffs: <strong>+{formatStat(tempGoldBonus)}%</strong>
              </div>
              <div style={{ borderTop: "1px dashed #45637d", paddingTop: 4 }}>
                Total Bonus:{" "}
                <strong>+{formatStat(totalGoldBonusPercent)}%</strong>
              </div>
              <div>
                Multiplier: <strong>{formatStat(totalGoldMultiplier)}x</strong>
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
          <div className="ui-card-tonal-alt">
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

          <div className="ui-card-tonal-alt">
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
                        className="ui-label-muted"
                        style={{ textTransform: "capitalize" }}
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
          <div className="ui-text-caption">
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
          <div className="ui-detail-divider-top">
            <StatSection title="Base" stats={baseStats} />
            <StatSection title="Items" stats={equipmentStats} />
            <StatSection title="Upgrades" stats={upgradeStats} />
            <StatSection title="Pets" stats={petStats} />
          </div>
        </ModalShell>
      )}

      <RewardInboxModal
        isOpen={showRewardInbox}
        onClose={() => setShowRewardInbox(false)}
      />
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
      <div className="ui-stat-section-title">{title}</div>
      <div className="ui-stat-section-list">
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
