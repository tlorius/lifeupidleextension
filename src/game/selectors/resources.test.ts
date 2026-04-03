import { describe, expect, it } from "vitest";
import { getGoldIncome } from "../engine";
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
    expect(result.totalGoldMultiplier).toBeCloseTo(1.35);
    expect(result.calculatedGoldPerSecond).toBeCloseTo(13.5);
    expect(result.attackSpeed.finalAps).toBeGreaterThan(0);
    expect(result.defenseRawMitigationPercent).toBeGreaterThanOrEqual(0);
    expect(result.passiveGemRatePerSecond).toBeGreaterThanOrEqual(0);
    expect(result.intelligenceSpellBonus.arcaneBoltEffectiveBonusDamage).toBe(
      result.intelligenceSpellBonus.arcaneBoltBaseBonusDamage *
        result.intelligenceSpellBonus.classSpellDamageMultiplier *
        result.intelligenceSpellBonus.arcaneBoltSetMultiplier,
    );
  });

  it("derives passive gems per second from gem-finder formulas", () => {
    const state = createDefaultState();
    state.upgrades = [
      { ...upgradeDefinitions.gem_hunter, level: 2 },
      { ...upgradeDefinitions.chaos_gem_foundry, level: 3 },
    ];

    const result = selectResourcesDisplayView(state, 0);

    expect(result.basePassiveGemRatePerSecond).toBeCloseTo(1.05);
    expect(result.totalGemFinderLevels).toBe(5);
    expect(result.gemRateMultiplier).toBeCloseTo(1.4);
    expect(result.passiveGemRatePerSecond).toBeCloseTo(1.47);
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

  it("clears expired temporary potion state and preserves default permanent deltas", () => {
    const state = createDefaultState();
    state.temporaryEffects = {
      goldIncomeBoostPercent: 25,
      goldIncomeBoostUntil: 5_000,
    };

    const result = selectResourcesDisplayView(state, 10_000);

    expect(result.activeGoldPotionBoost).toBe(0);
    expect(result.activePotionMsLeft).toBe(0);
    expect(result.hasPermanentPotionChanges).toBe(false);
    expect(result.permanentPotionStatChanges.attack).toBe(0);
    expect(result.permanentPotionStatChanges.defense).toBe(0);
  });

  it("matches engine gold income and attack fallback behavior", () => {
    const state = createDefaultState();
    state.stats.attack = 0;

    const result = selectResourcesDisplayView(state, Date.now());

    expect(result.baseGoldPerSecond).toBe(1);
    expect(result.goldIncomePerSecond).toBe(getGoldIncome(state));
    expect(result.calculatedGoldPerSecond).toBeCloseTo(
      result.goldIncomePerSecond,
    );
  });
});
