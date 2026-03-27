import { ModalShell } from "./ui/ModalShell";

interface GardenPlantModalSeedEntry {
  seedId: string;
  icon: string;
  label: string;
  count: number;
  growthTimeMinutes?: number;
  baseYield?: number;
  category?: string;
  baseGold?: number;
  isPerennial?: boolean;
  isTree?: boolean;
  isPlantable: boolean;
}

interface GardenPlantModalProps {
  isOpen: boolean;
  isMobile: boolean;
  row: number;
  col: number;
  seedEntries: GardenPlantModalSeedEntry[];
  selectedSeedId: string | null;
  ownedSprinklers: number;
  ownedHarvesters: number;
  ownedPlanters: number;
  onClose: () => void;
  onSelectSeed: (seedId: string) => void;
  onConfirmPlant: () => void;
}

export function GardenPlantModal({
  isOpen,
  isMobile,
  row,
  col,
  seedEntries,
  selectedSeedId,
  ownedSprinklers,
  ownedHarvesters,
  ownedPlanters,
  onClose,
  onSelectSeed,
  onConfirmPlant,
}: GardenPlantModalProps) {
  if (!isOpen) {
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
        ["--modal-padding" as string]: isMobile ? "12px" : "16px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h3 className="ui-plant-header">
        Plant Seed at ({row}, {col})
      </h3>

      {seedEntries.length === 0 ? (
        <p style={{ color: "#9eb0c2", marginBottom: 16 }}>
          You don't have any seeds yet.
        </p>
      ) : (
        <>
          <div className="ui-plant-scroll">
            <div className="ui-plant-automation-note">
              Automation inventory: sprinkler {ownedSprinklers}, harvester{" "}
              {ownedHarvesters}, planter {ownedPlanters}
            </div>
            {ownedSprinklers === 0 &&
              ownedHarvesters === 0 &&
              ownedPlanters === 0 && (
                <div className="ui-plant-automation-empty">
                  Acquire a sprinkler, planter, or harvester to use automation
                  on empty fields.
                </div>
              )}
            <div className="ui-plant-seed-title">Available Seeds:</div>
            <div className="ui-plant-seed-list">
              {seedEntries.map((seed) => {
                const isSelected = selectedSeedId === seed.seedId;

                return (
                  <div
                    key={seed.seedId}
                    className="ui-plant-seed-option"
                    style={{
                      backgroundColor: isSelected ? "#1d6a3a" : "#1b2d3f",
                      border: isSelected
                        ? "2px solid #2f9e44"
                        : "1px solid #34516a",
                    }}
                    onClick={() => onSelectSeed(seed.seedId)}
                  >
                    <div className="ui-plant-seed-option-head">
                      <span>{seed.icon}</span>
                      <span>{seed.label}</span>
                    </div>
                    {seed.isPlantable && (
                      <div className="ui-plant-seed-badge-row">
                        <span
                          className="ui-plant-seed-badge"
                          style={{
                            backgroundColor: isSelected
                              ? "rgba(255,255,255,0.25)"
                              : "#e9f7ef",
                            color: isSelected ? "white" : "#2b8a3e",
                          }}
                        >
                          {seed.isTree ? "Tree" : "Field"}
                        </span>
                        <span
                          className="ui-plant-seed-badge"
                          style={{
                            backgroundColor: isSelected
                              ? "rgba(255,255,255,0.25)"
                              : "#fff3bf",
                            color: isSelected ? "white" : "#8a5d00",
                          }}
                        >
                          {seed.isPerennial ? "Repeatable" : "One-time"}
                        </span>
                      </div>
                    )}
                    <div
                      className="ui-plant-seed-meta"
                      style={{
                        color: isSelected
                          ? "rgba(229,237,245,0.95)"
                          : "#9eb0c2",
                      }}
                    >
                      <div>
                        {!seed.isPlantable && (
                          <div
                            className="ui-plant-seed-unplantable"
                            style={{
                              color: isSelected ? "#ffe3e3" : "#c92a2a",
                            }}
                          >
                            This seed is not plantable in the garden yet.
                          </div>
                        )}
                        Growth: {seed.growthTimeMinutes ?? "-"}m | Yield:{" "}
                        {seed.baseYield ?? "-"} {seed.category ?? "crop"} +{" "}
                        {seed.baseGold ?? 0} gold
                      </div>
                      <div>Available: x{seed.count}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="ui-plant-actions">
            <button className="ui-plant-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button
              className="ui-plant-confirm-btn"
              style={{
                backgroundColor:
                  selectedSeedId === null ? "#2c3e50" : "#1f7f43",
                color: selectedSeedId === null ? "#7f94a8" : "white",
                border: selectedSeedId === null ? "1px solid #3f546a" : "none",
                cursor: selectedSeedId === null ? "not-allowed" : "pointer",
              }}
              disabled={selectedSeedId === null}
              onClick={onConfirmPlant}
            >
              Plant
            </button>
          </div>
        </>
      )}
    </ModalShell>
  );
}
