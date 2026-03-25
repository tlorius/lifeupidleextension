interface HarvestPreview {
  cropId: string;
  cropIndex: number;
  row: number;
  col: number;
  name: string;
  category: string;
  rarity: string;
  isPerennial: boolean;
  baseYield: number;
  baseXP: number;
  waterLevel: number;
  yieldAmount: number;
  waterBonus: number;
  goldAmount: number;
}

interface GardenHarvestModalProps {
  isOpen: boolean;
  isMobile: boolean;
  preview: HarvestPreview | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function GardenHarvestModal({
  isOpen,
  isMobile,
  preview,
  onClose,
  onConfirm,
}: GardenHarvestModalProps) {
  if (!isOpen || !preview) {
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
          backgroundColor: "#162433",
          color: "#e5edf5",
          borderRadius: 8,
          padding: isMobile ? 12 : 20,
          maxHeight: isMobile ? "88vh" : "80vh",
          maxWidth: "500px",
          width: isMobile ? "94vw" : "500px",
          overflow: "auto",
          border: "1px solid #35506a",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: "0 0 16px 0" }}>🌾 Ready to Harvest!</h3>

        <div
          style={{
            backgroundColor: "#1b2d3f",
            padding: 12,
            borderRadius: 6,
            marginBottom: 16,
            border: "1px solid #2f4459",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: 8 }}>
            {preview.name}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#9eb0c2",
              lineHeight: "1.6",
            }}
          >
            <div>Category: {preview.category}</div>
            <div>Rarity: {preview.rarity}</div>
            {preview.isPerennial && (
              <div style={{ color: "#2f9e44" }}>
                ♻️ This is a perennial - it will restart growing
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#13261f",
            padding: 12,
            borderRadius: 6,
            marginBottom: 16,
            border: "1px solid #2c4d3c",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: 10 }}>
            Harvest Summary
          </div>
          <div style={{ fontSize: 12, lineHeight: "1.8" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Base Yield:</span>
              <span>
                {preview.baseYield} {preview.category}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: preview.waterLevel > 0 ? "#2f9e44" : "#999",
              }}
            >
              <span>
                Water Bonus (+{Math.round((preview.waterLevel / 100) * 100)}%):
              </span>
              <span>+{preview.waterBonus}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderTop: "1px solid #2f4459",
                paddingTop: 8,
                marginTop: 8,
                fontWeight: "bold",
              }}
            >
              <span>Total {preview.category.toUpperCase()}:</span>
              <span style={{ color: "#51cf66" }}>+{preview.yieldAmount}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 8,
              }}
            >
              <span>💰 Gold Reward:</span>
              <span style={{ color: "#FFD700" }}>+{preview.goldAmount}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 4,
              }}
            >
              <span>⭐ XP (Category):</span>
              <span style={{ color: "#4169E1" }}>+{preview.baseXP}</span>
            </div>
          </div>
        </div>

        {preview.waterLevel > 0 && (
          <div
            style={{
              backgroundColor: "#12283a",
              padding: 10,
              borderRadius: 6,
              marginBottom: 16,
              fontSize: 12,
              color: "#8bc5ff",
              border: "1px solid #23445f",
            }}
          >
            <span>💧 Water bonus active!</span> Your crop's water level made it
            more productive. Keep watering your crops for better yields!
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
          }}
        >
          <button
            style={{
              padding: "10px 20px",
              backgroundColor: "#253649",
              border: "1px solid #3f546a",
              color: "#eaf2fb",
              borderRadius: 4,
              cursor: "pointer",
              fontWeight: "bold",
            }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            style={{
              padding: "10px 20px",
              backgroundColor: "#51cf66",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontWeight: "bold",
            }}
            onClick={onConfirm}
          >
            Harvest Now!
          </button>
        </div>
      </div>
    </div>
  );
}
