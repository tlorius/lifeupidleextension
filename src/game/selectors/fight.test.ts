import { describe, expect, it } from "vitest";
import { createDefaultState } from "../state";
import { selectFightDpsMetrics, selectFightView } from "./fight";

describe("fight selectors", () => {
  it("builds slotted spells from selected class spells without duplicates", () => {
    const state = createDefaultState();
    state.playerProgress.level = 20;
    state.playerProgress.xp = 250;
    state.playerProgress.unlockedSystems = {
      ...state.playerProgress.unlockedSystems,
      spells: true,
    };
    state.character.activeClassId = "sorceress";
    state.character.classProgress.sorceress.selectedSpellIds = [
      "arcane_bolt",
      "arcane_bolt",
      "second_wind",
      null,
      null,
      null,
      null,
      null,
    ];
    state.inventory = [
      { uid: "p1", itemId: "mana_potion", quantity: 2, level: 1 },
      { uid: "p2", itemId: "mana_potion", quantity: 3, level: 1 },
      { uid: "p3", itemId: "health_potion", quantity: 1, level: 1 },
    ];

    const result = selectFightView(state);

    expect(result.unlockedSpellSlots).toBe(5);
    expect(result.slottedSpells.map((spell) => spell.id)).toEqual([
      "arcane_bolt",
      "second_wind",
    ]);
    expect(result.potionSummaries.map((potion) => potion.itemId)).toEqual([
      "health_potion",
      "mana_potion",
    ]);
    expect(result.potionSummaries[1]?.quantity).toBe(5);
    expect(result.checkpointLevel).toBe(1);
  });

  it("calculates fight HUD values and DPS breakdowns", () => {
    const state = createDefaultState();
    state.playerProgress.level = 12;
    state.playerProgress.xp = 120;
    state.resources.energy = 40;
    state.combat.playerCurrentHp = 25;
    state.combat.enemy.currentHp = 15;
    state.combat.enemy.maxHp = 60;
    state.combat.lastBossCheckpointLevel = 6;

    const view = selectFightView(state);
    const dps = selectFightDpsMetrics(
      [
        { timestamp: 15_000, damage: 120, source: "auto" },
        { timestamp: 35_000, damage: 90, source: "auto" },
        { timestamp: 40_000, damage: 60, source: "click" },
        { timestamp: 45_000, damage: 150, source: "spell" },
        { timestamp: 55_000, damage: 30, source: "pet" },
      ],
      60_000,
      30_000,
    );

    expect(view.playerMana).toBe(40);
    expect(view.playerHpPercent).toBeGreaterThan(0);
    expect(view.enemyHpPercent).toBe(25);
    expect(view.checkpointLevel).toBe(6);
    expect(dps.currentDps).toBe(11);
    expect(dps.previousDps).toBe(4);
    expect(dps.currentAutoDps).toBe(3);
    expect(dps.currentClickDps).toBe(2);
    expect(dps.currentSpellDps).toBe(5);
    expect(dps.currentPetDps).toBe(1);
    expect(dps.dpsDelta).toBe(7);
    expect(dps.dpsDeltaPercent).toBe(175);
    expect(dps.dpsGraphPoints.split(" ")).toHaveLength(12);
  });
});
