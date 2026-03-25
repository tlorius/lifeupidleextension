import type {
  FightCombatLogViewModel,
  FightEncounterSummaryViewModel,
} from "../game/selectors/fight";

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
      <div style={{ marginBottom: 4 }}>{summary.levelLabel}</div>
      <div>{summary.rewardsLabel}</div>
    </div>
  );
}

export function FightCombatLogPanel({ log }: FightCombatLogPanelProps) {
  return (
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
    </div>
  );
}
