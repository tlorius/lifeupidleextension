import { formatCompactNumber } from "../game/numberFormat";
import type {
  FightDpsMetrics,
  FightDpsPanelViewModel,
} from "../game/selectors/fight";
import { PanelSurface } from "./ui/PanelSurface";

interface FightDpsPanelProps {
  panel: FightDpsPanelViewModel;
  metrics: FightDpsMetrics;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onSelectWindow: (windowMs: number) => void;
  isUnlocked: boolean;
}

export function FightDpsPanel({
  panel,
  metrics,
  isExpanded,
  onToggleExpanded,
  onSelectWindow,
  isUnlocked,
}: FightDpsPanelProps) {
  if (!isUnlocked) {
    return (
      <PanelSurface
        style={{
          marginTop: 12,
          ["--ui-panel-background" as string]:
            "linear-gradient(160deg, #2a1f26 0%, #3d2530 100%)",
          opacity: 0.7,
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
            <div style={{ fontWeight: 700, fontSize: 14, color: "#c8a2b0" }}>
              🔒 DPS Meter (Locked)
            </div>
            <div style={{ fontSize: 12, opacity: 0.76, color: "#9eb0c2" }}>
              Unlock via "DPS Goblin" upgrade in the Combat tree
            </div>
          </div>
        </div>
      </PanelSurface>
    );
  }

  return (
    <PanelSurface
      style={{
        marginTop: 12,
        ["--ui-panel-background" as string]:
          "linear-gradient(160deg, #121c26 0%, #1e3141 100%)",
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
          <div style={{ fontWeight: 700, fontSize: 14 }}>📊 DPS Meter</div>
          <div style={{ fontSize: 12, opacity: 0.76 }}>
            {formatCompactNumber(metrics.currentDps)} DPS over the last{" "}
            {panel.windowSeconds}s
          </div>
        </div>
        <button onClick={onToggleExpanded}>{panel.toggleLabel}</button>
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
          Current: <strong>{formatCompactNumber(metrics.currentDps)}</strong>
        </div>
        <div>
          Previous: <strong>{formatCompactNumber(metrics.previousDps)}</strong>
        </div>
        <div
          style={{
            color: panel.deltaTone === "positive" ? "#74f5b3" : "#ff9d9d",
          }}
        >
          {metrics.dpsDelta >= 0 ? "+" : ""}
          {formatCompactNumber(metrics.dpsDelta)} DPS (
          {metrics.dpsDelta >= 0 ? "+" : ""}
          {metrics.dpsDeltaPercent.toFixed(1)}%)
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
        {panel.sourceStats.map((entry) => (
          <div key={entry.label}>
            {entry.label}: <strong>{formatCompactNumber(entry.value)}</strong>
          </div>
        ))}
      </div>

      {isExpanded && (
        <div style={{ marginTop: 12 }}>
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 10,
              flexWrap: "wrap",
            }}
          >
            {panel.windowOptions.map((option) => (
              <button
                key={option.windowMs}
                className={option.isSelected ? "btn-selected" : ""}
                onClick={() => onSelectWindow(option.windowMs)}
              >
                {option.label}
              </button>
            ))}
          </div>

          {!panel.hasDamageHistory ? (
            <div style={{ fontSize: 12, opacity: 0.72 }}>
              {panel.emptyMessage}
            </div>
          ) : (
            <div
              style={{
                borderRadius: 10,
                border: "1px solid rgba(109, 144, 173, 0.3)",
                background: "rgba(8, 14, 20, 0.45)",
                padding: 10,
                position: "relative",
              }}
            >
              {/* Y-Axis labels container */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: 50,
                  height: 160,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  fontSize: 10,
                  opacity: 0.7,
                  color: "#9eb0c2",
                  paddingRight: 4,
                  textAlign: "right",
                  lineHeight: 1,
                  pointerEvents: "none",
                }}
              >
                {metrics.yAxisTicks.map((tick, i) => (
                  <div key={i}>{tick.label}</div>
                ))}
              </div>

              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                style={{
                  width: "100%",
                  height: 160,
                  display: "block",
                  marginLeft: 0,
                }}
              >
                <defs>
                  <linearGradient id="fightDpsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(220, 80, 80, 0.65)" />
                    <stop offset="100%" stopColor="rgba(220, 80, 80, 0.05)" />
                  </linearGradient>
                </defs>
                {/* Horizontal grid lines for each y-axis tick */}
                {metrics.yAxisTicks.map((tick, i) => (
                  <line
                    key={`gridline-${i}`}
                    x1="0"
                    y1={tick.y}
                    x2="100"
                    y2={tick.y}
                    stroke="rgba(109, 144, 173, 0.15)"
                    strokeWidth="0.5"
                    strokeDasharray="2,2"
                  />
                ))}
                {/* Baseline */}
                <polyline
                  fill="none"
                  stroke="rgba(120, 208, 255, 0.25)"
                  strokeWidth="0.8"
                  points="0,100 100,100"
                />
                {/* Area fill */}
                <polygon
                  fill="url(#fightDpsFill)"
                  points={`0,100 ${metrics.dpsGraphPoints} 100,100`}
                />
                {/* Line */}
                <polyline
                  fill="none"
                  stroke="#e05c5c"
                  strokeWidth="1.2"
                  points={metrics.dpsGraphPoints}
                />
              </svg>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 11,
                  opacity: 0.7,
                  marginTop: 6,
                  marginLeft: 50,
                }}
              >
                <span>{panel.windowSeconds}s ago</span>
                <span>now</span>
              </div>
            </div>
          )}
        </div>
      )}
    </PanelSurface>
  );
}
