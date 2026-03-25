import {
  harvestCrop,
  placeHarvesterOnField,
  placePlanterOnField,
  placeSprinklerOnField,
  reduceCropGrowthTime,
  removeHarvesterFromField,
  removePlanterFromField,
  removeSprinklerFromField,
  rockConfig,
  setCropSprinkler,
} from "../game/garden";
import { getItemDefSafe } from "../game/items";
import { formatCompactNumber } from "../game/numberFormat";
import {
  selectGardenCropTileDetailView,
  selectGardenEmptyTileAutomationView,
} from "../game/selectors/garden";
import type { GameState } from "../game/types";

interface TileDetailModalStateLike {
  isOpen: boolean;
  row: number;
  col: number;
  type: "empty" | "crop" | "rock" | null;
  cropId?: string;
  cropIndex?: number;
  emptyMode?: "choice" | "automation";
}

interface PendingPlanterActionLike {
  mode: "place" | "assign";
  row: number;
  col: number;
  planterId: string;
}

interface SprinklerPreviewStateLike {
  row: number;
  col: number;
  sprinklerId: string;
}

interface GardenTileDetailModalProps {
  state: GameState;
  tileDetailModal: TileDetailModalStateLike;
  isMobile: boolean;
  speedUpMinutes: number;
  speedUpGemCost: number;
  fieldCoverageText: (row: number, col: number) => string;
  isFieldCoveredBySprinklerNetwork: (
    row: number,
    col: number,
    ignoreOriginSprinkler?: boolean,
  ) => boolean;
  onClose: () => void;
  onSetEmptyMode: (mode: "choice" | "automation") => void;
  onOpenPlantModal: (row: number, col: number) => void;
  onOpenRockBreakModal: (
    row: number,
    col: number,
    rockTier: "small" | "medium" | "large",
  ) => void;
  onOpenPlanterSeedSelection: (
    action: PendingPlanterActionLike,
    closeTileModal?: boolean,
  ) => void;
  onSetSprinklerPreview: (preview: SprinklerPreviewStateLike | null) => void;
  onStateChange: (nextState: GameState) => void;
}

export function GardenTileDetailModal({
  state,
  tileDetailModal,
  isMobile,
  speedUpMinutes,
  speedUpGemCost,
  fieldCoverageText,
  isFieldCoveredBySprinklerNetwork,
  onClose,
  onSetEmptyMode,
  onOpenPlantModal,
  onOpenRockBreakModal,
  onOpenPlanterSeedSelection,
  onSetSprinklerPreview,
  onStateChange,
}: GardenTileDetailModalProps) {
  if (!tileDetailModal.isOpen) {
    return null;
  }

  const cropTileDetailView =
    tileDetailModal.type === "crop" &&
    tileDetailModal.cropId &&
    tileDetailModal.cropIndex !== undefined
      ? selectGardenCropTileDetailView(state, {
          cropId: tileDetailModal.cropId,
          cropIndex: tileDetailModal.cropIndex,
          row: tileDetailModal.row,
          col: tileDetailModal.col,
        })
      : null;

  const emptyTileAutomationView =
    tileDetailModal.type === "empty"
      ? selectGardenEmptyTileAutomationView(state, {
          row: tileDetailModal.row,
          col: tileDetailModal.col,
        })
      : null;

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
          padding: isMobile ? 12 : 20,
          maxHeight: isMobile ? "88vh" : "80vh",
          maxWidth: "500px",
          width: isMobile ? "94vw" : "500px",
          overflow: "auto",
          border: "1px solid #35506a",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        {tileDetailModal.type === "crop" && cropTileDetailView && (
          <GardenCropTileDetailSection
            state={state}
            view={cropTileDetailView}
            speedUpMinutes={speedUpMinutes}
            speedUpGemCost={speedUpGemCost}
            fieldCoverageText={fieldCoverageText}
            isFieldCoveredBySprinklerNetwork={isFieldCoveredBySprinklerNetwork}
            onClose={onClose}
            onOpenPlanterSeedSelection={onOpenPlanterSeedSelection}
            onSetSprinklerPreview={onSetSprinklerPreview}
            onStateChange={onStateChange}
          />
        )}

        {tileDetailModal.type === "rock" && (
          <GardenRockTileDetailSection
            state={state}
            row={tileDetailModal.row}
            col={tileDetailModal.col}
            onClose={onClose}
            onOpenRockBreakModal={onOpenRockBreakModal}
          />
        )}

        {tileDetailModal.type === "empty" && emptyTileAutomationView && (
          <GardenEmptyTileDetailSection
            state={state}
            emptyMode={tileDetailModal.emptyMode}
            view={emptyTileAutomationView}
            fieldCoverageText={fieldCoverageText}
            isFieldCoveredBySprinklerNetwork={isFieldCoveredBySprinklerNetwork}
            onClose={onClose}
            onSetEmptyMode={onSetEmptyMode}
            onOpenPlantModal={onOpenPlantModal}
            onOpenPlanterSeedSelection={onOpenPlanterSeedSelection}
            onSetSprinklerPreview={onSetSprinklerPreview}
            onStateChange={onStateChange}
          />
        )}
      </div>
    </div>
  );
}

function GardenCropTileDetailSection({
  state,
  view,
  speedUpMinutes,
  speedUpGemCost,
  fieldCoverageText,
  isFieldCoveredBySprinklerNetwork,
  onClose,
  onOpenPlanterSeedSelection,
  onSetSprinklerPreview,
  onStateChange,
}: {
  state: GameState;
  view: NonNullable<ReturnType<typeof selectGardenCropTileDetailView>>;
  speedUpMinutes: number;
  speedUpGemCost: number;
  fieldCoverageText: (row: number, col: number) => string;
  isFieldCoveredBySprinklerNetwork: (
    row: number,
    col: number,
    ignoreOriginSprinkler?: boolean,
  ) => boolean;
  onClose: () => void;
  onOpenPlanterSeedSelection: (
    action: PendingPlanterActionLike,
    closeTileModal?: boolean,
  ) => void;
  onSetSprinklerPreview: (preview: SprinklerPreviewStateLike | null) => void;
  onStateChange: (nextState: GameState) => void;
}) {
  const {
    cropId,
    cropIndex,
    cropDef,
    cropInstance,
    progress,
    isReady,
    timeRemainingMinutes,
    yieldAtHarvest,
    goldYield,
    cropRow,
    cropCol,
    harvesterOnTile,
    planterOnTile,
    ownedSprinklerIds,
    ownedHarvesterIds,
    ownedPlanterIds,
    planterSeedForTilePresentation,
  } = view;

  return (
    <>
      <h3 style={{ margin: "0 0 16px 0" }}>{cropDef.name}</h3>

      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontSize: 12,
            color: "#9eb0c2",
            marginBottom: 4,
          }}
        >
          Growth Progress: {progress.toFixed(0)}%
        </div>
        <div
          style={{
            height: 20,
            backgroundColor: "#2f4459",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              backgroundColor: isReady ? "#4CAF50" : "#FF9800",
              width: `${Math.min(progress, 100)}%`,
              transition: "width 0.3s",
            }}
          />
        </div>
      </div>

      {!isReady && (
        <div
          style={{
            backgroundColor: "#2a1f13",
            padding: 10,
            borderRadius: 6,
            marginBottom: 12,
            fontSize: 12,
            color: "#e8c08f",
            border: "1px solid #5e452c",
          }}
        >
          Time remaining: {Math.ceil(timeRemainingMinutes)} minutes
        </div>
      )}

      <div
        style={{
          backgroundColor: "#12283a",
          padding: 10,
          borderRadius: 6,
          marginBottom: 12,
          fontSize: 11,
          border: "1px solid #23445f",
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: 6 }}>
          💧 Water Mechanics
        </div>
        <div style={{ lineHeight: "1.6", color: "#b8cadb" }}>
          <div>Water Level: {cropInstance.waterLevel.toFixed(0)}%</div>
          <div>
            Sprinkler:{" "}
            {cropInstance.hasSprinkler ? "✓ Installed" : "✗ Not installed"}
          </div>
          <div style={{ marginTop: 6 }}>
            <strong>Watering Info:</strong>
          </div>
          <div>• Lasts: 12 hours</div>
          <div>• Decay rate: 100/720 min</div>
          <div>
            • Current bonus: +{Math.ceil(cropInstance.waterLevel)}% yield
          </div>
        </div>
      </div>

      <div
        style={{
          backgroundColor: "#10251d",
          padding: 10,
          borderRadius: 6,
          marginBottom: 12,
          fontSize: 11,
          border: "1px solid #2a4a3d",
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: 6 }}>
          Automation Tool Controls
        </div>
        <div style={{ marginBottom: 8, color: "#9eb0c2" }}>
          Manage sprinkler, harvester, and planter directly on this planted
          tile.
        </div>

        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              fontWeight: "bold",
              marginBottom: 6,
              color: "#9ed3ff",
            }}
          >
            Sprinkler
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {cropInstance.hasSprinkler ? (
              <button
                style={dangerSmallButtonStyle}
                onClick={() =>
                  onStateChange(setCropSprinkler(state, cropRow, cropCol, null))
                }
              >
                Remove Sprinkler
              </button>
            ) : ownedSprinklerIds.length > 0 ? (
              ownedSprinklerIds.map((sprinklerId) => {
                const sprinklerDef = getItemDefSafe(sprinklerId);
                return (
                  <button
                    key={sprinklerId}
                    style={{
                      ...smallButtonBaseStyle,
                      backgroundColor: "#e3f2fd",
                      color: "#0d47a1",
                      border: "1px solid #90caf9",
                    }}
                    onClick={() => {
                      if (
                        isFieldCoveredBySprinklerNetwork(cropRow, cropCol, true)
                      ) {
                        const proceed = window.confirm(
                          "This field is already covered by another sprinkler. Install anyway?",
                        );
                        if (!proceed) return;
                      }

                      const nextState = setCropSprinkler(
                        state,
                        cropRow,
                        cropCol,
                        sprinklerId,
                      );
                      if (nextState === state) {
                        alert(
                          "This tile already has another automation tool. Remove it first.",
                        );
                        return;
                      }
                      onStateChange(nextState);
                    }}
                    onMouseEnter={() =>
                      onSetSprinklerPreview({
                        row: cropRow,
                        col: cropCol,
                        sprinklerId,
                      })
                    }
                    onMouseLeave={() => onSetSprinklerPreview(null)}
                  >
                    Install {sprinklerDef?.name ?? sprinklerId}
                  </button>
                );
              })
            ) : (
              <span style={{ color: "#9eb0c2" }}>
                Acquire a sprinkler to use this function.
              </span>
            )}
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              fontWeight: "bold",
              marginBottom: 6,
              color: "#d1d5db",
            }}
          >
            Harvester
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {harvesterOnTile ? (
              <button
                style={dangerSmallButtonStyle}
                onClick={() =>
                  onStateChange(
                    removeHarvesterFromField(state, cropRow, cropCol),
                  )
                }
              >
                Remove Harvester
              </button>
            ) : ownedHarvesterIds.length > 0 ? (
              ownedHarvesterIds.map((harvesterId) => {
                const harvesterDef = getItemDefSafe(harvesterId);
                return (
                  <button
                    key={harvesterId}
                    style={{
                      ...smallButtonBaseStyle,
                      backgroundColor: "#334155",
                      color: "#e2e8f0",
                      border: "1px solid #64748b",
                    }}
                    onClick={() => {
                      const nextState = placeHarvesterOnField(
                        state,
                        cropRow,
                        cropCol,
                        harvesterId,
                      );
                      if (nextState === state) {
                        alert(
                          "This tile already has another automation tool. Remove it first.",
                        );
                        return;
                      }
                      onStateChange(nextState);
                    }}
                  >
                    Install {harvesterDef?.name ?? harvesterId}
                  </button>
                );
              })
            ) : (
              <span style={{ color: "#9eb0c2" }}>
                Acquire a harvester to use this function.
              </span>
            )}
          </div>
        </div>

        <div>
          <div
            style={{
              fontWeight: "bold",
              marginBottom: 6,
              color: "#b7efc5",
            }}
          >
            Planter
          </div>
          {planterOnTile && (
            <div style={{ marginBottom: 6, color: "#9eb0c2" }}>
              Seed: {planterSeedForTilePresentation?.icon}{" "}
              {planterSeedForTilePresentation?.label ?? "None"}
            </div>
          )}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {planterOnTile ? (
              <>
                <button
                  style={dangerSmallButtonStyle}
                  onClick={() =>
                    onStateChange(
                      removePlanterFromField(state, cropRow, cropCol),
                    )
                  }
                >
                  Remove Planter
                </button>
                <button
                  style={{
                    ...smallButtonBaseStyle,
                    backgroundColor: "#31572c",
                    color: "#d8f3dc",
                    border: "1px solid #4f772d",
                  }}
                  onClick={() =>
                    onOpenPlanterSeedSelection({
                      mode: "assign",
                      row: cropRow,
                      col: cropCol,
                      planterId: planterOnTile,
                    })
                  }
                >
                  Set This Planter's Seed
                </button>
              </>
            ) : ownedPlanterIds.length > 0 ? (
              ownedPlanterIds.map((planterId) => {
                const planterDef = getItemDefSafe(planterId);
                return (
                  <button
                    key={planterId}
                    style={{
                      ...smallButtonBaseStyle,
                      backgroundColor: "#1b4332",
                      color: "#d8f3dc",
                      border: "1px solid #2f9e44",
                    }}
                    onClick={() => {
                      if (!state.garden.selectedPlanterSeedId) {
                        onOpenPlanterSeedSelection({
                          mode: "place",
                          row: cropRow,
                          col: cropCol,
                          planterId,
                        });
                        return;
                      }

                      const nextState = placePlanterOnField(
                        state,
                        cropRow,
                        cropCol,
                        planterId,
                        state.garden.selectedPlanterSeedId,
                      );
                      if (nextState === state) {
                        alert(
                          "This tile already has another automation tool. Remove it first.",
                        );
                        return;
                      }
                      onStateChange(nextState);
                    }}
                  >
                    Install {planterDef?.name ?? planterId}
                  </button>
                );
              })
            ) : (
              <span style={{ color: "#9eb0c2" }}>
                Acquire a planter to use this function.
              </span>
            )}
          </div>
        </div>

        <div style={{ marginTop: 8, color: "#9eb0c2" }}>
          Coverage: {fieldCoverageText(cropRow, cropCol)}
        </div>
      </div>

      <div
        style={{
          backgroundColor: "#1b2d3f",
          padding: 10,
          borderRadius: 6,
          marginBottom: 16,
          fontSize: 11,
          border: "1px solid #2f4459",
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: 6 }}>📊 At Harvest</div>
        <div style={{ lineHeight: "1.6", color: "#b8cadb" }}>
          <div>
            Yield: {yieldAtHarvest} {cropDef.category}
          </div>
          <div>Gold: {goldYield}</div>
          <div>XP: {cropDef.baseXP}</div>
          <div style={{ marginTop: 6 }}>
            Type: {cropDef.isPerennial ? "🔄 Perennial" : "🚫 One-time"}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button style={secondaryButtonStyle} onClick={onClose}>
          Close
        </button>
        {!isReady && (
          <button
            style={{
              ...primaryActionButtonStyle,
              backgroundColor:
                (state.resources.gems ?? 0) >= speedUpGemCost
                  ? "#9c36ff"
                  : "#ccc",
              color:
                (state.resources.gems ?? 0) >= speedUpGemCost
                  ? "white"
                  : "#777",
              cursor:
                (state.resources.gems ?? 0) >= speedUpGemCost
                  ? "pointer"
                  : "not-allowed",
            }}
            disabled={(state.resources.gems ?? 0) < speedUpGemCost}
            onClick={() =>
              onStateChange(
                reduceCropGrowthTime(
                  state,
                  cropId,
                  cropIndex,
                  speedUpMinutes,
                  speedUpGemCost,
                ),
              )
            }
          >
            Reduce {speedUpMinutes}m ({formatCompactNumber(speedUpGemCost)}💎)
          </button>
        )}
        {isReady && (
          <button
            style={{
              ...primaryActionButtonStyle,
              backgroundColor: "#51cf66",
            }}
            onClick={() => {
              onStateChange(harvestCrop(state, cropId, cropIndex));
              onClose();
            }}
          >
            Harvest Now
          </button>
        )}
      </div>
    </>
  );
}

function GardenRockTileDetailSection({
  state,
  row,
  col,
  onClose,
  onOpenRockBreakModal,
}: {
  state: GameState;
  row: number;
  col: number;
  onClose: () => void;
  onOpenRockBreakModal: (
    row: number,
    col: number,
    rockTier: "small" | "medium" | "large",
  ) => void;
}) {
  const rockSmall = state.garden.rocks.small.find(
    (rock) => rock.row === row && rock.col === col,
  );
  const rockMedium = state.garden.rocks.medium.find(
    (rock) => rock.row === row && rock.col === col,
  );
  const tier = rockSmall ? "small" : rockMedium ? "medium" : "large";
  const config = rockConfig[tier];

  return (
    <>
      <h3 style={{ margin: "0 0 16px 0" }}>
        {tier.charAt(0).toUpperCase() + tier.slice(1)} Rock
      </h3>

      <div
        style={{
          backgroundColor: "#1b2d3f",
          padding: 12,
          borderRadius: 6,
          marginBottom: 16,
          border: "1px solid #2f4459",
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: "#9eb0c2",
            lineHeight: "1.6",
          }}
        >
          <div>
            Location: ({row}, {col})
          </div>
          <div>
            Difficulty:{" "}
            {tier === "large" ? "⭐⭐⭐" : tier === "medium" ? "⭐⭐" : "⭐"}
          </div>
          <div style={{ marginTop: 8 }}>
            <strong>Requirements:</strong>
          </div>
          <div>• Pickaxe Level: {config.minPickaxeLevel}+</div>
          <div>• Mana Cost: {config.energyCost} ⚡</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button style={secondaryButtonStyle} onClick={onClose}>
          Close
        </button>
        <button
          style={{
            ...primaryActionButtonStyle,
            backgroundColor: "#FF9800",
          }}
          onClick={() => onOpenRockBreakModal(row, col, tier)}
        >
          Break Rock
        </button>
      </div>
    </>
  );
}

function GardenEmptyTileDetailSection({
  state,
  emptyMode,
  view,
  fieldCoverageText,
  isFieldCoveredBySprinklerNetwork,
  onClose,
  onSetEmptyMode,
  onOpenPlantModal,
  onOpenPlanterSeedSelection,
  onSetSprinklerPreview,
  onStateChange,
}: {
  state: GameState;
  emptyMode: "choice" | "automation" | undefined;
  view: ReturnType<typeof selectGardenEmptyTileAutomationView>;
  fieldCoverageText: (row: number, col: number) => string;
  isFieldCoveredBySprinklerNetwork: (
    row: number,
    col: number,
    ignoreOriginSprinkler?: boolean,
  ) => boolean;
  onClose: () => void;
  onSetEmptyMode: (mode: "choice" | "automation") => void;
  onOpenPlantModal: (row: number, col: number) => void;
  onOpenPlanterSeedSelection: (
    action: PendingPlanterActionLike,
    closeTileModal?: boolean,
  ) => void;
  onSetSprinklerPreview: (preview: SprinklerPreviewStateLike | null) => void;
  onStateChange: (nextState: GameState) => void;
}) {
  const {
    emptyRow,
    emptyCol,
    fieldSprinklerId,
    fieldHarvesterId,
    fieldPlanterId,
    installedToolLabel,
    ownedSprinklerIds,
    ownedHarvesterIds,
    ownedPlanterIds,
    selectedSeedForTilePresentation,
  } = view;

  if (emptyMode === "automation") {
    return (
      <>
        <h3 style={{ margin: "0 0 16px 0" }}>
          Automation Tools @ ({emptyRow}, {emptyCol})
        </h3>

        <div
          style={{
            backgroundColor: "#12283a",
            padding: 12,
            borderRadius: 6,
            marginBottom: 16,
            border: "1px solid #23445f",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#8bc5ff",
              fontWeight: "bold",
              marginBottom: 6,
            }}
          >
            {installedToolLabel}
          </div>
          <div style={{ fontSize: 11, color: "#b8cadb" }}>
            Place a sprinkler, harvester, or planter. Only one automation tool
            can exist on a tile.
          </div>
          {fieldPlanterId && (
            <div style={{ marginTop: 6, fontSize: 11, color: "#b8cadb" }}>
              Planter seed: {selectedSeedForTilePresentation?.icon}{" "}
              {selectedSeedForTilePresentation?.label ?? "None"}
            </div>
          )}
          <div style={{ marginTop: 6, fontSize: 11, color: "#b8cadb" }}>
            Coverage tiers: common=self, rare=up/down/left/right (1), epic=rare
            + diagonals (1), legendary=epic pattern (2), unique=epic pattern
            (3).
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: "#b8cadb" }}>
            Coverage: {fieldCoverageText(emptyRow, emptyCol)}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 12,
          }}
        >
          {ownedSprinklerIds.length > 0 ? (
            ownedSprinklerIds.map((sprinklerId) => {
              const sprinklerDef = getItemDefSafe(sprinklerId);
              return (
                <button
                  key={sprinklerId}
                  style={{
                    ...smallButtonBaseStyle,
                    backgroundColor: "#1f3a4e",
                    color: "#9ed3ff",
                    border: "1px solid #3d5f79",
                  }}
                  onClick={() => {
                    if (
                      isFieldCoveredBySprinklerNetwork(emptyRow, emptyCol, true)
                    ) {
                      const proceed = window.confirm(
                        "This field is already covered by another sprinkler. Place anyway?",
                      );
                      if (!proceed) return;
                    }
                    onStateChange(
                      placeSprinklerOnField(
                        state,
                        emptyRow,
                        emptyCol,
                        sprinklerId,
                      ),
                    );
                  }}
                  onMouseEnter={() =>
                    onSetSprinklerPreview({
                      row: emptyRow,
                      col: emptyCol,
                      sprinklerId,
                    })
                  }
                  onMouseLeave={() => onSetSprinklerPreview(null)}
                >
                  Place {sprinklerDef?.name ?? sprinklerId}
                </button>
              );
            })
          ) : (
            <span style={{ color: "#9eb0c2", fontSize: 12 }}>
              No sprinkler tool in inventory.
            </span>
          )}

          {ownedHarvesterIds.length > 0 ? (
            ownedHarvesterIds.map((harvesterId) => {
              const harvesterDef = getItemDefSafe(harvesterId);
              return (
                <button
                  key={harvesterId}
                  style={{
                    ...smallButtonBaseStyle,
                    backgroundColor: "#334155",
                    color: "#e2e8f0",
                    border: "1px solid #64748b",
                  }}
                  onClick={() => {
                    const nextState = placeHarvesterOnField(
                      state,
                      emptyRow,
                      emptyCol,
                      harvesterId,
                    );
                    if (nextState === state) {
                      alert(
                        "Tile already occupied by another automation tool.",
                      );
                      return;
                    }
                    onStateChange(nextState);
                  }}
                >
                  Place {harvesterDef?.name ?? harvesterId}
                </button>
              );
            })
          ) : (
            <span style={{ color: "#9eb0c2", fontSize: 12 }}>
              No harvester tool in inventory.
            </span>
          )}

          {ownedPlanterIds.length > 0 ? (
            ownedPlanterIds.map((planterId) => {
              const planterDef = getItemDefSafe(planterId);
              return (
                <button
                  key={planterId}
                  style={{
                    ...smallButtonBaseStyle,
                    backgroundColor: "#1b4332",
                    color: "#d8f3dc",
                    border: "1px solid #2f9e44",
                  }}
                  onClick={() => {
                    if (!state.garden.selectedPlanterSeedId) {
                      onOpenPlanterSeedSelection(
                        {
                          mode: "place",
                          row: emptyRow,
                          col: emptyCol,
                          planterId,
                        },
                        true,
                      );
                      return;
                    }

                    const nextState = placePlanterOnField(
                      state,
                      emptyRow,
                      emptyCol,
                      planterId,
                      state.garden.selectedPlanterSeedId,
                    );
                    if (nextState === state) {
                      alert(
                        "Tile already occupied by another automation tool.",
                      );
                      return;
                    }
                    onStateChange(nextState);
                  }}
                >
                  Place {planterDef?.name ?? planterId}
                </button>
              );
            })
          ) : (
            <span style={{ color: "#9eb0c2", fontSize: 12 }}>
              No planter tool in inventory.
            </span>
          )}

          {fieldPlanterId && (
            <button
              style={{
                ...smallButtonBaseStyle,
                backgroundColor: "#31572c",
                color: "#d8f3dc",
                border: "1px solid #4f772d",
              }}
              onClick={() =>
                onOpenPlanterSeedSelection(
                  {
                    mode: "assign",
                    row: emptyRow,
                    col: emptyCol,
                    planterId: fieldPlanterId,
                  },
                  true,
                )
              }
            >
              Set This Planter's Seed
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            style={secondaryButtonStyle}
            onClick={() => onSetEmptyMode("choice")}
          >
            Back
          </button>
          {(fieldSprinklerId || fieldHarvesterId || fieldPlanterId) && (
            <button
              style={{
                ...dangerButtonStyle,
                border: "1px solid #f1998e",
              }}
              onClick={() => {
                const nextState = fieldSprinklerId
                  ? removeSprinklerFromField(state, emptyRow, emptyCol)
                  : fieldHarvesterId
                    ? removeHarvesterFromField(state, emptyRow, emptyCol)
                    : removePlanterFromField(state, emptyRow, emptyCol);
                onStateChange(nextState);
              }}
            >
              Remove Tool
            </button>
          )}
          <button style={secondaryButtonStyle} onClick={onClose}>
            Close
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <h3 style={{ margin: "0 0 16px 0" }}>
        Field Options @ ({view.emptyRow}, {view.emptyCol})
      </h3>

      <div
        style={{
          backgroundColor: "#10251d",
          padding: 12,
          borderRadius: 6,
          marginBottom: 16,
          border: "1px solid #2a4a3d",
        }}
      >
        <div style={{ fontSize: 12, color: "#7ad9a0", fontWeight: "bold" }}>
          Do you want to plant a crop or place an automation tool?
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button style={secondaryButtonStyle} onClick={onClose}>
          Close
        </button>
        <button
          style={{
            ...primaryActionButtonStyle,
            backgroundColor: "#2196F3",
          }}
          onClick={() => onSetEmptyMode("automation")}
        >
          Automation
        </button>
        <button
          style={{
            ...primaryActionButtonStyle,
            backgroundColor: "#51cf66",
          }}
          onClick={() => onOpenPlantModal(view.emptyRow, view.emptyCol)}
        >
          Plant
        </button>
      </div>
    </>
  );
}

const smallButtonBaseStyle = {
  padding: "6px 10px",
  borderRadius: 4,
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: 11,
} as const;

const dangerSmallButtonStyle = {
  ...smallButtonBaseStyle,
  backgroundColor: "#ffebe8",
  color: "#c62828",
  border: "1px solid #f1998e",
} as const;

const secondaryButtonStyle = {
  padding: "10px 20px",
  backgroundColor: "#253649",
  border: "1px solid #3f546a",
  color: "#eaf2fb",
  borderRadius: 4,
  cursor: "pointer",
  fontWeight: "bold",
} as const;

const primaryActionButtonStyle = {
  padding: "10px 20px",
  color: "white",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  fontWeight: "bold",
} as const;

const dangerButtonStyle = {
  padding: "10px 20px",
  backgroundColor: "#ffebe8",
  color: "#c62828",
  borderRadius: 4,
  cursor: "pointer",
  fontWeight: "bold",
} as const;
