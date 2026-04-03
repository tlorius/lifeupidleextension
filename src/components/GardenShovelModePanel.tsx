interface ShovelMoveState {
  sourceRow: number;
  sourceCol: number;
  areaSize: number;
}

interface GardenShovelModePanelProps {
  isVisible: boolean;
  isMobile: boolean;
  shovelMove: ShovelMoveState | null;
  shovelAreaSize: number;
  moveSprinklersWithShovel: boolean;
  onToggleMoveSprinklersWithShovel: (checked: boolean) => void;
  onClearSelection: () => void;
  onRemoveSelectedContents: () => void;
}

export function GardenShovelModePanel({
  isVisible,
  isMobile,
  shovelMove,
  shovelAreaSize,
  moveSprinklersWithShovel,
  onToggleMoveSprinklersWithShovel,
  onClearSelection,
  onRemoveSelectedContents,
}: GardenShovelModePanelProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div
      style={{
        marginBottom: 16,
        padding: isMobile ? 10 : 12,
        backgroundColor: "#fff3cd",
        borderRadius: 6,
        border: "1px solid #f0c36d",
        fontSize: isMobile ? 13 : 12,
      }}
    >
      <div style={{ fontWeight: "bold", marginBottom: 6 }}>🪏 Shovel Mode</div>
      <div style={{ color: "#6b4f1d", marginBottom: 8 }}>
        {shovelMove
          ? `Source selected at (${shovelMove.sourceRow}, ${shovelMove.sourceCol}). Click an empty unlocked tile to move the area or remove the selected area contents.`
          : `Click an unlocked tile to select a ${shovelAreaSize}x${shovelAreaSize} area.`}
      </div>
      {shovelAreaSize > 1 && (
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={moveSprinklersWithShovel}
            onChange={(e) => onToggleMoveSprinklersWithShovel(e.target.checked)}
          />
          Move sprinklers with fields
        </label>
      )}
      {shovelMove && (
        <div
          style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}
        >
          <button
            style={{
              padding: "6px 10px",
              backgroundColor: "#f0f0f0",
              border: "1px solid #ccc",
              borderRadius: 4,
              cursor: "pointer",
            }}
            onClick={onClearSelection}
          >
            Clear Selection
          </button>
          <button
            style={{
              padding: "6px 10px",
              backgroundColor: "#ffe4dc",
              border: "1px solid #e39a84",
              borderRadius: 4,
              cursor: "pointer",
            }}
            onClick={onRemoveSelectedContents}
          >
            Remove Area Contents
          </button>
        </div>
      )}
    </div>
  );
}
