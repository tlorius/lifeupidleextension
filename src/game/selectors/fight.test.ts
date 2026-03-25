import { describe, expect, it } from "vitest";
import { createDefaultState } from "../state";
import {
  selectFightCombatLog,
  selectFightConsumableModal,
  selectFightConsumablesPanel,
  selectFightDpsPanel,
  selectFightDpsMetrics,
  selectFightEncounterSummary,
  selectFightSpellPanel,
  selectFightView,
} from "./fight";

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

    const panel = selectFightDpsPanel(dps, 30_000, true, true);
    expect(panel.windowSeconds).toBe(30);
    expect(panel.toggleLabel).toBe("Hide Graph");
    expect(panel.deltaTone).toBe("positive");
    expect(panel.sourceStats.map((entry) => entry.label)).toEqual([
      "Auto DPS",
      "Click DPS",
      "Spell DPS",
      "Pet DPS",
    ]);
    expect(
      panel.windowOptions.find((entry) => entry.windowMs === 30_000)
        ?.isSelected,
    ).toBe(true);
    expect(panel.emptyMessage).toBeNull();
  });

  it("builds spell panel actions with cooldown and mana gating", () => {
    const state = createDefaultState();
    state.playerProgress.level = 20;
    state.playerProgress.unlockedSystems = {
      ...state.playerProgress.unlockedSystems,
      spells: true,
    };
    state.character.activeClassId = "sorceress";
    state.character.classProgress.sorceress.selectedSpellIds = [
      "arcane_bolt",
      "second_wind",
      null,
      null,
      null,
      null,
      null,
      null,
    ];
    state.resources.energy = 8;
    state.combat.spellCooldowns = {
      arcane_bolt: 1500,
    };

    const view = selectFightView(state);
    const panel = selectFightSpellPanel(state, view.slottedSpells);

    expect(panel.isVisible).toBe(true);
    expect(panel.classLabel).toBe("(Class: sorceress)");
    expect(panel.showManageButton).toBe(true);
    expect(panel.unlockedSpellSlots).toBe(5);
    expect(panel.spellActions).toHaveLength(2);
    expect(panel.spellActions[0]?.id).toBe("arcane_bolt");
    expect(panel.spellActions[0]?.canCast).toBe(false);
    expect(panel.spellActions[0]?.cooldownLabel).toBe("Cooldown 2s");
    expect(panel.spellActions[1]?.id).toBe("second_wind");
    expect(panel.spellActions[1]?.canCast).toBe(false);
    expect(panel.spellActions[1]?.cooldownLabel).toBe("Ready");
    expect(panel.spellPath.length).toBeGreaterThan(0);
  });

  it("builds consumable slot and modal view models", () => {
    const state = createDefaultState();
    state.inventory = [
      { uid: "hp-1", itemId: "health_potion", quantity: 2, level: 1 },
      { uid: "mp-1", itemId: "mana_potion", quantity: 1, level: 1 },
    ];
    state.combat.consumableCooldowns = {
      mana_potion: 2200,
    };

    const panel = selectFightConsumablesPanel(state, ["health_potion", null]);
    const modal = selectFightConsumableModal(
      state,
      ["health_potion", "mana_potion"],
      1,
    );

    expect(panel.slots).toHaveLength(2);
    expect(panel.slots[0]?.itemUid).toBe("hp-1");
    expect(panel.slots[0]?.quantityLabel).toBe("x2");
    expect(panel.slots[0]?.cooldownLabel).toBeNull();
    expect(panel.slots[1]?.isEmpty).toBe(true);
    expect(panel.slots[1]?.title).toBe("Select potion for slot 2");

    expect(modal.selectedSlot).toBe(1);
    expect(modal.slotTabs[1]?.isSelected).toBe(true);
    expect(modal.options).toHaveLength(2);
    expect(
      modal.options.find((option) => option.itemId === "health_potion")
        ?.alreadyEquippedInOtherSlot,
    ).toBe(true);
    expect(
      modal.options.find((option) => option.itemId === "mana_potion")
        ?.alreadyEquippedInOtherSlot,
    ).toBe(false);
  });

  it("builds encounter summary and combat log view models", () => {
    const state = createDefaultState();
    state.combat.currentLevel = 7;
    state.combat.highestLevelReached = 11;
    state.combat.enemy.goldReward = 14;
    state.combat.enemy.gemsReward = 2;
    state.combat.enemy.xpReward = 9;

    const summary = selectFightEncounterSummary(state);
    const log = selectFightCombatLog([
      { id: "a", text: "Loot dropped", color: "#fff" },
    ]);
    const emptyLog = selectFightCombatLog([]);

    expect(summary.levelLabel).toContain("Level 7");
    expect(summary.levelLabel).toContain("Highest 11");
    expect(summary.levelLabel).toContain("Next boss Lv 10");
    expect(summary.rewardsLabel).toBe(
      "Enemy rewards: +14 Gold, +2 Gems, +9 XP",
    );
    expect(log.isEmpty).toBe(false);
    expect(log.entries).toHaveLength(1);
    expect(emptyLog.isEmpty).toBe(true);
    expect(emptyLog.emptyMessage).toBe(
      "Defeat enemies to generate loot and progression events.",
    );
  });

  it("handles hidden spell panel and empty consumable modal states", () => {
    const state = createDefaultState();
    state.playerProgress.level = 5;
    state.playerProgress.unlockedSystems = {
      ...state.playerProgress.unlockedSystems,
      spells: false,
    };

    const spellPanel = selectFightSpellPanel(state, []);
    const consumableModal = selectFightConsumableModal(state, [null, null], 0);

    expect(spellPanel.isVisible).toBe(false);
    expect(spellPanel.showManageButton).toBe(false);
    expect(spellPanel.emptyMessage).toBe(
      "Spell slots unlock at level 10. Continue leveling to equip spells.",
    );
    expect(consumableModal.options).toHaveLength(0);
    expect(consumableModal.isEmpty).toBe(true);
  });

  it("builds negative delta dps panel when previous window is higher", () => {
    const metrics = selectFightDpsMetrics(
      [
        { timestamp: 1_000, damage: 300, source: "auto" },
        { timestamp: 12_000, damage: 30, source: "auto" },
      ],
      20_000,
      10_000,
    );
    const panel = selectFightDpsPanel(metrics, 10_000, false, false);

    expect(metrics.previousDps).toBeGreaterThan(metrics.currentDps);
    expect(panel.deltaTone).toBe("negative");
    expect(panel.toggleLabel).toBe("Show Graph");
    expect(panel.emptyMessage).toBe(
      "No damage recorded yet. Start attacking to populate the meter.",
    );
  });
});
