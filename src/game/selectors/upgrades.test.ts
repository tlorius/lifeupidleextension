import { describe, expect, it } from "vitest";
import { createDefaultState } from "../state";
import { buyUpgrade, getUpgradeDef } from "../upgrades";
import {
  getTreeIcon,
  selectUpgradePresentation,
  selectUpgradeTreeSummaries,
  selectUpgradeTreeView,
} from "./upgrades";

describe("upgrade selectors", () => {
  it("builds upgrade tree summaries from current state", () => {
    let state = createDefaultState();
    state.resources.gold = 1_000_000;
    state = buyUpgrade(state, "gold_rush");
    state = buyUpgrade(state, "gold_rush");
    state = buyUpgrade(state, "mage_talent");

    const summaries = selectUpgradeTreeSummaries(state);
    const resource = summaries.find((entry) => entry.tree === "resource");
    const magic = summaries.find((entry) => entry.tree === "magic");

    expect(getTreeIcon("resource")).toBe("💰");
    expect(resource?.totalLevel).toBe(2);
    expect(resource?.unlockedCount).toBeGreaterThan(0);
    expect(magic?.totalLevel).toBe(1);
  });

  it("builds purchase and tree-layout view models", () => {
    let state = createDefaultState();
    state.resources.gold = 1_000_000;
    state = buyUpgrade(state, "gold_rush");
    state = buyUpgrade(state, "gold_rush");
    state = buyUpgrade(state, "gold_rush");
    state = buyUpgrade(state, "gold_efficiency");

    const goldRush = selectUpgradePresentation(
      state,
      getUpgradeDef("gold_rush")!,
    );
    const resourceTree = selectUpgradeTreeView(
      state,
      "resource",
      1024,
      "gold_efficiency",
    );

    expect(goldRush.level).toBe(3);
    expect(goldRush.canPurchase).toBe(true);
    expect(goldRush.linkedText).toContain("Gold Efficiency");
    expect(resourceTree.tierEntries.length).toBeGreaterThan(1);
    expect(resourceTree.treeConnectors.length).toBeGreaterThan(0);
    expect(resourceTree.selectedModalPresentation?.upgrade.id).toBe(
      "gold_efficiency",
    );
    expect(resourceTree.layout.treeBoardWidth).toBeGreaterThan(0);
  });
});
