import { ModalShell } from "./ui/ModalShell";

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
    <ModalShell
      onClose={onClose}
      overlayStyle={{ zIndex: 1200 }}
      panelStyle={{
        ["--modal-width" as string]: "560px",
        ["--modal-width-mobile" as string]: isMobile ? "94vw" : "95vw",
        ["--modal-max-height" as string]: "80vh",
        ["--modal-max-height-mobile" as string]: isMobile ? "88vh" : "88vh",
        ["--modal-padding" as string]: isMobile ? "10px" : "12px",
      }}
    >
      <div className="ui-modal-header" style={{ marginBottom: 8 }}>
        <span>
          Seed Bag {seedSelectionTarget === "planter" ? "(Planter Seed)" : ""}
        </span>
        <button className="ui-modal-close" onClick={onClose}>
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
    </ModalShell>
  );
}
