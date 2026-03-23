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
  calculateYieldWithMastery,
  calculateGoldWithMastery,
  CROP_MAX_LEVEL,
  getCropXpForNextLevel,
  getCropYieldMultiplier,
  getCropGoldMultiplier,
  prestigeCropType,
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
  placeHarvesterOnField,
  removeHarvesterFromField,
  placePlanterOnField,
  removePlanterFromField,
  rockConfig,
} from "../game/garden";
import { getItemDefSafe } from "../game/items";
import { formatCompactNumber } from "../game/numberFormat";
import type { CropInstance, FieldPosition } from "../game/types";

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
  emptyMode?: "choice" | "automation";
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

interface PendingPlanterActionState {
  mode: "place" | "assign";
  row: number;
  col: number;
  planterId: string;
}

export function Garden() {
  const { state, setState } = useGame();
  const speedUpMinutes = 30;
  const speedUpGemCost = 100;
  const seedBagPlantEnergyCost = 1;
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
  const [showCropMasteryModal, setShowCropMasteryModal] = useState(false);
  const [isToolEffectActive, setIsToolEffectActive] = useState(false);
  const [activateSeedBagAfterSelection, setActivateSeedBagAfterSelection] =
    useState(false);
  const [seedSelectionTarget, setSeedSelectionTarget] = useState<
    "seedbag" | "planter"
  >("seedbag");
  const [pendingPlanterAction, setPendingPlanterAction] =
    useState<PendingPlanterActionState | null>(null);
  const [activeSeedBagSeedId, setActiveSeedBagSeedId] = useState<string | null>(
    null,
  );
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
  const toolbarButtonSize = isMobile ? 52 : 58;
  const toolbarIconSize = isMobile ? 22 : 26;
  const toolbarBadgeSize = isMobile ? 28 : 24;
  const toolbarCornerActionSize = isMobile ? 24 : 20;

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

  const normalizeToolId = (toolId: string | null | undefined): string =>
    (toolId ?? "").replace(/_/g, "").toLowerCase();

  const isPickaxeTool = (toolId: string | null | undefined): boolean =>
    normalizeToolId(toolId).includes("pickaxe");

  const isShovelTool = (toolId: string | null | undefined): boolean =>
    normalizeToolId(toolId).includes("shovel");

  const isWateringCanTool = (toolId: string | null | undefined): boolean =>
    normalizeToolId(toolId).includes("wateringcan");

  const isSprinklerTool = (toolId: string | null | undefined): boolean =>
    normalizeToolId(toolId).includes("sprinkler");

  const isScytheTool = (toolId: string | null | undefined): boolean =>
    normalizeToolId(toolId).includes("scythe");

  const isSeedBagTool = (toolId: string | null | undefined): boolean =>
    normalizeToolId(toolId).includes("seedbag");

  const isHarvesterTool = (toolId: string | null | undefined): boolean =>
    normalizeToolId(toolId).includes("harvester");

  const isPlanterTool = (toolId: string | null | undefined): boolean =>
    normalizeToolId(toolId).includes("planter");

  const getShovelAreaSize = (): number => {
    if (!isShovelTool(equippedToolId)) return 1;
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

  const getRaritySortValue = (rarity: string | null | undefined): number => {
    const rarityOrder: Record<string, number> = {
      common: 0,
      rare: 1,
      epic: 2,
      legendary: 3,
      unique: 4,
    };

    return rarityOrder[rarity ?? "common"] ?? rarityOrder.common;
  };

  const getToolIcon = (toolId: string | null | undefined): string => {
    if (!toolId) return "🧰";
    if (isPickaxeTool(toolId)) return "⛏️";
    if (isShovelTool(toolId)) return "🪏";
    if (isWateringCanTool(toolId)) return "💧";
    if (isSprinklerTool(toolId)) return "🌊";
    if (isHarvesterTool(toolId)) return "🤖";
    if (isPlanterTool(toolId)) return "🌱";
    if (isScytheTool(toolId)) return "🔪";
    if (isSeedBagTool(toolId)) return "🎒";
    return "🔧";
  };

  const getSeedPresentation = (seedId: string) => {
    const cropId = resolveCropIdFromSeed(seedId);
    const cropDef = cropId ? getCropDef(cropId) : null;
    const itemDef = getItemDefSafe(seedId);

    return {
      cropId,
      cropDef,
      icon: cropDef ? getCategoryIcon(cropDef.category) : "🌱",
      label: cropDef?.name ?? itemDef?.name ?? seedId,
    };
  };

  const handleSeedBagSeedSelect = (
    seedId: string,
    options?: { closeSeedBagModal?: boolean },
  ) => {
    if (seedSelectionTarget === "planter") {
      const pendingAction = pendingPlanterAction;
      setState((prev) => {
        const next = {
          ...prev,
          garden: {
            ...prev.garden,
            selectedPlanterSeedId: seedId,
          },
        };

        if (!pendingAction) return next;

        const key = `${pendingAction.row},${pendingAction.col}`;
        if (pendingAction.mode === "assign") {
          return {
            ...next,
            garden: {
              ...next.garden,
              planterSeedSelections: {
                ...(next.garden.planterSeedSelections ?? {}),
                [key]: seedId,
              },
            },
          };
        }

        return placePlanterOnField(
          next,
          pendingAction.row,
          pendingAction.col,
          pendingAction.planterId,
          seedId,
        );
      });
      if (activateSeedBagAfterSelection && !pendingAction) {
        setIsToolEffectActive(true);
      }
      setPendingPlanterAction(null);
      setTileDetailModal((prev) => ({ ...prev, isOpen: false }));
      setShowSeedBag(false);
      setActivateSeedBagAfterSelection(false);
      return;
    } else {
      setActiveSeedBagSeedId(seedId);
    }

    if (activateSeedBagAfterSelection && isSeedBagTool(equippedToolId)) {
      setIsToolEffectActive(true);
      setShowSeedBag(false);
      setActivateSeedBagAfterSelection(false);
      return;
    }

    if (options?.closeSeedBagModal) {
      setShowSeedBag(false);
    }
  };

  const activeSeedBagSeedPresentation = activeSeedBagSeedId
    ? getSeedPresentation(activeSeedBagSeedId)
    : null;

  const selectedPlanterSeedPresentation = state.garden.selectedPlanterSeedId
    ? getSeedPresentation(state.garden.selectedPlanterSeedId)
    : null;

  const openPlanterSeedSelection = (
    action: PendingPlanterActionState,
    closeTileModal = false,
  ) => {
    setPendingPlanterAction(action);
    setSeedSelectionTarget("planter");
    setActivateSeedBagAfterSelection(false);
    if (closeTileModal) {
      setTileDetailModal((prev) => ({ ...prev, isOpen: false }));
    }
    setShowSeedBag(true);
  };

  const getToolCoverageTiles = (
    centerRow: number,
    centerCol: number,
    toolId: string,
  ): FieldPosition[] => {
    const normalized = normalizeToolId(toolId);
    const isRare = normalized.includes("rare");
    const isEpic = normalized.includes("epic");
    const isLegendary = normalized.includes("legendary");
    const isUnique = normalized.includes("unique");

    // Requested tool ranges:
    // common: center only (1 tile)
    // rare: center + N/S/E/W (cross radius 1)
    // epic: full 3x3 square
    // legendary: full 5x5 square
    // unique: full 7x7 square
    let squareRadius = 0;
    if (isUnique) {
      squareRadius = 3;
    } else if (isLegendary) {
      squareRadius = 2;
    } else if (isEpic) {
      squareRadius = 1;
    }

    const tilesWithDistance: Array<{
      row: number;
      col: number;
      dr: number;
      dc: number;
    }> = [];

    for (let dr = -squareRadius; dr <= squareRadius; dr++) {
      for (let dc = -squareRadius; dc <= squareRadius; dc++) {
        const absDr = Math.abs(dr);
        const absDc = Math.abs(dc);

        if (isRare) {
          const isCross = absDr + absDc <= 1;
          if (!isCross) continue;
        }

        if (squareRadius === 0 && !isRare) {
          if (absDr !== 0 || absDc !== 0) continue;
        }

        if (squareRadius > 0 || isRare || (absDr === 0 && absDc === 0)) {
          tilesWithDistance.push({
            row: centerRow + dr,
            col: centerCol + dc,
            dr,
            dc,
          });
        }
      }
    }

    // Process center first, then expand outward ring-by-ring.
    tilesWithDistance.sort((a, b) => {
      const ringA = Math.max(Math.abs(a.dr), Math.abs(a.dc));
      const ringB = Math.max(Math.abs(b.dr), Math.abs(b.dc));
      if (ringA !== ringB) return ringA - ringB;

      const manhattanA = Math.abs(a.dr) + Math.abs(a.dc);
      const manhattanB = Math.abs(b.dr) + Math.abs(b.dc);
      if (manhattanA !== manhattanB) return manhattanA - manhattanB;

      if (a.dr !== b.dr) return a.dr - b.dr;
      return a.dc - b.dc;
    });

    return tilesWithDistance.map((tile) => ({
      row: tile.row,
      col: tile.col,
    }));
  };

  const applyWateringCanArea = (
    currentState: typeof state,
    centerRow: number,
    centerCol: number,
    toolId: string,
  ) => {
    const tiles = getToolCoverageTiles(centerRow, centerCol, toolId);
    let nextState = currentState;
    let wateredTiles = 0;
    let lackedEnergy = false;

    for (const tile of tiles) {
      let cropAtTile: CropInstance | null = null;
      for (const cropList of Object.values(nextState.garden.crops)) {
        const found = cropList.find(
          (crop) =>
            crop.position?.row === tile.row && crop.position?.col === tile.col,
        );
        if (found) {
          cropAtTile = found;
          break;
        }
      }

      if (!cropAtTile || cropAtTile.hasSprinkler) continue;

      const beforeEnergy = nextState.resources.energy ?? 0;
      const updatedState = waterField(nextState, tile.row, tile.col);
      const afterEnergy = updatedState.resources.energy ?? 0;

      if (afterEnergy < beforeEnergy) {
        wateredTiles += 1;
        nextState = updatedState;
      } else {
        lackedEnergy = true;
      }
    }

    return { nextState, wateredTiles, lackedEnergy };
  };

  const applyScytheHarvestArea = (
    currentState: typeof state,
    centerRow: number,
    centerCol: number,
    toolId: string,
  ) => {
    const tiles = getToolCoverageTiles(centerRow, centerCol, toolId);
    const tileKeySet = new Set(tiles.map((t) => `${t.row},${t.col}`));
    const targetsByCropId: Record<string, number[]> = {};

    for (const [cId, cropList] of Object.entries(currentState.garden.crops)) {
      const cropDef = getCropDef(cId);
      if (!cropDef) continue;

      cropList.forEach((crop, index) => {
        const key = `${crop.position.row},${crop.position.col}`;
        if (!tileKeySet.has(key)) return;
        if (getGrowthProgress(crop, cropDef) < 100) return;

        if (!targetsByCropId[cId]) targetsByCropId[cId] = [];
        targetsByCropId[cId].push(index);
      });
    }

    let nextState = currentState;
    for (const [cId, indexes] of Object.entries(targetsByCropId)) {
      const sortedDesc = [...indexes].sort((a, b) => b - a);
      for (const idx of sortedDesc) {
        nextState = harvestCrop(nextState, cId, idx);
      }
    }

    return nextState;
  };

  const consumeOneSeedFromInventory = (
    inventory: typeof state.inventory,
    seedId: string,
  ) => {
    const idx = inventory.findIndex(
      (item) => item.itemId === seedId && item.quantity > 0,
    );
    if (idx < 0) return { inventory, consumed: false };

    const nextInventory = [...inventory];
    const nextItem = { ...nextInventory[idx] };
    nextItem.quantity -= 1;

    if (nextItem.quantity <= 0) {
      nextInventory.splice(idx, 1);
    } else {
      nextInventory[idx] = nextItem;
    }

    return { inventory: nextInventory, consumed: true };
  };

  const hasRockAtPositionInState = (
    currentState: typeof state,
    row: number,
    col: number,
  ): boolean => {
    const rocks = currentState.garden.rocks;
    return (
      rocks.small.some((r) => r.row === row && r.col === col) ||
      rocks.medium.some((r) => r.row === row && r.col === col) ||
      rocks.large.some((r) => r.row === row && r.col === col)
    );
  };

  const hasCropAtPositionInState = (
    currentState: typeof state,
    row: number,
    col: number,
  ): boolean => {
    for (const cropList of Object.values(currentState.garden.crops)) {
      if (
        cropList.some(
          (crop) => crop.position?.row === row && crop.position?.col === col,
        )
      ) {
        return true;
      }
    }
    return false;
  };

  const isFieldUnlockedInState = (
    currentState: typeof state,
    row: number,
    col: number,
  ): boolean => {
    const unlocked = currentState.garden.unlockedFields;
    if (unlocked && unlocked.length > 0) {
      return unlocked.some((f) => f.row === row && f.col === col);
    }
    return (
      row < currentState.garden.gridSize.rows &&
      col < currentState.garden.gridSize.cols
    );
  };

  const applySeedBagPlantArea = (
    currentState: typeof state,
    centerRow: number,
    centerCol: number,
    toolId: string,
    seedId: string,
  ) => {
    const cropId = resolveCropIdFromSeed(seedId);
    if (!cropId) {
      return {
        nextState: currentState,
        plantedTiles: 0,
        lackedEnergy: false,
        lackedSeeds: false,
      };
    }

    const tiles = getToolCoverageTiles(centerRow, centerCol, toolId);
    let nextState = currentState;
    let plantedTiles = 0;
    let lackedEnergy = false;
    let lackedSeeds = false;

    for (const tile of tiles) {
      if (!isFieldUnlockedInState(nextState, tile.row, tile.col)) continue;
      if (hasRockAtPositionInState(nextState, tile.row, tile.col)) continue;
      if (hasCropAtPositionInState(nextState, tile.row, tile.col)) continue;

      const energy = nextState.resources.energy ?? 0;
      if (energy < seedBagPlantEnergyCost) {
        lackedEnergy = true;
        break;
      }

      const consumed = consumeOneSeedFromInventory(nextState.inventory, seedId);
      if (!consumed.consumed) {
        lackedSeeds = true;
        break;
      }

      let plantedState = plantCrop(nextState, cropId, tile.row, tile.col);
      plantedState = {
        ...plantedState,
        inventory: consumed.inventory,
        resources: {
          ...plantedState.resources,
          energy: energy - seedBagPlantEnergyCost,
        },
      };

      nextState = plantedState;
      plantedTiles += 1;
    }

    return { nextState, plantedTiles, lackedEnergy, lackedSeeds };
  };

  useEffect(() => {
    setIsToolEffectActive(false);
    setShovelMove(null);
    setActiveSeedBagSeedId(null);
  }, [equippedToolId]);

  useEffect(() => {
    if (!isToolEffectActive) {
      setShovelMove(null);
    }
  }, [isToolEffectActive]);

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

  const getOwnedHarvesterIds = (): string[] => {
    const ids = state.inventory
      .filter((item) => {
        const def = getItemDefSafe(item.itemId);
        return def?.type === "tool" && item.itemId.includes("harvester");
      })
      .map((item) => item.itemId);
    return Array.from(new Set(ids));
  };

  const getOwnedPlanterIds = (): string[] => {
    const ids = state.inventory
      .filter((item) => {
        const def = getItemDefSafe(item.itemId);
        return def?.type === "tool" && item.itemId.includes("planter");
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

  const getHarvesterAtField = (row: number, col: number): string | null => {
    for (const [harvesterId, positions] of Object.entries(
      garden.harvesters ?? {},
    )) {
      if (positions.some((p) => p.row === row && p.col === col)) {
        return harvesterId;
      }
    }
    return null;
  };

  const getPlanterAtField = (row: number, col: number): string | null => {
    for (const [planterId, positions] of Object.entries(
      garden.planters ?? {},
    )) {
      if (positions.some((p) => p.row === row && p.col === col)) {
        return planterId;
      }
    }
    return null;
  };

  const getAutomationToolAtField = (
    row: number,
    col: number,
  ): { type: "sprinkler" | "harvester" | "planter"; id: string } | null => {
    const sprinklerId = getSprinklerAtField(row, col);
    if (sprinklerId) return { type: "sprinkler", id: sprinklerId };

    const harvesterId = getHarvesterAtField(row, col);
    if (harvesterId) return { type: "harvester", id: harvesterId };

    const planterId = getPlanterAtField(row, col);
    if (planterId) return { type: "planter", id: planterId };

    return null;
  };

  const getCropMastery = (cropId: string) => {
    const existing = garden.cropMastery?.[cropId];
    return {
      level: Math.max(1, Math.min(CROP_MAX_LEVEL, existing?.level ?? 1)),
      xp: Math.max(0, existing?.xp ?? 0),
      prestige: Math.max(0, existing?.prestige ?? 0),
    };
  };

  const getCropYieldAtLevel = (cropId: string, level: number): number => {
    const cropDef = getCropDef(cropId);
    if (!cropDef) return 0;
    const mastery = getCropMastery(cropId);
    const base = calculateYield(cropDef, 0);
    const multiplier = getCropYieldMultiplier(level, mastery.prestige);
    return Math.max(1, Math.round(base * multiplier));
  };

  const getCropGoldWithPrestige = (cropId: string): number => {
    const cropDef = getCropDef(cropId);
    if (!cropDef) return 0;
    const mastery = getCropMastery(cropId);
    const multiplier = getCropGoldMultiplier(mastery.prestige);
    return Math.max(1, Math.round(cropDef.baseGold * multiplier));
  };

  const allCropTypes = Object.values(cropDefinitions).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

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
      .filter(([toolId]) => normalizeToolId(toolId).startsWith("pickaxe"))
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
      const pickaxeActive = isToolEffectActive && isPickaxeTool(equippedToolId);
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
            opacity: pickaxeActive ? 1 : 0.8,
            filter: pickaxeActive
              ? "drop-shadow(0 0 6px rgba(255, 200, 0, 0.6))"
              : "none",
          }}
          aria-label={`${tier} rock - requires pickaxe (Level ${config.minPickaxeLevel}+, ${config.energyCost} energy)`}
          onClick={() => {
            if (pickaxeActive) {
              setRockBreakModal({
                isOpen: true,
                row,
                col,
                rockTier: tier as "small" | "medium" | "large",
              });
              return;
            }

            setTileDetailModal({
              isOpen: true,
              row,
              col,
              type: "rock",
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
      const harvesterOnTile = getHarvesterAtField(row, col);
      const planterOnTile = getPlanterAtField(row, col);

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
            const toolActive = isToolEffectActive;

            if (toolActive && isShovelTool(equippedTool)) {
              setShovelMove({
                sourceRow: row,
                sourceCol: col,
                areaSize: getShovelAreaSize(),
              });
              return;
            }

            // Handle sprinkler placement
            if (toolActive && isSprinklerTool(equippedTool)) {
              const newState = toggleSprinkler(state, row, col);
              setState(newState);
              return;
            }

            if (toolActive && isHarvesterTool(equippedTool)) {
              const newState = harvesterOnTile
                ? removeHarvesterFromField(state, row, col)
                : placeHarvesterOnField(state, row, col, equippedTool ?? "");
              if (newState === state) {
                alert(
                  "This tile already has another automation tool. Remove it first.",
                );
              }
              setState(newState);
              return;
            }

            if (toolActive && isPlanterTool(equippedTool)) {
              if (!planterOnTile && !state.garden.selectedPlanterSeedId) {
                openPlanterSeedSelection({
                  mode: "place",
                  row,
                  col,
                  planterId: equippedTool ?? "",
                });
                return;
              }
              const newState = planterOnTile
                ? removePlanterFromField(state, row, col)
                : placePlanterOnField(
                    state,
                    row,
                    col,
                    equippedTool ?? "",
                    state.garden.selectedPlanterSeedId,
                  );
              if (newState === state) {
                alert(
                  "This tile already has another automation tool. Remove it first.",
                );
              }
              setState(newState);
              return;
            }

            // Handle watering can (AoE by rarity profile)
            if (toolActive && isWateringCanTool(equippedTool)) {
              const result = applyWateringCanArea(
                state,
                row,
                col,
                equippedTool ?? "",
              );
              if (result.wateredTiles > 0) {
                setState(result.nextState);
              } else if (result.lackedEnergy) {
                alert("Not enough energy to water crops in range.");
              }
              return;
            }

            // Handle scythe (AoE harvest by rarity profile)
            if (toolActive && isScytheTool(equippedTool)) {
              const newState = applyScytheHarvestArea(
                state,
                row,
                col,
                equippedTool ?? "",
              );
              setState(newState);
              return;
            }

            if (toolActive && isSeedBagTool(equippedTool)) {
              if (!activeSeedBagSeedId) {
                alert("Select a seed in the tool selector first.");
                return;
              }
              const result = applySeedBagPlantArea(
                state,
                row,
                col,
                equippedTool ?? "",
                activeSeedBagSeedId,
              );
              if (result.plantedTiles > 0) {
                setState(result.nextState);
              } else if (result.lackedEnergy) {
                alert("Not enough energy to plant in range.");
              } else if (result.lackedSeeds) {
                alert("Not enough seeds to plant in range.");
              }
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

          {harvesterOnTile && (
            <div
              style={{
                position: "absolute",
                bottom: 2,
                right: 2,
                fontSize: 10,
                backgroundColor: "#334155",
                color: "#e2e8f0",
                borderRadius: 8,
                padding: "1px 4px",
                fontWeight: "bold",
              }}
              aria-label="Harvester installed"
            >
              HARV
            </div>
          )}

          {planterOnTile && (
            <div
              style={{
                position: "absolute",
                bottom: 2,
                left: 2,
                fontSize: 10,
                backgroundColor: "#1b4332",
                color: "#d8f3dc",
                borderRadius: 8,
                padding: "1px 4px",
                fontWeight: "bold",
              }}
              aria-label="Planter installed"
            >
              PLAN
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
    const fieldAutomationTool = getAutomationToolAtField(row, col);
    const fieldSprinklerId =
      fieldAutomationTool?.type === "sprinkler" ? fieldAutomationTool.id : null;
    const fieldHarvesterId =
      fieldAutomationTool?.type === "harvester" ? fieldAutomationTool.id : null;
    const fieldPlanterId =
      fieldAutomationTool?.type === "planter" ? fieldAutomationTool.id : null;
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
        onClick={() => {
          if (
            isToolEffectActive &&
            isShovelTool(equippedToolId) &&
            shovelMove
          ) {
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

          if (isToolEffectActive && isWateringCanTool(equippedToolId)) {
            const result = applyWateringCanArea(
              state,
              row,
              col,
              equippedToolId ?? "",
            );
            if (result.wateredTiles > 0) {
              setState(result.nextState);
            } else if (result.lackedEnergy) {
              alert("Not enough energy to water crops in range.");
            }
            return;
          }

          if (isToolEffectActive && isScytheTool(equippedToolId)) {
            const newState = applyScytheHarvestArea(
              state,
              row,
              col,
              equippedToolId ?? "",
            );
            setState(newState);
            return;
          }

          if (isToolEffectActive && isSeedBagTool(equippedToolId)) {
            if (!activeSeedBagSeedId) {
              alert("Select a seed in the tool selector first.");
              return;
            }
            const result = applySeedBagPlantArea(
              state,
              row,
              col,
              equippedToolId ?? "",
              activeSeedBagSeedId,
            );
            if (result.plantedTiles > 0) {
              setState(result.nextState);
            } else if (result.lackedEnergy) {
              alert("Not enough energy to plant in range.");
            } else if (result.lackedSeeds) {
              alert("Not enough seeds to plant in range.");
            }
            return;
          }

          if (isToolEffectActive && isHarvesterTool(equippedToolId)) {
            const newState = fieldHarvesterId
              ? removeHarvesterFromField(state, row, col)
              : placeHarvesterOnField(state, row, col, equippedToolId ?? "");
            if (newState === state) {
              alert(
                "This tile already has another automation tool. Remove it first.",
              );
            }
            setState(newState);
            return;
          }

          if (isToolEffectActive && isPlanterTool(equippedToolId)) {
            if (!fieldPlanterId && !state.garden.selectedPlanterSeedId) {
              openPlanterSeedSelection({
                mode: "place",
                row,
                col,
                planterId: equippedToolId ?? "",
              });
              return;
            }
            const newState = fieldPlanterId
              ? removePlanterFromField(state, row, col)
              : placePlanterOnField(
                  state,
                  row,
                  col,
                  equippedToolId ?? "",
                  state.garden.selectedPlanterSeedId,
                );
            if (newState === state) {
              alert(
                "This tile already has another automation tool. Remove it first.",
              );
            }
            setState(newState);
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
              width: toolbarButtonSize,
              height: toolbarButtonSize,
              backgroundColor: "#FFD700",
              border: "2px solid #DAA520",
              fontSize: toolbarIconSize,
            }}
            onClick={() => setShowToolWheel(!showToolWheel)}
            title="Tool wheel"
          >
            🔧
          </button>

          {/* Crop Silo Button */}
          <button
            className="btn-round-icon"
            style={{
              width: toolbarButtonSize,
              height: toolbarButtonSize,
              backgroundColor: "#F5F5DC",
              border: "2px solid #DAA520",
              fontSize: toolbarIconSize,
            }}
            onClick={() => setShowStorageModal(true)}
            title="Crop silos"
            aria-label="Open crop storage"
          >
            🛢️
          </button>

          {/* Crop Mastery Button */}
          <button
            className="btn-round-icon"
            style={{
              width: toolbarButtonSize,
              height: toolbarButtonSize,
              backgroundColor: "#e7f5ff",
              border: "2px solid #4dabf7",
              fontSize: toolbarIconSize,
            }}
            onClick={() => setShowCropMasteryModal(true)}
            title="Crop mastery"
            aria-label="Open crop mastery"
          >
            📈
          </button>

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
              onClick={() => {
                if (!equippedToolId) {
                  setShowToolWheel(true);
                  return;
                }

                const willActivate = !isToolEffectActive;
                if (
                  willActivate &&
                  isSeedBagTool(equippedToolId) &&
                  !activeSeedBagSeedId
                ) {
                  setSeedSelectionTarget("seedbag");
                  setActivateSeedBagAfterSelection(true);
                  setShowSeedBag(true);
                  return;
                }

                if (
                  willActivate &&
                  isPlanterTool(equippedToolId) &&
                  !state.garden.selectedPlanterSeedId
                ) {
                  setPendingPlanterAction(null);
                  setSeedSelectionTarget("planter");
                  setActivateSeedBagAfterSelection(true);
                  setShowSeedBag(true);
                  return;
                }

                setActivateSeedBagAfterSelection(false);
                setIsToolEffectActive((prev) => !prev);
              }}
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
              {getToolIcon(equippedToolId)}
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
                  setActivateSeedBagAfterSelection(false);
                  setIsToolEffectActive(false);
                  setState((prev) => ({
                    ...prev,
                    equipment: {
                      ...prev.equipment,
                      tool: null,
                    },
                  }));
                }}
              >
                ×
              </button>
            )}
            {isSeedBagTool(equippedToolId) && activeSeedBagSeedPresentation && (
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
                  setActivateSeedBagAfterSelection(false);
                  setSeedSelectionTarget("seedbag");
                  setShowSeedBag(true);
                }}
              >
                {activeSeedBagSeedPresentation.icon}
              </button>
            )}
            {isPlanterTool(equippedToolId) &&
              selectedPlanterSeedPresentation && (
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
                    setActivateSeedBagAfterSelection(false);
                    setSeedSelectionTarget("planter");
                    setShowSeedBag(true);
                  }}
                >
                  {selectedPlanterSeedPresentation.icon}
                </button>
              )}
          </div>
        </div>
      </div>

      {/* Tool Wheel Menu */}
      {showToolWheel && (
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
          onClick={() => setShowToolWheel(false)}
        >
          <div
            style={{
              padding: isMobile ? 10 : 12,
              backgroundColor: "#16212d",
              borderRadius: 8,
              border: "1px solid #2a3a4c",
              width: isMobile ? "94vw" : "560px",
              maxWidth: "560px",
              maxHeight: isMobile ? "88vh" : "80vh",
              overflow: "auto",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                fontWeight: "bold",
                marginBottom: 8,
                color: "#e5edf5",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Available Tools</span>
              <button
                style={{
                  padding: "4px 8px",
                  backgroundColor: "#253649",
                  border: "1px solid #3f546a",
                  color: "#eaf2fb",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 12,
                }}
                onClick={() => setShowToolWheel(false)}
              >
                Close
              </button>
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
                  border: "1px solid #3f546a",
                  borderRadius: 3,
                  backgroundColor: "#1b2a39",
                  color: "#e5edf5",
                }}
                onClick={() => setToolTypeFilter(null)}
              >
                All
              </button>
              {[
                "pickaxe",
                "shovel",
                "wateringcan",
                "sprinkler",
                "harvester",
                "planter",
                "scythe",
                "seedbag",
              ].map((type) => (
                <button
                  key={type}
                  className={toolTypeFilter === type ? "btn-selected" : ""}
                  style={{
                    padding: "4px 8px",
                    fontSize: 11,
                    border: "1px solid #3f546a",
                    borderRadius: 3,
                    textTransform: "capitalize",
                    backgroundColor: "#1b2a39",
                    color: "#e5edf5",
                  }}
                  onClick={() => setToolTypeFilter(type)}
                >
                  {type}
                </button>
              ))}
            </div>

            <div
              style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}
            >
              {(() => {
                const filteredTools = [
                  ...state.inventory
                    .filter(
                      (item) => getItemDefSafe(item.itemId)?.type === "tool",
                    )
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
                    if (toolTypeFilter === "wateringcan") {
                      return isWateringCanTool(tool.toolId);
                    }
                    if (toolTypeFilter === "seedbag") {
                      return isSeedBagTool(tool.toolId);
                    }
                    return normalizeToolId(tool.toolId).includes(
                      toolTypeFilter,
                    );
                  })
                  .sort((a, b) => {
                    const aRarity =
                      getItemDefSafe(a.toolId)?.rarity ?? "common";
                    const bRarity =
                      getItemDefSafe(b.toolId)?.rarity ?? "common";
                    const rarityDelta =
                      getRaritySortValue(bRarity) - getRaritySortValue(aRarity);
                    if (rarityDelta !== 0) return rarityDelta;
                    if (a.level !== b.level) return b.level - a.level;
                    return a.name.localeCompare(b.name);
                  });

                if (filteredTools.length === 0) {
                  const message =
                    toolTypeFilter === "harvester"
                      ? "Acquire a harvester to use this function."
                      : toolTypeFilter === "planter"
                        ? "Acquire a planter to use this function."
                        : toolTypeFilter === "sprinkler"
                          ? "Acquire a sprinkler to use this function."
                          : "No tools in inventory yet.";

                  return (
                    <div
                      style={{
                        padding: 10,
                        border: "1px solid #34516a",
                        borderRadius: 4,
                        fontSize: 11,
                        color: "#9eb0c2",
                        backgroundColor: "#1b2d3f",
                      }}
                    >
                      {message}
                    </div>
                  );
                }

                return filteredTools.map((tool) => {
                  let description = "";
                  let icon = "🔧";

                  if (isPickaxeTool(tool.toolId)) {
                    icon = "⛏️";
                    description = "Click rocks to break them (costs energy)";
                  } else if (isShovelTool(tool.toolId)) {
                    icon = "🪏";
                    const areaSize = tool.toolId.includes("mithril")
                      ? 5
                      : tool.toolId.includes("iron")
                        ? 3
                        : 1;
                    description = `Move planted fields (${areaSize}x${areaSize} area)`;
                  } else if (isSprinklerTool(tool.toolId)) {
                    icon = "🌊";
                    description = "Click crops to place/remove sprinklers";
                  } else if (isHarvesterTool(tool.toolId)) {
                    icon = "🤖";
                    description =
                      "Auto-harvests finished crops in sprinkler-style range";
                  } else if (isPlanterTool(tool.toolId)) {
                    icon = "🌱";
                    description =
                      "Auto-plants selected seed in sprinkler-style range";
                  } else if (isWateringCanTool(tool.toolId)) {
                    icon = "💧";
                    description = "Click crops to water them (10 energy)";
                  } else if (isScytheTool(tool.toolId)) {
                    icon = "🔪";
                    description = "For future use";
                  } else if (isSeedBagTool(tool.toolId)) {
                    icon = "🎒";
                    description = "Plant seeds in an area around clicked tile";
                  }

                  return (
                    <button
                      key={tool.key}
                      style={{
                        padding: isMobile ? 12 : 10,
                        backgroundColor:
                          state.equipment.tool === tool.equipValue
                            ? "#1f7f43"
                            : "#1b2d3f",
                        color:
                          state.equipment.tool === tool.equipValue
                            ? "white"
                            : "#e5edf5",
                        border: "1px solid #34516a",
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
                      <div
                        style={{ fontSize: 10, opacity: 0.92, marginTop: 2 }}
                      >
                        Level {tool.level}
                      </div>
                      <div
                        style={{
                          fontSize: 9,
                          opacity: 0.78,
                          marginTop: 4,
                          whiteSpace: "normal",
                        }}
                      >
                        {description}
                      </div>
                    </button>
                  );
                });
              })()}
            </div>

            {isSeedBagTool(equippedToolId) && (
              <div
                style={{
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: "1px solid #2a3a4c",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: "bold",
                    color: "#e5edf5",
                    marginBottom: 8,
                  }}
                >
                  Seed Bag Tool: Select Seed
                </div>
                {seedBag.length === 0 ? (
                  <div style={{ fontSize: 11, color: "#9eb0c2" }}>
                    No seeds available.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {seedBag.map((seed) => {
                      const seedPresentation = getSeedPresentation(seed.seedId);

                      return (
                        <button
                          key={seed.seedId}
                          className={
                            activeSeedBagSeedId === seed.seedId
                              ? "btn-selected"
                              : ""
                          }
                          style={{
                            padding: "4px 8px",
                            fontSize: 11,
                            border: "1px solid #3f546a",
                            borderRadius: 3,
                            backgroundColor: "#1b2a39",
                            color: "#e5edf5",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                          onClick={() => handleSeedBagSeedSelect(seed.seedId)}
                          title={seedPresentation.label}
                        >
                          <span>{seedPresentation.icon}</span>
                          <span>
                            {seedPresentation.label} x{seed.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {isPlanterTool(equippedToolId) && (
              <div
                style={{
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: "1px solid #2a3a4c",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: "bold",
                    color: "#e5edf5",
                    marginBottom: 8,
                  }}
                >
                  Planter Tool: Select Seed
                </div>
                {seedBag.length === 0 ? (
                  <div style={{ fontSize: 11, color: "#9eb0c2" }}>
                    No seeds available.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {seedBag.map((seed) => {
                      const seedPresentation = getSeedPresentation(seed.seedId);

                      return (
                        <button
                          key={`planter-${seed.seedId}`}
                          className={
                            state.garden.selectedPlanterSeedId === seed.seedId
                              ? "btn-selected"
                              : ""
                          }
                          style={{
                            padding: "4px 8px",
                            fontSize: 11,
                            border: "1px solid #3f546a",
                            borderRadius: 3,
                            backgroundColor: "#1b2a39",
                            color: "#e5edf5",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                          onClick={() => {
                            setPendingPlanterAction(null);
                            setSeedSelectionTarget("planter");
                            handleSeedBagSeedSelect(seed.seedId);
                          }}
                          title={seedPresentation.label}
                        >
                          <span>{seedPresentation.icon}</span>
                          <span>
                            {seedPresentation.label} x{seed.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {isShovelTool(equippedToolId) && isToolEffectActive && (
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
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(6, 10, 14, 0.72)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1200,
          }}
          onClick={() => {
            setShowSeedBag(false);
            setActivateSeedBagAfterSelection(false);
            setPendingPlanterAction(null);
          }}
        >
          <div
            style={{
              padding: isMobile ? 10 : 12,
              backgroundColor: "#16212d",
              borderRadius: 8,
              border: "1px solid #2a3a4c",
              width: isMobile ? "94vw" : "560px",
              maxWidth: "560px",
              maxHeight: isMobile ? "88vh" : "80vh",
              overflow: "auto",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                fontWeight: "bold",
                marginBottom: 8,
                color: "#e5edf5",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>
                Seed Bag{" "}
                {seedSelectionTarget === "planter" ? "(Planter Seed)" : ""}
              </span>
              <button
                style={{
                  padding: "4px 8px",
                  backgroundColor: "#253649",
                  border: "1px solid #3f546a",
                  color: "#eaf2fb",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 12,
                }}
                onClick={() => {
                  setShowSeedBag(false);
                  setActivateSeedBagAfterSelection(false);
                  setPendingPlanterAction(null);
                }}
              >
                Close
              </button>
            </div>
            {seedBag.length === 0 ? (
              <p style={{ fontSize: 12, color: "#9eb0c2" }}>No seeds yet</p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: 8,
                }}
              >
                {(() => {
                  const pendingKey = pendingPlanterAction
                    ? `${pendingPlanterAction.row},${pendingPlanterAction.col}`
                    : null;
                  const selectedPlanterSeedForModal =
                    seedSelectionTarget === "planter" &&
                    pendingPlanterAction?.mode === "assign" &&
                    pendingKey
                      ? (state.garden.planterSeedSelections?.[pendingKey] ??
                        state.garden.selectedPlanterSeedId)
                      : state.garden.selectedPlanterSeedId;

                  return seedBag.map((seed) => {
                    const seedPresentation = getSeedPresentation(seed.seedId);
                    const isSelected =
                      seedSelectionTarget === "planter"
                        ? selectedPlanterSeedForModal === seed.seedId
                        : activeSeedBagSeedId === seed.seedId;

                    return (
                      <button
                        key={seed.seedId}
                        type="button"
                        className={isSelected ? "btn-selected" : ""}
                        style={{
                          padding: 8,
                          backgroundColor: isSelected ? "#1d6a3a" : "#1b2d3f",
                          border: isSelected
                            ? "2px solid #2f9e44"
                            : "1px solid #34516a",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontSize: 11,
                          textAlign: "left",
                          color: "#e5edf5",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                        }}
                        onClick={() =>
                          handleSeedBagSeedSelect(seed.seedId, {
                            closeSeedBagModal: true,
                          })
                        }
                        title={seedPresentation.label}
                      >
                        <span style={{ fontSize: 18, lineHeight: 1.1 }}>
                          {seedPresentation.icon}
                        </span>
                        <span>
                          <div style={{ fontWeight: "bold" }}>
                            {seedPresentation.label}
                          </div>
                          <div style={{ fontSize: 10, color: "#9eb0c2" }}>
                            x {seed.count}
                          </div>
                        </span>
                      </button>
                    );
                  });
                })()}
              </div>
            )}
          </div>
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
            backgroundColor: "rgba(6, 10, 14, 0.72)",
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
              backgroundColor: "#162433",
              color: "#e5edf5",
              borderRadius: 8,
              padding: isMobile ? 12 : 16,
              maxHeight: isMobile ? "88vh" : "80vh",
              maxWidth: "500px",
              width: isMobile ? "94vw" : "500px",
              border: "1px solid #35506a",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 16px 0" }}>
              Plant Seed at ({plantModal.row}, {plantModal.col})
            </h3>

            {seedBag.length === 0 ? (
              <p style={{ color: "#9eb0c2", marginBottom: 16 }}>
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
                      marginBottom: 12,
                      fontSize: 11,
                      color: "#b8cadb",
                      lineHeight: 1.5,
                    }}
                  >
                    Automation inventory: sprinkler{" "}
                    {getOwnedSprinklerIds().length}, harvester{" "}
                    {getOwnedHarvesterIds().length}, planter{" "}
                    {getOwnedPlanterIds().length}
                  </div>
                  {getOwnedSprinklerIds().length === 0 &&
                    getOwnedHarvesterIds().length === 0 &&
                    getOwnedPlanterIds().length === 0 && (
                      <div
                        style={{
                          marginBottom: 12,
                          fontSize: 11,
                          color: "#9eb0c2",
                        }}
                      >
                        Acquire a sprinkler, planter, or harvester to use
                        automation on empty fields.
                      </div>
                    )}
                  <div
                    style={{
                      fontWeight: "bold",
                      marginBottom: 8,
                      position: "sticky",
                      top: 0,
                      backgroundColor: "#162433",
                      paddingBottom: 8,
                      color: "#e5edf5",
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
                      const seedPresentation = getSeedPresentation(seed.seedId);
                      const cropDef = seedPresentation.cropDef;
                      const isSelected =
                        plantModal.selectedSeedId === seed.seedId;

                      return (
                        <div
                          key={seed.seedId}
                          style={{
                            padding: 8,
                            backgroundColor: isSelected ? "#1d6a3a" : "#1b2d3f",
                            border: isSelected
                              ? "2px solid #2f9e44"
                              : "1px solid #34516a",
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
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              fontWeight: "bold",
                              color: "#e5edf5",
                            }}
                          >
                            <span>{seedPresentation.icon}</span>
                            <span>{seedPresentation.label}</span>
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
                                ? "rgba(229,237,245,0.95)"
                                : "#9eb0c2",
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
                              {cropDef?.baseYield} {cropDef?.category ?? "crop"}{" "}
                              + {cropDef?.baseGold ?? 0} gold
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
                      backgroundColor: "#253649",
                      border: "1px solid #3f546a",
                      color: "#eaf2fb",
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
                        plantModal.selectedSeedId === null
                          ? "#2c3e50"
                          : "#1f7f43",
                      color:
                        plantModal.selectedSeedId === null
                          ? "#7f94a8"
                          : "white",
                      border:
                        plantModal.selectedSeedId === null
                          ? "1px solid #3f546a"
                          : "none",
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
            backgroundColor: "rgba(6, 10, 14, 0.72)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowStorageModal(false)}
        >
          <div
            style={{
              backgroundColor: "#162433",
              color: "#e5edf5",
              borderRadius: 8,
              padding: isMobile ? 12 : 16,
              maxHeight: isMobile ? "88vh" : "80vh",
              maxWidth: "560px",
              width: isMobile ? "94vw" : "560px",
              overflow: "auto",
              border: "1px solid #35506a",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
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
                  backgroundColor: "#253649",
                  border: "1px solid #3f546a",
                  color: "#eaf2fb",
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
                        border: "1px solid #2f4459",
                        borderRadius: 6,
                        backgroundColor: "#1b2d3f",
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
                          backgroundColor: "#2f4459",
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
              backgroundColor: "rgba(6, 10, 14, 0.72)",
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
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const cropId = harvestModal.cropId;
                const cropIndex = harvestModal.cropIndex;
                const cropDef = getCropDef(cropId);
                const cropInstance = garden.crops[cropId]?.[cropIndex];

                if (!cropDef || !cropInstance) return null;

                const yieldAmount = calculateYieldWithMastery(
                  state,
                  cropId,
                  cropDef,
                  cropInstance.waterLevel,
                );
                const waterBonus = Math.round(
                  (cropInstance.waterLevel / 100) * cropDef.baseYield,
                );
                const goldAmount = calculateGoldWithMastery(
                  state,
                  cropId,
                  cropDef,
                );

                return (
                  <>
                    <h3 style={{ margin: "0 0 16px 0" }}>
                      🌾 Ready to Harvest!
                    </h3>

                    {/* Crop Info */}
                    <div
                      style={{
                        backgroundColor: "#1b2d3f",
                        padding: 12,
                        borderRadius: 6,
                        marginBottom: 16,
                        border: "1px solid #2f4459",
                      }}
                    >
                      <div style={{ fontWeight: "bold", marginBottom: 8 }}>
                        {cropDef.name}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#9eb0c2",
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
                        backgroundColor: "#13261f",
                        padding: 12,
                        borderRadius: 6,
                        marginBottom: 16,
                        border: "1px solid #2c4d3c",
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
                            borderTop: "1px solid #2f4459",
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
                          backgroundColor: "#12283a",
                          padding: 10,
                          borderRadius: 6,
                          marginBottom: 16,
                          fontSize: 12,
                          color: "#8bc5ff",
                          border: "1px solid #23445f",
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
                          backgroundColor: "#253649",
                          border: "1px solid #3f546a",
                          color: "#eaf2fb",
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

      {/* Crop Mastery Modal */}
      {showCropMasteryModal && (
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
          onClick={() => setShowCropMasteryModal(false)}
        >
          <div
            style={{
              backgroundColor: "#162433",
              color: "#e5edf5",
              borderRadius: 8,
              padding: isMobile ? 12 : 16,
              maxHeight: isMobile ? "88vh" : "82vh",
              maxWidth: "760px",
              width: isMobile ? "95vw" : "760px",
              overflow: "auto",
              border: "1px solid #35506a",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
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
              <h3 style={{ margin: 0 }}>📈 Crop Mastery</h3>
              <button
                style={{
                  padding: "6px 10px",
                  backgroundColor: "#253649",
                  border: "1px solid #3f546a",
                  color: "#eaf2fb",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
                onClick={() => setShowCropMasteryModal(false)}
              >
                Close
              </button>
            </div>

            <div style={{ fontSize: 12, color: "#9eb0c2", marginBottom: 12 }}>
              Each level grants +1% crop yield for that crop type. Prestige at
              level 100 resets that crop to level 1 and grants +20% crop yield
              and +10% gold for that crop type permanently.
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: 10,
              }}
            >
              {allCropTypes.map((cropDef) => {
                const mastery = getCropMastery(cropDef.id);
                const currentYield = getCropYieldAtLevel(
                  cropDef.id,
                  mastery.level,
                );
                const nextLevel = Math.min(CROP_MAX_LEVEL, mastery.level + 1);
                const nextYield = getCropYieldAtLevel(cropDef.id, nextLevel);
                const currentGold = getCropGoldWithPrestige(cropDef.id);
                const nextGold = Math.max(
                  1,
                  Math.round(
                    cropDef.baseGold *
                      getCropGoldMultiplier(mastery.prestige + 1),
                  ),
                );
                const xpToNext =
                  mastery.level >= CROP_MAX_LEVEL
                    ? 0
                    : getCropXpForNextLevel(mastery.level);
                const xpProgress =
                  mastery.level >= CROP_MAX_LEVEL
                    ? 100
                    : Math.min(100, (mastery.xp / xpToNext) * 100);

                return (
                  <div
                    key={cropDef.id}
                    style={{
                      padding: 12,
                      border: "1px solid #2f4459",
                      borderRadius: 6,
                      backgroundColor: "#1b2d3f",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ fontWeight: "bold" }}>{cropDef.name}</div>
                      <div style={{ fontSize: 12, color: "#9eb0c2" }}>
                        Lv {mastery.level}/{CROP_MAX_LEVEL} | Prestige{" "}
                        {mastery.prestige}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                        gap: 8,
                        fontSize: 12,
                        lineHeight: "1.5",
                      }}
                    >
                      <div>
                        <div>
                          Current Yield: {currentYield} {cropDef.category}
                        </div>
                        <div>
                          Current Gold: {formatCompactNumber(currentGold)}
                        </div>
                      </div>
                      <div>
                        {mastery.level < CROP_MAX_LEVEL ? (
                          <>
                            <div>
                              Next Lv Yield: {nextYield} {cropDef.category}
                            </div>
                            <div>
                              XP to next: {mastery.xp}/{xpToNext}
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              Next Prestige Yield: {nextYield}{" "}
                              {cropDef.category}
                            </div>
                            <div>
                              Next Prestige Gold:{" "}
                              {formatCompactNumber(nextGold)}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: 8,
                        height: 8,
                        backgroundColor: "#2f4459",
                        borderRadius: 999,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${xpProgress}%`,
                          height: "100%",
                          backgroundColor:
                            mastery.level >= CROP_MAX_LEVEL
                              ? "#9c36ff"
                              : "#51cf66",
                        }}
                      />
                    </div>

                    {mastery.level >= CROP_MAX_LEVEL && (
                      <div
                        style={{
                          marginTop: 10,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ fontSize: 11, color: "#6b46c1" }}>
                          Prestige Bonus: +20% crop yield and +10% gold for this
                          crop type.
                        </div>
                        <button
                          className="btn-primary"
                          style={{ padding: "6px 10px", fontSize: 12 }}
                          onClick={() =>
                            setState((prev) =>
                              prestigeCropType(prev, cropDef.id),
                            )
                          }
                        >
                          Prestige
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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
            backgroundColor: "rgba(6, 10, 14, 0.72)",
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
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const tier = rockBreakModal.rockTier;
              const config = rockConfig[tier!];
              const equippedPickaxe = isPickaxeTool(equippedToolId)
                ? (state.equipment.tool ?? equippedToolId)
                : null;
              const pickaxeLevel = isPickaxeTool(equippedToolId)
                ? (equippedToolItem?.level ??
                  garden.tools[equippedToolId ?? ""] ??
                  0)
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
                      backgroundColor: "#1b2d3f",
                      padding: 12,
                      borderRadius: 6,
                      marginBottom: 16,
                      border: "1px solid #2f4459",
                    }}
                  >
                    <div style={{ fontWeight: "bold", marginBottom: 8 }}>
                      {tier?.charAt(0).toUpperCase() + tier?.slice(1)} Rock
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#9eb0c2",
                        lineHeight: "1.6",
                      }}
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
                      backgroundColor: "#1f2b38",
                      padding: 12,
                      borderRadius: 6,
                      marginBottom: 16,
                      border: "1px solid #2f4459",
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
                        backgroundColor: "#253649",
                        border: "1px solid #3f546a",
                        color: "#eaf2fb",
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
            backgroundColor: "rgba(6, 10, 14, 0.72)",
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
                const yield_ = calculateYieldWithMastery(
                  state,
                  tileDetailModal.cropId,
                  cropDef,
                  cropInstance.waterLevel,
                );
                const goldYield = calculateGoldWithMastery(
                  state,
                  tileDetailModal.cropId,
                  cropDef,
                );
                const cropRow = tileDetailModal.row;
                const cropCol = tileDetailModal.col;
                const harvesterOnTile = getHarvesterAtField(cropRow, cropCol);
                const planterOnTile = getPlanterAtField(cropRow, cropCol);
                const ownedSprinklerIds = getOwnedSprinklerIds();
                const ownedHarvesterIds = getOwnedHarvesterIds();
                const ownedPlanterIds = getOwnedPlanterIds();
                const planterSeedKey = `${cropRow},${cropCol}`;
                const planterSeedForTile =
                  state.garden.planterSeedSelections?.[planterSeedKey] ??
                  state.garden.selectedPlanterSeedId ??
                  null;
                const planterSeedForTilePresentation = planterSeedForTile
                  ? getSeedPresentation(planterSeedForTile)
                  : null;

                return (
                  <>
                    <h3 style={{ margin: "0 0 16px 0" }}>{cropDef.name}</h3>

                    {/* Progress */}
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

                    {/* Time Remaining */}
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
                        Time remaining: {Math.ceil(timeRemaining)} minutes
                      </div>
                    )}

                    {/* Water Mechanics */}
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
                        Manage sprinkler, harvester, and planter directly on
                        this planted tile.
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
                                  cropRow,
                                  cropCol,
                                  null,
                                );
                                setState(newState);
                              }}
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
                                        cropRow,
                                        cropCol,
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
                                      cropRow,
                                      cropCol,
                                      sprinklerId,
                                    );
                                    if (newState === state) {
                                      alert(
                                        "This tile already has another automation tool. Remove it first.",
                                      );
                                      return;
                                    }
                                    setState(newState);
                                  }}
                                  onMouseEnter={() =>
                                    setSprinklerPreview({
                                      row: cropRow,
                                      col: cropCol,
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
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            flexWrap: "wrap",
                          }}
                        >
                          {harvesterOnTile ? (
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
                                const newState = removeHarvesterFromField(
                                  state,
                                  cropRow,
                                  cropCol,
                                );
                                setState(newState);
                              }}
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
                                    padding: "6px 10px",
                                    backgroundColor: "#334155",
                                    color: "#e2e8f0",
                                    border: "1px solid #64748b",
                                    borderRadius: 4,
                                    cursor: "pointer",
                                    fontWeight: "bold",
                                    fontSize: 11,
                                  }}
                                  onClick={() => {
                                    const newState = placeHarvesterOnField(
                                      state,
                                      cropRow,
                                      cropCol,
                                      harvesterId,
                                    );
                                    if (newState === state) {
                                      alert(
                                        "This tile already has another automation tool. Remove it first.",
                                      );
                                      return;
                                    }
                                    setState(newState);
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
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            flexWrap: "wrap",
                          }}
                        >
                          {planterOnTile ? (
                            <>
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
                                  const newState = removePlanterFromField(
                                    state,
                                    cropRow,
                                    cropCol,
                                  );
                                  setState(newState);
                                }}
                              >
                                Remove Planter
                              </button>
                              <button
                                style={{
                                  padding: "6px 10px",
                                  backgroundColor: "#31572c",
                                  color: "#d8f3dc",
                                  border: "1px solid #4f772d",
                                  borderRadius: 4,
                                  cursor: "pointer",
                                  fontWeight: "bold",
                                  fontSize: 11,
                                }}
                                onClick={() =>
                                  openPlanterSeedSelection({
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
                                    padding: "6px 10px",
                                    backgroundColor: "#1b4332",
                                    color: "#d8f3dc",
                                    border: "1px solid #2f9e44",
                                    borderRadius: 4,
                                    cursor: "pointer",
                                    fontWeight: "bold",
                                    fontSize: 11,
                                  }}
                                  onClick={() => {
                                    if (!state.garden.selectedPlanterSeedId) {
                                      openPlanterSeedSelection({
                                        mode: "place",
                                        row: cropRow,
                                        col: cropCol,
                                        planterId,
                                      });
                                      return;
                                    }

                                    const newState = placePlanterOnField(
                                      state,
                                      cropRow,
                                      cropCol,
                                      planterId,
                                      state.garden.selectedPlanterSeedId,
                                    );
                                    if (newState === state) {
                                      alert(
                                        "This tile already has another automation tool. Remove it first.",
                                      );
                                      return;
                                    }
                                    setState(newState);
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

                    {/* Harvest Preview */}
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
                      <div style={{ fontWeight: "bold", marginBottom: 6 }}>
                        📊 At Harvest
                      </div>
                      <div style={{ lineHeight: "1.6", color: "#b8cadb" }}>
                        <div>
                          Yield: {yield_} {cropDef.category}
                        </div>
                        <div>Gold: {goldYield}</div>
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
                          backgroundColor: "#253649",
                          border: "1px solid #3f546a",
                          color: "#eaf2fb",
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
                          backgroundColor: "#253649",
                          border: "1px solid #3f546a",
                          color: "#eaf2fb",
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
                const fieldAutomationTool = getAutomationToolAtField(
                  emptyRow,
                  emptyCol,
                );
                const fieldSprinklerId =
                  fieldAutomationTool?.type === "sprinkler"
                    ? fieldAutomationTool.id
                    : null;
                const fieldHarvesterId =
                  fieldAutomationTool?.type === "harvester"
                    ? fieldAutomationTool.id
                    : null;
                const fieldPlanterId =
                  fieldAutomationTool?.type === "planter"
                    ? fieldAutomationTool.id
                    : null;
                const ownedSprinklerIds = getOwnedSprinklerIds();
                const ownedHarvesterIds = getOwnedHarvesterIds();
                const ownedPlanterIds = getOwnedPlanterIds();
                const planterSeedKey = `${emptyRow},${emptyCol}`;
                const selectedSeedForTile = fieldPlanterId
                  ? (state.garden.planterSeedSelections?.[planterSeedKey] ??
                    state.garden.selectedPlanterSeedId)
                  : null;
                const selectedSeedForTilePresentation = selectedSeedForTile
                  ? getSeedPresentation(selectedSeedForTile)
                  : null;

                if (tileDetailModal.emptyMode === "automation") {
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
                          {fieldSprinklerId
                            ? `Installed: ${getItemDefSafe(fieldSprinklerId)?.name ?? fieldSprinklerId}`
                            : fieldHarvesterId
                              ? `Installed: ${getItemDefSafe(fieldHarvesterId)?.name ?? fieldHarvesterId}`
                              : fieldPlanterId
                                ? `Installed: ${getItemDefSafe(fieldPlanterId)?.name ?? fieldPlanterId}`
                                : "No automation tool installed on this field"}
                        </div>
                        <div style={{ fontSize: 11, color: "#b8cadb" }}>
                          Place a sprinkler, harvester, or planter. Only one
                          automation tool can exist on a tile.
                        </div>
                        {fieldPlanterId && (
                          <div
                            style={{
                              marginTop: 6,
                              fontSize: 11,
                              color: "#b8cadb",
                            }}
                          >
                            Planter seed:{" "}
                            {selectedSeedForTilePresentation?.icon}{" "}
                            {selectedSeedForTilePresentation?.label ?? "None"}
                          </div>
                        )}
                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 11,
                            color: "#b8cadb",
                          }}
                        >
                          Coverage tiers: common=self, rare=up/down/left/right
                          (1), epic=rare + diagonals (1), legendary=epic pattern
                          (2), unique=epic pattern (3).
                        </div>
                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 11,
                            color: "#b8cadb",
                          }}
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
                                  backgroundColor: "#1f3a4e",
                                  color: "#9ed3ff",
                                  border: "1px solid #3d5f79",
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
                                  padding: "8px 12px",
                                  backgroundColor: "#334155",
                                  color: "#e2e8f0",
                                  border: "1px solid #64748b",
                                  borderRadius: 4,
                                  cursor: "pointer",
                                  fontWeight: "bold",
                                }}
                                onClick={() => {
                                  const newState = placeHarvesterOnField(
                                    state,
                                    emptyRow,
                                    emptyCol,
                                    harvesterId,
                                  );
                                  if (newState === state) {
                                    alert(
                                      "Tile already occupied by another automation tool.",
                                    );
                                    return;
                                  }
                                  setState(newState);
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
                                  padding: "8px 12px",
                                  backgroundColor: "#1b4332",
                                  color: "#d8f3dc",
                                  border: "1px solid #2f9e44",
                                  borderRadius: 4,
                                  cursor: "pointer",
                                  fontWeight: "bold",
                                }}
                                onClick={() => {
                                  if (!state.garden.selectedPlanterSeedId) {
                                    openPlanterSeedSelection(
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
                                  const newState = placePlanterOnField(
                                    state,
                                    emptyRow,
                                    emptyCol,
                                    planterId,
                                    state.garden.selectedPlanterSeedId,
                                  );
                                  if (newState === state) {
                                    alert(
                                      "Tile already occupied by another automation tool.",
                                    );
                                    return;
                                  }
                                  setState(newState);
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
                              padding: "8px 12px",
                              backgroundColor: "#31572c",
                              color: "#d8f3dc",
                              border: "1px solid #4f772d",
                              borderRadius: 4,
                              cursor: "pointer",
                              fontWeight: "bold",
                            }}
                            onClick={() =>
                              openPlanterSeedSelection(
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
                            backgroundColor: "#253649",
                            border: "1px solid #3f546a",
                            color: "#eaf2fb",
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
                        {(fieldSprinklerId ||
                          fieldHarvesterId ||
                          fieldPlanterId) && (
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
                              const newState = fieldSprinklerId
                                ? removeSprinklerFromField(
                                    state,
                                    emptyRow,
                                    emptyCol,
                                  )
                                : fieldHarvesterId
                                  ? removeHarvesterFromField(
                                      state,
                                      emptyRow,
                                      emptyCol,
                                    )
                                  : removePlanterFromField(
                                      state,
                                      emptyRow,
                                      emptyCol,
                                    );
                              setState(newState);
                            }}
                          >
                            Remove Tool
                          </button>
                        )}
                        <button
                          style={{
                            padding: "10px 20px",
                            backgroundColor: "#253649",
                            border: "1px solid #3f546a",
                            color: "#eaf2fb",
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
                        backgroundColor: "#10251d",
                        padding: 12,
                        borderRadius: 6,
                        marginBottom: 16,
                        border: "1px solid #2a4a3d",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          color: "#7ad9a0",
                          fontWeight: "bold",
                        }}
                      >
                        Do you want to plant a crop or place an automation tool?
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
                          backgroundColor: "#253649",
                          border: "1px solid #3f546a",
                          color: "#eaf2fb",
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
                            emptyMode: "automation",
                          })
                        }
                      >
                        Automation
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
