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
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(6, 10, 14, 0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background:
            "linear-gradient(180deg, rgba(24, 36, 51, 0.98) 0%, rgba(14, 22, 34, 0.98) 100%)",
          color: "#e5edf5",
          borderRadius: 18,
          padding: isMobile ? 16 : 22,
          maxHeight: isMobile ? "88vh" : "80vh",
          maxWidth: "540px",
          width: isMobile ? "94vw" : "540px",
          overflow: "auto",
          border: "1px solid rgba(116, 192, 252, 0.22)",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.45)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "#8eb8de",
                marginBottom: 6,
              }}
            >
              Rock obstacle
            </div>
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
          <div
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              backgroundColor: "rgba(74, 144, 226, 0.14)",
              border: "1px solid rgba(74, 144, 226, 0.3)",
              color: "#b7d7f5",
              fontSize: 12,
              fontWeight: 700,
              textTransform: "capitalize",
              whiteSpace: "nowrap",
            }}
          >
            {tier} tier
          </div>
        </div>

        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(47, 68, 89, 0.88) 0%, rgba(27, 45, 63, 0.88) 100%)",
            padding: 14,
            borderRadius: 14,
            marginBottom: 16,
            border: "1px solid rgba(143, 176, 194, 0.22)",
          }}
        >
          <div
            style={{
              fontWeight: "bold",
              marginBottom: 10,
              fontSize: 16,
            }}
          >
            {tier.charAt(0).toUpperCase() + tier.slice(1)} Rock
          </div>
          <div
            style={{
              fontSize: 13,
              color: "#c3d6e8",
              lineHeight: "1.7",
              display: "grid",
              gap: 6,
            }}
          >
            <div>
              Location: ({row}, {col})
            </div>
            <div>
              Difficulty:{" "}
              {tier === "large" ? "⭐⭐⭐" : tier === "medium" ? "⭐⭐" : "⭐"}
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "rgba(18, 29, 41, 0.92)",
            padding: 14,
            borderRadius: 14,
            marginBottom: 16,
            border: "1px solid rgba(143, 176, 194, 0.18)",
          }}
        >
          <div
            style={{
              fontWeight: "bold",
              marginBottom: 12,
              fontSize: 15,
            }}
          >
            Requirements
          </div>
          <div
            style={{
              fontSize: 12,
              lineHeight: "1.8",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div
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
              <div style={{ fontWeight: "bold", marginBottom: 4 }}>
                Pickaxe Level
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
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
              <div style={{ fontWeight: "bold", marginBottom: 4 }}>
                Mana Cost
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
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
          <div
            style={{
              backgroundColor: "rgba(255, 183, 77, 0.14)",
              padding: 12,
              borderRadius: 12,
              marginBottom: 16,
              fontSize: 12,
              color: "#ffd8a8",
              border: "1px solid rgba(255, 183, 77, 0.45)",
              lineHeight: 1.6,
            }}
          >
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

        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <button
            className="btn-secondary"
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              fontWeight: "bold",
            }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={meetsRequirement && hasEnergy ? "btn-primary" : ""}
            style={{
              padding: "10px 20px",
              backgroundColor:
                meetsRequirement && hasEnergy ? undefined : "#52606d",
              color: meetsRequirement && hasEnergy ? undefined : "#c7d0d9",
              border: "none",
              borderRadius: 10,
              cursor: meetsRequirement && hasEnergy ? "pointer" : "not-allowed",
              fontWeight: "bold",
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
      </div>
    </div>
  );
}
