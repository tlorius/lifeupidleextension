import { describe, expect, it, vi } from "vitest";
import { createDefaultState } from "./state";
import {
  getLevelGainPreview,
  getLevelUpGains,
  getXpForNextLevel,
  grantPlayerXp,
} from "./progression";

describe("progression", () => {
  it("uses the authored XP curve for key levels", () => {
    expect(getXpForNextLevel(1)).toBe(45);
    expect(getXpForNextLevel(10)).toBe(900);
    expect(getXpForNextLevel(20)).toBe(3180);
  });

  it("returns the expected level-up gains for milestone and non-milestone levels", () => {
    expect(getLevelUpGains(2)).toEqual({
      hp: 10,
      attack: 2,
      agility: 0.5,
    });

    expect(getLevelUpGains(4)).toEqual({
      hp: 10,
      attack: 2,
      agility: 0.5,
      critChance: 0.75,
    });
  });

  it("previews gains for the next level", () => {
    expect(getLevelGainPreview(1)).toEqual({
      hp: 10,
      attack: 2,
      agility: 0.5,
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

    const next = grantPlayerXp(state, 45);

    expect(next.playerProgress.level).toBe(2);
    expect(next.playerProgress.xp).toBe(0);
    expect(next.playerProgress.totalXpEarned).toBe(45);
    expect(next.playerProgress.lastLevelUpAt).toBe(1_700_000_000_000);
    expect(next.stats.attack).toBe(12);
    expect(next.stats.hp).toBe(110);
    expect(next.stats.agility).toBeCloseTo(1.5, 8);
  });

  it("handles multiple level-ups in a single XP grant", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_123_456);
    const state = createDefaultState();

    const next = grantPlayerXp(state, 300);

    expect(next.playerProgress.level).toBe(4);
    expect(next.playerProgress.xp).toBe(34);
    expect(next.stats.attack).toBe(16);
    expect(next.stats.hp).toBe(130);
    expect(next.stats.agility).toBeCloseTo(2, 8);
    expect(next.stats.critChance).toBeCloseTo(5.75, 8);
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
});
