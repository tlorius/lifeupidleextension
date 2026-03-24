import { describe, expect, it } from "vitest";
import { createDefaultState } from "../state";
import { upgradeDefinitions } from "../upgrades";
import { selectResourcesDisplayView } from "./resources";

describe("resource selectors", () => {
  it("calculates active potion and gold income breakdown", () => {
    const state = createDefaultState();
    state.stats.attack = 10;
    state.temporaryEffects = {
      goldIncomeBoostPercent: 25,
      goldIncomeBoostUntil: 20_000,
    };
    state.upgrades = [{ ...upgradeDefinitions.gold_rush, level: 1 }];

    const result = selectResourcesDisplayView(state, 10_000);

    expect(result.activeGoldPotionBoost).toBe(25);
    expect(result.activePotionMsLeft).toBe(10_000);
    expect(result.upgradeGoldBonus).toBe(10);
    expect(result.totalGoldBonusPercent).toBe(35);
    expect(result.totalGoldMultiplier).toBe(1.35);
    expect(result.calculatedGoldPerSecond).toBe(13.5);
  });

  it("tracks permanent potion stat changes against defaults", () => {
    const state = createDefaultState();
    state.stats.attack += 4;
    state.stats.intelligence = (state.stats.intelligence ?? 0) + 2;

    const result = selectResourcesDisplayView(state, 1_000);

    expect(result.hasPermanentPotionChanges).toBe(true);
    expect(result.permanentPotionStatChanges.attack).toBe(4);
    expect(result.permanentPotionStatChanges.intelligence).toBe(2);
  });
});
