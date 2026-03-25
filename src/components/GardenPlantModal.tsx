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
          maxWidth: "500px",
          width: isMobile ? "94vw" : "500px",
          border: "1px solid #35506a",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: "0 0 16px 0" }}>
          Plant Seed at ({row}, {col})
        </h3>

        {seedEntries.length === 0 ? (
          <p style={{ color: "#9eb0c2", marginBottom: 16 }}>
            You don't have any seeds yet.
          </p>
        ) : (
          <>
            <div
              style={{
                marginBottom: 16,
                overflowY: "auto",
                maxHeight: "50vh",
              }}
            >
              <div
                style={{
                  marginBottom: 12,
                  fontSize: 11,
                  color: "#b8cadb",
                  lineHeight: 1.5,
                }}
              >
                Automation inventory: sprinkler {ownedSprinklers}, harvester{" "}
                {ownedHarvesters}, planter {ownedPlanters}
              </div>
              {ownedSprinklers === 0 &&
                ownedHarvesters === 0 &&
                ownedPlanters === 0 && (
                  <div
                    style={{
                      marginBottom: 12,
                      fontSize: 11,
                      color: "#9eb0c2",
                    }}
                  >
                    Acquire a sprinkler, planter, or harvester to use automation
                    on empty fields.
                  </div>
                )}
              <div
                style={{
                  fontWeight: "bold",
                  marginBottom: 8,
                  position: "sticky",
                  top: 0,
                  backgroundColor: "#162433",
                  paddingBottom: 8,
                  color: "#e5edf5",
                }}
              >
                Available Seeds:
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {seedEntries.map((seed) => {
                  const isSelected = selectedSeedId === seed.seedId;

                  return (
                    <div
                      key={seed.seedId}
                      style={{
                        padding: 8,
                        backgroundColor: isSelected ? "#1d6a3a" : "#1b2d3f",
                        border: isSelected
                          ? "2px solid #2f9e44"
                          : "1px solid #34516a",
                        borderRadius: 4,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                      onClick={() => onSelectSeed(seed.seedId)}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontWeight: "bold",
                          color: "#e5edf5",
                        }}
                      >
                        <span>{seed.icon}</span>
                        <span>{seed.label}</span>
                      </div>
                      {seed.isPlantable && (
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            flexWrap: "wrap",
                            marginTop: 6,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 10,
                              padding: "2px 6px",
                              borderRadius: 999,
                              backgroundColor: isSelected
                                ? "rgba(255,255,255,0.25)"
                                : "#e9f7ef",
                              color: isSelected ? "white" : "#2b8a3e",
                              fontWeight: "bold",
                            }}
                          >
                            {seed.isTree ? "Tree" : "Field"}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              padding: "2px 6px",
                              borderRadius: 999,
                              backgroundColor: isSelected
                                ? "rgba(255,255,255,0.25)"
                                : "#fff3bf",
                              color: isSelected ? "white" : "#8a5d00",
                              fontWeight: "bold",
                            }}
                          >
                            {seed.isPerennial ? "Repeatable" : "One-time"}
                          </span>
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: 12,
                          color: isSelected
                            ? "rgba(229,237,245,0.95)"
                            : "#9eb0c2",
                          marginTop: 4,
                        }}
                      >
                        <div>
                          {!seed.isPlantable && (
                            <div
                              style={{
                                fontSize: 11,
                                color: isSelected ? "#ffe3e3" : "#c92a2a",
                                marginTop: 4,
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

            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
                marginTop: "auto",
                paddingTop: 16,
              }}
            >
              <button
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#253649",
                  border: "1px solid #3f546a",
                  color: "#eaf2fb",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                style={{
                  padding: "8px 16px",
                  backgroundColor:
                    selectedSeedId === null ? "#2c3e50" : "#1f7f43",
                  color: selectedSeedId === null ? "#7f94a8" : "white",
                  border:
                    selectedSeedId === null ? "1px solid #3f546a" : "none",
                  borderRadius: 4,
                  cursor: selectedSeedId === null ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                }}
                disabled={selectedSeedId === null}
                onClick={onConfirmPlant}
              >
                Plant
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
