import {
  placeHarvesterOnField,
  placePlanterOnField,
  rockConfig,
  setCropSprinkler,
} from "../game/garden";
import type { GardenAction } from "../game/actionHandlers/garden";
import { getItemDefSafe } from "../game/items";
import { formatCompactNumber } from "../game/numberFormat";
import {
  selectGardenCropTileDetailView,
  selectGardenEmptyTileAutomationView,
} from "../game/selectors/garden";
import type { GameState } from "../game/types";
import { ModalShell } from "./ui/ModalShell";

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
  onGardenAction: (action: GardenAction) => void;
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
  onGardenAction,
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
    <ModalShell
      onClose={onClose}
      overlayStyle={{ zIndex: 1000 }}
      panelStyle={{
        ["--modal-width" as string]: "500px",
        ["--modal-width-mobile" as string]: isMobile ? "94vw" : "95vw",
        ["--modal-max-height" as string]: "80vh",
        ["--modal-max-height-mobile" as string]: isMobile ? "88vh" : "88vh",
        ["--modal-padding" as string]: isMobile ? "12px" : "20px",
      }}
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
          onGardenAction={onGardenAction}
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
          onGardenAction={onGardenAction}
        />
      )}
    </ModalShell>
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
  onGardenAction,
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
  onGardenAction: (action: GardenAction) => void;
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
      <h3 className="ui-section-title-16">{cropDef.name}</h3>

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
          className="ui-card ui-garden-detail-card ui-garden-detail-card--compact ui-garden-detail-card--warning"
          style={{ fontSize: 12 }}
        >
          Time remaining: {Math.ceil(timeRemainingMinutes)} minutes
        </div>
      )}

      <div className="ui-card ui-garden-detail-card ui-garden-detail-card--compact ui-garden-detail-card--water">
        <div className="ui-garden-detail-title">💧 Water Mechanics</div>
        <div className="ui-garden-detail-copy">
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

      <div className="ui-card ui-garden-detail-card ui-garden-detail-card--compact ui-garden-detail-card--automation">
        <div className="ui-garden-detail-title">Automation Tool Controls</div>
        <div style={{ marginBottom: 8, color: "#9eb0c2" }}>
          Manage sprinkler, harvester, and planter directly on this planted
          tile.
        </div>

        <div style={{ marginBottom: 10 }}>
          <div className="ui-garden-detail-title ui-garden-detail-title--water">
            Sprinkler
          </div>
          <div className="ui-garden-inline-actions">
            {cropInstance.hasSprinkler ? (
              <button
                className="ui-modal-btn-small ui-modal-btn-small-danger ui-touch-target"
                onClick={() =>
                  onGardenAction({
                    type: "garden/setCropSprinkler",
                    row: cropRow,
                    col: cropCol,
                    sprinklerId: null,
                  })
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
                    className="ui-modal-btn-small ui-touch-target"
                    style={{
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
                      onGardenAction({
                        type: "garden/setCropSprinkler",
                        row: cropRow,
                        col: cropCol,
                        sprinklerId,
                      });
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
          <div className="ui-garden-detail-title ui-garden-detail-title--harvester">
            Harvester
          </div>
          <div className="ui-garden-inline-actions">
            {harvesterOnTile ? (
              <button
                className="ui-modal-btn-small ui-modal-btn-small-danger ui-touch-target"
                onClick={() =>
                  onGardenAction({
                    type: "garden/removeHarvester",
                    row: cropRow,
                    col: cropCol,
                  })
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
                    className="ui-modal-btn-small ui-touch-target"
                    style={{
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
                      onGardenAction({
                        type: "garden/placeHarvester",
                        row: cropRow,
                        col: cropCol,
                        harvesterId,
                      });
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
          <div className="ui-garden-detail-title ui-garden-detail-title--planter">
            Planter
          </div>
          {planterOnTile && (
            <div style={{ marginBottom: 6, color: "#9eb0c2" }}>
              Seed: {planterSeedForTilePresentation?.icon}{" "}
              {planterSeedForTilePresentation?.label ?? "None"}
            </div>
          )}
          <div className="ui-garden-inline-actions">
            {planterOnTile ? (
              <>
                <button
                  className="ui-modal-btn-small ui-modal-btn-small-danger ui-touch-target"
                  onClick={() =>
                    onGardenAction({
                      type: "garden/removePlanter",
                      row: cropRow,
                      col: cropCol,
                    })
                  }
                >
                  Remove Planter
                </button>
                <button
                  className="ui-modal-btn-small ui-touch-target"
                  style={{
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
                    className="ui-modal-btn-small ui-touch-target"
                    style={{
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
                      onGardenAction({
                        type: "garden/placePlanter",
                        row: cropRow,
                        col: cropCol,
                        planterId,
                        seedId: state.garden.selectedPlanterSeedId ?? null,
                      });
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

      <div className="ui-card ui-garden-detail-card ui-garden-detail-card--compact">
        <div className="ui-garden-detail-title">📊 At Harvest</div>
        <div className="ui-garden-detail-copy">
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

      <div className="ui-action-row-end">
        <button
          className="ui-modal-btn-secondary ui-touch-target"
          onClick={onClose}
        >
          Close
        </button>
        {!isReady && (
          <button
            className="ui-modal-btn-primary ui-touch-target"
            style={{
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
              onGardenAction({
                type: "garden/reduceCropGrowthTime",
                cropId,
                cropIndex,
                minutes: speedUpMinutes,
                gemCost: speedUpGemCost,
              })
            }
          >
            Reduce {speedUpMinutes}m ({formatCompactNumber(speedUpGemCost)}💎)
          </button>
        )}
        {isReady && (
          <button
            className="ui-modal-btn-primary ui-touch-target"
            style={{
              backgroundColor: "#51cf66",
            }}
            onClick={() => {
              onGardenAction({
                type: "garden/harvestCrop",
                cropId,
                cropIndex,
              });
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
      <h3 className="ui-section-title-16">
        {tier.charAt(0).toUpperCase() + tier.slice(1)} Rock
      </h3>

      <div className="ui-card ui-garden-detail-card">
        <div className="ui-garden-detail-meta">
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

      <div className="ui-action-row-end">
        <button
          className="ui-modal-btn-secondary ui-touch-target"
          onClick={onClose}
        >
          Close
        </button>
        <button
          className="ui-modal-btn-primary ui-touch-target"
          style={{
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
  onGardenAction,
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
  onGardenAction: (action: GardenAction) => void;
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
        <h3 className="ui-section-title-16">
          Automation Tools @ ({emptyRow}, {emptyCol})
        </h3>

        <div className="ui-card ui-garden-detail-card ui-garden-detail-card--water">
          <div
            className="ui-garden-detail-meta ui-garden-detail-copy--accent"
            style={{ fontWeight: "bold", marginBottom: 6 }}
          >
            {installedToolLabel}
          </div>
          <div className="ui-garden-detail-copy">
            Place a sprinkler, harvester, or planter. Only one automation tool
            can exist on a tile.
          </div>
          {fieldPlanterId && (
            <div className="ui-garden-detail-copy" style={{ marginTop: 6 }}>
              Planter seed: {selectedSeedForTilePresentation?.icon}{" "}
              {selectedSeedForTilePresentation?.label ?? "None"}
            </div>
          )}
          <div className="ui-garden-detail-copy" style={{ marginTop: 6 }}>
            Coverage tiers: common=self, rare=up/down/left/right (1), epic=rare
            + diagonals (1), legendary=epic pattern (2), unique=epic pattern
            (3).
          </div>
          <div className="ui-garden-detail-copy" style={{ marginTop: 6 }}>
            Coverage: {fieldCoverageText(emptyRow, emptyCol)}
          </div>
        </div>

        <div className="ui-garden-inline-actions ui-garden-inline-actions--spacious">
          {ownedSprinklerIds.length > 0 ? (
            ownedSprinklerIds.map((sprinklerId) => {
              const sprinklerDef = getItemDefSafe(sprinklerId);
              return (
                <button
                  key={sprinklerId}
                  className="ui-modal-btn-small ui-touch-target"
                  style={{
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
                    onGardenAction({
                      type: "garden/placeSprinkler",
                      row: emptyRow,
                      col: emptyCol,
                      sprinklerId,
                    });
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
                  className="ui-modal-btn-small ui-touch-target"
                  style={{
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
                    onGardenAction({
                      type: "garden/placeHarvester",
                      row: emptyRow,
                      col: emptyCol,
                      harvesterId,
                    });
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
                  className="ui-modal-btn-small ui-touch-target"
                  style={{
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
                    onGardenAction({
                      type: "garden/placePlanter",
                      row: emptyRow,
                      col: emptyCol,
                      planterId,
                      seedId: state.garden.selectedPlanterSeedId ?? null,
                    });
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
              className="ui-modal-btn-small ui-touch-target"
              style={{
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

        <div className="ui-action-row-end">
          <button
            className="ui-modal-btn-secondary ui-touch-target"
            onClick={() => onSetEmptyMode("choice")}
          >
            Back
          </button>
          {(fieldSprinklerId || fieldHarvesterId || fieldPlanterId) && (
            <button
              className="ui-modal-btn-danger ui-touch-target"
              style={{
                border: "1px solid #f1998e",
              }}
              onClick={() => {
                if (fieldSprinklerId) {
                  onGardenAction({
                    type: "garden/removeSprinkler",
                    row: emptyRow,
                    col: emptyCol,
                  });
                } else if (fieldHarvesterId) {
                  onGardenAction({
                    type: "garden/removeHarvester",
                    row: emptyRow,
                    col: emptyCol,
                  });
                } else {
                  onGardenAction({
                    type: "garden/removePlanter",
                    row: emptyRow,
                    col: emptyCol,
                  });
                }
              }}
            >
              Remove Tool
            </button>
          )}
          <button
            className="ui-modal-btn-secondary ui-touch-target"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <h3 className="ui-section-title-16">
        Field Options @ ({view.emptyRow}, {view.emptyCol})
      </h3>

      <div className="ui-card ui-garden-detail-card ui-garden-detail-card--automation">
        <div
          className="ui-garden-detail-meta"
          style={{ color: "#7ad9a0", fontWeight: "bold" }}
        >
          Do you want to plant a crop or place an automation tool?
        </div>
      </div>

      <div className="ui-action-row-end">
        <button
          className="ui-modal-btn-secondary ui-touch-target"
          onClick={onClose}
        >
          Close
        </button>
        <button
          className="ui-modal-btn-primary ui-touch-target"
          style={{
            backgroundColor: "#2196F3",
          }}
          onClick={() => onSetEmptyMode("automation")}
        >
          Automation
        </button>
        <button
          className="ui-modal-btn-primary ui-touch-target"
          style={{
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
