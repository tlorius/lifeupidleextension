import { useGame } from "../game/GameContext";
import { formatCompactNumber } from "../game/numberFormat";
import { ModalShell } from "./ui/ModalShell";

export function IdleEarningsModal() {
  const {
    idleEarningsModalItems,
    idleDurationMs,
    idleFightReview,
    dismissIdleEarningsModal,
  } = useGame();

  const formatAwayDuration = (durationMs: number): string => {
    const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    const seconds = totalSeconds % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (parts.length === 0) parts.push(`${seconds}s`);

    return parts.slice(0, 2).join(" ");
  };

  if (idleEarningsModalItems.length === 0 && !idleFightReview) return null;

  return (
    <ModalShell
      onClose={dismissIdleEarningsModal}
      overlayStyle={{ zIndex: 1800, backgroundColor: "rgba(6, 10, 14, 0.76)" }}
      panelStyle={{
        ["--modal-width" as string]: "520px",
        ["--modal-width-mobile" as string]: "92vw",
        ["--modal-max-height" as string]: "84vh",
        ["--modal-padding" as string]: "14px",
      }}
    >
      <div className="ui-modal-header" style={{ gap: 8, marginBottom: 10 }}>
        <div>
          <h3 style={{ margin: 0, color: "#e6edf5", fontSize: 16 }}>
            Welcome back! Idle earnings
          </h3>
          <div style={{ marginTop: 2, color: "#9db1c5", fontSize: 11 }}>
            You were away for {formatAwayDuration(idleDurationMs)}
          </div>
        </div>
        <button
          className="ui-modal-btn-compact ui-touch-target"
          onClick={dismissIdleEarningsModal}
        >
          Collect
        </button>
      </div>

      {idleEarningsModalItems.length > 0 && (
        <div className="ui-grid-gap-8">
          {idleEarningsModalItems.map((earning) => (
            <div
              key={earning.resourceId}
              style={{
                display: "grid",
                gridTemplateColumns: "34px 1fr auto",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                border: "1px solid #3a536a",
                borderRadius: 8,
                backgroundColor: "#1f3345",
              }}
            >
              <div style={{ fontSize: 20, textAlign: "center" }}>
                {earning.icon}
              </div>
              <div>
                <div style={{ color: "#dfe9f3", fontWeight: "bold" }}>
                  {earning.label}
                </div>
                <div style={{ color: "#96abc0", fontSize: 11 }}>
                  Earned while you were away
                </div>
              </div>
              <div style={{ color: "#f3d06b", fontWeight: "bold" }}>
                +{formatCompactNumber(earning.amount)}
              </div>
            </div>
          ))}
        </div>
      )}

      {idleFightReview && (
        <div
          style={{
            marginTop: idleEarningsModalItems.length > 0 ? 12 : 0,
            border: "1px solid #3a536a",
            borderRadius: 8,
            backgroundColor: "#1b3041",
            padding: 12,
          }}
        >
          <div
            style={{
              color: "#e6edf5",
              fontWeight: "bold",
              fontSize: 14,
              marginBottom: 8,
            }}
          >
            Fight Review
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ color: "#dfe9f3", fontSize: 12 }}>
              You progressed{" "}
              {formatCompactNumber(idleFightReview.playerLevelsGained)} player
              levels.
            </div>
            <div style={{ color: "#dfe9f3", fontSize: 12 }}>
              You gained {formatCompactNumber(idleFightReview.gemsGained)} gems.
            </div>
            <div style={{ color: "#dfe9f3", fontSize: 12 }}>
              You gained {formatCompactNumber(idleFightReview.itemsGained)}{" "}
              items.
            </div>
            <div style={{ color: "#dfe9f3", fontSize: 12 }}>
              You defeated{" "}
              {formatCompactNumber(idleFightReview.newEnemiesDefeated)} new
              enemies.
            </div>
          </div>
        </div>
      )}
    </ModalShell>
  );
}
