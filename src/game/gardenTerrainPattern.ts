import type { FieldPosition } from "./types";

export function isProtectedStarterField(row: number, col: number): boolean {
  return row >= 0 && col >= 0 && row < 3 && col < 3;
}

function getDistanceFromStarterZone(row: number, col: number): number {
  if (isProtectedStarterField(row, col)) return 0;
  const rowDistance = row >= 3 ? row - 2 : 0;
  const colDistance = col >= 3 ? col - 2 : 0;
  return Math.max(rowDistance, colDistance);
}

function getRockPatternScore(row: number, col: number): number {
  return ((row + 1) * 13 + (col + 1) * 17 + (row - col) * 7) % 100;
}

export function hasRockPatternAtTile(row: number, col: number): boolean {
  const distance = getDistanceFromStarterZone(row, col);
  if (distance <= 0) return false;

  const localRow = row % 12;
  const localCol = col % 12;
  const smileyPixels = new Set([
    "3,2",
    "3,3",
    "3,8",
    "4,3",
    "4,8",
    "7,3",
    "8,4",
    "8,5",
    "8,6",
    "8,7",
    "7,8",
  ]);

  return smileyPixels.has(`${localRow},${localCol}`);
}

function getRockTierByDistance(
  distance: number,
  patternScore: number,
): "small" | "medium" | "large" {
  if (distance <= 2) {
    return "small";
  }

  if (distance <= 5) {
    return patternScore < 72 ? "small" : "medium";
  }

  if (distance <= 8) {
    if (patternScore < 42) return "small";
    if (patternScore < 82) return "medium";
    return "large";
  }

  if (patternScore < 24) return "small";
  if (patternScore < 64) return "medium";
  return "large";
}

export function getRockTierForTile(
  row: number,
  col: number,
): "small" | "medium" | "large" | null {
  if (!hasRockPatternAtTile(row, col)) return null;

  const distance = getDistanceFromStarterZone(row, col);
  const patternScore = getRockPatternScore(row, col);

  return getRockTierByDistance(distance, patternScore);
}

export function generateRocksForGrid(
  gridRows: number,
  gridCols: number,
): { small: FieldPosition[]; medium: FieldPosition[]; large: FieldPosition[] } {
  const rocks = {
    small: [] as FieldPosition[],
    medium: [] as FieldPosition[],
    large: [] as FieldPosition[],
  };
  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      const isCorner =
        (row === 0 || row === gridRows - 1) &&
        (col === 0 || col === gridCols - 1);
      if (isCorner) continue;

      if (isProtectedStarterField(row, col)) continue;

      const tier = getRockTierForTile(row, col);
      if (!tier) continue;
      rocks[tier].push({ row, col });
    }
  }

  return rocks;
}
