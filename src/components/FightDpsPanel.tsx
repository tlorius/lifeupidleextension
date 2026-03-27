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
}

export function FightDpsPanel({
  panel,
  metrics,
  isExpanded,
  onToggleExpanded,
  onSelectWindow,
}: FightDpsPanelProps) {
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
          <div style={{ fontWeight: 700, fontSize: 14 }}>DPS Meter</div>
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
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
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
              }}
            >
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                style={{ width: "100%", height: 140, display: "block" }}
              >
                <defs>
                  <linearGradient id="fightDpsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(86, 224, 153, 0.7)" />
                    <stop offset="100%" stopColor="rgba(86, 224, 153, 0.05)" />
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
                  points={`0,100 ${metrics.dpsGraphPoints} 100,100`}
                />
                <polyline
                  fill="none"
                  stroke="#72f2a4"
                  strokeWidth="1.8"
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
