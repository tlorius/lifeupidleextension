import { Fragment, type ReactNode, type RefObject } from "react";

interface GardenGridProps {
  previewRows: number;
  previewCols: number;
  minimumCellSize: number;
  isMobile: boolean;
  renderField: (row: number, col: number) => ReactNode;
  containerRef?: RefObject<HTMLDivElement | null>;
  contentRef?: RefObject<HTMLDivElement | null>;
  onScroll?: () => void;
}

export function GardenGrid({
  previewRows,
  previewCols,
  minimumCellSize,
  isMobile,
  renderField,
  containerRef,
  contentRef,
  onScroll,
}: GardenGridProps) {
  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      style={{
        overflowX: "auto",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        paddingBottom: 2,
        maxHeight: "80vh",
      }}
    >
      <div
        ref={contentRef}
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
          Array.from({ length: previewCols }).map((_, col) => (
            <Fragment key={`${row}-${col}`}>{renderField(row, col)}</Fragment>
          )),
        )}
      </div>
    </div>
  );
}
