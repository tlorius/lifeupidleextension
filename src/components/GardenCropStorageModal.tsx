import { ModalShell } from "./ui/ModalShell";

interface CropStorageEntry {
  category: string;
  icon: string;
  label: string;
  amount: number;
  limit: number;
}

interface GardenCropStorageModalProps {
  isOpen: boolean;
  isMobile: boolean;
  entries: CropStorageEntry[];
  onClose: () => void;
}

export function GardenCropStorageModal({
  isOpen,
  isMobile,
  entries,
  onClose,
}: GardenCropStorageModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <ModalShell
      onClose={onClose}
      panelStyle={{
        ["--modal-width" as string]: "560px",
        ["--modal-width-mobile" as string]: isMobile ? "94vw" : "95vw",
        ["--modal-max-height" as string]: "80vh",
        ["--modal-max-height-mobile" as string]: isMobile ? "88vh" : "88vh",
        ["--modal-padding" as string]: isMobile ? "12px" : "16px",
      }}
    >
      <div className="ui-modal-header" style={{ marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>🛢️ Crop Silos</h3>
        <button className="ui-modal-close" onClick={onClose}>
          Close
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 10,
          fontSize: isMobile ? 13 : 12,
        }}
      >
        {entries.map((entry) => {
          const percent =
            entry.limit > 0 ? (entry.amount / entry.limit) * 100 : 0;
          return (
            <div key={entry.category} className="ui-card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <span>
                  {entry.icon} {entry.label}
                </span>
                <span>
                  {entry.amount} / {entry.limit}
                </span>
              </div>
              <div className="ui-progress-track">
                <div
                  className="ui-progress-fill"
                  style={{
                    backgroundColor: "#51cf66",
                    width: `${Math.max(0, Math.min(100, percent))}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ModalShell>
  );
}
