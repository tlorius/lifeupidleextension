import { useGame } from "../game/GameContext";
import { formatCompactNumber } from "../game/numberFormat";

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

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    if (parts.length === 0) {
      return "under 1m";
    }

    return parts.slice(0, 2).join(" ");
  };

  if (idleEarningsModalItems.length === 0 && !idleFightReview) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(6, 10, 14, 0.76)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1800,
      }}
      onClick={dismissIdleEarningsModal}
    >
      <div
        style={{
          width: "min(520px, 92vw)",
          maxHeight: "84vh",
          overflowY: "auto",
          borderRadius: 10,
          border: "1px solid #3c5872",
          backgroundColor: "#172736",
          boxShadow: "0 20px 42px rgba(0, 0, 0, 0.5)",
          padding: 14,
        }}
        onClick={(event) => event.stopPropagation()}
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
          <div>
            <h3 style={{ margin: 0, color: "#e6edf5", fontSize: 16 }}>
              Welcome back! Idle earnings
            </h3>
            <div style={{ marginTop: 2, color: "#9db1c5", fontSize: 11 }}>
              You were away for {formatAwayDuration(idleDurationMs)}
            </div>
          </div>
          <button
            style={{ padding: "6px 10px", fontSize: 12 }}
            onClick={dismissIdleEarningsModal}
          >
            Collect
          </button>
        </div>

        {idleEarningsModalItems.length > 0 && (
          <div style={{ display: "grid", gap: 8 }}>
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
                You gained {formatCompactNumber(idleFightReview.gemsGained)}{" "}
                gems.
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
      </div>
    </div>
  );
}
