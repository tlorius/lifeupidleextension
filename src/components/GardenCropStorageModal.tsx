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
          padding: isMobile ? 12 : 16,
          maxHeight: isMobile ? "88vh" : "80vh",
          maxWidth: "560px",
          width: isMobile ? "94vw" : "560px",
          overflow: "auto",
          border: "1px solid #35506a",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <h3 style={{ margin: 0 }}>🛢️ Crop Silos</h3>
          <button
            style={{
              padding: "6px 10px",
              backgroundColor: "#253649",
              border: "1px solid #3f546a",
              color: "#eaf2fb",
              borderRadius: 4,
              cursor: "pointer",
            }}
            onClick={onClose}
          >
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
              <div
                key={entry.category}
                style={{
                  padding: 10,
                  border: "1px solid #2f4459",
                  borderRadius: 6,
                  backgroundColor: "#1b2d3f",
                }}
              >
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
                <div
                  style={{
                    height: 8,
                    backgroundColor: "#2f4459",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      backgroundColor: "#51cf66",
                      width: `${Math.max(0, Math.min(100, percent))}%`,
                      transition: "width 0.3s",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
