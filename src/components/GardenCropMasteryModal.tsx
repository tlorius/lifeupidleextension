import { ModalHeader } from "./ui/ModalHeader";
import { ModalShell } from "./ui/ModalShell";
import { ProgressBar } from "./ui/ProgressBar";

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
    <ModalShell
      onClose={onClose}
      panelStyle={{
        ["--modal-width" as string]: "760px",
        ["--modal-width-mobile" as string]: isMobile ? "95vw" : "95vw",
        ["--modal-max-height" as string]: "82vh",
        ["--modal-max-height-mobile" as string]: isMobile ? "88vh" : "88vh",
        ["--modal-padding" as string]: isMobile ? "12px" : "16px",
      }}
    >
      <ModalHeader
        style={{ marginBottom: 12 }}
        heading="📈 Crop Mastery"
        actions={
          <button className="ui-modal-close" onClick={onClose}>
            Close
          </button>
        }
      />

      <div className="ui-mastery-note">
        Each level grants +1% crop yield for that crop type. Prestige at level
        100 resets that crop to level 1 and grants +20% crop yield and +10% gold
        for that crop type permanently.
      </div>

      <div className="ui-mastery-list">
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
            <div key={cropDef.id} className="ui-card ui-mastery-card">
              <div className="ui-mastery-head">
                <div className="ui-mastery-title">{cropDef.name}</div>
                <div className="ui-mastery-level">
                  Lv {mastery.level}/{cropMaxLevel} | Prestige{" "}
                  {mastery.prestige}
                </div>
              </div>

              <div
                className={`ui-mastery-grid ${isMobile ? "" : "ui-mastery-grid-2"}`}
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

              <ProgressBar
                className=""
                value={xpProgress}
                trackStyle={{ marginTop: 8 }}
                fillStyle={{
                  backgroundColor:
                    mastery.level >= cropMaxLevel ? "#9c36ff" : "#51cf66",
                }}
              />

              {mastery.level >= cropMaxLevel && (
                <div className="ui-mastery-prestige-row">
                  <div className="ui-mastery-prestige-note">
                    Prestige Bonus: +20% crop yield and +10% gold for this crop
                    type.
                  </div>
                  <button
                    className="btn-primary ui-mastery-prestige-btn"
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
    </ModalShell>
  );
}
