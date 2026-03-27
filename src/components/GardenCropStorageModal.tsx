import { ModalHeader } from "./ui/ModalHeader";
import { ModalShell } from "./ui/ModalShell";
import { ProgressBar } from "./ui/ProgressBar";
import { ValueRow } from "./ui/ValueRow";

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
      <ModalHeader
        style={{ marginBottom: 12 }}
        heading="🛢️ Crop Silos"
        actions={
          <button className="ui-modal-close" onClick={onClose}>
            Close
          </button>
        }
      />

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
              <ValueRow
                style={{ marginBottom: 4 }}
                left={
                  <>
                    {entry.icon} {entry.label}
                  </>
                }
                right={`${entry.amount} / ${entry.limit}`}
              />
              <ProgressBar
                value={percent}
                fillStyle={{ backgroundColor: "#51cf66" }}
              />
            </div>
          );
        })}
      </div>
    </ModalShell>
  );
}
