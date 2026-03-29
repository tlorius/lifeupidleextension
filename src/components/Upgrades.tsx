import { useEffect, useMemo, useState } from "react";
import { useGame } from "../game/GameContext";
import { useGameActions } from "../game/useGameActions";
import {
  selectUpgradeTreeSummaries,
  selectUpgradeTreeView,
} from "../game/selectors/upgrades";
import { UpgradesTreeScreen, UpgradesTreeSelector } from "./UpgradesViews";

const UPGRADES_PANEL_STYLE = {
  backgroundColor: "#16212d",
  border: "1px solid #2a3a4c",
  borderRadius: 10,
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.24)",
};

export function Upgrades() {
  const { state } = useGame();
  const { buyUpgrade } = useGameActions();
  const [selectedTree, setSelectedTree] = useState<string | null>(null);
  const [isTreeView, setIsTreeView] = useState(false);
  const [treeModalUpgradeId, setTreeModalUpgradeId] = useState<string | null>(
    null,
  );
  const [viewportWidth, setViewportWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 1024,
  );

  const trees = useMemo(() => selectUpgradeTreeSummaries(state), [state]);
  const selectedTreeView = useMemo(
    () =>
      selectedTree
        ? selectUpgradeTreeView(
            state,
            selectedTree,
            viewportWidth,
            treeModalUpgradeId,
          )
        : null,
    [state, selectedTree, treeModalUpgradeId, viewportWidth],
  );
  const hasItems = state.inventory.length > 0;

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleSelectTree = (tree: string) => {
    setSelectedTree(tree);
    setIsTreeView(false);
    setTreeModalUpgradeId(null);
  };

  const handleBackToTrees = () => {
    setSelectedTree(null);
    setTreeModalUpgradeId(null);
    setIsTreeView(false);
  };

  if (selectedTree && selectedTreeView) {
    return (
      <UpgradesTreeScreen
        treeView={selectedTreeView}
        isTreeView={isTreeView}
        panelStyle={UPGRADES_PANEL_STYLE}
        onBackToTrees={handleBackToTrees}
        onToggleTreeView={() => setIsTreeView((prev) => !prev)}
        onOpenUpgradeModal={setTreeModalUpgradeId}
        onCloseUpgradeModal={() => setTreeModalUpgradeId(null)}
        onBuyUpgrade={buyUpgrade}
      />
    );
  }

  return (
    <UpgradesTreeSelector
      trees={trees}
      hasItems={hasItems}
      panelStyle={UPGRADES_PANEL_STYLE}
      onSelectTree={handleSelectTree}
    />
  );
}
