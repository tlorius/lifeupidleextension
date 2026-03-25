import type { ReactNode } from "react";

interface GardenGridProps {
  previewRows: number;
  previewCols: number;
  minimumCellSize: number;
  isMobile: boolean;
  renderField: (row: number, col: number) => ReactNode;
}

export function GardenGrid({
  previewRows,
  previewCols,
  minimumCellSize,
  isMobile,
  renderField,
}: GardenGridProps) {
  return (
    <div
      style={{
        overflowX: "auto",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        paddingBottom: 2,
        maxHeight: "80vh",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${previewCols}, minmax(${minimumCellSize}px, 1fr))`,
          gap: isMobile ? 3 : 4,
          padding: isMobile ? 3 : 4,
          backgroundColor: "#D2B48C",
          borderRadius: 8,
          border: "2px solid #8B4513",
          width: "max-content",
          minWidth: "100%",
        }}
      >
        {Array.from({ length: previewRows }).map((_, row) =>
          Array.from({ length: previewCols }).map((_, col) =>
            renderField(row, col),
          ),
        )}
      </div>
    </div>
  );
}
