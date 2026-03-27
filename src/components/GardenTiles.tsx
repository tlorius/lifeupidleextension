import { TileChip } from "./ui/TileChip";

interface GardenRockTileProps {
  tileKey: string;
  tier: "small" | "medium" | "large";
  minPickaxeLevel: number;
  energyCost: number;
  isSprinklerPreviewTarget: boolean;
  pickaxeActive: boolean;
  cannotBreakRock: boolean;
  cannotBreakReason: string;
  compactGridLabels: boolean;
  onClick: () => void;
}

export function GardenRockTile({
  tileKey,
  tier,
  minPickaxeLevel,
  energyCost,
  isSprinklerPreviewTarget,
  pickaxeActive,
  cannotBreakRock,
  cannotBreakReason,
  compactGridLabels,
  onClick,
}: GardenRockTileProps) {
  return (
    <div
      key={tileKey}
      style={{
        width: "100%",
        aspectRatio: "1",
        backgroundColor: "#555",
        border: "2px solid #333",
        outline: isSprinklerPreviewTarget ? "2px dashed #74c0fc" : "none",
        borderRadius: 4,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 24,
        position: "relative",
        overflow: "hidden",
        opacity: pickaxeActive ? 1 : 0.8,
        filter: pickaxeActive
          ? "drop-shadow(0 0 6px rgba(255, 200, 0, 0.6))"
          : "none",
      }}
      aria-label={`${tier} rock - requires pickaxe (Level ${minPickaxeLevel}+, ${energyCost} mana)`}
      onClick={onClick}
    >
      🪨
      {cannotBreakRock && (
        <div
          style={{
            position: "absolute",
            top: 2,
            left: 2,
            fontSize: compactGridLabels ? 10 : 11,
            lineHeight: 1,
            backgroundColor: "#ff6b6b",
            color: "white",
            borderRadius: "50%",
            width: compactGridLabels ? 14 : 16,
            height: compactGridLabels ? 14 : 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
          }}
          aria-label="Cannot break yet"
          title={cannotBreakReason}
        >
          ⛔
        </div>
      )}
      {pickaxeActive && (
        <div
          style={{
            position: "absolute",
            top: 2,
            right: 2,
            fontSize: 12,
            backgroundColor: "#FFD700",
            color: "#333",
            borderRadius: "50%",
            width: 18,
            height: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            animation: "pulse 1.5s infinite",
          }}
          aria-label="Ready to break"
        >
          ⛏️
        </div>
      )}
    </div>
  );
}

interface GardenCropTileProps {
  tileKey: string;
  cropName: string;
  progress: number;
  waterLevel: number;
  hasSprinkler: boolean;
  isReady: boolean;
  isWithinSelectedMoveArea: boolean;
  isSprinklerPreviewTarget: boolean;
  stageEmoji: string;
  coveredByAdjacentSprinkler: boolean;
  harvesterOnTile: boolean;
  planterOnTile: boolean;
  onClick: () => void;
}

export function GardenCropTile({
  tileKey,
  cropName,
  progress,
  waterLevel,
  hasSprinkler,
  isReady,
  isWithinSelectedMoveArea,
  isSprinklerPreviewTarget,
  stageEmoji,
  coveredByAdjacentSprinkler,
  harvesterOnTile,
  planterOnTile,
  onClick,
}: GardenCropTileProps) {
  return (
    <div
      key={tileKey}
      style={{
        width: "100%",
        aspectRatio: "1",
        backgroundColor: hasSprinkler
          ? "#cfefff"
          : coveredByAdjacentSprinkler
            ? "#e6f6ff"
            : waterLevel > 50
              ? "#8B7D6B"
              : "#A0826D",
        border: "2px solid #654321",
        outline: isWithinSelectedMoveArea
          ? "2px solid #ffd43b"
          : isSprinklerPreviewTarget
            ? "2px dashed #74c0fc"
            : "none",
        borderRadius: 4,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 32,
        position: "relative",
        overflow: "hidden",
        opacity: isReady ? 1 : 0.6 + (progress / 100) * 0.4,
        boxShadow:
          waterLevel > 0
            ? `inset 0 0 0 2px rgba(65, 105, 225, ${waterLevel / 100})`
            : "none",
      }}
      aria-label={`${cropName} - ${progress.toFixed(0)}% grown - Water: ${waterLevel.toFixed(0)}%`}
      onClick={onClick}
    >
      {stageEmoji}

      {waterLevel > 0 && !hasSprinkler && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "4px",
            backgroundColor: "rgba(65, 105, 225, 0.3)",
            borderRadius: "0 0 2px 2px",
          }}
        >
          <div
            style={{
              height: "100%",
              backgroundColor: "#4169E1",
              width: `${waterLevel}%`,
              borderRadius: "0 0 2px 2px",
            }}
          />
        </div>
      )}

      {hasSprinkler && (
        <div
          style={{
            position: "absolute",
            top: 2,
            right: 2,
            fontSize: 12,
            backgroundColor: "#4169E1",
            borderRadius: "50%",
            width: 18,
            height: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="Has sprinkler"
        >
          💧
        </div>
      )}

      {coveredByAdjacentSprinkler && (
        <TileChip
          tone="adj"
          style={{
            position: "absolute",
            top: 2,
            left: 2,
          }}
          aria-label="Covered by adjacent sprinkler"
        >
          ADJ
        </TileChip>
      )}

      {harvesterOnTile && (
        <TileChip
          tone="harvester"
          style={{
            position: "absolute",
            bottom: 2,
            right: 2,
          }}
          aria-label="Harvester installed"
        >
          HARV
        </TileChip>
      )}

      {planterOnTile && (
        <TileChip
          tone="planter"
          style={{
            position: "absolute",
            bottom: 2,
            left: 2,
          }}
          aria-label="Planter installed"
        >
          PLAN
        </TileChip>
      )}
    </div>
  );
}

interface GardenPreviewFieldTileProps {
  tileKey: string;
  isAdjacentUnlockable: boolean;
  compactGridLabels: boolean;
  isSprinklerPreviewTarget: boolean;
  previewTitle: string;
  previewLabel: string;
  cannotUnlockField: boolean;
  cannotUnlockReason: string;
  onClick: () => void;
}

export function GardenPreviewFieldTile({
  tileKey,
  isAdjacentUnlockable,
  compactGridLabels,
  isSprinklerPreviewTarget,
  previewTitle,
  previewLabel,
  cannotUnlockField,
  cannotUnlockReason,
  onClick,
}: GardenPreviewFieldTileProps) {
  return (
    <div
      key={tileKey}
      style={{
        width: "100%",
        aspectRatio: "1",
        backgroundColor: "#C19A6B",
        border: isAdjacentUnlockable
          ? "2px dashed #8B7355"
          : "2px dashed #b76e79",
        outline: isSprinklerPreviewTarget ? "2px dashed #74c0fc" : "none",
        borderRadius: 4,
        cursor: isAdjacentUnlockable ? "pointer" : "not-allowed",
        opacity: isAdjacentUnlockable ? 0.6 : 0.45,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: compactGridLabels ? 14 : 10,
        color: isAdjacentUnlockable ? "#333" : "#8b0000",
        position: "relative",
        textAlign: "center",
        lineHeight: 1.1,
        padding: 2,
      }}
      aria-label={previewTitle}
      title={previewTitle}
      onClick={onClick}
    >
      {previewLabel}
      {isAdjacentUnlockable && cannotUnlockField && (
        <div
          style={{
            position: "absolute",
            top: 3,
            right: 3,
            fontSize: 11,
            lineHeight: 1,
            backgroundColor: "#ff6b6b",
            color: "white",
            borderRadius: "50%",
            width: compactGridLabels ? 14 : 16,
            height: compactGridLabels ? 14 : 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
          }}
          aria-label="Cannot unlock yet"
          title={cannotUnlockReason}
        >
          ⛔
        </div>
      )}
    </div>
  );
}

interface GardenEmptyFieldTileProps {
  tileKey: string;
  isWithinSelectedMoveArea: boolean;
  isSprinklerPreviewTarget: boolean;
  fieldSprinklerId: string | null;
  fieldHarvesterId: string | null;
  fieldPlanterId: string | null;
  fieldCoveredByAdjacentSprinkler: boolean;
  compactGridLabels: boolean;
  onClick: () => void;
}

export function GardenEmptyFieldTile({
  tileKey,
  isWithinSelectedMoveArea,
  isSprinklerPreviewTarget,
  fieldSprinklerId,
  fieldHarvesterId,
  fieldPlanterId,
  fieldCoveredByAdjacentSprinkler,
  compactGridLabels,
  onClick,
}: GardenEmptyFieldTileProps) {
  return (
    <div
      key={tileKey}
      style={{
        width: "100%",
        aspectRatio: "1",
        backgroundColor: fieldSprinklerId
          ? "#cfefff"
          : fieldHarvesterId
            ? "#e2e8f0"
            : fieldPlanterId
              ? "#e6f4ea"
              : fieldCoveredByAdjacentSprinkler
                ? "#e6f6ff"
                : "#8B7355",
        border: fieldSprinklerId
          ? "2px solid #74c0fc"
          : fieldHarvesterId
            ? "2px solid #64748b"
            : fieldPlanterId
              ? "2px solid #2f9e44"
              : fieldCoveredByAdjacentSprinkler
                ? "2px solid #a5d8ff"
                : "2px solid #654321",
        outline: isWithinSelectedMoveArea
          ? "2px solid #ffd43b"
          : isSprinklerPreviewTarget
            ? "2px dashed #74c0fc"
            : "none",
        borderRadius: 4,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: compactGridLabels ? 16 : 14,
        color: fieldSprinklerId
          ? "#0b4f75"
          : fieldHarvesterId
            ? "#334155"
            : fieldPlanterId
              ? "#1b4332"
              : fieldCoveredByAdjacentSprinkler
                ? "#1864ab"
                : "#555",
        textAlign: "center",
        lineHeight: 1.1,
        padding: 2,
      }}
      aria-label="Empty field - click to manage planting or sprinkler"
      onClick={onClick}
    >
      {compactGridLabels
        ? fieldSprinklerId
          ? "💧"
          : fieldHarvesterId
            ? "🤖"
            : fieldPlanterId
              ? "🌱"
              : fieldCoveredByAdjacentSprinkler
                ? "💦"
                : "+"
        : fieldSprinklerId
          ? "💧 Sprinkler"
          : fieldHarvesterId
            ? "🤖 Harvester"
            : fieldPlanterId
              ? "🌱 Planter"
              : fieldCoveredByAdjacentSprinkler
                ? "💦 Adjacent Water"
                : "Plant / Automation"}
    </div>
  );
}
