import { useState, useEffect } from "react";
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
import { useGame } from "../game/GameContext";
import {
  getCropDef,
  cropDefinitions,
  getGrowthProgress,
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
  moveCropArea,
  reconcileGardenRocksForPreview,
  sprinklerCoversField,
  placeHarvesterOnField,
  removeHarvesterFromField,
  placePlanterOnField,
  removePlanterFromField,
  rockConfig,
  getSeedMakerCost,
  craftSeedFromSeedMaker,
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
import type { CropInstance, FieldPosition } from "../game/types";

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
    setState((prev) => reconcileGardenRocksForPreview(prev));
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

    setState((prev) => {
      const next = structuredClone(prev);
      const crafted = craftSeedFromSeedMaker(next, seedId);
      return crafted ? next : prev;
    });
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

    setState((prev) => ({
      ...prev,
      garden: {
        ...prev.garden,
        automationTimers: {
          ...(prev.garden.automationTimers ?? {}),
          seedMakerRemainderMs: 0,
        },
        seedMaker: {
          ...(prev.garden.seedMaker ?? {}),
          isRunning: true,
          selectedSeedId: seedId,
        },
      },
    }));
  };

  const stopSeedMaker = () => {
    setState((prev) => ({
      ...prev,
      garden: {
        ...prev.garden,
        automationTimers: {
          ...(prev.garden.automationTimers ?? {}),
          seedMakerRemainderMs: 0,
        },
        seedMaker: {
          ...(prev.garden.seedMaker ?? {}),
          isRunning: false,
        },
      },
    }));
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

    setState((prev) => ({
      ...prev,
      garden: {
        ...prev.garden,
        seedMaker: {
          ...(prev.garden.seedMaker ?? {}),
          selectedSeedId: seedId,
        },
      },
    }));
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

  // Get preview grid (showing adjacent fields that can be unlocked)
  const previewRows = garden.gridSize.rows + 2;
  const previewCols = garden.gridSize.cols + 2;
  const compactGridLabels = isMobile || previewCols >= 8;
  const minimumCellSize = isMobile ? 34 : 42;

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
    const cropId = resolveGardenCropIdFromSeed(seedId);
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
      setState((prev) => ({
        ...prev,
        garden: {
          ...prev.garden,
          seedMaker: {
            ...(prev.garden.seedMaker ?? {}),
            selectedSeedId: defaultSeedMakerSeedId,
          },
        },
      }));
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
    setState((prev) => ({
      ...prev,
      equipment: {
        ...prev.equipment,
        tool: null,
      },
    }));
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
                alert("Not enough mana to water crops in range.");
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
            const newState = unlockField(state, row, col);
            setState(newState);
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
              alert("Not enough mana to water crops in range.");
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
      />
    );
  };

  return (
    <div style={{ padding: isMobile ? 8 : 16 }}>
      <GardenToolbar
        isMobile={isMobile}
        isSeedMakerUnlocked={isSeedMakerUnlocked}
        isSeedMakerRunning={isSeedMakerRunning}
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
        seedBag={seedBag.map((seed) => ({
          seedId: seed.seedId,
          icon: seed.presentation.icon,
          label: seed.presentation.label,
          count: seed.count,
        }))}
        activeSeedBagSeedId={activeSeedBagSeedId}
        selectedPlanterSeedId={state.garden.selectedPlanterSeedId ?? null}
        onClose={() => setShowToolWheel(false)}
        onToolTypeFilterChange={setToolTypeFilter}
        onEquipTool={(equipValue) => {
          setState((prev) => ({
            ...prev,
            equipment: {
              ...prev.equipment,
              tool: equipValue,
            },
          }));
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
      />

      <GardenSeedBagModal
        isOpen={showSeedBag}
        isMobile={isMobile}
        seedSelectionTarget={seedSelectionTarget}
        seedBag={seedBag.map((seed) => ({
          seedId: seed.seedId,
          icon: seed.presentation.icon,
          label: seed.presentation.label,
          count: seed.count,
        }))}
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
      />

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
                      const seedPresentation = seed.presentation;
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
                        const cropId = resolveGardenCropIdFromSeed(
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
      <GardenCropStorageModal
        isOpen={showStorageModal}
        isMobile={isMobile}
        entries={cropStorageEntries}
        onClose={() => setShowStorageModal(false)}
      />

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
              background:
                "linear-gradient(180deg, rgba(24, 36, 51, 0.98) 0%, rgba(14, 22, 34, 0.98) 100%)",
              color: "#e5edf5",
              borderRadius: 18,
              padding: isMobile ? 16 : 22,
              maxHeight: isMobile ? "88vh" : "80vh",
              maxWidth: "540px",
              width: isMobile ? "94vw" : "540px",
              overflow: "auto",
              border: "1px solid rgba(116, 192, 252, 0.22)",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.45)",
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
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      marginBottom: 18,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          textTransform: "uppercase",
                          letterSpacing: "0.12em",
                          color: "#8eb8de",
                          marginBottom: 6,
                        }}
                      >
                        Rock obstacle
                      </div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: isMobile ? 22 : 26,
                          lineHeight: 1.1,
                        }}
                      >
                        ⛏️ Break Rock
                      </h3>
                    </div>
                    <div
                      style={{
                        padding: "8px 12px",
                        borderRadius: 999,
                        backgroundColor: "rgba(74, 144, 226, 0.14)",
                        border: "1px solid rgba(74, 144, 226, 0.3)",
                        color: "#b7d7f5",
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: "capitalize",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {tier} tier
                    </div>
                  </div>

                  {/* Rock Info */}
                  <div
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(47, 68, 89, 0.88) 0%, rgba(27, 45, 63, 0.88) 100%)",
                      padding: 14,
                      borderRadius: 14,
                      marginBottom: 16,
                      border: "1px solid rgba(143, 176, 194, 0.22)",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "bold",
                        marginBottom: 10,
                        fontSize: 16,
                      }}
                    >
                      {tier?.charAt(0).toUpperCase() + tier?.slice(1)} Rock
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "#c3d6e8",
                        lineHeight: "1.7",
                        display: "grid",
                        gap: 6,
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
                      backgroundColor: "rgba(18, 29, 41, 0.92)",
                      padding: 14,
                      borderRadius: 14,
                      marginBottom: 16,
                      border: "1px solid rgba(143, 176, 194, 0.18)",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "bold",
                        marginBottom: 12,
                        fontSize: 15,
                      }}
                    >
                      Requirements
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        lineHeight: "1.8",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          padding: 10,
                          backgroundColor: meetsRequirement
                            ? "rgba(46, 125, 50, 0.16)"
                            : "rgba(198, 40, 40, 0.16)",
                          borderRadius: 10,
                          border: meetsRequirement
                            ? "1px solid rgba(76, 175, 80, 0.5)"
                            : "1px solid rgba(244, 67, 54, 0.5)",
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
                              color: meetsRequirement ? "#8dd694" : "#ff8a80",
                              fontWeight: "bold",
                            }}
                          >
                            {meetsRequirement ? "✓" : "✗"} Level {pickaxeLevel}
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          padding: 10,
                          backgroundColor: hasEnergy
                            ? "rgba(33, 150, 243, 0.16)"
                            : "rgba(198, 40, 40, 0.16)",
                          borderRadius: 10,
                          border: hasEnergy
                            ? "1px solid rgba(33, 150, 243, 0.5)"
                            : "1px solid rgba(244, 67, 54, 0.5)",
                        }}
                      >
                        <div style={{ fontWeight: "bold", marginBottom: 4 }}>
                          Mana Cost
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
                              color: hasEnergy ? "#8ecbff" : "#ff8a80",
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
                        backgroundColor: "rgba(255, 183, 77, 0.14)",
                        padding: 12,
                        borderRadius: 12,
                        marginBottom: 16,
                        fontSize: 12,
                        color: "#ffd8a8",
                        border: "1px solid rgba(255, 183, 77, 0.45)",
                        lineHeight: 1.6,
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
                          ⚠️ Not enough mana. You need{" "}
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
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      className="btn-secondary"
                      style={{
                        padding: "10px 20px",
                        borderRadius: 10,
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
                      className={
                        meetsRequirement && hasEnergy ? "btn-primary" : ""
                      }
                      style={{
                        padding: "10px 20px",
                        backgroundColor:
                          meetsRequirement && hasEnergy ? undefined : "#52606d",
                        color:
                          meetsRequirement && hasEnergy ? undefined : "#c7d0d9",
                        border: "none",
                        borderRadius: 10,
                        cursor:
                          meetsRequirement && hasEnergy
                            ? "pointer"
                            : "not-allowed",
                        fontWeight: "bold",
                        boxShadow:
                          meetsRequirement && hasEnergy
                            ? "0 10px 20px rgba(0, 0, 0, 0.28)"
                            : "none",
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
        onStateChange={setState}
      />
    </div>
  );
}
