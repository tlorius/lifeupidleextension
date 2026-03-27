import type { GardenSeedMakerRecipeView } from "../game/selectors/garden";
import { ModalShell } from "./ui/ModalShell";

interface GardenSeedMakerModalProps {
  isOpen: boolean;
  isMobile: boolean;
  cycleDurationLabel: string;
  isSeedMakerRunning: boolean;
  remainingDurationLabel: string | null;
  seedMakerRecipes: GardenSeedMakerRecipeView[];
  onClose: () => void;
  onToggleAuto: () => void;
  onCraftOne: () => void;
  onSelectRecipe: (seedId: string, canSelectRecipe: boolean) => void;
}

export function GardenSeedMakerModal({
  isOpen,
  isMobile,
  cycleDurationLabel,
  isSeedMakerRunning,
  remainingDurationLabel,
  seedMakerRecipes,
  onClose,
  onToggleAuto,
  onCraftOne,
  onSelectRecipe,
}: GardenSeedMakerModalProps) {
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
        <span>Seedmaker</span>
        <button className="ui-modal-close" onClick={onClose}>
          Close
        </button>
      </div>

      <div
        style={{
          fontSize: 12,
          color: "#9eb0c2",
          marginBottom: 10,
        }}
      >
        Convert crop resources into seeds. Crafting takes {cycleDurationLabel}{" "}
        per seed at current Seedmaker level and runs continuously until you stop
        it.
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 10,
        }}
      >
        <button
          type="button"
          className="ui-modal-btn-compact"
          style={{
            backgroundColor: isSeedMakerRunning ? "#7f1f1f" : "#1f7f43",
            border: "1px solid #3f546a",
            color: "#fff",
          }}
          onClick={onToggleAuto}
        >
          {isSeedMakerRunning ? "Stop Auto Seedmaker" : "Start Auto Seedmaker"}
        </button>

        <button
          type="button"
          className="ui-modal-btn-compact"
          style={{
            backgroundColor: "#2d3f52",
            border: "1px solid #3f546a",
            color: "#fff",
          }}
          onClick={onCraftOne}
        >
          Craft One Now
        </button>

        <span style={{ fontSize: 11, color: "#c7d8e8" }}>
          Status: {isSeedMakerRunning ? "Running" : "Stopped"}
          {remainingDurationLabel
            ? ` | Next seed in ${remainingDurationLabel}`
            : ""}
        </span>
      </div>

      {seedMakerRecipes.length === 0 ? (
        <div style={{ fontSize: 12, color: "#9eb0c2" }}>
          No seed recipes available.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: 8,
          }}
        >
          {seedMakerRecipes.map((recipe) => (
            <button
              key={`seedmaker-${recipe.seedId}`}
              type="button"
              className={recipe.isSelected ? "btn-selected" : ""}
              style={{
                padding: 8,
                backgroundColor: recipe.isSelected ? "#1f7f43" : "#1b2d3f",
                border: recipe.isSelected
                  ? "2px solid #2f9e44"
                  : "1px solid #34516a",
                borderRadius: 4,
                cursor:
                  recipe.canCraft && recipe.canSelectRecipe
                    ? "pointer"
                    : "not-allowed",
                opacity: recipe.canCraft && recipe.canSelectRecipe ? 1 : 0.68,
                fontSize: 11,
                textAlign: "left",
                color: "#e5edf5",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
              onClick={() =>
                onSelectRecipe(recipe.seedId, recipe.canSelectRecipe)
              }
              title={`${recipe.cropName} Seed`}
            >
              <div style={{ fontWeight: "bold" }}>
                {recipe.categoryIcon} {recipe.cropName} Seed
              </div>
              <div style={{ fontSize: 10, color: "#9eb0c2" }}>
                Category: {recipe.categoryLabel}
              </div>
              <div style={{ fontSize: 10 }}>
                Cost: 💎 {recipe.cost.gemCost} + {recipe.cost.resourceCost}{" "}
                {recipe.categoryLabel}
              </div>
              <div style={{ fontSize: 10, color: "#c7d8e8" }}>
                Available: {recipe.availableResource} {recipe.categoryLabel}
              </div>
            </button>
          ))}
        </div>
      )}
    </ModalShell>
  );
}
