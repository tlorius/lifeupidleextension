import { describe, expect, it, vi } from "vitest";
import { createDefaultState } from "../state";
import { addDebugItems } from "../items";
import { applyCombatAction } from "./combat";

describe("combat action handler", () => {
  it("applies click attack through the action handler", () => {
    const state = createDefaultState();
    const next = applyCombatAction(state, { type: "combat/clickAttack" });

    expect(next.state.combat.enemy.currentHp).toBeLessThan(
      state.combat.enemy.currentHp,
    );
    expect(next.combatEvents.some((event) => event.type === "playerHit")).toBe(
      true,
    );
  });

  it("uses a consumable through the action handler", () => {
    const seeded = addDebugItems(createDefaultState());
    const potion = seeded.inventory.find(
      (entry) => entry.itemId === "mana_potion",
    );
    expect(potion).toBeTruthy();

    const next = applyCombatAction(seeded, {
      type: "combat/useConsumable",
      itemUid: potion!.uid,
    });

    expect(next.combatEvents).toEqual([
      { type: "consumableUsed", itemId: "mana_potion" },
    ]);
    expect(next.state).not.toBe(seeded);
  });

  it("returns unchanged state when casting a spell without enough mana", () => {
    const state = createDefaultState();
    state.resources.energy = 0;

    const next = applyCombatAction(state, {
      type: "combat/castSpell",
      spellId: "arcane_bolt",
    });

    expect(next.state).toBe(state);
    expect(next.combatEvents).toEqual([]);
  });

  it("produces identical results for identical combat action sequences", () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.5);
    const base = createDefaultState();

    const sequence = [
      { type: "combat/clickAttack" } as const,
      { type: "combat/clickAttack" } as const,
      { type: "combat/clickAttack" } as const,
    ];

    const runSequence = () => {
      let state = structuredClone(base);
      for (const action of sequence) {
        state = applyCombatAction(state, action).state;
      }
      return state;
    };

    const first = runSequence();
    const second = runSequence();

    randomSpy.mockRestore();

    expect(first).toEqual(second);
  });

  it("preserves full playerHit value for very large click damage", () => {
    const state = createDefaultState();
    state.stats.attack = 1_234_567_890;
    state.stats.critChance = 0;
    state.combat.enemy.currentHp = 50_000_000_000;

    const next = applyCombatAction(state, { type: "combat/clickAttack" });
    const playerHit = next.combatEvents.find(
      (event) => event.type === "playerHit",
    );

    expect(playerHit).toBeTruthy();
    expect(playerHit?.value ?? 0).toBeGreaterThan(1_000_000_000);
  });
});
