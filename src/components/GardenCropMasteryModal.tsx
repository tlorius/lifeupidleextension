interface CropMasteryRecord {
  level: number;
  prestige: number;
  xp: number;
}

interface CropMasteryCropDef {
  id: string;
  name: string;
  category: string;
  baseGold: number;
}

interface GardenCropMasteryModalProps {
  isOpen: boolean;
  isMobile: boolean;
  allCropTypes: CropMasteryCropDef[];
  cropMaxLevel: number;
  getCropMastery: (cropId: string) => CropMasteryRecord;
  getCropYieldAtLevel: (cropId: string, level: number) => number;
  getCropGoldWithPrestige: (cropId: string) => number;
  getCropGoldMultiplier: (prestige: number) => number;
  getCropXpForNextLevel: (level: number) => number;
  formatCompactNumber: (value: number) => string;
  onClose: () => void;
  onPrestige: (cropId: string) => void;
}

export function GardenCropMasteryModal({
  isOpen,
  isMobile,
  allCropTypes,
  cropMaxLevel,
  getCropMastery,
  getCropYieldAtLevel,
  getCropGoldWithPrestige,
  getCropGoldMultiplier,
  getCropXpForNextLevel,
  formatCompactNumber,
  onClose,
  onPrestige,
}: GardenCropMasteryModalProps) {
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
          maxHeight: isMobile ? "88vh" : "82vh",
          maxWidth: "760px",
          width: isMobile ? "95vw" : "760px",
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
          <h3 style={{ margin: 0 }}>📈 Crop Mastery</h3>
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

        <div style={{ fontSize: 12, color: "#9eb0c2", marginBottom: 12 }}>
          Each level grants +1% crop yield for that crop type. Prestige at level
          100 resets that crop to level 1 and grants +20% crop yield and +10%
          gold for that crop type permanently.
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 10,
          }}
        >
          {allCropTypes.map((cropDef) => {
            const mastery = getCropMastery(cropDef.id);
            const currentYield = getCropYieldAtLevel(cropDef.id, mastery.level);
            const nextLevel = Math.min(cropMaxLevel, mastery.level + 1);
            const nextYield = getCropYieldAtLevel(cropDef.id, nextLevel);
            const currentGold = getCropGoldWithPrestige(cropDef.id);
            const nextGold = Math.max(
              1,
              Math.round(
                cropDef.baseGold * getCropGoldMultiplier(mastery.prestige + 1),
              ),
            );
            const xpToNext =
              mastery.level >= cropMaxLevel
                ? 0
                : getCropXpForNextLevel(mastery.level);
            const xpProgress =
              mastery.level >= cropMaxLevel
                ? 100
                : Math.min(100, (mastery.xp / xpToNext) * 100);

            return (
              <div
                key={cropDef.id}
                style={{
                  padding: 12,
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
                    marginBottom: 8,
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ fontWeight: "bold" }}>{cropDef.name}</div>
                  <div style={{ fontSize: 12, color: "#9eb0c2" }}>
                    Lv {mastery.level}/{cropMaxLevel} | Prestige{" "}
                    {mastery.prestige}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                    gap: 8,
                    fontSize: 12,
                    lineHeight: "1.5",
                  }}
                >
                  <div>
                    <div>
                      Current Yield: {currentYield} {cropDef.category}
                    </div>
                    <div>Current Gold: {formatCompactNumber(currentGold)}</div>
                  </div>
                  <div>
                    {mastery.level < cropMaxLevel ? (
                      <>
                        <div>
                          Next Lv Yield: {nextYield} {cropDef.category}
                        </div>
                        <div>
                          XP to next: {mastery.xp}/{xpToNext}
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          Next Prestige Yield: {nextYield} {cropDef.category}
                        </div>
                        <div>
                          Next Prestige Gold: {formatCompactNumber(nextGold)}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 8,
                    height: 8,
                    backgroundColor: "#2f4459",
                    borderRadius: 999,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${xpProgress}%`,
                      height: "100%",
                      backgroundColor:
                        mastery.level >= cropMaxLevel ? "#9c36ff" : "#51cf66",
                    }}
                  />
                </div>

                {mastery.level >= cropMaxLevel && (
                  <div
                    style={{
                      marginTop: 10,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ fontSize: 11, color: "#6b46c1" }}>
                      Prestige Bonus: +20% crop yield and +10% gold for this
                      crop type.
                    </div>
                    <button
                      className="btn-primary"
                      style={{ padding: "6px 10px", fontSize: 12 }}
                      onClick={() => onPrestige(cropDef.id)}
                    >
                      Prestige
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
