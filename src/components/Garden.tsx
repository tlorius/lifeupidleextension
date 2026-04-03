import { useState, useEffect, useMemo, useRef } from "react";
import { GardenGrid } from "./GardenGrid";
import { GardenSeedMakerModal } from "./GardenSeedMakerModal";
import { GardenTileDetailModal } from "./GardenTileDetailModal";
import {
  GardenCropTile,
  GardenEmptyFieldTile,
  GardenPreviewFieldTile,
  GardenRockTile,
} from "./GardenTiles";
import { GardenCropStorageModal } from "./GardenCropStorageModal";
import { GardenShovelModePanel } from "./GardenShovelModePanel";
import { GardenToolbar } from "./GardenToolbar";
import { GardenToolWheelModal } from "./GardenToolWheelModal";
import { GardenSeedBagModal } from "./GardenSeedBagModal";
import { GardenCropMasteryModal } from "./GardenCropMasteryModal";
import { GardenHarvestModal } from "./GardenHarvestModal";
import { GardenRockBreakModal } from "./GardenRockBreakModal";
import { GardenPlantModal } from "./GardenPlantModal";
import { useGame } from "../game/GameContext";
import {
  computeWaterAreaResult,
  computeSeedBagPlantResult,
} from "../game/actionHandlers/garden";
import {
  getCropDef,
  cropDefinitions,
  getGrowthProgress,
  getFieldUnlockCost,
  calculateYield,
  calculateYieldWithMastery,
  calculateGoldWithMastery,
  CROP_MAX_LEVEL,
  getCropXpForNextLevel,
  getCropYieldMultiplier,
  getCropGoldMultiplier,
  breakRock,
  moveCropArea,
  sprinklerCoversField,
  placeHarvesterOnField,
  removeHarvesterFromField,
  placePlanterOnField,
  removePlanterFromField,
  rockConfig,
  getSeedMakerCost,
  canCraftSeedFromSeedMaker,
} from "../game/garden";
import { getItemDefSafe } from "../game/items";
import { formatCompactNumber } from "../game/numberFormat";
import {
  formatGardenCategoryLabel,
  getGardenCategoryIcon,
  resolveGardenCropIdFromSeed,
  selectGardenSeedView,
} from "../game/selectors/garden";
import type { CropInstance } from "../game/types";

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

interface MinimapViewportBounds {
  rowStart: number;
  rowEnd: number;
  colStart: number;
  colEnd: number;
}

export function Garden() {
  const { state, dispatch } = useGame();
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
  const [showSeedMakerModal, setShowSeedMakerModal] = useState(false);
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
  const [isMinimapExpanded, setIsMinimapExpanded] = useState(false);
  const [minimapViewportBounds, setMinimapViewportBounds] =
    useState<MinimapViewportBounds | null>(null);
  const gardenGridScrollRef = useRef<HTMLDivElement>(null);
  const gardenGridContentRef = useRef<HTMLDivElement>(null);

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
  const {
    seedBag,
    seedMakerRecipes,
    isSeedMakerUnlocked,
    selectedSeedMakerSeedId,
    selectedSeedMakerPresentation,
    selectedPlanterSeedPresentation,
    activeSeedBagSeedPresentation,
    seedMakerCycleMs,
    seedMakerRemainingMs,
    isSeedMakerRunning,
    defaultSeedMakerSeedId,
  } = selectGardenSeedView(state, {
    activeSeedBagSeedId,
  });

  const isFieldUnlocked = (row: number, col: number): boolean => {
    const unlocked = garden.unlockedFields;
    if (unlocked && unlocked.length > 0) {
      return unlocked.some((f) => f.row === row && f.col === col);
    }
    return row < garden.gridSize.rows && col < garden.gridSize.cols;
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

  // Reconcile rocks on load to sanitize starter tiles and fill missing preview rocks.
  useEffect(() => {
    dispatch({ type: "garden/reconcileRocks" });
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

  const craftSeedFromStorage = (seedId: string) => {
    const recipe = seedMakerRecipes.find((entry) => entry.seedId === seedId);
    if (!recipe) return;

    const cost = getSeedMakerCost(seedId);
    const currentGems = state.resources.gems ?? 0;
    const currentCategoryAmount =
      state.garden.cropStorage.current[recipe.category] ?? 0;

    if (currentGems < cost.gemCost) {
      alert(`Need ${cost.gemCost} gems to create this seed.`);
      return;
    }

    if (currentCategoryAmount < cost.resourceCost) {
      alert(
        `Need ${cost.resourceCost} ${formatGardenCategoryLabel(recipe.category)} resource to create this seed.`,
      );
      return;
    }

    dispatch({ type: "garden/craftSeed", seedId });
  };

  const startSeedMaker = () => {
    const seedId = defaultSeedMakerSeedId;
    if (!seedId) {
      alert("Select a seed recipe first.");
      return;
    }

    const selectedRecipe = seedMakerRecipes.find((r) => r.seedId === seedId);
    const cost = getSeedMakerCost(seedId);
    const availableGems = state.resources.gems ?? 0;
    const availableCategoryAmount = selectedRecipe
      ? (state.garden.cropStorage.current[selectedRecipe.category] ?? 0)
      : 0;

    if (!canCraftSeedFromSeedMaker(state, seedId)) {
      if (availableGems < cost.gemCost) {
        alert(
          `Cannot start Seedmaker. Need ${cost.gemCost} gems for the selected recipe.`,
        );
        return;
      }

      if (selectedRecipe && availableCategoryAmount < cost.resourceCost) {
        alert(
          `Cannot start Seedmaker. Need ${cost.resourceCost} ${formatGardenCategoryLabel(selectedRecipe.category)} resource for the selected recipe.`,
        );
        return;
      }

      alert("Cannot start Seedmaker with the selected recipe right now.");
      return;
    }

    dispatch({ type: "garden/startSeedMaker", seedId });
  };

  const stopSeedMaker = () => {
    dispatch({ type: "garden/stopSeedMaker" });
  };

  const handleSeedMakerRecipeSelect = (
    seedId: string,
    canSelectRecipe: boolean,
  ) => {
    if (!canSelectRecipe) {
      alert(
        "Seedmaker is currently crafting. Stop it before changing the selected seed.",
      );
      return;
    }

    dispatch({ type: "garden/selectSeedMakerRecipe", seedId });
  };

  const handleCraftOneSeed = () => {
    if (!selectedSeedMakerSeedId) {
      alert("Select a seed recipe first.");
      return;
    }

    craftSeedFromStorage(selectedSeedMakerSeedId);
  };

  const formatDuration = (milliseconds: number): string => {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const unlockedFieldSet = useMemo(() => {
    const set = new Set<string>();
    const explicitUnlocked = garden.unlockedFields;
    if (explicitUnlocked && explicitUnlocked.length > 0) {
      for (const field of explicitUnlocked) {
        set.add(`${field.row},${field.col}`);
      }
      return set;
    }

    for (let row = 0; row < garden.gridSize.rows; row++) {
      for (let col = 0; col < garden.gridSize.cols; col++) {
        set.add(`${row},${col}`);
      }
    }
    return set;
  }, [garden.unlockedFields, garden.gridSize.rows, garden.gridSize.cols]);

  const knownBounds = useMemo(() => {
    let maxRow = Math.max(0, garden.gridSize.rows - 1);
    let maxCol = Math.max(0, garden.gridSize.cols - 1);

    const include = (row: number, col: number) => {
      if (row > maxRow) maxRow = row;
      if (col > maxCol) maxCol = col;
    };

    for (const key of unlockedFieldSet) {
      const [rowText, colText] = key.split(",");
      include(Number(rowText), Number(colText));
    }

    for (const positions of Object.values(garden.rocks)) {
      for (const field of positions) {
        include(field.row, field.col);
      }
    }

    for (const crops of Object.values(garden.crops)) {
      for (const crop of crops) {
        if (crop.position) include(crop.position.row, crop.position.col);
      }
    }

    for (const positions of Object.values(garden.sprinklers)) {
      for (const field of positions) {
        include(field.row, field.col);
      }
    }

    for (const positions of Object.values(garden.harvesters ?? {})) {
      for (const field of positions) {
        include(field.row, field.col);
      }
    }

    for (const positions of Object.values(garden.planters ?? {})) {
      for (const field of positions) {
        include(field.row, field.col);
      }
    }

    return {
      maxRow,
      maxCol,
    };
  }, [
    garden.crops,
    garden.gridSize.cols,
    garden.gridSize.rows,
    garden.harvesters,
    garden.planters,
    garden.rocks,
    garden.sprinklers,
    unlockedFieldSet,
  ]);

  // Get preview grid (showing adjacent fields that can be unlocked)
  const previewRows = knownBounds.maxRow + 3;
  const previewCols = knownBounds.maxCol + 3;
  const compactGridLabels = isMobile || previewCols >= 8;
  const minimumCellSize = isMobile ? 34 : 42;

  const hasMinimapUnlock = useMemo(() => {
    const rowCounts = new Map<number, number>();
    const colCounts = new Map<number, number>();

    for (const key of unlockedFieldSet) {
      const [rowText, colText] = key.split(",");
      const row = Number(rowText);
      const col = Number(colText);
      rowCounts.set(row, (rowCounts.get(row) ?? 0) + 1);
      colCounts.set(col, (colCounts.get(col) ?? 0) + 1);
    }

    const maxRowUnlockCount = Math.max(0, ...rowCounts.values());
    const maxColUnlockCount = Math.max(0, ...colCounts.values());
    return maxRowUnlockCount >= 10 || maxColUnlockCount >= 10;
  }, [unlockedFieldSet]);

  const updateMinimapViewportBounds = () => {
    const container = gardenGridScrollRef.current;
    const content = gardenGridContentRef.current;
    if (!container || !content || previewRows <= 0 || previewCols <= 0) {
      setMinimapViewportBounds(null);
      return;
    }

    const cellWidth = content.scrollWidth / previewCols;
    const cellHeight = content.scrollHeight / previewRows;
    if (!Number.isFinite(cellWidth) || !Number.isFinite(cellHeight)) {
      setMinimapViewportBounds(null);
      return;
    }

    const rowStart = Math.max(0, Math.floor(container.scrollTop / cellHeight));
    const rowEnd = Math.min(
      previewRows - 1,
      Math.ceil((container.scrollTop + container.clientHeight) / cellHeight),
    );
    const colStart = Math.max(0, Math.floor(container.scrollLeft / cellWidth));
    const colEnd = Math.min(
      previewCols - 1,
      Math.ceil((container.scrollLeft + container.clientWidth) / cellWidth),
    );

    setMinimapViewportBounds({
      rowStart,
      rowEnd,
      colStart,
      colEnd,
    });
  };

  const centerGardenViewportAt = (row: number, col: number) => {
    const container = gardenGridScrollRef.current;
    const content = gardenGridContentRef.current;
    if (!container || !content || previewRows <= 0 || previewCols <= 0) {
      return;
    }

    const cellWidth = content.scrollWidth / previewCols;
    const cellHeight = content.scrollHeight / previewRows;
    if (!Number.isFinite(cellWidth) || !Number.isFinite(cellHeight)) {
      return;
    }

    const targetLeft = (col + 0.5) * cellWidth - container.clientWidth / 2;
    const targetTop = (row + 0.5) * cellHeight - container.clientHeight / 2;

    container.scrollTo({
      left: Math.max(0, targetLeft),
      top: Math.max(0, targetTop),
      behavior: "smooth",
    });
  };

  useEffect(() => {
    updateMinimapViewportBounds();
  }, [previewRows, previewCols, garden]);

  useEffect(() => {
    if (!hasMinimapUnlock && isMinimapExpanded) {
      setIsMinimapExpanded(false);
    }
  }, [hasMinimapUnlock, isMinimapExpanded]);

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

  const getToolDescription = (toolId: string): string => {
    if (isPickaxeTool(toolId)) {
      return "Click rocks to break them (costs mana)";
    }
    if (isShovelTool(toolId)) {
      const areaSize = toolId.includes("mithril")
        ? 5
        : toolId.includes("iron")
          ? 3
          : 1;
      return `Move planted fields (${areaSize}x${areaSize} area)`;
    }
    if (isSprinklerTool(toolId)) {
      return "Click crops to place/remove sprinklers";
    }
    if (isHarvesterTool(toolId)) {
      return "Auto-harvests finished crops in sprinkler-style range";
    }
    if (isPlanterTool(toolId)) {
      return "Auto-plants selected seed in sprinkler-style range";
    }
    if (isWateringCanTool(toolId)) {
      return "Click crops to water them (10 mana)";
    }
    if (isScytheTool(toolId)) {
      return "For future use";
    }
    if (isSeedBagTool(toolId)) {
      return "Plant seeds in an area around clicked tile";
    }
    return "";
  };

  const handleSeedBagSeedSelect = (
    seedId: string,
    options?: { closeSeedBagModal?: boolean },
  ) => {
    if (seedSelectionTarget === "planter") {
      const pendingAction = pendingPlanterAction;
      dispatch({ type: "garden/selectPlanterSeed", seedId });
      if (pendingAction) {
        if (pendingAction.mode === "assign") {
          dispatch({
            type: "garden/assignPlanterTileSeed",
            row: pendingAction.row,
            col: pendingAction.col,
            seedId,
          });
        } else {
          dispatch({
            type: "garden/placePlanter",
            row: pendingAction.row,
            col: pendingAction.col,
            planterId: pendingAction.planterId,
            seedId,
          });
        }
      }
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

  const getOwnedToolCount = (
    toolKeyword: "sprinkler" | "harvester" | "planter",
  ): number =>
    state.inventory.filter((item) => {
      const def = getItemDefSafe(item.itemId);
      return def?.type === "tool" && item.itemId.includes(toolKeyword);
    }).length;

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

  const cropStorageEntries = Object.entries(garden.cropStorage.current).map(
    ([category, amount]) => ({
      category,
      icon: getGardenCategoryIcon(category),
      label: formatGardenCategoryLabel(category),
      amount,
      limit: garden.cropStorage.limits[category],
    }),
  );

  const handleOpenSeedMakerModal = () => {
    if (!selectedSeedMakerSeedId && defaultSeedMakerSeedId) {
      dispatch({
        type: "garden/selectSeedMakerRecipe",
        seedId: defaultSeedMakerSeedId,
      });
    }
    setShowSeedMakerModal(true);
  };

  const handleToggleEquippedToolMode = () => {
    if (!equippedToolId) {
      setShowToolWheel(true);
      return;
    }

    const willActivate = !isToolEffectActive;
    if (willActivate && isSeedBagTool(equippedToolId) && !activeSeedBagSeedId) {
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
  };

  const handleUnequipTool = () => {
    setActivateSeedBagAfterSelection(false);
    setIsToolEffectActive(false);
    dispatch({ type: "garden/unequipTool" });
  };

  const handleCloseSeedBagModal = () => {
    setShowSeedBag(false);
    setActivateSeedBagAfterSelection(false);
    setPendingPlanterAction(null);
  };

  const filteredTools = state.inventory
    .filter((item) => getItemDefSafe(item.itemId)?.type === "tool")
    .map((item) => ({
      key: item.uid,
      equipValue: item.uid,
      toolId: item.itemId,
      level: item.level,
      name: getItemDefSafe(item.itemId)?.name ?? item.itemId,
      icon: getToolIcon(item.itemId),
      description: getToolDescription(item.itemId),
      isEquipped: state.equipment.tool === item.uid,
    }))
    .filter((tool) => {
      if (!toolTypeFilter) return true;
      if (toolTypeFilter === "wateringcan") {
        return isWateringCanTool(tool.toolId);
      }
      if (toolTypeFilter === "seedbag") {
        return isSeedBagTool(tool.toolId);
      }
      return normalizeToolId(tool.toolId).includes(toolTypeFilter);
    })
    .sort((a, b) => {
      const aRarity = getItemDefSafe(a.toolId)?.rarity ?? "common";
      const bRarity = getItemDefSafe(b.toolId)?.rarity ?? "common";
      const rarityDelta =
        getRaritySortValue(bRarity) - getRaritySortValue(aRarity);
      if (rarityDelta !== 0) return rarityDelta;
      if (a.level !== b.level) return b.level - a.level;
      return a.name.localeCompare(b.name);
    });

  const seedBagEntries = seedBag.map((seed) => ({
    seedId: seed.seedId,
    icon: seed.presentation.icon,
    label: seed.presentation.label,
    count: seed.count,
  }));

  const pendingPlanterKey = pendingPlanterAction
    ? `${pendingPlanterAction.row},${pendingPlanterAction.col}`
    : null;
  const selectedPlanterSeedForSeedBagModal =
    seedSelectionTarget === "planter" &&
    pendingPlanterAction?.mode === "assign" &&
    pendingPlanterKey
      ? (state.garden.planterSeedSelections?.[pendingPlanterKey] ??
        state.garden.selectedPlanterSeedId)
      : state.garden.selectedPlanterSeedId;

  const plantModalSeedEntries = seedBag.map((seed) => {
    const cropDef = seed.presentation.cropDef;
    return {
      seedId: seed.seedId,
      icon: seed.presentation.icon,
      label: seed.presentation.label,
      count: seed.count,
      growthTimeMinutes: cropDef?.growthTimeMinutes,
      baseYield: cropDef?.baseYield,
      category: cropDef?.category,
      baseGold: cropDef?.baseGold,
      isPerennial: cropDef?.isPerennial,
      isTree: cropDef ? isTreeCrop(cropDef) : false,
      isPlantable: Boolean(cropDef),
    };
  });
  const ownedSprinklerCount = getOwnedToolCount("sprinkler");
  const ownedHarvesterCount = getOwnedToolCount("harvester");
  const ownedPlanterCount = getOwnedToolCount("planter");

  const handleClosePlantModal = () => {
    setPlantModal((prev) => ({
      ...prev,
      isOpen: false,
      selectedSeedId: null,
    }));
  };

  const handleConfirmPlantModal = () => {
    if (!plantModal.selectedSeedId) {
      return;
    }

    const cropId = resolveGardenCropIdFromSeed(plantModal.selectedSeedId);
    if (!cropId) {
      alert("This seed cannot be planted in the garden yet.");
      return;
    }

    dispatch({
      type: "garden/plantCrop",
      cropId,
      row: plantModal.row,
      col: plantModal.col,
      consumeSeedId: plantModal.selectedSeedId,
    });
    setPlantModal({
      isOpen: false,
      row: 0,
      col: 0,
      selectedSeedId: null,
    });
  };

  const closeHarvestModal = () => {
    setHarvestModal({
      isOpen: false,
      cropId: null,
      cropIndex: null,
      row: 0,
      col: 0,
    });
  };

  const closeRockBreakModal = () => {
    setRockBreakModal({
      isOpen: false,
      row: 0,
      col: 0,
      rockTier: null,
    });
  };

  const harvestPreview = (() => {
    if (
      !harvestModal.isOpen ||
      !harvestModal.cropId ||
      harvestModal.cropIndex === null
    ) {
      return null;
    }

    const cropDef = getCropDef(harvestModal.cropId);
    const cropInstance =
      state.garden.crops[harvestModal.cropId]?.[harvestModal.cropIndex];

    if (!cropDef || !cropInstance) {
      return null;
    }

    return {
      cropId: harvestModal.cropId,
      cropIndex: harvestModal.cropIndex,
      row: harvestModal.row,
      col: harvestModal.col,
      name: cropDef.name,
      category: cropDef.category,
      rarity: cropDef.rarity,
      isPerennial: cropDef.isPerennial,
      baseYield: cropDef.baseYield,
      baseXP: cropDef.baseXP,
      waterLevel: cropInstance.waterLevel,
      yieldAmount: calculateYieldWithMastery(
        state,
        harvestModal.cropId,
        cropDef,
        cropInstance.waterLevel,
      ),
      waterBonus: Math.round(
        (cropInstance.waterLevel / 100) * cropDef.baseYield,
      ),
      goldAmount: calculateGoldWithMastery(state, harvestModal.cropId, cropDef),
    };
  })();

  const rockBreakConfig = rockBreakModal.rockTier
    ? rockConfig[rockBreakModal.rockTier]
    : null;
  const equippedPickaxe = isPickaxeTool(equippedToolId)
    ? (state.equipment.tool ?? equippedToolId)
    : null;
  const pickaxeLevel = isPickaxeTool(equippedToolId)
    ? (equippedToolItem?.level ?? garden.tools[equippedToolId ?? ""] ?? 0)
    : 0;
  const meetsRockBreakRequirement =
    rockBreakConfig !== null && pickaxeLevel >= rockBreakConfig.minPickaxeLevel;
  const hasRockBreakEnergy =
    rockBreakConfig !== null &&
    (state.resources.energy ?? 0) >= rockBreakConfig.energyCost;

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
              ? `Need ${missingRockEnergy} more mana`
              : null,
          ]
            .filter(Boolean)
            .join(" | ")
        : "Ready to break";
      return (
        <GardenRockTile
          tileKey={`${row}-${col}`}
          tier={tier as "small" | "medium" | "large"}
          minPickaxeLevel={config.minPickaxeLevel}
          energyCost={config.energyCost}
          isSprinklerPreviewTarget={isSprinklerPreviewTarget}
          pickaxeActive={pickaxeActive}
          cannotBreakRock={cannotBreakRock}
          cannotBreakReason={cannotBreakReason}
          compactGridLabels={compactGridLabels}
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
        />
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
        <GardenCropTile
          tileKey={`${row}-${col}`}
          cropName={cropDef.name}
          progress={progress}
          waterLevel={cropInstance.waterLevel}
          hasSprinkler={cropInstance.hasSprinkler}
          isReady={isReady}
          isWithinSelectedMoveArea={isWithinSelectedMoveArea(row, col)}
          isSprinklerPreviewTarget={isSprinklerPreviewTarget}
          stageEmoji={stageEmojis[Math.min(stage, 3)]}
          coveredByAdjacentSprinkler={coveredByAdjacentSprinkler}
          harvesterOnTile={Boolean(harvesterOnTile)}
          planterOnTile={Boolean(planterOnTile)}
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
              dispatch({ type: "garden/toggleSprinkler", row, col });
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
                return;
              }
              if (harvesterOnTile) {
                dispatch({ type: "garden/removeHarvester", row, col });
              } else {
                dispatch({
                  type: "garden/placeHarvester",
                  row,
                  col,
                  harvesterId: equippedTool ?? "",
                });
              }
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
                return;
              }
              if (planterOnTile) {
                dispatch({ type: "garden/removePlanter", row, col });
              } else {
                dispatch({
                  type: "garden/placePlanter",
                  row,
                  col,
                  planterId: equippedTool ?? "",
                  seedId: state.garden.selectedPlanterSeedId ?? null,
                });
              }
              return;
            }

            // Handle watering can (AoE by rarity profile)
            if (toolActive && isWateringCanTool(equippedTool)) {
              const result = computeWaterAreaResult(
                state,
                row,
                col,
                equippedTool ?? "",
              );
              if (result.wateredTiles > 0) {
                dispatch({
                  type: "garden/waterArea",
                  centerRow: row,
                  centerCol: col,
                  toolId: equippedTool ?? "",
                });
              } else if (result.lackedEnergy) {
                alert("Not enough mana to water crops in range.");
              }
              return;
            }

            // Handle scythe (AoE harvest by rarity profile)
            if (toolActive && isScytheTool(equippedTool)) {
              dispatch({
                type: "garden/scytheHarvestArea",
                centerRow: row,
                centerCol: col,
                toolId: equippedTool ?? "",
              });
              return;
            }

            if (toolActive && isSeedBagTool(equippedTool)) {
              if (!activeSeedBagSeedId) {
                alert("Select a seed in the tool selector first.");
                return;
              }
              const result = computeSeedBagPlantResult(
                state,
                row,
                col,
                equippedTool ?? "",
                activeSeedBagSeedId,
                seedBagPlantEnergyCost,
              );
              if (result.plantedTiles > 0) {
                dispatch({
                  type: "garden/seedBagPlantArea",
                  centerRow: row,
                  centerCol: col,
                  toolId: equippedTool ?? "",
                  seedId: activeSeedBagSeedId,
                  seedBagPlantEnergyCost,
                });
              } else if (result.lackedEnergy) {
                alert("Not enough mana to plant in range.");
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
        />
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
                  ? `Need ${missingUnlockEnergy} more mana`
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
        <GardenPreviewFieldTile
          tileKey={`${row}-${col}`}
          isAdjacentUnlockable={isAdjacentUnlockable}
          compactGridLabels={compactGridLabels}
          isSprinklerPreviewTarget={isSprinklerPreviewTarget}
          previewTitle={previewTitle}
          previewLabel={previewLabel}
          cannotUnlockField={cannotUnlockField}
          cannotUnlockReason={cannotUnlockReason}
          onClick={() => {
            if (!isAdjacentUnlockable) return;
            dispatch({ type: "garden/unlockField", row, col });
          }}
        />
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
      <GardenEmptyFieldTile
        tileKey={`${row}-${col}`}
        isWithinSelectedMoveArea={isWithinSelectedMoveArea(row, col)}
        isSprinklerPreviewTarget={isSprinklerPreviewTarget}
        fieldSprinklerId={fieldSprinklerId}
        fieldHarvesterId={fieldHarvesterId}
        fieldPlanterId={fieldPlanterId}
        fieldCoveredByAdjacentSprinkler={fieldCoveredByAdjacentSprinkler}
        compactGridLabels={compactGridLabels}
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
              dispatch({
                type: "garden/moveCropArea",
                sourceRow: shovelMove.sourceRow,
                sourceCol: shovelMove.sourceCol,
                targetRow: row,
                targetCol: col,
                areaSize: shovelMove.areaSize,
                moveSprinklers:
                  shovelMove.areaSize === 1 ? true : moveSprinklersWithShovel,
              });
              setShovelMove(null);
            } else if (result.reason) {
              alert(result.reason);
            }
            return;
          }

          if (
            isToolEffectActive &&
            isShovelTool(equippedToolId) &&
            !shovelMove
          ) {
            setShovelMove({
              sourceRow: row,
              sourceCol: col,
              areaSize: getShovelAreaSize(),
            });
            return;
          }

          if (isToolEffectActive && isWateringCanTool(equippedToolId)) {
            const result = computeWaterAreaResult(
              state,
              row,
              col,
              equippedToolId ?? "",
            );
            if (result.wateredTiles > 0) {
              dispatch({
                type: "garden/waterArea",
                centerRow: row,
                centerCol: col,
                toolId: equippedToolId ?? "",
              });
            } else if (result.lackedEnergy) {
              alert("Not enough mana to water crops in range.");
            }
            return;
          }

          if (isToolEffectActive && isScytheTool(equippedToolId)) {
            dispatch({
              type: "garden/scytheHarvestArea",
              centerRow: row,
              centerCol: col,
              toolId: equippedToolId ?? "",
            });
            return;
          }

          if (isToolEffectActive && isSeedBagTool(equippedToolId)) {
            if (!activeSeedBagSeedId) {
              alert("Select a seed in the tool selector first.");
              return;
            }
            const result = computeSeedBagPlantResult(
              state,
              row,
              col,
              equippedToolId ?? "",
              activeSeedBagSeedId,
              seedBagPlantEnergyCost,
            );
            if (result.plantedTiles > 0) {
              dispatch({
                type: "garden/seedBagPlantArea",
                centerRow: row,
                centerCol: col,
                toolId: equippedToolId ?? "",
                seedId: activeSeedBagSeedId,
                seedBagPlantEnergyCost,
              });
            } else if (result.lackedEnergy) {
              alert("Not enough mana to plant in range.");
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
              return;
            }
            if (fieldHarvesterId) {
              dispatch({ type: "garden/removeHarvester", row, col });
            } else {
              dispatch({
                type: "garden/placeHarvester",
                row,
                col,
                harvesterId: equippedToolId ?? "",
              });
            }
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
              return;
            }
            if (fieldPlanterId) {
              dispatch({ type: "garden/removePlanter", row, col });
            } else {
              dispatch({
                type: "garden/placePlanter",
                row,
                col,
                planterId: equippedToolId ?? "",
                seedId: state.garden.selectedPlanterSeedId ?? null,
              });
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
      />
    );
  };

  return (
    <div style={{ padding: isMobile ? 8 : 16 }}>
      <GardenToolbar
        isMobile={isMobile}
        isSeedMakerUnlocked={isSeedMakerUnlocked}
        isSeedMakerRunning={isSeedMakerRunning}
        hasMinimapUnlock={hasMinimapUnlock}
        isMinimapExpanded={isMinimapExpanded}
        selectedSeedMakerPresentation={selectedSeedMakerPresentation}
        seedMakerRemainingDurationLabel={
          isSeedMakerRunning ? formatDuration(seedMakerRemainingMs) : null
        }
        toolbarButtonSize={toolbarButtonSize}
        toolbarIconSize={toolbarIconSize}
        toolbarBadgeSize={toolbarBadgeSize}
        toolbarCornerActionSize={toolbarCornerActionSize}
        equippedToolId={equippedToolId}
        equippedToolIcon={getToolIcon(equippedToolId)}
        isToolEffectActive={isToolEffectActive}
        activeSeedBagSeedPresentation={
          isSeedBagTool(equippedToolId) ? activeSeedBagSeedPresentation : null
        }
        selectedPlanterSeedPresentation={
          isPlanterTool(equippedToolId) ? selectedPlanterSeedPresentation : null
        }
        onToggleToolWheel={() => setShowToolWheel((prev) => !prev)}
        onOpenStorage={() => setShowStorageModal(true)}
        onOpenCropMastery={() => setShowCropMasteryModal(true)}
        onOpenSeedMaker={handleOpenSeedMakerModal}
        onToggleMinimap={() => {
          setIsMinimapExpanded((previous) => !previous);
          setTimeout(() => updateMinimapViewportBounds(), 0);
        }}
        onToggleEquippedToolMode={handleToggleEquippedToolMode}
        onUnequipTool={handleUnequipTool}
        onOpenSeedBagSeedPicker={() => {
          setActivateSeedBagAfterSelection(false);
          setSeedSelectionTarget("seedbag");
          setShowSeedBag(true);
        }}
        onOpenPlanterSeedPicker={() => {
          setActivateSeedBagAfterSelection(false);
          setSeedSelectionTarget("planter");
          setShowSeedBag(true);
        }}
      />

      <GardenToolWheelModal
        isOpen={showToolWheel}
        isMobile={isMobile}
        toolTypeFilter={toolTypeFilter}
        filteredTools={filteredTools}
        isSeedBagToolEquipped={isSeedBagTool(equippedToolId)}
        isPlanterToolEquipped={isPlanterTool(equippedToolId)}
        seedBag={seedBagEntries}
        activeSeedBagSeedId={activeSeedBagSeedId}
        selectedPlanterSeedId={state.garden.selectedPlanterSeedId ?? null}
        onClose={() => setShowToolWheel(false)}
        onToolTypeFilterChange={setToolTypeFilter}
        onEquipTool={(equipValue) => {
          dispatch({ type: "garden/equipTool", toolUid: equipValue });
        }}
        onSelectSeedBagSeed={(seedId) => handleSeedBagSeedSelect(seedId)}
        onSelectPlanterSeed={(seedId) => {
          setPendingPlanterAction(null);
          setSeedSelectionTarget("planter");
          handleSeedBagSeedSelect(seedId);
        }}
      />

      <GardenShovelModePanel
        isVisible={isShovelTool(equippedToolId) && isToolEffectActive}
        isMobile={isMobile}
        shovelMove={shovelMove}
        shovelAreaSize={getShovelAreaSize()}
        moveSprinklersWithShovel={moveSprinklersWithShovel}
        onToggleMoveSprinklersWithShovel={setMoveSprinklersWithShovel}
        onClearSelection={() => setShovelMove(null)}
        onRemoveSelectedContents={() => {
          if (!shovelMove) return;
          dispatch({
            type: "garden/clearCropAreaContents",
            sourceRow: shovelMove.sourceRow,
            sourceCol: shovelMove.sourceCol,
            areaSize: shovelMove.areaSize,
          });
          setShovelMove(null);
        }}
      />

      <GardenSeedBagModal
        isOpen={showSeedBag}
        isMobile={isMobile}
        seedSelectionTarget={seedSelectionTarget}
        seedBag={seedBagEntries}
        activeSeedBagSeedId={activeSeedBagSeedId}
        selectedPlanterSeedIdForModal={selectedPlanterSeedForSeedBagModal}
        onClose={handleCloseSeedBagModal}
        onSelectSeed={(seedId) =>
          handleSeedBagSeedSelect(seedId, {
            closeSeedBagModal: true,
          })
        }
      />

      <GardenSeedMakerModal
        isOpen={showSeedMakerModal}
        isMobile={isMobile}
        cycleDurationLabel={formatDuration(seedMakerCycleMs)}
        isSeedMakerRunning={isSeedMakerRunning}
        remainingDurationLabel={
          isSeedMakerRunning ? formatDuration(seedMakerRemainingMs) : null
        }
        seedMakerRecipes={seedMakerRecipes}
        onClose={() => setShowSeedMakerModal(false)}
        onToggleAuto={() => {
          if (isSeedMakerRunning) {
            stopSeedMaker();
          } else {
            startSeedMaker();
          }
        }}
        onCraftOne={handleCraftOneSeed}
        onSelectRecipe={handleSeedMakerRecipeSelect}
      />

      <GardenGrid
        previewRows={previewRows}
        previewCols={previewCols}
        minimumCellSize={minimumCellSize}
        isMobile={isMobile}
        renderField={renderField}
        containerRef={gardenGridScrollRef}
        contentRef={gardenGridContentRef}
        onScroll={updateMinimapViewportBounds}
      />

      {hasMinimapUnlock && isMinimapExpanded && (
        <div
          role="dialog"
          aria-label="Garden world map"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(8, 14, 22, 0.62)",
            zIndex: 120,
            display: "grid",
            placeItems: "center",
            padding: isMobile ? 10 : 20,
          }}
          onClick={() => setIsMinimapExpanded(false)}
        >
          <div
            style={{
              width: "min(92vw, 900px)",
              maxHeight: "88vh",
              overflow: "auto",
              borderRadius: 10,
              border: "2px solid #6d5932",
              backgroundColor: "#142432",
              padding: isMobile ? 10 : 14,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
                gap: 8,
              }}
            >
              <h3 style={{ margin: 0, fontSize: isMobile ? 15 : 18 }}>
                Garden World Map
              </h3>
              <button
                type="button"
                onClick={() => setIsMinimapExpanded(false)}
                style={{
                  border: "1px solid #6a7785",
                  backgroundColor: "#213447",
                }}
              >
                Close
              </button>
            </div>

            <p style={{ marginTop: 0, color: "#9db3c5", fontSize: 12 }}>
              Click any unlocked tile to jump the garden viewport.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${previewCols}, ${isMobile ? 12 : 14}px)`,
                gap: 2,
                width: "max-content",
                marginInline: "auto",
                padding: 4,
                border: "1px solid #4d5c68",
                borderRadius: 8,
                backgroundColor: "#0f1a23",
              }}
            >
              {Array.from({ length: previewRows }).map((_, row) =>
                Array.from({ length: previewCols }).map((__, col) => {
                  const isUnlocked = unlockedFieldSet.has(`${row},${col}`);
                  const inViewport =
                    minimapViewportBounds !== null &&
                    row >= minimapViewportBounds.rowStart &&
                    row <= minimapViewportBounds.rowEnd &&
                    col >= minimapViewportBounds.colStart &&
                    col <= minimapViewportBounds.colEnd;

                  return (
                    <button
                      type="button"
                      key={`map-${row}-${col}`}
                      title={`Row ${row}, Col ${col}${isUnlocked ? " (unlocked)" : ""}`}
                      disabled={!isUnlocked}
                      onClick={() => {
                        centerGardenViewportAt(row, col);
                        setIsMinimapExpanded(false);
                      }}
                      style={{
                        width: isMobile ? 12 : 14,
                        height: isMobile ? 12 : 14,
                        minWidth: isMobile ? 12 : 14,
                        minHeight: isMobile ? 12 : 14,
                        padding: 0,
                        borderRadius: 2,
                        border: inViewport
                          ? "1px solid #f7e07f"
                          : "1px solid #2d3d4a",
                        backgroundColor: isUnlocked ? "#4a8d5f" : "#2a3540",
                        opacity: isUnlocked ? 1 : 0.5,
                        cursor: isUnlocked ? "pointer" : "not-allowed",
                      }}
                    />
                  );
                }),
              )}
            </div>
          </div>
        </div>
      )}

      <GardenPlantModal
        isOpen={plantModal.isOpen}
        isMobile={isMobile}
        row={plantModal.row}
        col={plantModal.col}
        seedEntries={plantModalSeedEntries}
        selectedSeedId={plantModal.selectedSeedId}
        ownedSprinklers={ownedSprinklerCount}
        ownedHarvesters={ownedHarvesterCount}
        ownedPlanters={ownedPlanterCount}
        onClose={handleClosePlantModal}
        onSelectSeed={(seedId) =>
          setPlantModal((prev) => ({
            ...prev,
            selectedSeedId: seedId,
          }))
        }
        onConfirmPlant={handleConfirmPlantModal}
      />

      {/* Crop Storage Modal */}
      <GardenCropStorageModal
        isOpen={showStorageModal}
        isMobile={isMobile}
        entries={cropStorageEntries}
        onClose={() => setShowStorageModal(false)}
      />

      <GardenHarvestModal
        isOpen={harvestModal.isOpen}
        isMobile={isMobile}
        preview={harvestPreview}
        onClose={closeHarvestModal}
        onConfirm={() => {
          if (harvestPreview) {
            dispatch({
              type: "garden/harvestCrop",
              cropId: harvestPreview.cropId,
              cropIndex: harvestPreview.cropIndex,
            });
            closeHarvestModal();
          }
        }}
      />

      <GardenCropMasteryModal
        isOpen={showCropMasteryModal}
        isMobile={isMobile}
        allCropTypes={allCropTypes}
        cropMaxLevel={CROP_MAX_LEVEL}
        getCropMastery={getCropMastery}
        getCropYieldAtLevel={getCropYieldAtLevel}
        getCropGoldWithPrestige={getCropGoldWithPrestige}
        getCropGoldMultiplier={getCropGoldMultiplier}
        getCropXpForNextLevel={getCropXpForNextLevel}
        formatCompactNumber={formatCompactNumber}
        onClose={() => setShowCropMasteryModal(false)}
        onPrestige={(cropId) =>
          dispatch({ type: "garden/prestigeCrop", cropId })
        }
      />

      <GardenRockBreakModal
        isOpen={rockBreakModal.isOpen}
        isMobile={isMobile}
        tier={rockBreakModal.rockTier}
        row={rockBreakModal.row}
        col={rockBreakModal.col}
        config={rockBreakConfig}
        pickaxeLevel={pickaxeLevel}
        currentEnergy={state.resources.energy ?? 0}
        meetsRequirement={meetsRockBreakRequirement}
        hasEnergy={hasRockBreakEnergy}
        onClose={closeRockBreakModal}
        onConfirm={() => {
          if (equippedPickaxe && rockBreakModal.rockTier) {
            const result = breakRock(
              state,
              rockBreakModal.row,
              rockBreakModal.col,
              equippedPickaxe,
            );

            if (result.success && result.newState) {
              dispatch({
                type: "garden/breakRock",
                row: rockBreakModal.row,
                col: rockBreakModal.col,
                pickaxeId: equippedPickaxe,
              });
              closeRockBreakModal();
            }
          }
        }}
      />

      {/* Tile Detail Modal */}
      <GardenTileDetailModal
        state={state}
        tileDetailModal={tileDetailModal}
        isMobile={isMobile}
        speedUpMinutes={speedUpMinutes}
        speedUpGemCost={speedUpGemCost}
        fieldCoverageText={fieldCoverageText}
        isFieldCoveredBySprinklerNetwork={isFieldCoveredBySprinklerNetwork}
        onClose={() =>
          setTileDetailModal((prev) => ({ ...prev, isOpen: false }))
        }
        onSetEmptyMode={(mode) =>
          setTileDetailModal((prev) => ({ ...prev, emptyMode: mode }))
        }
        onOpenPlantModal={(row, col) => {
          setTileDetailModal((prev) => ({ ...prev, isOpen: false }));
          setPlantModal({
            isOpen: true,
            row,
            col,
            selectedSeedId: null,
          });
        }}
        onOpenRockBreakModal={(row, col, rockTier) => {
          setTileDetailModal((prev) => ({ ...prev, isOpen: false }));
          setRockBreakModal({
            isOpen: true,
            row,
            col,
            rockTier,
          });
        }}
        onOpenPlanterSeedSelection={openPlanterSeedSelection}
        onSetSprinklerPreview={setSprinklerPreview}
        onGardenAction={dispatch}
      />
    </div>
  );
}
