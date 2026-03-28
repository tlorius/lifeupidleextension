import { useGame } from "../game/GameContext";
import { getItemDefSafe } from "../game/items";
import { resolveRewardTokenDisplayName } from "../game/tokenRewards";
import { ModalShell } from "./ui/ModalShell";

interface RewardInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RewardInboxModal({ isOpen, onClose }: RewardInboxModalProps) {
  const { rewardInboxBundles, redeemRewardInboxBundle } = useGame();

  if (!isOpen) return null;

  const sorted = [...rewardInboxBundles].sort(
    (left, right) => right.receivedAt - left.receivedAt,
  );

  return (
    <ModalShell
      onClose={onClose}
      panelStyle={{
        ["--modal-width" as string]: "680px",
        ["--modal-width-mobile" as string]: "94vw",
      }}
    >
      <div className="ui-modal-header" style={{ marginBottom: 10 }}>
        <h3 style={{ margin: 0 }}>Reward Inbox</h3>
        <button
          className="ui-modal-btn-compact ui-touch-target"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="ui-fight-spells-empty">
          No reward bundles received yet.
        </div>
      ) : (
        <div className="ui-grid-gap-8">
          {sorted.map((bundle) => {
            const totalItems = bundle.rewards.reduce<number>(
              (sum, reward) => sum + Math.max(1, reward.quantity),
              0,
            );
            const receivedLabel = new Date(bundle.receivedAt).toLocaleString();
            const displayName =
              bundle.sourceLabel ??
              resolveRewardTokenDisplayName(bundle.sourceToken) ??
              bundle.sourceToken;

            return (
              <div
                key={bundle.id}
                className="ui-card-tonal"
                style={{ padding: 10 }}
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
                  <div>
                    <strong style={{ color: "#e8f4ff" }}>{displayName}</strong>
                    <div style={{ fontSize: 11, color: "#8fa8be" }}>
                      Token: {bundle.sourceToken} | Received: {receivedLabel}
                    </div>
                  </div>
                  <button
                    className="ui-touch-target"
                    onClick={() => redeemRewardInboxBundle(bundle.id)}
                  >
                    Redeem
                  </button>
                </div>

                <div
                  style={{ fontSize: 12, color: "#c4d8ea", marginBottom: 6 }}
                >
                  {bundle.rewards.length} item type(s) | {totalItems} total
                  item(s)
                </div>

                <div
                  className="ui-grid-gap-8"
                  style={{ gridTemplateColumns: "1fr 1fr" }}
                >
                  {bundle.rewards.map((reward, index) => {
                    const itemDef = getItemDefSafe(reward.itemId);
                    const rewardLabel =
                      reward.itemId === "ruby_currency"
                        ? "Ruby"
                        : (itemDef?.name ?? reward.itemId);
                    return (
                      <div
                        key={`${bundle.id}-${reward.itemId}-${index}`}
                        style={{
                          border: "1px solid rgba(109, 144, 173, 0.24)",
                          borderRadius: 8,
                          padding: "6px 8px",
                          background: "rgba(13, 22, 34, 0.56)",
                        }}
                      >
                        <div style={{ color: "#ddecfb", fontWeight: 600 }}>
                          {rewardLabel}
                        </div>
                        <div style={{ color: "#9bb3c8", fontSize: 11 }}>
                          Qty: {reward.quantity}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ModalShell>
  );
}
