import { ModalShell } from "./ui/ModalShell";

interface RockBreakTierConfig {
  minPickaxeLevel: number;
  energyCost: number;
}

interface GardenRockBreakModalProps {
  isOpen: boolean;
  isMobile: boolean;
  tier: "small" | "medium" | "large" | null;
  row: number;
  col: number;
  config: RockBreakTierConfig | null;
  pickaxeLevel: number;
  currentEnergy: number;
  meetsRequirement: boolean;
  hasEnergy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function GardenRockBreakModal({
  isOpen,
  isMobile,
  tier,
  row,
  col,
  config,
  pickaxeLevel,
  currentEnergy,
  meetsRequirement,
  hasEnergy,
  onClose,
  onConfirm,
}: GardenRockBreakModalProps) {
  if (!isOpen || !tier || !config) {
    return null;
  }

  return (
    <ModalShell
      onClose={onClose}
      overlayStyle={{ zIndex: 1000 }}
      panelStyle={{
        ["--modal-width" as string]: "540px",
        ["--modal-width-mobile" as string]: isMobile ? "94vw" : "95vw",
        ["--modal-max-height" as string]: "80vh",
        ["--modal-max-height-mobile" as string]: isMobile ? "88vh" : "88vh",
        ["--modal-padding" as string]: isMobile ? "16px" : "22px",
        background:
          "linear-gradient(180deg, rgba(24, 36, 51, 0.98) 0%, rgba(14, 22, 34, 0.98) 100%)",
        borderRadius: 18,
        border: "1px solid rgba(116, 192, 252, 0.22)",
        boxShadow: "0 24px 60px rgba(0, 0, 0, 0.45)",
      }}
    >
      <div className="ui-rockbreak-header">
        <div>
          <div className="ui-rockbreak-eyebrow">Rock obstacle</div>
          <h3
            style={{
              margin: 0,
              fontSize: isMobile ? 22 : 26,
              lineHeight: 1.1,
            }}
          >
            ⛏️ Break Rock
          </h3>
        </div>
        <div className="ui-rockbreak-tier-pill">{tier} tier</div>
      </div>

      <div className="ui-rockbreak-card ui-rockbreak-card--info">
        <div className="ui-rockbreak-card-title">
          {tier.charAt(0).toUpperCase() + tier.slice(1)} Rock
        </div>
        <div className="ui-rockbreak-meta-grid">
          <div>
            Location: ({row}, {col})
          </div>
          <div>
            Difficulty:{" "}
            {tier === "large" ? "⭐⭐⭐" : tier === "medium" ? "⭐⭐" : "⭐"}
          </div>
        </div>
      </div>

      <div className="ui-rockbreak-card ui-rockbreak-card--req">
        <div className="ui-rockbreak-req-title">Requirements</div>
        <div className="ui-rockbreak-req-list">
          <div
            className="ui-rockbreak-req-item"
            style={{
              padding: 10,
              backgroundColor: meetsRequirement
                ? "rgba(46, 125, 50, 0.16)"
                : "rgba(198, 40, 40, 0.16)",
              borderRadius: 10,
              border: meetsRequirement
                ? "1px solid rgba(76, 175, 80, 0.5)"
                : "1px solid rgba(244, 67, 54, 0.5)",
            }}
          >
            <div className="ui-rockbreak-req-item-title">Pickaxe Level</div>
            <div className="ui-rockbreak-req-item-row">
              <span>Required: Level {config.minPickaxeLevel}</span>
              <span
                style={{
                  color: meetsRequirement ? "#8dd694" : "#ff8a80",
                  fontWeight: "bold",
                }}
              >
                {meetsRequirement ? "✓" : "✗"} Level {pickaxeLevel}
              </span>
            </div>
          </div>

          <div
            className="ui-rockbreak-req-item"
            style={{
              padding: 10,
              backgroundColor: hasEnergy
                ? "rgba(33, 150, 243, 0.16)"
                : "rgba(198, 40, 40, 0.16)",
              borderRadius: 10,
              border: hasEnergy
                ? "1px solid rgba(33, 150, 243, 0.5)"
                : "1px solid rgba(244, 67, 54, 0.5)",
            }}
          >
            <div className="ui-rockbreak-req-item-title">Mana Cost</div>
            <div className="ui-rockbreak-req-item-row">
              <span>Required: {config.energyCost} ⚡</span>
              <span
                style={{
                  color: hasEnergy ? "#8ecbff" : "#ff8a80",
                  fontWeight: "bold",
                }}
              >
                {hasEnergy ? "✓" : "✗"} {currentEnergy}
              </span>
            </div>
          </div>
        </div>
      </div>

      {(!meetsRequirement || !hasEnergy) && (
        <div className="ui-rockbreak-warning">
          {!meetsRequirement && (
            <div>
              ⚠️ Your pickaxe is not strong enough. You need level{" "}
              {config.minPickaxeLevel - pickaxeLevel} more levels.
            </div>
          )}
          {!hasEnergy && (
            <div>
              ⚠️ Not enough mana. You need {config.energyCost - currentEnergy}{" "}
              more.
            </div>
          )}
        </div>
      )}

      <div className="ui-rockbreak-actions">
        <button className="btn-secondary ui-rockbreak-btn" onClick={onClose}>
          Cancel
        </button>
        <button
          className={`ui-rockbreak-btn ${meetsRequirement && hasEnergy ? "btn-primary" : ""}`}
          style={{
            backgroundColor:
              meetsRequirement && hasEnergy ? undefined : "#52606d",
            color: meetsRequirement && hasEnergy ? undefined : "#c7d0d9",
            border: "none",
            cursor: meetsRequirement && hasEnergy ? "pointer" : "not-allowed",
            boxShadow:
              meetsRequirement && hasEnergy
                ? "0 10px 20px rgba(0, 0, 0, 0.28)"
                : "none",
          }}
          disabled={!meetsRequirement || !hasEnergy}
          onClick={onConfirm}
        >
          Break Rock!
        </button>
      </div>
    </ModalShell>
  );
}
