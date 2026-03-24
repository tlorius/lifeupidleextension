import { describe, expect, it, vi } from "vitest";
import { createDefaultState } from "./state";
import {
  getHardLevelCap,
  getLevelGainPreview,
  getLevelUpGains,
  getXpForNextLevel,
  grantPlayerXp,
} from "./progression";

describe("progression", () => {
  it("uses the authored XP curve for key levels", () => {
    expect(getXpForNextLevel(1)).toBe(100);
    expect(getXpForNextLevel(10)).toBe(1540);
    expect(getXpForNextLevel(20)).toBe(5420);
    expect(getXpForNextLevel(101)).toBeGreaterThan(getXpForNextLevel(100));
  });

  it("returns the expected level-up gains for milestone and non-milestone levels", () => {
    expect(getLevelUpGains(2)).toEqual({
      hp: 18,
      attack: 4,
      agility: 0.8,
    });

    expect(getLevelUpGains(4)).toEqual({
      hp: 18,
      attack: 4,
      agility: 0.8,
    });

    expect(getLevelUpGains(60)).toEqual({
      hp: 30,
      attack: 7,
      agility: 0.8,
      critChance: 1.2,
      defense: 2,
      intelligence: 3,
    });

    expect(getLevelUpGains(120)).toEqual({
      hp: 60,
      attack: 15,
      agility: 1.4,
      critChance: 1.2,
      defense: 6,
      intelligence: 9,
    });
  });

  it("previews gains for the next level", () => {
    expect(getLevelGainPreview(1)).toEqual({
      hp: 18,
      attack: 4,
      agility: 0.8,
    });
  });

  it("grants XP without leveling when below the threshold", () => {
    const state = createDefaultState();

    const next = grantPlayerXp(state, 20);

    expect(next.playerProgress.level).toBe(1);
    expect(next.playerProgress.xp).toBe(20);
    expect(next.playerProgress.totalXpEarned).toBe(20);
    expect(next.stats).toEqual(state.stats);
  });

  it("applies level-up gains when enough XP is earned", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    const state = createDefaultState();

    const next = grantPlayerXp(state, 100);

    expect(next.playerProgress.level).toBe(2);
    expect(next.playerProgress.xp).toBe(0);
    expect(next.playerProgress.totalXpEarned).toBe(100);
    expect(next.playerProgress.lastLevelUpAt).toBe(1_700_000_000_000);
    expect(next.stats.attack).toBe(14);
    expect(next.stats.hp).toBe(118);
    expect(next.stats.agility).toBeCloseTo(1.8, 8);
  });

  it("handles multiple level-ups in a single XP grant", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_123_456);
    const state = createDefaultState();

    const next = grantPlayerXp(state, 300);

    expect(next.playerProgress.level).toBe(3);
    expect(next.playerProgress.xp).toBe(36);
    expect(next.stats.attack).toBe(18);
    expect(next.stats.hp).toBe(136);
    expect(next.stats.agility).toBeCloseTo(1.8, 8);
    expect(next.stats.critChance).toBeCloseTo(6.2, 8);
  });

  it("unlocks spell system at configured level threshold", () => {
    const state = createDefaultState();

    const next = grantPlayerXp(state, 5000);

    expect(next.playerProgress.level).toBeGreaterThanOrEqual(8);
    expect(next.playerProgress.unlockedSystems?.spells).toBe(true);
  });

  it("ignores non-positive XP grants", () => {
    const state = createDefaultState();

    expect(grantPlayerXp(state, 0)).toBe(state);
    expect(grantPlayerXp(state, -10)).toBe(state);
  });

  it("enforces the hard level cap and clears overflow XP", () => {
    const state = createDefaultState();

    const next = grantPlayerXp(state, 10_000_000_000_000_000);

    expect(next.playerProgress.level).toBe(getHardLevelCap());
    expect(next.playerProgress.xp).toBe(0);
  });
});
