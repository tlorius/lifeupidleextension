import type {
  FightCombatLogViewModel,
  FightEncounterSummaryViewModel,
} from "../game/selectors/fight";
import { PanelSurface } from "./ui/PanelSurface";

interface FightEncounterSummaryPanelProps {
  summary: FightEncounterSummaryViewModel;
}

interface FightCombatLogPanelProps {
  log: FightCombatLogViewModel;
}

export function FightEncounterSummaryPanel({
  summary,
}: FightEncounterSummaryPanelProps) {
  return (
    <PanelSurface
      style={{
        fontSize: 12,
        lineHeight: 1.55,
        opacity: 0.95,
      }}
    >
      <div style={{ marginBottom: 4 }}>{summary.levelLabel}</div>
      <div>{summary.rewardsLabel}</div>
    </PanelSurface>
  );
}

export function FightCombatLogPanel({ log }: FightCombatLogPanelProps) {
  return (
    <PanelSurface
      style={{
        marginTop: 12,
        ["--ui-panel-background" as string]:
          "linear-gradient(160deg, #131f29 0%, #1d2f3f 100%)",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
        Combat Log
      </div>
      {log.isEmpty ? (
        <div style={{ fontSize: 12, opacity: 0.72 }}>{log.emptyMessage}</div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 6,
            maxHeight: 220,
            overflowY: "auto",
          }}
        >
          {log.entries.map((entry) => (
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
    </PanelSurface>
  );
}
