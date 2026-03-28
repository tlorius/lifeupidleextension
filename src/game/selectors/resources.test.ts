import { describe, expect, it } from "vitest";
import { getDamageAfterDefense, getPlayerAttacksPerSecond } from "../combat";
import { getGoldIncome } from "../engine";
import { createDefaultState } from "../state";
import { getPassiveGemRatePerSecond } from "../upgrades";
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

  it("matches defense, agility, and passive gem calculations", () => {
    const state = createDefaultState();
    state.stats.agility = 20;
    state.stats.defense = 80;
    state.combat.enemy.damage = 120;
    state.upgrades = [
      { ...upgradeDefinitions.chaos_gem_foundry, level: 3 },
      { ...upgradeDefinitions.gem_hunter, level: 4 },
      { ...upgradeDefinitions.prism_sieves, level: 2 },
    ];

    const result = selectResourcesDisplayView(state, 1_000);

    expect(result.attacksPerSecond).toBeCloseTo(
      getPlayerAttacksPerSecond(state),
    );
    expect(result.enemyDamageTakenPerHit).toBe(
      getDamageAfterDefense(
        state.combat.enemy.damage,
        result.total.defense ?? 0,
      ),
    );
    expect(result.passiveGemRatePerSecond).toBeCloseTo(
      getPassiveGemRatePerSecond(state),
    );
    expect(result.passiveGemsPerTick).toBe(
      Math.ceil(result.passiveGemRatePerSecond),
    );
    expect(result.passiveGemsPerMinute).toBe(
      Math.ceil(result.passiveGemRatePerSecond * 60),
    );
  });
});
