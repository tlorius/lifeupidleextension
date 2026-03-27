import { ModalShell } from "./ui/ModalShell";

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
    <ModalShell
      onClose={onClose}
      overlayStyle={{ zIndex: 1000 }}
      panelStyle={{
        ["--modal-width" as string]: "500px",
        ["--modal-width-mobile" as string]: isMobile ? "94vw" : "95vw",
        ["--modal-max-height" as string]: "80vh",
        ["--modal-max-height-mobile" as string]: isMobile ? "88vh" : "88vh",
        ["--modal-padding" as string]: isMobile ? "12px" : "20px",
      }}
    >
      <h3 className="ui-section-title-16">🌾 Ready to Harvest!</h3>

      <div className="ui-card ui-garden-detail-card">
        <div className="ui-garden-detail-title" style={{ marginBottom: 8 }}>
          {preview.name}
        </div>
        <div className="ui-garden-detail-meta">
          <div>Category: {preview.category}</div>
          <div>Rarity: {preview.rarity}</div>
          {preview.isPerennial && (
            <div style={{ color: "#2f9e44" }}>
              ♻️ This is a perennial - it will restart growing
            </div>
          )}
        </div>
      </div>

      <div className="ui-card ui-garden-detail-card ui-garden-detail-card--summary">
        <div className="ui-garden-detail-title" style={{ marginBottom: 10 }}>
          Harvest Summary
        </div>
        <div style={{ fontSize: 12, lineHeight: "1.8" }}>
          <div className="ui-garden-summary-row">
            <span>Base Yield:</span>
            <span>
              {preview.baseYield} {preview.category}
            </span>
          </div>
          <div
            className="ui-garden-summary-row"
            style={{ color: preview.waterLevel > 0 ? "#2f9e44" : "#999" }}
          >
            <span>
              Water Bonus (+{Math.round((preview.waterLevel / 100) * 100)}%):
            </span>
            <span>+{preview.waterBonus}</span>
          </div>
          <div className="ui-garden-summary-row ui-garden-summary-row--total">
            <span>Total {preview.category.toUpperCase()}:</span>
            <span style={{ color: "#51cf66" }}>+{preview.yieldAmount}</span>
          </div>
          <div className="ui-garden-summary-row" style={{ marginTop: 8 }}>
            <span>💰 Gold Reward:</span>
            <span style={{ color: "#FFD700" }}>+{preview.goldAmount}</span>
          </div>
          <div className="ui-garden-summary-row" style={{ marginTop: 4 }}>
            <span>⭐ XP (Category):</span>
            <span style={{ color: "#4169E1" }}>+{preview.baseXP}</span>
          </div>
        </div>
      </div>

      {preview.waterLevel > 0 && (
        <div
          className="ui-card ui-garden-detail-card ui-garden-detail-card--compact ui-garden-detail-card--water"
          style={{ fontSize: 12, color: "#8bc5ff" }}
        >
          <span>💧 Water bonus active!</span> Your crop's water level made it
          more productive. Keep watering your crops for better yields!
        </div>
      )}

      <div className="ui-action-row-end">
        <button
          className="ui-modal-btn-secondary ui-touch-target"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="ui-modal-btn-primary ui-touch-target"
          style={{
            backgroundColor: "#51cf66",
          }}
          onClick={onConfirm}
        >
          Harvest Now!
        </button>
      </div>
    </ModalShell>
  );
}
