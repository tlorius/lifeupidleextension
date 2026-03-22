import { useState, useEffect } from "react";
import { useGame } from "../game/GameContext";
import {
  getCropDef,
  cropDefinitions,
  getGrowthProgress,
  generateRocksForGrid,
  getFieldUnlockCost,
  unlockField,
  plantCrop,
  harvestCrop,
  calculateYield,
  toggleSprinkler,
  waterField,
  breakRock,
  reduceCropGrowthTime,
  moveCropArea,
  sanitizeStarterZoneRocks,
  sprinklerCoversField,
  setCropSprinkler,
  placeSprinklerOnField,
  removeSprinklerFromField,
  rockConfig,
} from "../game/garden";
import { getItemDefSafe } from "../game/items";
import { formatCompactNumber } from "../game/numberFormat";
import type { CropInstance } from "../game/types";

interface SeedBagItem {
  seedId: string;
  count: number;
}

interface PlantModalState {
  isOpen: boolean;
  row: number;
  col: number;
  selectedSeedId: string | null;
}

interface HarvestModalState {
  isOpen: boolean;
  cropId: string | null;
  cropIndex: number | null;
  row: number;
  col: number;
}

interface RockBreakModalState {
  isOpen: boolean;
  row: number;
  col: number;
  rockTier: "small" | "medium" | "large" | null;
}

interface TileDetailModalState {
  isOpen: boolean;
  row: number;
  col: number;
  type: "empty" | "crop" | "rock" | null;
  cropId?: string;
  cropIndex?: number;
  emptyMode?: "choice" | "sprinkler";
}

interface ShovelMoveState {
  sourceRow: number;
  sourceCol: number;
  areaSize: number;
}

interface SprinklerPreviewState {
  row: number;
  col: number;
  sprinklerId: string;
}

export function Garden() {
  const { state, setState } = useGame();
  const speedUpMinutes = 30;
  const speedUpGemCost = 100;
  const [showSeedBag, setShowSeedBag] = useState(false);
  const [showToolWheel, setShowToolWheel] = useState(false);
  const [plantModal, setPlantModal] = useState<PlantModalState>({
    isOpen: false,
    row: 0,
    col: 0,
    selectedSeedId: null,
  });
  const [harvestModal, setHarvestModal] = useState<HarvestModalState>({
    isOpen: false,
    cropId: null,
    cropIndex: null,
    row: 0,
    col: 0,
  });
  const [rockBreakModal, setRockBreakModal] = useState<RockBreakModalState>({
    isOpen: false,
    row: 0,
    col: 0,
    rockTier: null,
  });
  const [tileDetailModal, setTileDetailModal] = useState<TileDetailModalState>({
    isOpen: false,
    row: 0,
    col: 0,
    type: null,
  });
  const [shovelMove, setShovelMove] = useState<ShovelMoveState | null>(null);
  const [moveSprinklersWithShovel, setMoveSprinklersWithShovel] =
    useState(true);
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [sprinklerPreview, setSprinklerPreview] =
    useState<SprinklerPreviewState | null>(null);
  const [viewportWidth, setViewportWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 1024,
  );

  const garden = state.garden;
  const [toolTypeFilter, setToolTypeFilter] = useState<string | null>(null);
  const equippedToolItem = state.equipment.tool
    ? (state.inventory.find((item) => item.uid === state.equipment.tool) ??
      null)
    : null;
  const equippedToolId = equippedToolItem?.itemId ?? state.equipment.tool;
  const equippedToolDef = equippedToolItem
    ? getItemDefSafe(equippedToolItem.itemId)
    : null;
  const isMobile = viewportWidth <= 768;

  const isFieldUnlocked = (row: number, col: number): boolean => {
    const unlocked = garden.unlockedFields;
    if (unlocked && unlocked.length > 0) {
      return unlocked.some((f) => f.row === row && f.col === col);
    }
    return row < garden.gridSize.rows && col < garden.gridSize.cols;
  };

  const resolveCropIdFromSeed = (seedId: string): string | null => {
    const fromDefinition = Object.values(cropDefinitions).find(
      (crop) => crop.seedItemId === seedId,
    );
    if (fromDefinition) return fromDefinition.id;

    const seedMatch = seedId.match(
      /^(.+)_seed(?:_(common|rare|epic|legendary|unique))?$/,
    );
    if (seedMatch) {
      const [, base, rarity] = seedMatch;
      if (rarity) {
        const directCrop = `${base}_${rarity}`;
        if (getCropDef(directCrop)) return directCrop;
      }
      const commonCrop = `${base}_common`;
      if (getCropDef(commonCrop)) return commonCrop;

      const anyVariant = Object.values(cropDefinitions).find(
        (crop) =>
          crop.id.startsWith(`${base}_`) ||
          crop.seedItemId.startsWith(`${base}_seed`),
      );
      if (anyVariant) return anyVariant.id;
    }

    // Backward-compatible fallback for legacy IDs like "sunflower_seed_common".
    const fallbackCropId = seedId.replace("_seed", "");
    return getCropDef(fallbackCropId) ? fallbackCropId : null;
  };

  const isTreeCrop = (cropDef: { category: string; isPerennial: boolean }) =>
    cropDef.category === "grape" ||
    (cropDef.category === "fruit" && cropDef.isPerennial);

  const getShovelAreaSize = (): number => {
    if (!equippedToolId?.includes("shovel")) return 1;
    const rarity = equippedToolDef?.rarity ?? "common";
    if (rarity === "rare") return 3;
    if (rarity === "epic" || rarity === "legendary" || rarity === "unique") {
      return 5;
    }
    return 1;
  };

  // Initialize rocks on first load
  useEffect(() => {
    const sanitizedRocks = sanitizeStarterZoneRocks(garden.rocks);
    const starterRocksWerePresent =
      sanitizedRocks.small.length !== garden.rocks.small.length ||
      sanitizedRocks.medium.length !== garden.rocks.medium.length ||
      sanitizedRocks.large.length !== garden.rocks.large.length;

    if (starterRocksWerePresent) {
      setState((prev) => ({
        ...prev,
        garden: {
          ...prev.garden,
          rocks: sanitizeStarterZoneRocks(prev.garden.rocks),
        },
      }));
      return;
    }

    if (
      garden.rocks.small.length === 0 &&
      garden.rocks.medium.length === 0 &&
      garden.rocks.large.length === 0
    ) {
      // Generate rocks for the preview area (gridSize + 2)
      const previewRows = garden.gridSize.rows + 2;
      const previewCols = garden.gridSize.cols + 2;
      const generatedRocks = generateRocksForGrid(
        previewRows,
        previewCols,
        Math.floor(Math.random() * 1000000),
      );
      setState((prev) => ({
        ...prev,
        garden: {
          ...prev.garden,
          rocks: generatedRocks,
        },
      }));
    }
  }, []);

  useEffect(() => {
    if (!tileDetailModal.isOpen) {
      setSprinklerPreview(null);
    }
  }, [tileDetailModal.isOpen]);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Collect seeds from inventory. Keep compatibility with older save IDs
  // that may not exist in the latest item definition table.
  const seedBag: SeedBagItem[] = [];
  for (const item of state.inventory) {
    const def = getItemDefSafe(item.itemId);
    const isSeedLike = def?.type === "seed" || item.itemId.includes("_seed");
    const isPlantableSeed = resolveCropIdFromSeed(item.itemId) !== null;
    if (isSeedLike && isPlantableSeed && item.quantity > 0) {
      const existing = seedBag.find((s) => s.seedId === item.itemId);
      if (existing) {
        existing.count += item.quantity;
      } else {
        seedBag.push({ seedId: item.itemId, count: item.quantity });
      }
    }
  }

  // Get preview grid (showing adjacent fields that can be unlocked)
  const previewRows = garden.gridSize.rows + 2;
  const previewCols = garden.gridSize.cols + 2;
  const compactGridLabels = isMobile || previewCols >= 8;
  const minimumCellSize = isMobile ? 34 : 42;

  const formatCategoryLabel = (category: string) =>
    category.charAt(0).toUpperCase() + category.slice(1);

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case "flower":
        return "🌸";
      case "vegetable":
        return "🥕";
      case "fruit":
        return "🍎";
      case "herb":
        return "🌿";
      case "grains":
        return "🌾";
      case "grape":
        return "🍇";
      case "special":
        return "✨";
      default:
        return "📦";
    }
  };

  const isWithinSelectedMoveArea = (row: number, col: number): boolean => {
    if (!shovelMove) return false;
    const half = Math.floor(shovelMove.areaSize / 2);
    return (
      row >= shovelMove.sourceRow - half &&
      row <= shovelMove.sourceRow + half &&
      col >= shovelMove.sourceCol - half &&
      col <= shovelMove.sourceCol + half
    );
  };

  const getOwnedSprinklerIds = (): string[] => {
    const ids = state.inventory
      .filter((item) => {
        const def = getItemDefSafe(item.itemId);
        return def?.type === "tool" && item.itemId.includes("sprinkler");
      })
      .map((item) => item.itemId);
    return Array.from(new Set(ids));
  };

  const getSprinklerAtField = (row: number, col: number): string | null => {
    for (const [sprinklerId, positions] of Object.entries(garden.sprinklers)) {
      if (positions.some((p) => p.row === row && p.col === col)) {
        return sprinklerId;
      }
    }
    return null;
  };

  const isAdjacentUnlockableField = (row: number, col: number): boolean => {
    if (isFieldUnlocked(row, col)) return false;

    const unlocked = garden.unlockedFields;
    if (unlocked && unlocked.length > 0) {
      return unlocked.some(
        (f) =>
          (Math.abs(f.row - row) === 1 && f.col === col) ||
          (Math.abs(f.col - col) === 1 && f.row === row),
      );
    }

    // Legacy fallback: allow immediate perimeter expansion from rectangular grid.
    const r = garden.gridSize.rows;
    const c = garden.gridSize.cols;
    return (row === r && col < c) || (col === c && row < r);
  };

  const isFieldCoveredBySprinklerNetwork = (
    row: number,
    col: number,
    excludeSameField: boolean = false,
  ): boolean => {
    for (const [sprinklerId, positions] of Object.entries(garden.sprinklers)) {
      for (const pos of positions) {
        if (excludeSameField && pos.row === row && pos.col === col) continue;
        if (
          sprinklerCoversField(sprinklerId, pos, {
            row,
            col,
          })
        ) {
          return true;
        }
      }
    }
    return false;
  };

  const fieldCoverageText = (row: number, col: number): string => {
    if (getSprinklerAtField(row, col)) {
      return "Directly sprinklered";
    }
    if (isFieldCoveredBySprinklerNetwork(row, col)) {
      return "Covered by nearby sprinkler pattern";
    }
    return "No sprinkler coverage";
  };

  const renderField = (row: number, col: number) => {
    // Check bounds
    const isInGrid = isFieldUnlocked(row, col);
    const isPreview = !isInGrid;
    const bestPickaxeLevel = Object.entries(garden.tools)
      .filter(([toolId]) => toolId.startsWith("pickaxe"))
      .reduce((maxLevel, [, level]) => Math.max(maxLevel, level), 0);
    const isSprinklerPreviewTarget = sprinklerPreview
      ? sprinklerCoversField(
          sprinklerPreview.sprinklerId,
          { row: sprinklerPreview.row, col: sprinklerPreview.col },
          { row, col },
        )
      : false;

    // Check for rock
    const rockSmall = garden.rocks.small.find(
      (r) => r.row === row && r.col === col,
    );
    const rockMedium = garden.rocks.medium.find(
      (r) => r.row === row && r.col === col,
    );
    const rockLarge = garden.rocks.large.find(
      (r) => r.row === row && r.col === col,
    );

    if (rockSmall || rockMedium || rockLarge) {
      const tier = rockSmall ? "small" : rockMedium ? "medium" : "large";
      const config = rockConfig[tier];
      const needsPickaxeLevel = Math.max(
        0,
        config.minPickaxeLevel - bestPickaxeLevel,
      );
      const missingRockEnergy = Math.max(
        0,
        config.energyCost - (state.resources.energy ?? 0),
      );
      const cannotBreakRock = needsPickaxeLevel > 0 || missingRockEnergy > 0;
      const cannotBreakReason = cannotBreakRock
        ? [
            needsPickaxeLevel > 0
              ? `Need pickaxe level ${config.minPickaxeLevel} (missing ${needsPickaxeLevel})`
              : null,
            missingRockEnergy > 0
              ? `Need ${missingRockEnergy} more energy`
              : null,
          ]
            .filter(Boolean)
            .join(" | ")
        : "Ready to break";
      return (
        <div
          key={`${row}-${col}`}
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
            opacity: equippedToolId?.includes("pickaxe") ? 1 : 0.8,
            filter: equippedToolId?.includes("pickaxe")
              ? "drop-shadow(0 0 6px rgba(255, 200, 0, 0.6))"
              : "none",
          }}
          aria-label={`${tier} rock - requires pickaxe (Level ${config.minPickaxeLevel}+, ${config.energyCost} energy)`}
          onClick={() => {
            setRockBreakModal({
              isOpen: true,
              row,
              col,
              rockTier: tier as "small" | "medium" | "large",
            });
          }}
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
          {equippedToolId?.includes("pickaxe") && (
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

    // Check for planted crop
    let cropInstance: CropInstance | null = null;
    let cropId: string | null = null;

    for (const [cId, crops] of Object.entries(garden.crops)) {
      const found = crops.find(
        (c) => c.position?.row === row && c.position?.col === col,
      );
      if (found) {
        cropInstance = found;
        cropId = cId;
        break;
      }
    }

    if (cropInstance && cropId) {
      const cropDef = getCropDef(cropId);
      if (!cropDef) return null;

      const progress = getGrowthProgress(cropInstance, cropDef);
      const isReady = progress >= 100;

      // Determine visual stage and use tree vs crop icons
      const stage = Math.floor((progress / 100) * 3); // 0, 1, 2, 3
      // Trees show different growth stages than regular crops
      const isTree = isTreeCrop(cropDef);
      const stageEmojis = isTree
        ? ["🌱", "🌳", "🌳", "🌲"]
        : ["🌱", "🌾", "🌿", "🍃"];
      const coveredByAdjacentSprinkler =
        !cropInstance.hasSprinkler &&
        isFieldCoveredBySprinklerNetwork(row, col, true);

      return (
        <div
          key={`${row}-${col}`}
          style={{
            width: "100%",
            aspectRatio: "1",
            backgroundColor: cropInstance.hasSprinkler
              ? "#cfefff"
              : coveredByAdjacentSprinkler
                ? "#e6f6ff"
                : cropInstance.waterLevel > 50
                  ? "#8B7D6B"
                  : "#A0826D",
            border: "2px solid #654321",
            outline: isWithinSelectedMoveArea(row, col)
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
              cropInstance.waterLevel > 0
                ? `inset 0 0 0 2px rgba(65, 105, 225, ${cropInstance.waterLevel / 100})`
                : "none",
          }}
          aria-label={`${cropDef.name} - ${progress.toFixed(0)}% grown - Water: ${cropInstance.waterLevel.toFixed(0)}%`}
          onClick={() => {
            const equippedTool = equippedToolId;

            if (equippedTool?.includes("shovel")) {
              setShovelMove({
                sourceRow: row,
                sourceCol: col,
                areaSize: getShovelAreaSize(),
              });
              return;
            }

            // Handle sprinkler placement
            if (equippedTool?.includes("sprinkler")) {
              const newState = toggleSprinkler(state, row, col);
              setState(newState);
              return;
            }

            // Handle watering
            if (equippedTool?.includes("wateringcan")) {
              if (cropInstance.hasSprinkler) {
                alert("This field already has a sprinkler!");
                return;
              }
              const newState = waterField(state, row, col);
              setState(newState);
              return;
            }

            // Default: Open detail modal
            if (cropId) {
              const cropIdxInArray =
                garden.crops[cropId]?.indexOf(cropInstance) ?? -1;
              if (cropIdxInArray >= 0) {
                setTileDetailModal({
                  isOpen: true,
                  row,
                  col,
                  type: "crop",
                  cropId,
                  cropIndex: cropIdxInArray,
                });
              }
            }
          }}
        >
          {stageEmojis[Math.min(stage, 3)]}

          {/* Water level indicator bar */}
          {cropInstance.waterLevel > 0 && !cropInstance.hasSprinkler && (
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
                  width: `${cropInstance.waterLevel}%`,
                  borderRadius: "0 0 2px 2px",
                }}
              />
            </div>
          )}

          {/* Sprinkler indicator badge */}
          {cropInstance.hasSprinkler && (
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
            <div
              style={{
                position: "absolute",
                top: 2,
                left: 2,
                fontSize: 10,
                backgroundColor: "#339af0",
                color: "white",
                borderRadius: 8,
                padding: "1px 4px",
                fontWeight: "bold",
              }}
              aria-label="Covered by adjacent sprinkler"
            >
              ADJ
            </div>
          )}
        </div>
      );
    }

    // Empty field or preview
    if (isPreview) {
      const isAdjacentUnlockable = isAdjacentUnlockableField(row, col);
      const cost = getFieldUnlockCost(state, row, col);
      const missingGems =
        cost.type === "diamond"
          ? Math.max(0, (cost.cost ?? 0) - (state.resources.gems ?? 0))
          : 0;
      const rockUnlockConfig =
        cost.type === "rock" ? rockConfig[cost.rockTier!] : null;
      const needsUnlockPickaxeLevel = rockUnlockConfig
        ? Math.max(0, rockUnlockConfig.minPickaxeLevel - bestPickaxeLevel)
        : 0;
      const missingUnlockEnergy = rockUnlockConfig
        ? Math.max(
            0,
            rockUnlockConfig.energyCost - (state.resources.energy ?? 0),
          )
        : 0;
      const cannotUnlockField =
        cost.type === "diamond"
          ? missingGems > 0
          : cost.type === "rock"
            ? needsUnlockPickaxeLevel > 0 || missingUnlockEnergy > 0
            : false;
      const cannotUnlockReason =
        cost.type === "diamond"
          ? `Need ${missingGems} more gems`
          : cost.type === "rock"
            ? [
                needsUnlockPickaxeLevel > 0
                  ? `Need pickaxe level ${rockUnlockConfig!.minPickaxeLevel} (missing ${needsUnlockPickaxeLevel})`
                  : null,
                missingUnlockEnergy > 0
                  ? `Need ${missingUnlockEnergy} more energy`
                  : null,
              ]
                .filter(Boolean)
                .join(" | ")
            : "Ready to unlock";
      const costText =
        cost.type === "diamond"
          ? `💎 ${cost.cost}`
          : cost.type === "rock"
            ? `🪨 ${cost.rockTier}`
            : "Free";
      const compactCostText =
        cost.type === "diamond" ? "💎" : cost.type === "rock" ? "🪨" : "•";
      const previewLabel = isAdjacentUnlockable
        ? compactGridLabels
          ? compactCostText
          : costText
        : "⛔";
      const previewTitle = isAdjacentUnlockable
        ? `Unlock field - ${costText}`
        : "Not unlockable yet (unlock an adjacent field first)";

      return (
        <div
          key={`${row}-${col}`}
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
          onClick={() => {
            if (!isAdjacentUnlockable) return;
            const newState = unlockField(state, row, col);
            setState(newState);
          }}
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

    // Empty field in grid
    const fieldSprinklerId = getSprinklerAtField(row, col);
    const fieldCoveredByAdjacentSprinkler =
      !fieldSprinklerId && isFieldCoveredBySprinklerNetwork(row, col, true);
    return (
      <div
        key={`${row}-${col}`}
        style={{
          width: "100%",
          aspectRatio: "1",
          backgroundColor: fieldSprinklerId
            ? "#cfefff"
            : fieldCoveredByAdjacentSprinkler
              ? "#e6f6ff"
              : "#8B7355",
          border: fieldSprinklerId
            ? "2px solid #74c0fc"
            : fieldCoveredByAdjacentSprinkler
              ? "2px solid #a5d8ff"
              : "2px solid #654321",
          outline: isWithinSelectedMoveArea(row, col)
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
            : fieldCoveredByAdjacentSprinkler
              ? "#1864ab"
              : "#555",
          textAlign: "center",
          lineHeight: 1.1,
          padding: 2,
        }}
        aria-label="Empty field - click to manage planting or sprinkler"
        onClick={() => {
          if (equippedToolId?.includes("shovel") && shovelMove) {
            const result = moveCropArea(
              state,
              { row: shovelMove.sourceRow, col: shovelMove.sourceCol },
              { row, col },
              shovelMove.areaSize,
              shovelMove.areaSize === 1 ? true : moveSprinklersWithShovel,
            );
            if (result.success && result.newState) {
              setState(result.newState);
              setShovelMove(null);
            } else if (result.reason) {
              alert(result.reason);
            }
            return;
          }

          setTileDetailModal({
            isOpen: true,
            row,
            col,
            type: "empty",
            emptyMode: "choice",
          });
        }}
      >
        {compactGridLabels
          ? fieldSprinklerId
            ? "💧"
            : fieldCoveredByAdjacentSprinkler
              ? "💦"
              : "+"
          : fieldSprinklerId
            ? "💧 Sprinkler"
            : fieldCoveredByAdjacentSprinkler
              ? "💦 Adjacent Water"
              : "Click to plant"}
      </div>
    );
  };

  return (
    <div style={{ padding: isMobile ? 8 : 16 }}>
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
        <h2 style={{ margin: 0 }}>🌾 Garden</h2>
        <div style={{ display: "flex", gap: 8 }}>
          {/* Tool Wheel Button */}
          <button
            className="btn-round-icon"
            style={{
              width: isMobile ? 44 : 50,
              height: isMobile ? 44 : 50,
              backgroundColor: "#FFD700",
              border: "2px solid #DAA520",
              fontSize: isMobile ? 20 : 24,
            }}
            onClick={() => setShowToolWheel(!showToolWheel)}
            title="Tool wheel"
          >
            🔧
          </button>

          {/* Seed Bag Button */}
          <button
            className="btn-round-icon"
            style={{
              width: isMobile ? 44 : 50,
              height: isMobile ? 44 : 50,
              backgroundColor: "#90EE90",
              border: "2px solid #228B22",
              fontSize: isMobile ? 20 : 24,
            }}
            onClick={() => setShowSeedBag(!showSeedBag)}
            title="Seed bag"
          >
            🎒
          </button>

          {/* Crop Silo Button */}
          <button
            className="btn-round-icon"
            style={{
              width: isMobile ? 44 : 50,
              height: isMobile ? 44 : 50,
              backgroundColor: "#F5F5DC",
              border: "2px solid #DAA520",
              fontSize: isMobile ? 19 : 22,
            }}
            onClick={() => setShowStorageModal(true)}
            title="Crop silos"
            aria-label="Open crop storage"
          >
            🛢️
          </button>
        </div>
      </div>

      {/* Tool Wheel Menu */}
      {showToolWheel && (
        <div
          style={{
            marginBottom: 16,
            padding: isMobile ? 10 : 12,
            backgroundColor: "#FFF8DC",
            borderRadius: 6,
            border: "1px solid #DAA520",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: 8 }}>
            Available Tools
          </div>

          {/* Tool Type Filter Buttons */}
          <div
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 8,
              flexWrap: "wrap",
            }}
          >
            <button
              className={toolTypeFilter === null ? "btn-selected" : ""}
              style={{
                padding: "4px 8px",
                fontSize: 11,
                border: "1px solid #999",
                borderRadius: 3,
              }}
              onClick={() => setToolTypeFilter(null)}
            >
              All
            </button>
            {["pickaxe", "shovel", "wateringcan", "sprinkler", "scythe"].map(
              (type) => (
                <button
                  key={type}
                  className={toolTypeFilter === type ? "btn-selected" : ""}
                  style={{
                    padding: "4px 8px",
                    fontSize: 11,
                    border: "1px solid #999",
                    borderRadius: 3,
                    textTransform: "capitalize",
                  }}
                  onClick={() => setToolTypeFilter(type)}
                >
                  {type}
                </button>
              ),
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
            {[
              ...state.inventory
                .filter((item) => getItemDefSafe(item.itemId)?.type === "tool")
                .map((item) => ({
                  key: item.uid,
                  equipValue: item.uid,
                  toolId: item.itemId,
                  level: item.level,
                  name: getItemDefSafe(item.itemId)?.name ?? item.itemId,
                })),
            ]
              .filter((tool) => {
                if (!toolTypeFilter) return true;
                return tool.toolId.includes(toolTypeFilter);
              })
              .map((tool) => {
                let description = "";
                let icon = "🔧";

                if (tool.toolId.includes("pickaxe")) {
                  icon = "⛏️";
                  description = "Click rocks to break them (costs energy)";
                } else if (tool.toolId.includes("shovel")) {
                  icon = "🪏";
                  const areaSize = tool.toolId.includes("mithril")
                    ? 5
                    : tool.toolId.includes("iron")
                      ? 3
                      : 1;
                  description = `Move planted fields (${areaSize}x${areaSize} area)`;
                } else if (tool.toolId.includes("sprinkler")) {
                  icon = "🌊";
                  description = "Click crops to place/remove sprinklers";
                } else if (tool.toolId.includes("wateringcan")) {
                  icon = "💧";
                  description = "Click crops to water them (10 energy)";
                } else if (tool.toolId.includes("scythe")) {
                  icon = "🔪";
                  description = "For future use";
                }

                return (
                  <button
                    key={tool.key}
                    style={{
                      padding: isMobile ? 12 : 10,
                      backgroundColor:
                        state.equipment.tool === tool.equipValue
                          ? "#51cf66"
                          : "#f0f0f0",
                      color:
                        state.equipment.tool === tool.equipValue
                          ? "white"
                          : "#333",
                      border: "1px solid #999",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: isMobile ? 12 : 11,
                      fontWeight:
                        state.equipment.tool === tool.equipValue
                          ? "bold"
                          : "normal",
                      textAlign: "left",
                    }}
                    onClick={() => {
                      // Equip tool
                      setState((prev) => ({
                        ...prev,
                        equipment: {
                          ...prev.equipment,
                          tool: tool.equipValue,
                        },
                      }));
                    }}
                    title={description}
                  >
                    <div style={{ fontWeight: "bold" }}>
                      {icon} {tool.name}
                    </div>
                    <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>
                      Level {tool.level}
                    </div>
                    <div
                      style={{
                        fontSize: 9,
                        opacity: 0.6,
                        marginTop: 4,
                        whiteSpace: "normal",
                      }}
                    >
                      {description}
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {equippedToolId?.includes("shovel") && (
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
          <div style={{ fontWeight: "bold", marginBottom: 6 }}>
            🪏 Shovel Mode
          </div>
          <div style={{ color: "#6b4f1d", marginBottom: 8 }}>
            {shovelMove
              ? `Source selected at (${shovelMove.sourceRow}, ${shovelMove.sourceCol}). Click an empty unlocked tile to move the area.`
              : `Click a planted tile to select a ${getShovelAreaSize()}x${getShovelAreaSize()} area to move.`}
          </div>
          {getShovelAreaSize() > 1 && (
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={moveSprinklersWithShovel}
                onChange={(e) => setMoveSprinklersWithShovel(e.target.checked)}
              />
              Move sprinklers with fields
            </label>
          )}
          {shovelMove && (
            <button
              style={{
                marginTop: 8,
                padding: "6px 10px",
                backgroundColor: "#f0f0f0",
                border: "1px solid #ccc",
                borderRadius: 4,
                cursor: "pointer",
              }}
              onClick={() => setShovelMove(null)}
            >
              Clear Selection
            </button>
          )}
        </div>
      )}

      {/* Seed Bag Menu */}
      {showSeedBag && (
        <div
          style={{
            marginBottom: 16,
            padding: isMobile ? 10 : 12,
            backgroundColor: "#F0FFF0",
            borderRadius: 6,
            border: "1px solid #228B22",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: 8 }}>Seed Bag</div>
          {seedBag.length === 0 ? (
            <p style={{ fontSize: 12, color: "#666" }}>No seeds yet</p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: 8,
              }}
            >
              {seedBag.map((seed) => (
                <div
                  key={seed.seedId}
                  style={{
                    padding: 8,
                    backgroundColor: "#f0f0f0",
                    border: "1px solid #ddd",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontSize: 11,
                    textAlign: "left",
                  }}
                >
                  <div>{seed.seedId}</div>
                  <div style={{ fontSize: 10, color: "#666" }}>
                    x {seed.count}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Garden Grid */}
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

      {/* Planting Modal */}
      {plantModal.isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() =>
            setPlantModal({
              ...plantModal,
              isOpen: false,
              selectedSeedId: null,
            })
          }
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: 8,
              padding: isMobile ? 12 : 16,
              maxHeight: isMobile ? "88vh" : "80vh",
              maxWidth: "500px",
              width: isMobile ? "94vw" : "500px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 16px 0" }}>
              Plant Seed at ({plantModal.row}, {plantModal.col})
            </h3>

            {seedBag.length === 0 ? (
              <p style={{ color: "#666", marginBottom: 16 }}>
                You don't have any seeds yet.
              </p>
            ) : (
              <>
                <div
                  style={{
                    marginBottom: 16,
                    overflowY: "auto",
                    maxHeight: "50vh",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      marginBottom: 8,
                      position: "sticky",
                      top: 0,
                      backgroundColor: "white",
                      paddingBottom: 8,
                    }}
                  >
                    Available Seeds:
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {seedBag.map((seed) => {
                      const cropId = resolveCropIdFromSeed(seed.seedId);
                      const cropDef = cropId ? getCropDef(cropId) : null;
                      const isSelected =
                        plantModal.selectedSeedId === seed.seedId;

                      return (
                        <div
                          key={seed.seedId}
                          style={{
                            padding: 8,
                            backgroundColor: isSelected ? "#51cf66" : "#f0f0f0",
                            border: isSelected
                              ? "2px solid #2f9e44"
                              : "1px solid #ddd",
                            borderRadius: 4,
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                          onClick={() =>
                            setPlantModal({
                              ...plantModal,
                              selectedSeedId: seed.seedId,
                            })
                          }
                        >
                          <div
                            style={{
                              fontWeight: "bold",
                              color: isSelected ? "white" : "black",
                            }}
                          >
                            {cropDef?.name || seed.seedId}
                          </div>
                          {cropDef && (
                            <div
                              style={{
                                display: "flex",
                                gap: 6,
                                flexWrap: "wrap",
                                marginTop: 6,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 10,
                                  padding: "2px 6px",
                                  borderRadius: 999,
                                  backgroundColor: isSelected
                                    ? "rgba(255,255,255,0.25)"
                                    : "#e9f7ef",
                                  color: isSelected ? "white" : "#2b8a3e",
                                  fontWeight: "bold",
                                }}
                              >
                                {isTreeCrop(cropDef) ? "Tree" : "Field"}
                              </span>
                              <span
                                style={{
                                  fontSize: 10,
                                  padding: "2px 6px",
                                  borderRadius: 999,
                                  backgroundColor: isSelected
                                    ? "rgba(255,255,255,0.25)"
                                    : "#fff3bf",
                                  color: isSelected ? "white" : "#8a5d00",
                                  fontWeight: "bold",
                                }}
                              >
                                {cropDef.isPerennial
                                  ? "Repeatable"
                                  : "One-time"}
                              </span>
                            </div>
                          )}
                          <div
                            style={{
                              fontSize: 12,
                              color: isSelected
                                ? "rgba(255,255,255,0.9)"
                                : "#666",
                              marginTop: 4,
                            }}
                          >
                            <div>
                              {!cropDef && (
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: isSelected ? "#ffe3e3" : "#c92a2a",
                                    marginTop: 4,
                                  }}
                                >
                                  This seed is not plantable in the garden yet.
                                </div>
                              )}
                              Growth: {cropDef?.growthTimeMinutes}m | Yield:{" "}
                              {cropDef?.baseYield}
                            </div>
                            <div>Available: x{seed.count}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    justifyContent: "flex-end",
                    marginTop: "auto",
                    paddingTop: 16,
                  }}
                >
                  <button
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#f0f0f0",
                      border: "1px solid #ddd",
                      borderRadius: 4,
                      cursor: "pointer",
                    }}
                    onClick={() =>
                      setPlantModal({
                        ...plantModal,
                        isOpen: false,
                        selectedSeedId: null,
                      })
                    }
                  >
                    Cancel
                  </button>
                  <button
                    style={{
                      padding: "8px 16px",
                      backgroundColor:
                        plantModal.selectedSeedId === null ? "#ccc" : "#51cf66",
                      color:
                        plantModal.selectedSeedId === null ? "#999" : "white",
                      border: "none",
                      borderRadius: 4,
                      cursor:
                        plantModal.selectedSeedId === null
                          ? "not-allowed"
                          : "pointer",
                      fontWeight: "bold",
                    }}
                    disabled={plantModal.selectedSeedId === null}
                    onClick={() => {
                      if (plantModal.selectedSeedId) {
                        const cropId = resolveCropIdFromSeed(
                          plantModal.selectedSeedId,
                        );
                        if (!cropId) {
                          alert(
                            "This seed cannot be planted in the garden yet.",
                          );
                          return;
                        }

                        let newState = plantCrop(
                          state,
                          cropId,
                          plantModal.row,
                          plantModal.col,
                        );

                        newState = {
                          ...newState,
                          inventory: newState.inventory.map((item) =>
                            item.itemId === plantModal.selectedSeedId
                              ? {
                                  ...item,
                                  quantity: item.quantity - 1,
                                }
                              : item,
                          ),
                        };

                        setState(newState);
                        setPlantModal({
                          isOpen: false,
                          row: 0,
                          col: 0,
                          selectedSeedId: null,
                        });
                      }
                    }}
                  >
                    Plant
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Crop Storage Modal */}
      {showStorageModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowStorageModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: 8,
              padding: isMobile ? 12 : 16,
              maxHeight: isMobile ? "88vh" : "80vh",
              maxWidth: "560px",
              width: isMobile ? "94vw" : "560px",
              overflow: "auto",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <h3 style={{ margin: 0 }}>🛢️ Crop Silos</h3>
              <button
                style={{
                  padding: "6px 10px",
                  backgroundColor: "#f0f0f0",
                  border: "1px solid #ddd",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
                onClick={() => setShowStorageModal(false)}
              >
                Close
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: 10,
                fontSize: isMobile ? 13 : 12,
              }}
            >
              {Object.entries(garden.cropStorage.current).map(
                ([category, amount]) => {
                  const limit = garden.cropStorage.limits[category];
                  const percent = (amount / limit) * 100;
                  return (
                    <div
                      key={category}
                      style={{
                        padding: 10,
                        border: "1px solid #e5e5e5",
                        borderRadius: 6,
                        backgroundColor: "#fafafa",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 4,
                        }}
                      >
                        <span>
                          {getCategoryIcon(category)}{" "}
                          {formatCategoryLabel(category)}
                        </span>
                        <span>
                          {amount} / {limit}
                        </span>
                      </div>
                      <div
                        style={{
                          height: 8,
                          backgroundColor: "#ddd",
                          borderRadius: 4,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            backgroundColor: "#51cf66",
                            width: `${percent}%`,
                            transition: "width 0.3s",
                          }}
                        />
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </div>
      )}

      {/* Harvest Modal */}
      {harvestModal.isOpen &&
        harvestModal.cropId &&
        harvestModal.cropIndex !== null && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
            onClick={() =>
              setHarvestModal({
                isOpen: false,
                cropId: null,
                cropIndex: null,
                row: 0,
                col: 0,
              })
            }
          >
            <div
              style={{
                backgroundColor: "white",
                borderRadius: 8,
                padding: isMobile ? 12 : 20,
                maxHeight: isMobile ? "88vh" : "80vh",
                maxWidth: "500px",
                width: isMobile ? "94vw" : "500px",
                overflow: "auto",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const cropId = harvestModal.cropId;
                const cropIndex = harvestModal.cropIndex;
                const cropDef = getCropDef(cropId);
                const cropInstance = garden.crops[cropId]?.[cropIndex];

                if (!cropDef || !cropInstance) return null;

                const yieldAmount = calculateYield(
                  cropDef,
                  cropInstance.waterLevel,
                );
                const waterBonus = Math.round(
                  (cropInstance.waterLevel / 100) * cropDef.baseYield,
                );
                const goldAmount = cropDef.baseGold;

                return (
                  <>
                    <h3 style={{ margin: "0 0 16px 0" }}>
                      🌾 Ready to Harvest!
                    </h3>

                    {/* Crop Info */}
                    <div
                      style={{
                        backgroundColor: "#F5F5DC",
                        padding: 12,
                        borderRadius: 6,
                        marginBottom: 16,
                      }}
                    >
                      <div style={{ fontWeight: "bold", marginBottom: 8 }}>
                        {cropDef.name}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#666",
                          lineHeight: "1.6",
                        }}
                      >
                        <div>Category: {cropDef.category}</div>
                        <div>Rarity: {cropDef.rarity}</div>
                        {cropDef.isPerennial && (
                          <div style={{ color: "#2f9e44" }}>
                            ♻️ This is a perennial - it will restart growing
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Harvest Summary */}
                    <div
                      style={{
                        backgroundColor: "#F0FFF0",
                        padding: 12,
                        borderRadius: 6,
                        marginBottom: 16,
                      }}
                    >
                      <div style={{ fontWeight: "bold", marginBottom: 10 }}>
                        Harvest Summary
                      </div>
                      <div style={{ fontSize: 12, lineHeight: "1.8" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span>Base Yield:</span>
                          <span>
                            {cropDef.baseYield} {cropDef.category}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            color:
                              cropInstance.waterLevel > 0 ? "#2f9e44" : "#999",
                          }}
                        >
                          <span>
                            Water Bonus (+
                            {Math.round((cropInstance.waterLevel / 100) * 100)}
                            %):
                          </span>
                          <span>+{waterBonus}</span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            borderTop: "1px solid #ddd",
                            paddingTop: 8,
                            marginTop: 8,
                            fontWeight: "bold",
                          }}
                        >
                          <span>Total {cropDef.category.toUpperCase()}:</span>
                          <span style={{ color: "#51cf66" }}>
                            +{yieldAmount}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginTop: 8,
                          }}
                        >
                          <span>💰 Gold Reward:</span>
                          <span style={{ color: "#FFD700" }}>
                            +{goldAmount}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginTop: 4,
                          }}
                        >
                          <span>⭐ XP (Category):</span>
                          <span style={{ color: "#4169E1" }}>
                            +{cropDef.baseXP}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Water Level Info */}
                    {cropInstance.waterLevel > 0 && (
                      <div
                        style={{
                          backgroundColor: "#E8F4F8",
                          padding: 10,
                          borderRadius: 6,
                          marginBottom: 16,
                          fontSize: 12,
                          color: "#0066cc",
                        }}
                      >
                        <span>💧 Water bonus active!</span> Your crop's water
                        level made it more productive. Keep watering your crops
                        for better yields!
                      </div>
                    )}

                    {/* Buttons */}
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        style={{
                          padding: "10px 20px",
                          backgroundColor: "#f0f0f0",
                          border: "1px solid #ddd",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontWeight: "bold",
                        }}
                        onClick={() =>
                          setHarvestModal({
                            isOpen: false,
                            cropId: null,
                            cropIndex: null,
                            row: 0,
                            col: 0,
                          })
                        }
                      >
                        Cancel
                      </button>
                      <button
                        style={{
                          padding: "10px 20px",
                          backgroundColor: "#51cf66",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontWeight: "bold",
                        }}
                        onClick={() => {
                          if (cropId && cropIndex !== null) {
                            const newState = harvestCrop(
                              state,
                              cropId,
                              cropIndex,
                            );
                            setState(newState);
                            setHarvestModal({
                              isOpen: false,
                              cropId: null,
                              cropIndex: null,
                              row: 0,
                              col: 0,
                            });
                          }
                        }}
                      >
                        Harvest Now!
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

      {/* Rock Break Modal */}
      {rockBreakModal.isOpen && rockBreakModal.rockTier && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() =>
            setRockBreakModal({
              isOpen: false,
              row: 0,
              col: 0,
              rockTier: null,
            })
          }
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: 8,
              padding: isMobile ? 12 : 20,
              maxHeight: isMobile ? "88vh" : "80vh",
              maxWidth: "500px",
              width: isMobile ? "94vw" : "500px",
              overflow: "auto",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const tier = rockBreakModal.rockTier;
              const config = rockConfig[tier!];
              const equippedPickaxe = equippedToolId?.includes("pickaxe")
                ? (state.equipment.tool ?? equippedToolId)
                : null;
              const pickaxeLevel = equippedToolId?.includes("pickaxe")
                ? (equippedToolItem?.level ?? garden.tools[equippedToolId] ?? 0)
                : 0;
              const meetsRequirement = pickaxeLevel >= config.minPickaxeLevel;
              const hasEnergy =
                (state.resources.energy ?? 0) >= config.energyCost;

              return (
                <>
                  <h3 style={{ margin: "0 0 16px 0" }}>⛏️ Break Rock</h3>

                  {/* Rock Info */}
                  <div
                    style={{
                      backgroundColor: "#F5F5DC",
                      padding: 12,
                      borderRadius: 6,
                      marginBottom: 16,
                    }}
                  >
                    <div style={{ fontWeight: "bold", marginBottom: 8 }}>
                      {tier?.charAt(0).toUpperCase() + tier?.slice(1)} Rock
                    </div>
                    <div
                      style={{ fontSize: 12, color: "#666", lineHeight: "1.6" }}
                    >
                      <div>
                        Location: ({rockBreakModal.row}, {rockBreakModal.col})
                      </div>
                      <div>
                        Difficulty:{" "}
                        {tier === "large"
                          ? "⭐⭐⭐"
                          : tier === "medium"
                            ? "⭐⭐"
                            : "⭐"}
                      </div>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div
                    style={{
                      backgroundColor: "#FFF8DC",
                      padding: 12,
                      borderRadius: 6,
                      marginBottom: 16,
                    }}
                  >
                    <div style={{ fontWeight: "bold", marginBottom: 10 }}>
                      Requirements
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        lineHeight: "1.8",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          padding: 8,
                          backgroundColor: meetsRequirement
                            ? "#E8F5E9"
                            : "#FFEBEE",
                          borderRadius: 4,
                          border: meetsRequirement
                            ? "1px solid #4CAF50"
                            : "1px solid #F44336",
                        }}
                      >
                        <div style={{ fontWeight: "bold", marginBottom: 4 }}>
                          Pickaxe Level
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span>Required: Level {config.minPickaxeLevel}</span>
                          <span
                            style={{
                              color: meetsRequirement ? "#4CAF50" : "#F44336",
                              fontWeight: "bold",
                            }}
                          >
                            {meetsRequirement ? "✓" : "✗"} Level {pickaxeLevel}
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          padding: 8,
                          backgroundColor: hasEnergy ? "#E3F2FD" : "#FFEBEE",
                          borderRadius: 4,
                          border: hasEnergy
                            ? "1px solid #2196F3"
                            : "1px solid #F44336",
                        }}
                      >
                        <div style={{ fontWeight: "bold", marginBottom: 4 }}>
                          Energy Cost
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span>
                            Required: {formatCompactNumber(config.energyCost)}{" "}
                            ⚡
                          </span>
                          <span
                            style={{
                              color: hasEnergy ? "#2196F3" : "#F44336",
                              fontWeight: "bold",
                            }}
                          >
                            {hasEnergy ? "✓" : "✗"}{" "}
                            {formatCompactNumber(state.resources.energy ?? 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Warning if requirements not met */}
                  {(!meetsRequirement || !hasEnergy) && (
                    <div
                      style={{
                        backgroundColor: "#FFF3E0",
                        padding: 10,
                        borderRadius: 6,
                        marginBottom: 16,
                        fontSize: 12,
                        color: "#E65100",
                        border: "1px solid #FFB74D",
                      }}
                    >
                      {!meetsRequirement && (
                        <div>
                          ⚠️ Your pickaxe is not strong enough. You need level{" "}
                          {config.minPickaxeLevel - pickaxeLevel} more levels.
                        </div>
                      )}
                      {!hasEnergy && (
                        <div>
                          ⚠️ Not enough energy. You need{" "}
                          {formatCompactNumber(
                            config.energyCost - (state.resources.energy ?? 0),
                          )}{" "}
                          more.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Buttons */}
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      style={{
                        padding: "10px 20px",
                        backgroundColor: "#f0f0f0",
                        border: "1px solid #ddd",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                      onClick={() =>
                        setRockBreakModal({
                          isOpen: false,
                          row: 0,
                          col: 0,
                          rockTier: null,
                        })
                      }
                    >
                      Cancel
                    </button>
                    <button
                      style={{
                        padding: "10px 20px",
                        backgroundColor:
                          meetsRequirement && hasEnergy ? "#FF9800" : "#ccc",
                        color: meetsRequirement && hasEnergy ? "white" : "#999",
                        border: "none",
                        borderRadius: 4,
                        cursor:
                          meetsRequirement && hasEnergy
                            ? "pointer"
                            : "not-allowed",
                        fontWeight: "bold",
                      }}
                      disabled={!meetsRequirement || !hasEnergy}
                      onClick={() => {
                        if (equippedPickaxe && rockBreakModal.rockTier) {
                          const result = breakRock(
                            state,
                            rockBreakModal.row,
                            rockBreakModal.col,
                            equippedPickaxe,
                          );

                          if (result.success && result.newState) {
                            setState(result.newState);
                            setRockBreakModal({
                              isOpen: false,
                              row: 0,
                              col: 0,
                              rockTier: null,
                            });
                          }
                        }
                      }}
                    >
                      Break Rock!
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Tile Detail Modal */}
      {tileDetailModal.isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() =>
            setTileDetailModal({ ...tileDetailModal, isOpen: false })
          }
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: 8,
              padding: isMobile ? 12 : 20,
              maxHeight: isMobile ? "88vh" : "80vh",
              maxWidth: "500px",
              width: isMobile ? "94vw" : "500px",
              overflow: "auto",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {tileDetailModal.type === "crop" &&
              tileDetailModal.cropId &&
              tileDetailModal.cropIndex !== undefined &&
              (() => {
                const cropInstance =
                  garden.crops[tileDetailModal.cropId]?.[
                    tileDetailModal.cropIndex
                  ];
                const cropDef = getCropDef(tileDetailModal.cropId);
                if (!cropInstance || !cropDef) return null;

                const progress = getGrowthProgress(cropInstance, cropDef);
                const isReady = progress >= 100;
                const timeRemaining = Math.max(
                  0,
                  cropDef.growthTimeMinutes -
                    (Date.now() - cropInstance.plantedAt) / (60 * 1000),
                );
                const yield_ = calculateYield(cropDef, cropInstance.waterLevel);

                return (
                  <>
                    <h3 style={{ margin: "0 0 16px 0" }}>{cropDef.name}</h3>

                    {/* Progress */}
                    <div style={{ marginBottom: 16 }}>
                      <div
                        style={{ fontSize: 12, color: "#666", marginBottom: 4 }}
                      >
                        Growth Progress: {progress.toFixed(0)}%
                      </div>
                      <div
                        style={{
                          height: 20,
                          backgroundColor: "#ddd",
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

                    {/* Time Remaining */}
                    {!isReady && (
                      <div
                        style={{
                          backgroundColor: "#FFF3E0",
                          padding: 10,
                          borderRadius: 6,
                          marginBottom: 12,
                          fontSize: 12,
                        }}
                      >
                        Time remaining: {Math.ceil(timeRemaining)} minutes
                      </div>
                    )}

                    {/* Water Mechanics */}
                    <div
                      style={{
                        backgroundColor: "#E3F2FD",
                        padding: 10,
                        borderRadius: 6,
                        marginBottom: 12,
                        fontSize: 11,
                      }}
                    >
                      <div style={{ fontWeight: "bold", marginBottom: 6 }}>
                        💧 Water Mechanics
                      </div>
                      <div style={{ lineHeight: "1.6", color: "#555" }}>
                        <div>
                          Water Level: {cropInstance.waterLevel.toFixed(0)}%
                        </div>
                        <div>
                          Sprinkler:{" "}
                          {cropInstance.hasSprinkler
                            ? "✓ Installed"
                            : "✗ Not installed"}
                        </div>
                        <div style={{ marginTop: 6 }}>
                          <strong>Watering Info:</strong>
                        </div>
                        <div>• Lasts: 12 hours</div>
                        <div>• Decay rate: 100/720 min</div>
                        <div>
                          • Current bonus: +{Math.ceil(cropInstance.waterLevel)}
                          % yield
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        backgroundColor: "#EDF7EE",
                        padding: 10,
                        borderRadius: 6,
                        marginBottom: 12,
                        fontSize: 11,
                      }}
                    >
                      <div style={{ fontWeight: "bold", marginBottom: 6 }}>
                        Sprinkler Controls
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        {cropInstance.hasSprinkler ? (
                          <button
                            style={{
                              padding: "6px 10px",
                              backgroundColor: "#ffebe8",
                              color: "#c62828",
                              border: "1px solid #f1998e",
                              borderRadius: 4,
                              cursor: "pointer",
                              fontWeight: "bold",
                              fontSize: 11,
                            }}
                            onClick={() => {
                              const newState = setCropSprinkler(
                                state,
                                tileDetailModal.row,
                                tileDetailModal.col,
                                null,
                              );
                              setState(newState);
                            }}
                          >
                            Remove Sprinkler
                          </button>
                        ) : getOwnedSprinklerIds().length > 0 ? (
                          getOwnedSprinklerIds().map((sprinklerId) => {
                            const sprinklerDef = getItemDefSafe(sprinklerId);
                            return (
                              <button
                                key={sprinklerId}
                                style={{
                                  padding: "6px 10px",
                                  backgroundColor: "#e3f2fd",
                                  color: "#0d47a1",
                                  border: "1px solid #90caf9",
                                  borderRadius: 4,
                                  cursor: "pointer",
                                  fontWeight: "bold",
                                  fontSize: 11,
                                }}
                                onClick={() => {
                                  if (
                                    isFieldCoveredBySprinklerNetwork(
                                      tileDetailModal.row,
                                      tileDetailModal.col,
                                      true,
                                    )
                                  ) {
                                    const proceed = window.confirm(
                                      "This field is already covered by another sprinkler. Install anyway?",
                                    );
                                    if (!proceed) return;
                                  }
                                  const newState = setCropSprinkler(
                                    state,
                                    tileDetailModal.row,
                                    tileDetailModal.col,
                                    sprinklerId,
                                  );
                                  setState(newState);
                                }}
                                onMouseEnter={() =>
                                  setSprinklerPreview({
                                    row: tileDetailModal.row,
                                    col: tileDetailModal.col,
                                    sprinklerId,
                                  })
                                }
                                onMouseLeave={() => setSprinklerPreview(null)}
                              >
                                Install {sprinklerDef?.name ?? sprinklerId}
                              </button>
                            );
                          })
                        ) : (
                          <span style={{ color: "#666" }}>
                            No sprinkler tool in inventory.
                          </span>
                        )}
                      </div>
                      <div style={{ marginTop: 8, color: "#4d4d4d" }}>
                        Coverage:{" "}
                        {fieldCoverageText(
                          tileDetailModal.row,
                          tileDetailModal.col,
                        )}
                      </div>
                    </div>

                    {/* Harvest Preview */}
                    <div
                      style={{
                        backgroundColor: "#F5F5DC",
                        padding: 10,
                        borderRadius: 6,
                        marginBottom: 16,
                        fontSize: 11,
                      }}
                    >
                      <div style={{ fontWeight: "bold", marginBottom: 6 }}>
                        📊 At Harvest
                      </div>
                      <div style={{ lineHeight: "1.6", color: "#555" }}>
                        <div>
                          Yield: {yield_} {cropDef.category}
                        </div>
                        <div>Gold: {cropDef.baseGold}</div>
                        <div>XP: {cropDef.baseXP}</div>
                        <div style={{ marginTop: 6 }}>
                          Type:{" "}
                          {cropDef.isPerennial ? "🔄 Perennial" : "🚫 One-time"}
                        </div>
                      </div>
                    </div>

                    {/* Buttons */}
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        style={{
                          padding: "10px 20px",
                          backgroundColor: "#f0f0f0",
                          border: "1px solid #ddd",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontWeight: "bold",
                        }}
                        onClick={() =>
                          setTileDetailModal({
                            ...tileDetailModal,
                            isOpen: false,
                          })
                        }
                      >
                        Close
                      </button>
                      {!isReady && (
                        <button
                          style={{
                            padding: "10px 20px",
                            backgroundColor:
                              (state.resources.gems ?? 0) >= speedUpGemCost
                                ? "#9c36ff"
                                : "#ccc",
                            color:
                              (state.resources.gems ?? 0) >= speedUpGemCost
                                ? "white"
                                : "#777",
                            border: "none",
                            borderRadius: 4,
                            cursor:
                              (state.resources.gems ?? 0) >= speedUpGemCost
                                ? "pointer"
                                : "not-allowed",
                            fontWeight: "bold",
                          }}
                          disabled={
                            (state.resources.gems ?? 0) < speedUpGemCost
                          }
                          onClick={() => {
                            const newState = reduceCropGrowthTime(
                              state,
                              tileDetailModal.cropId!,
                              tileDetailModal.cropIndex!,
                              speedUpMinutes,
                              speedUpGemCost,
                            );
                            setState(newState);
                          }}
                        >
                          Reduce {speedUpMinutes}m (
                          {formatCompactNumber(speedUpGemCost)}💎)
                        </button>
                      )}
                      {isReady && (
                        <button
                          style={{
                            padding: "10px 20px",
                            backgroundColor: "#51cf66",
                            color: "white",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                            fontWeight: "bold",
                          }}
                          onClick={() => {
                            const newState = harvestCrop(
                              state,
                              tileDetailModal.cropId!,
                              tileDetailModal.cropIndex!,
                            );
                            setState(newState);
                            setTileDetailModal({
                              ...tileDetailModal,
                              isOpen: false,
                            });
                          }}
                        >
                          Harvest Now
                        </button>
                      )}
                    </div>
                  </>
                );
              })()}

            {tileDetailModal.type === "rock" &&
              (() => {
                const rockSmall = garden.rocks.small.find(
                  (r) =>
                    r.row === tileDetailModal.row &&
                    r.col === tileDetailModal.col,
                );
                const rockMedium = garden.rocks.medium.find(
                  (r) =>
                    r.row === tileDetailModal.row &&
                    r.col === tileDetailModal.col,
                );
                const tier = rockSmall
                  ? "small"
                  : rockMedium
                    ? "medium"
                    : "large";
                const config = rockConfig[tier as "small" | "medium" | "large"];

                return (
                  <>
                    <h3 style={{ margin: "0 0 16px 0" }}>
                      {tier.charAt(0).toUpperCase() + tier.slice(1)} Rock
                    </h3>

                    <div
                      style={{
                        backgroundColor: "#F5F5DC",
                        padding: 12,
                        borderRadius: 6,
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          color: "#666",
                          lineHeight: "1.6",
                        }}
                      >
                        <div>
                          Location: ({tileDetailModal.row},{" "}
                          {tileDetailModal.col})
                        </div>
                        <div>
                          Difficulty:{" "}
                          {tier === "large"
                            ? "⭐⭐⭐"
                            : tier === "medium"
                              ? "⭐⭐"
                              : "⭐"}
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <strong>Requirements:</strong>
                        </div>
                        <div>• Pickaxe Level: {config.minPickaxeLevel}+</div>
                        <div>• Energy Cost: {config.energyCost} ⚡</div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        style={{
                          padding: "10px 20px",
                          backgroundColor: "#f0f0f0",
                          border: "1px solid #ddd",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontWeight: "bold",
                        }}
                        onClick={() =>
                          setTileDetailModal({
                            ...tileDetailModal,
                            isOpen: false,
                          })
                        }
                      >
                        Close
                      </button>
                      <button
                        style={{
                          padding: "10px 20px",
                          backgroundColor: "#FF9800",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontWeight: "bold",
                        }}
                        onClick={() => {
                          setTileDetailModal({
                            ...tileDetailModal,
                            isOpen: false,
                          });
                          setRockBreakModal({
                            isOpen: true,
                            row: tileDetailModal.row,
                            col: tileDetailModal.col,
                            rockTier: tier as "small" | "medium" | "large",
                          });
                        }}
                      >
                        Break Rock
                      </button>
                    </div>
                  </>
                );
              })()}

            {tileDetailModal.type === "empty" &&
              (() => {
                const emptyRow = tileDetailModal.row;
                const emptyCol = tileDetailModal.col;
                const fieldSprinklerId = getSprinklerAtField(
                  emptyRow,
                  emptyCol,
                );
                const ownedSprinklerIds = getOwnedSprinklerIds();

                if (tileDetailModal.emptyMode === "sprinkler") {
                  return (
                    <>
                      <h3 style={{ margin: "0 0 16px 0" }}>
                        Sprinkler Options @ ({emptyRow}, {emptyCol})
                      </h3>

                      <div
                        style={{
                          backgroundColor: "#E3F2FD",
                          padding: 12,
                          borderRadius: 6,
                          marginBottom: 16,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            color: "#0d47a1",
                            fontWeight: "bold",
                            marginBottom: 6,
                          }}
                        >
                          {fieldSprinklerId
                            ? `Installed: ${getItemDefSafe(fieldSprinklerId)?.name ?? fieldSprinklerId}`
                            : "No sprinkler installed on this field"}
                        </div>
                        <div style={{ fontSize: 11, color: "#444" }}>
                          Place a sprinkler now, or remove the current one.
                        </div>
                        <div
                          style={{ marginTop: 6, fontSize: 11, color: "#444" }}
                        >
                          Coverage tiers: common=self, rare=up/down/left/right
                          (1), epic=rare + diagonals (1), legendary=epic pattern
                          (2), unique=epic pattern (3).
                        </div>
                        <div
                          style={{ marginTop: 6, fontSize: 11, color: "#444" }}
                        >
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
                                  padding: "8px 12px",
                                  backgroundColor: "#e3f2fd",
                                  color: "#0d47a1",
                                  border: "1px solid #90caf9",
                                  borderRadius: 4,
                                  cursor: "pointer",
                                  fontWeight: "bold",
                                }}
                                onClick={() => {
                                  if (
                                    isFieldCoveredBySprinklerNetwork(
                                      emptyRow,
                                      emptyCol,
                                      true,
                                    )
                                  ) {
                                    const proceed = window.confirm(
                                      "This field is already covered by another sprinkler. Place anyway?",
                                    );
                                    if (!proceed) return;
                                  }
                                  const newState = placeSprinklerOnField(
                                    state,
                                    emptyRow,
                                    emptyCol,
                                    sprinklerId,
                                  );
                                  setState(newState);
                                }}
                                onMouseEnter={() =>
                                  setSprinklerPreview({
                                    row: emptyRow,
                                    col: emptyCol,
                                    sprinklerId,
                                  })
                                }
                                onMouseLeave={() => setSprinklerPreview(null)}
                              >
                                Place {sprinklerDef?.name ?? sprinklerId}
                              </button>
                            );
                          })
                        ) : (
                          <span style={{ color: "#666", fontSize: 12 }}>
                            No sprinkler tool in inventory.
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          justifyContent: "flex-end",
                        }}
                      >
                        <button
                          style={{
                            padding: "10px 20px",
                            backgroundColor: "#f0f0f0",
                            border: "1px solid #ddd",
                            borderRadius: 4,
                            cursor: "pointer",
                            fontWeight: "bold",
                          }}
                          onClick={() =>
                            setTileDetailModal({
                              ...tileDetailModal,
                              emptyMode: "choice",
                            })
                          }
                        >
                          Back
                        </button>
                        {fieldSprinklerId && (
                          <button
                            style={{
                              padding: "10px 20px",
                              backgroundColor: "#ffebe8",
                              color: "#c62828",
                              border: "1px solid #f1998e",
                              borderRadius: 4,
                              cursor: "pointer",
                              fontWeight: "bold",
                            }}
                            onClick={() => {
                              const newState = removeSprinklerFromField(
                                state,
                                emptyRow,
                                emptyCol,
                              );
                              setState(newState);
                            }}
                          >
                            Remove Sprinkler
                          </button>
                        )}
                        <button
                          style={{
                            padding: "10px 20px",
                            backgroundColor: "#f0f0f0",
                            border: "1px solid #ddd",
                            borderRadius: 4,
                            cursor: "pointer",
                            fontWeight: "bold",
                          }}
                          onClick={() =>
                            setTileDetailModal({
                              ...tileDetailModal,
                              isOpen: false,
                            })
                          }
                        >
                          Close
                        </button>
                      </div>
                    </>
                  );
                }

                return (
                  <>
                    <h3 style={{ margin: "0 0 16px 0" }}>
                      Field Options @ ({tileDetailModal.row},{" "}
                      {tileDetailModal.col})
                    </h3>

                    <div
                      style={{
                        backgroundColor: "#E8F5E9",
                        padding: 12,
                        borderRadius: 6,
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          color: "#1B5E20",
                          fontWeight: "bold",
                        }}
                      >
                        Do you want to plant a crop or place a sprinkler?
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        style={{
                          padding: "10px 20px",
                          backgroundColor: "#f0f0f0",
                          border: "1px solid #ddd",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontWeight: "bold",
                        }}
                        onClick={() =>
                          setTileDetailModal({
                            ...tileDetailModal,
                            isOpen: false,
                          })
                        }
                      >
                        Close
                      </button>
                      <button
                        style={{
                          padding: "10px 20px",
                          backgroundColor: "#2196F3",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontWeight: "bold",
                        }}
                        onClick={() =>
                          setTileDetailModal({
                            ...tileDetailModal,
                            emptyMode: "sprinkler",
                          })
                        }
                      >
                        Sprinkler
                      </button>
                      <button
                        style={{
                          padding: "10px 20px",
                          backgroundColor: "#51cf66",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontWeight: "bold",
                        }}
                        onClick={() => {
                          setTileDetailModal({
                            ...tileDetailModal,
                            isOpen: false,
                          });
                          setPlantModal({
                            isOpen: true,
                            row: tileDetailModal.row,
                            col: tileDetailModal.col,
                            selectedSeedId: null,
                          });
                        }}
                      >
                        Plant
                      </button>
                    </div>
                  </>
                );
              })()}
          </div>
        </div>
      )}
    </div>
  );
}
