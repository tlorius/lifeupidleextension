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
    expect(goldRush.purchaseDisabled).toBe(false);
    expect(goldRush.lockReason).toBeNull();
    expect(goldRush.linkedText).toContain("Gold Efficiency");
    expect(resourceTree.tierEntries.length).toBeGreaterThan(1);
    expect(resourceTree.treeConnectors.length).toBeGreaterThan(0);
    expect(resourceTree.selectedModalPresentation?.upgrade.id).toBe(
      "gold_efficiency",
    );
    expect(resourceTree.layout.treeBoardWidth).toBeGreaterThan(0);
  });

  it("exposes lock reason when prerequisites are not met", () => {
    const state = createDefaultState();
    const locked = selectUpgradePresentation(
      state,
      getUpgradeDef("gold_efficiency")!,
    );

    expect(locked.isUnlocked).toBe(false);
    expect(locked.purchaseDisabled).toBe(true);
    expect(locked.lockReason).toBe("prerequisites");
    expect(locked.actionLabel).toBe("Locked");
    expect(locked.actionTitle).toBe("Prerequisites not met");
  });

  it("exposes linked-level and insufficient-gold lock reasons", () => {
    let state = createDefaultState();
    state.resources.gold = 1_000_000;
    state = buyUpgrade(state, "gold_rush");

    const linkedLevelLocked = selectUpgradePresentation(
      state,
      getUpgradeDef("wealth")!,
    );

    state.resources.gold = 0;
    const insufficientGold = selectUpgradePresentation(
      state,
      getUpgradeDef("gold_efficiency")!,
    );

    expect(linkedLevelLocked.isUnlocked).toBe(false);
    expect(linkedLevelLocked.preqsMet).toBe(true);
    expect(linkedLevelLocked.lockReason).toBe("linked-level");
    expect(linkedLevelLocked.actionTitle).toBe(
      "Previous upgrade level required",
    );

    expect(insufficientGold.isUnlocked).toBe(true);
    expect(insufficientGold.preqsMet).toBe(true);
    expect(insufficientGold.lockReason).toBe("insufficient-gold");
    expect(insufficientGold.actionLabel).toBe("Unlock");
    expect(insufficientGold.actionTitle).toBe("Not enough gold");
  });

  it("exposes ruby, level, and max-level lock states", () => {
    let state = createDefaultState();
    state.resources.gold = 1_000_000_000;
    state.resources.ruby = 1_000;
    state.playerProgress.level = 50;
    state = buyUpgrade(state, "chaos_core");
    state.resources.ruby = 0;

    const insufficientRuby = selectUpgradePresentation(
      state,
      getUpgradeDef("chaos_idle_surge_1")!,
    );

    state.resources.ruby = 1_000;
    state.playerProgress.level = 49;
    const levelLocked = selectUpgradePresentation(
      state,
      getUpgradeDef("chaos_idle_surge_1")!,
    );

    state.playerProgress.level = 50;
    state = buyUpgrade(state, "chaos_idle_surge_1");
    const maxed = selectUpgradePresentation(
      state,
      getUpgradeDef("chaos_idle_surge_1")!,
    );

    expect(insufficientRuby.lockReason).toBe("insufficient-ruby");
    expect(insufficientRuby.actionTitle).toBe("Not enough ruby");
    expect(insufficientRuby.rubyCost).toBe(100);

    expect(levelLocked.lockReason).toBe("level-requirement");
    expect(levelLocked.levelRequirementText).toContain("Requires Player Level");

    expect(maxed.lockReason).toBe("max-level");
    expect(maxed.actionLabel).toBe("Purchased");
    expect(maxed.purchaseDisabled).toBe(true);
  });

  it("returns null selected modal when selected upgrade id is not present", () => {
    const state = createDefaultState();
    const treeView = selectUpgradeTreeView(state, "resource", 1024, "attack_i");

    expect(treeView.selectedModalPresentation).toBeNull();
  });
});
