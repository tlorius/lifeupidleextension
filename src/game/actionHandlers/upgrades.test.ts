import { describe, expect, it } from "vitest";
import { createDefaultState } from "../state";
import { reduceUpgradeAction } from "./upgrades";

describe("upgrade action handler", () => {
  it("buys an unlocked upgrade through the handler", () => {
    const state = createDefaultState();
    state.resources.gold = 1_000;

    const next = reduceUpgradeAction(state, {
      type: "upgrade/buy",
      upgradeId: "attack_i",
    });

    expect(
      next.upgrades.find((upgrade) => upgrade.id === "attack_i")?.level,
    ).toBe(1);
    expect(next.resources.gold).toBeLessThan(state.resources.gold);
  });

  it("leaves state unchanged when the upgrade cannot be afforded", () => {
    const state = createDefaultState();
    state.resources.gold = 0;

    const next = reduceUpgradeAction(state, {
      type: "upgrade/buy",
      upgradeId: "attack_i",
    });

    expect(next).toBe(state);
  });

  it("produces identical state for identical upgrade purchase sequences", () => {
    const base = createDefaultState();
    base.resources.gold = 5000;

    const sequence = [
      { type: "upgrade/buy" as const, upgradeId: "attack_i" },
      { type: "upgrade/buy" as const, upgradeId: "defense_i" },
      { type: "upgrade/buy" as const, upgradeId: "attack_i" },
    ];

    const runSequence = () =>
      sequence.reduce(
        (next, action) => reduceUpgradeAction(next, action),
        structuredClone(base),
      );

    const first = runSequence();
    const second = runSequence();

    expect(first).toEqual(second);
  });
});
