interface GardenSeedPresentation {
  icon: string;
  label: string;
}

interface GardenToolbarProps {
  isMobile: boolean;
  isSeedMakerUnlocked: boolean;
  isSeedMakerRunning: boolean;
  hasMinimapUnlock: boolean;
  isMinimapExpanded: boolean;
  selectedSeedMakerPresentation: GardenSeedPresentation | null;
  seedMakerRemainingDurationLabel: string | null;
  toolbarButtonSize: number;
  toolbarIconSize: number;
  toolbarBadgeSize: number;
  toolbarCornerActionSize: number;
  equippedToolId: string | null;
  equippedToolIcon: string;
  isToolEffectActive: boolean;
  activeSeedBagSeedPresentation: GardenSeedPresentation | null;
  selectedPlanterSeedPresentation: GardenSeedPresentation | null;
  onToggleToolWheel: () => void;
  onOpenStorage: () => void;
  onOpenCropMastery: () => void;
  onOpenSeedMaker: () => void;
  onToggleMinimap: () => void;
  onToggleEquippedToolMode: () => void;
  onUnequipTool: () => void;
  onOpenSeedBagSeedPicker: () => void;
  onOpenPlanterSeedPicker: () => void;
}

export function GardenToolbar({
  isMobile,
  isSeedMakerUnlocked,
  isSeedMakerRunning,
  hasMinimapUnlock,
  isMinimapExpanded,
  selectedSeedMakerPresentation,
  seedMakerRemainingDurationLabel,
  toolbarButtonSize,
  toolbarIconSize,
  toolbarBadgeSize,
  toolbarCornerActionSize,
  equippedToolId,
  equippedToolIcon,
  isToolEffectActive,
  activeSeedBagSeedPresentation,
  selectedPlanterSeedPresentation,
  onToggleToolWheel,
  onOpenStorage,
  onOpenCropMastery,
  onOpenSeedMaker,
  onToggleMinimap,
  onToggleEquippedToolMode,
  onUnequipTool,
  onOpenSeedBagSeedPicker,
  onOpenPlanterSeedPicker,
}: GardenToolbarProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: isMobile ? 8 : 0,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <h2 style={{ margin: 0 }}>🌾 Garden</h2>
        {isSeedMakerUnlocked && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: isMobile ? "4px 8px" : "5px 10px",
              borderRadius: 999,
              border: isSeedMakerRunning
                ? "1px solid #4fbf79"
                : "1px solid #4b6075",
              backgroundColor: isSeedMakerRunning ? "#163a2a" : "#1a2632",
              color: "#dbe7f3",
              fontSize: isMobile ? 11 : 12,
              lineHeight: 1,
            }}
            title={
              selectedSeedMakerPresentation
                ? `Seedmaker ${isSeedMakerRunning ? "running" : "stopped"} - ${selectedSeedMakerPresentation.label}`
                : `Seedmaker ${isSeedMakerRunning ? "running" : "stopped"}`
            }
          >
            <span>{isSeedMakerRunning ? "🟢" : "⚪"}</span>
            <span>Seedmaker</span>
            {selectedSeedMakerPresentation && (
              <span>
                {selectedSeedMakerPresentation.icon}{" "}
                {selectedSeedMakerPresentation.label}
              </span>
            )}
            {isSeedMakerRunning && seedMakerRemainingDurationLabel && (
              <span>{seedMakerRemainingDurationLabel}</span>
            )}
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="btn-round-icon"
          style={{
            width: toolbarButtonSize,
            height: toolbarButtonSize,
            backgroundColor: "#FFD700",
            border: "2px solid #DAA520",
            fontSize: toolbarIconSize,
          }}
          onClick={onToggleToolWheel}
          title="Tool wheel"
        >
          🔧
        </button>

        <button
          className="btn-round-icon"
          style={{
            width: toolbarButtonSize,
            height: toolbarButtonSize,
            backgroundColor: "#F5F5DC",
            border: "2px solid #DAA520",
            fontSize: toolbarIconSize,
          }}
          onClick={onOpenStorage}
          title="Crop silos"
          aria-label="Open crop storage"
        >
          🛢️
        </button>

        <button
          className="btn-round-icon"
          style={{
            width: toolbarButtonSize,
            height: toolbarButtonSize,
            backgroundColor: "#e7f5ff",
            border: "2px solid #4dabf7",
            fontSize: toolbarIconSize,
          }}
          onClick={onOpenCropMastery}
          title="Crop mastery"
          aria-label="Open crop mastery"
        >
          📈
        </button>

        {isSeedMakerUnlocked && (
          <button
            className="btn-round-icon"
            style={{
              width: toolbarButtonSize,
              height: toolbarButtonSize,
              backgroundColor: "#fff4db",
              border: "2px solid #d4a24f",
              fontSize: toolbarIconSize,
            }}
            onClick={onOpenSeedMaker}
            title="Seedmaker"
            aria-label="Open seedmaker"
          >
            🧪
          </button>
        )}

        {hasMinimapUnlock && (
          <button
            className="btn-round-icon"
            style={{
              width: toolbarButtonSize,
              height: toolbarButtonSize,
              backgroundColor: isMinimapExpanded ? "#325f45" : "#2f4152",
              border: "2px solid #6d5932",
              fontSize: toolbarIconSize,
            }}
            onClick={onToggleMinimap}
            title={
              isMinimapExpanded ? "Close world map" : "Open world map minimap"
            }
            aria-label={
              isMinimapExpanded ? "Close world map" : "Open world map minimap"
            }
          >
            🗺️
          </button>
        )}

        <div
          style={{
            position: "relative",
            marginLeft: 12,
            width: toolbarButtonSize,
            height: toolbarButtonSize,
          }}
        >
          <button
            className="btn-round-icon"
            style={{
              width: toolbarButtonSize,
              height: toolbarButtonSize,
              backgroundColor: equippedToolId ? "#253649" : "#1a2430",
              border: isToolEffectActive
                ? "2px solid #57b3f3"
                : "2px solid #3f546a",
              boxShadow: isToolEffectActive
                ? "0 0 0 3px rgba(87,179,243,0.22)"
                : "none",
              opacity: 1,
              fontSize: toolbarIconSize,
            }}
            onClick={onToggleEquippedToolMode}
            title={
              equippedToolId
                ? isToolEffectActive
                  ? "Tool mode active"
                  : "Tool mode inactive"
                : "Open tool bag"
            }
            aria-label={
              equippedToolId ? "Toggle equipped tool mode" : "Open tool bag"
            }
          >
            {equippedToolIcon}
          </button>
          {equippedToolId && (
            <button
              type="button"
              style={{
                position: "absolute",
                top: isMobile ? -6 : -4,
                left: isMobile ? -6 : -4,
                width: toolbarCornerActionSize,
                height: toolbarCornerActionSize,
                borderRadius: "50%",
                backgroundColor: "#8f1d1d",
                border: "1px solid #d66a6a",
                color: "#fff4f4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: isMobile ? 12 : 11,
                lineHeight: 1,
                padding: 0,
                cursor: "pointer",
              }}
              title="Unequip tool"
              aria-label="Unequip tool"
              onClick={(event) => {
                event.stopPropagation();
                onUnequipTool();
              }}
            >
              ×
            </button>
          )}
          {activeSeedBagSeedPresentation && (
            <button
              type="button"
              style={{
                position: "absolute",
                top: isMobile ? -6 : -4,
                right: isMobile ? -6 : -4,
                width: toolbarBadgeSize,
                height: toolbarBadgeSize,
                borderRadius: "50%",
                backgroundColor: "#142131",
                border: "1px solid #4f6b84",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: isMobile ? 15 : 13,
                lineHeight: 1,
                padding: 0,
                cursor: "pointer",
              }}
              title={activeSeedBagSeedPresentation.label}
              aria-label={`Selected seed: ${activeSeedBagSeedPresentation.label}`}
              onClick={(event) => {
                event.stopPropagation();
                onOpenSeedBagSeedPicker();
              }}
            >
              {activeSeedBagSeedPresentation.icon}
            </button>
          )}
          {selectedPlanterSeedPresentation && (
            <button
              type="button"
              style={{
                position: "absolute",
                top: isMobile ? -6 : -4,
                right: isMobile ? -6 : -4,
                width: toolbarBadgeSize,
                height: toolbarBadgeSize,
                borderRadius: "50%",
                backgroundColor: "#142131",
                border: "1px solid #4f6b84",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: isMobile ? 15 : 13,
                lineHeight: 1,
                padding: 0,
                cursor: "pointer",
              }}
              title={selectedPlanterSeedPresentation.label}
              aria-label={`Selected planter seed: ${selectedPlanterSeedPresentation.label}`}
              onClick={(event) => {
                event.stopPropagation();
                onOpenPlanterSeedPicker();
              }}
            >
              {selectedPlanterSeedPresentation.icon}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
