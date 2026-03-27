import { describe, expect, it } from "vitest";
import { allClassDefinitions, CLASS_TREE_NODE_TARGET } from "./classes";
import { castCombatSpell, createInitialCombatRuntime } from "./combat";
import {
  getClassCombatSpellsForClass,
  getCombatSpellDefinition,
} from "./combatSpells";
import { createDefaultState } from "./state";

describe("class spell content", () => {
  it("gives every class at least 22 nodes and 10 unique class spells", () => {
    for (const classDef of allClassDefinitions) {
      expect(classDef.nodes.length).toBeGreaterThanOrEqual(
        CLASS_TREE_NODE_TARGET,
      );
      expect(classDef.classSpells).toHaveLength(10);
      expect(new Set(classDef.classSpells.map((spell) => spell.id)).size).toBe(
        10,
      );
    }
  });

  it("registers all authored class spells in the combat spell registry", () => {
    for (const classDef of allClassDefinitions) {
      const classSpells = getClassCombatSpellsForClass(classDef.id);
      expect(classSpells).toHaveLength(10);
      for (const spell of classSpells) {
        expect(getCombatSpellDefinition(spell.id)?.classId).toBe(classDef.id);
      }
    }
  });

  it("makes late sorceress spells hit much harder than early ones", () => {
    const buildState = () => {
      const state = createDefaultState();
      state.playerProgress.level = 60;
      state.playerProgress.unlockedSystems = {
        ...state.playerProgress.unlockedSystems,
        spells: true,
      };
      state.character.activeClassId = "sorceress";
      state.resources.energy = 100;
      state.stats.attack = 40;
      state.stats.intelligence = 80;
      return state;
    };

    const earlyState = buildState();
    const earlyRuntime = createInitialCombatRuntime(earlyState);
    earlyRuntime.enemy.currentHp = 50_000;
    const earlyResult = castCombatSpell(
      earlyRuntime,
      earlyState,
      "sorceress_nova",
      () => 0.5,
    );

    const lateState = buildState();
    const lateRuntime = createInitialCombatRuntime(lateState);
    lateRuntime.enemy.currentHp = 50_000;
    const lateResult = castCombatSpell(
      lateRuntime,
      lateState,
      "sorceress_eclipse_verdict",
      () => 0.5,
    );

    const earlyDamage = earlyResult.events
      .filter((event) => event.type === "playerHit")
      .reduce((sum, event) => sum + (event.value ?? 0), 0);
    const lateDamage = lateResult.events
      .filter((event) => event.type === "playerHit")
      .reduce((sum, event) => sum + (event.value ?? 0), 0);

    expect(lateDamage).toBeGreaterThan(earlyDamage * 1.8);
    expect(
      lateResult.runtime.spellCooldowns?.sorceress_eclipse_verdict,
    ).toBeGreaterThan(earlyResult.runtime.spellCooldowns?.sorceress_nova ?? 0);
  });

  it("gives representative late spells bespoke behavior profiles", () => {
    const buildState = () => {
      const state = createDefaultState();
      state.playerProgress.level = 60;
      state.playerProgress.unlockedSystems = {
        ...state.playerProgress.unlockedSystems,
        spells: true,
      };
      state.resources.energy = 100;
      state.stats.attack = 55;
      state.stats.intelligence = 70;
      state.stats.agility = 45;
      state.stats.defense = 38;
      state.stats.hp = 220;
      state.stats.petStrength = 40;
      state.meta.lastUpdate = Date.now() - 3 * 60 * 60 * 1000;
      return state;
    };

    const archerState = buildState();
    archerState.character.activeClassId = "archer";
    const archerRuntime = createInitialCombatRuntime(archerState);
    archerRuntime.enemy.currentHp = 80_000;
    const archerResult = castCombatSpell(
      archerRuntime,
      archerState,
      "archer_zenith_barrage",
      () => 0.5,
    );
    expect(
      archerResult.events.filter((event) => event.type === "playerHit"),
    ).toHaveLength(8);

    const farmerState = buildState();
    farmerState.character.activeClassId = "farmer";
    farmerState.combat.playerCurrentHp = 40;
    const farmerRuntime = createInitialCombatRuntime(farmerState);
    farmerRuntime.playerCurrentHp = 40;
    farmerRuntime.enemy.currentHp = 80_000;
    const farmerResult = castCombatSpell(
      farmerRuntime,
      farmerState,
      "farmer_verdant_end",
      () => 0.5,
    );
    expect(farmerResult.runtime.playerCurrentHp).toBeGreaterThan(40);
    expect(
      farmerResult.events.some((event) => event.type === "playerHit"),
    ).toBe(true);

    const idlerState = buildState();
    idlerState.character.activeClassId = "idler";
    const idlerRuntime = createInitialCombatRuntime(idlerState);
    idlerRuntime.enemy.currentHp = 80_000;
    idlerRuntime.spellCooldowns = {
      arcane_bolt: 9000,
      ember_lance: 4000,
    };
    const idlerResult = castCombatSpell(
      idlerRuntime,
      idlerState,
      "idler_epoch_cashout",
      () => 0.5,
    );
    expect(idlerResult.state.resources.energy).toBeGreaterThan(100 - 82);
    expect(idlerResult.runtime.spellCooldowns?.arcane_bolt ?? 0).toBeLessThan(
      9000,
    );

    const sorceressState = buildState();
    sorceressState.character.activeClassId = "sorceress";
    const sorceressRuntime = createInitialCombatRuntime(sorceressState);
    sorceressRuntime.enemy.currentHp = 80_000;
    const sorceressResult = castCombatSpell(
      sorceressRuntime,
      sorceressState,
      "sorceress_supernova_sigil",
      () => 0.5,
    );
    expect(
      sorceressResult.events.filter((event) => event.type === "playerHit"),
    ).toHaveLength(2);

    const tamerState = buildState();
    tamerState.character.activeClassId = "tamer";
    const tamerRuntime = createInitialCombatRuntime(tamerState);
    tamerRuntime.enemy.currentHp = 80_000;
    const tamerResult = castCombatSpell(
      tamerRuntime,
      tamerState,
      "tamer_wild_hunt",
      () => 0.5,
    );
    expect(
      tamerResult.events.some(
        (event) => event.type === "playerHit" && event.attackSource === "pet",
      ),
    ).toBe(true);
    expect(
      tamerResult.events.some(
        (event) => event.type === "playerHit" && event.attackSource === "spell",
      ),
    ).toBe(true);
  });
});
