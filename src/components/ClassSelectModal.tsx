import { useGame } from "../game/GameContext";
import { useGameActions } from "../game/useGameActions";
import {
  allClassDefinitions,
  CLASS_SWITCH_GEM_COST,
  CLASS_UNLOCK_LEVEL,
  isClassSystemUnlocked,
} from "../game/classes";
import archerPortrait from "../assets/classes/archer.svg";
import berserkerPortrait from "../assets/classes/berserker.svg";
import farmerPortrait from "../assets/classes/farmer.svg";
import idlerPortrait from "../assets/classes/idler.svg";
import sorceressPortrait from "../assets/classes/sorceress.svg";
import tamerPortrait from "../assets/classes/tamer.svg";
import { ModalShell } from "./ui/ModalShell";

interface ClassSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const classPortraits: Record<string, string> = {
  archer: archerPortrait,
  berserker: berserkerPortrait,
  farmer: farmerPortrait,
  idler: idlerPortrait,
  sorceress: sorceressPortrait,
  tamer: tamerPortrait,
};

export function ClassSelectModal({ isOpen, onClose }: ClassSelectModalProps) {
  const { state } = useGame();
  const { switchClass } = useGameActions();

  if (!isOpen) return null;

  const activeClassId = state.character.activeClassId;
  const classSystemUnlocked = isClassSystemUnlocked(state.playerProgress.level);

  return (
    <ModalShell
      onClose={onClose}
      panelStyle={{
        width: "min(800px, 100%)",
      }}
    >
      {/* Header */}
      <div className="ui-modal-header">
        <h2 className="ui-modal-title">Select Your Class</h2>
        <button className="ui-modal-close" onClick={onClose}>
          Close
        </button>
      </div>

      {/* Info Text */}
      <div
        style={{
          marginBottom: 14,
          paddingBottom: 12,
          borderBottom: "1px solid rgba(109, 144, 173, 0.25)",
          fontSize: 12,
          color: "#b8d5ea",
        }}
      >
        {!classSystemUnlocked ? (
          <div style={{ color: "#ffd9a3" }}>
            ⭐ Reach level {CLASS_UNLOCK_LEVEL} to select a class.
          </div>
        ) : (
          <div>
            ⭐ Your first class is free. Switching classes costs{" "}
            <strong>{CLASS_SWITCH_GEM_COST} gems</strong>.
          </div>
        )}
      </div>

      {/* Classes Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
        }}
      >
        {allClassDefinitions.map((classDef) => {
          const isActive = activeClassId === classDef.id;
          const requiresGems = activeClassId !== null;
          const notEnoughGems =
            requiresGems && (state.resources.gems ?? 0) < CLASS_SWITCH_GEM_COST;
          const canSwitch =
            classSystemUnlocked && (!notEnoughGems || !requiresGems);

          return (
            <div
              key={classDef.id}
              style={{
                border: isActive ? "2px solid #67e8c6" : "1px solid #2f4459",
                borderRadius: 10,
                overflow: "hidden",
                backgroundColor: isActive ? "#1a2e3d" : "#11212f",
                cursor: canSwitch && !isActive ? "pointer" : "default",
                transition: "all 0.2s",
                display: "flex",
                flexDirection: "column",
              }}
              onMouseEnter={(e) => {
                if (!isActive && canSwitch) {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "#5dd9c9";
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    "#162835";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive && canSwitch) {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "#2f4459";
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    "#11212f";
                }
              }}
            >
              {/* Portrait */}
              <img
                src={classPortraits[classDef.id]}
                alt={`${classDef.name} class portrait`}
                style={{
                  width: "100%",
                  height: 120,
                  objectFit: "cover",
                  opacity: classDef.portraitAsset ? 1 : 0.6,
                }}
              />

              {/* Description */}
              <div
                style={{
                  padding: 12,
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    color: isActive ? "#67e8c6" : "#eaf3fb",
                    fontWeight: 700,
                    fontSize: 14,
                    marginBottom: 4,
                  }}
                >
                  {classDef.name}
                </div>
                <div
                  style={{
                    color: "#9fc2dc",
                    fontSize: 11,
                    marginBottom: 6,
                    opacity: 0.9,
                    flex: 1,
                  }}
                >
                  {classDef.summary}
                </div>
                <div style={{ fontSize: 10, color: "#7fb7d8", marginTop: 4 }}>
                  {classDef.nodes.length} nodes • {classDef.classSpells.length}{" "}
                  spells
                </div>

                {/* Button */}
                <button
                  disabled={!canSwitch}
                  onClick={() => {
                    switchClass(classDef.id);
                    onClose();
                  }}
                  style={{
                    marginTop: 10,
                    padding: "6px 10px",
                    fontSize: 11,
                    borderRadius: 7,
                    border: "1px solid rgba(109, 144, 173, 0.35)",
                    background: isActive
                      ? "rgba(103, 232, 198, 0.15)"
                      : "rgba(20, 35, 50, 0.65)",
                    color: isActive ? "#67e8c6" : "#9fc6ff",
                    cursor: canSwitch && !isActive ? "pointer" : "not-allowed",
                    opacity: canSwitch ? 1 : 0.5,
                    fontWeight: 600,
                  }}
                >
                  {isActive ? "✓ Active" : canSwitch ? "Select" : "Locked"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ModalShell>
  );
}
