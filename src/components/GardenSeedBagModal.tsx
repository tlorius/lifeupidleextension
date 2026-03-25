interface SeedBagEntry {
  seedId: string;
  icon: string;
  label: string;
  count: number;
}

interface GardenSeedBagModalProps {
  isOpen: boolean;
  isMobile: boolean;
  seedSelectionTarget: "seedbag" | "planter";
  seedBag: SeedBagEntry[];
  activeSeedBagSeedId: string | null;
  selectedPlanterSeedIdForModal: string | null | undefined;
  onClose: () => void;
  onSelectSeed: (seedId: string) => void;
}

export function GardenSeedBagModal({
  isOpen,
  isMobile,
  seedSelectionTarget,
  seedBag,
  activeSeedBagSeedId,
  selectedPlanterSeedIdForModal,
  onClose,
  onSelectSeed,
}: GardenSeedBagModalProps) {
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
        zIndex: 1200,
      }}
      onClick={onClose}
    >
      <div
        style={{
          padding: isMobile ? 10 : 12,
          backgroundColor: "#16212d",
          borderRadius: 8,
          border: "1px solid #2a3a4c",
          width: isMobile ? "94vw" : "560px",
          maxWidth: "560px",
          maxHeight: isMobile ? "88vh" : "80vh",
          overflow: "auto",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            fontWeight: "bold",
            marginBottom: 8,
            color: "#e5edf5",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>
            Seed Bag {seedSelectionTarget === "planter" ? "(Planter Seed)" : ""}
          </span>
          <button
            style={{
              padding: "4px 8px",
              backgroundColor: "#253649",
              border: "1px solid #3f546a",
              color: "#eaf2fb",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 12,
            }}
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {seedBag.length === 0 ? (
          <p style={{ fontSize: 12, color: "#9eb0c2" }}>No seeds yet</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: 8,
            }}
          >
            {seedBag.map((seed) => {
              const isSelected =
                seedSelectionTarget === "planter"
                  ? selectedPlanterSeedIdForModal === seed.seedId
                  : activeSeedBagSeedId === seed.seedId;

              return (
                <button
                  key={seed.seedId}
                  type="button"
                  className={isSelected ? "btn-selected" : ""}
                  style={{
                    padding: 8,
                    backgroundColor: isSelected ? "#1d6a3a" : "#1b2d3f",
                    border: isSelected
                      ? "2px solid #2f9e44"
                      : "1px solid #34516a",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontSize: 11,
                    textAlign: "left",
                    color: "#e5edf5",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                  }}
                  onClick={() => onSelectSeed(seed.seedId)}
                  title={seed.label}
                >
                  <span style={{ fontSize: 18, lineHeight: 1.1 }}>
                    {seed.icon}
                  </span>
                  <span>
                    <div style={{ fontWeight: "bold" }}>{seed.label}</div>
                    <div style={{ fontSize: 10, color: "#9eb0c2" }}>
                      x {seed.count}
                    </div>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
