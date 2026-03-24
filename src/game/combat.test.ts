import { describe, expect, it, vi } from "vitest";
import {
  castCombatSpell,
  calculatePlayerHit,
  createEnemyInstance,
  createInitialCombatRuntime,
  getDamageAfterDefense,
  getCombatLevelConfig,
  getPlayerAttacksPerSecond,
  performClickAttack,
  resolveBossLootDrops,
  resolveOfflineCombatExpected,
  runCombatTick,
  useCombatConsumable,
} from "./combat";
import { getItemDefSafe } from "./items";
import { createDefaultState } from "./state";

describe("combat engine", () => {
  it("uses authored combat levels when present", () => {
    const levelOne = getCombatLevelConfig(1);
    expect(levelOne.enemyId).toBe("moss_mite");
    expect(levelOne.kind).toBe("normal");
  });

  it("generates fallback boss entries on every 5th level", () => {
    const levelThirty = getCombatLevelConfig(30);
    expect(levelThirty.kind).toBe("boss");
    expect(levelThirty.lootTableId).toBe("boss_tier_4");
  });

  it("converts agility to attacks per second and respects cap", () => {
    const state = createDefaultState();
    state.stats.agility = 500;

    expect(getPlayerAttacksPerSecond(state)).toBe(100);
  });

  it("calculates crit damage using rng", () => {
    const state = createDefaultState();
    state.stats.attack = 15;
    state.stats.critChance = 100;

    const hit = calculatePlayerHit(state, () => 0);
    expect(hit.isCrit).toBe(true);
    expect(hit.damage).toBe(58);
  });

  it("keeps high enemy damage threatening even with extreme defense", () => {
    const mitigated = getDamageAfterDefense(1000, 1_000_000);
    expect(mitigated).toBeGreaterThan(1);
  });

  it("advances level and awards rewards when enemy is defeated", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    const state = createDefaultState();
    const runtime = createInitialCombatRuntime(state);
    runtime.enemy.currentHp = 1;

    const result = runCombatTick(runtime, state, 2000, () => 0.5);

    expect(result.runtime.currentLevel).toBe(2);
    expect(result.state.resources.gold).toBeGreaterThan(state.resources.gold);
    expect(result.state.playerProgress.totalXpEarned).toBeGreaterThan(0);
    expect(result.events.some((event) => event.type === "enemyDefeated")).toBe(
      true,
    );
  });

  it("resets to the stored post-boss checkpoint when player is defeated", () => {
    const state = createDefaultState();
    const runtime = createInitialCombatRuntime(state);
    runtime.currentLevel = 11;
    runtime.lastBossCheckpointLevel = 11;
    runtime.playerCurrentHp = 1;
    runtime.enemy = createEnemyInstance(11);
    runtime.enemy.damage = 999;
    runtime.enemy.attacksPerSecond = 2;

    const result = runCombatTick(runtime, state, 1000, () => 0.5);

    expect(result.runtime.currentLevel).toBe(11);
    expect(result.runtime.playerCurrentHp).toBeGreaterThan(0);
    expect(result.events.some((event) => event.type === "playerDefeated")).toBe(
      true,
    );
  });

  it("stores the next level as checkpoint after killing a boss", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    const state = createDefaultState();
    const runtime = createInitialCombatRuntime(state);
    runtime.currentLevel = 5;
    runtime.enemy = createEnemyInstance(5);
    runtime.enemy.currentHp = 1;

    const result = runCombatTick(runtime, state, 2000, () => 0.5);

    expect(result.runtime.currentLevel).toBe(6);
    expect(result.runtime.lastBossCheckpointLevel).toBe(6);
  });

  it("applies immediate click attack", () => {
    const state = createDefaultState();
    const runtime = createInitialCombatRuntime(state);
    runtime.enemy.currentHp = 5;

    const result = performClickAttack(runtime, state, () => 0.99);

    expect(result.runtime.currentLevel).toBeGreaterThanOrEqual(1);
    expect(result.events.some((event) => event.type === "playerHit")).toBe(
      true,
    );
  });

  it("casts arcane bolt, spends mana, and starts spell cooldown", () => {
    const state = createDefaultState();
    state.playerProgress.unlockedSystems = {
      ...state.playerProgress.unlockedSystems,
      spells: true,
    };
    state.resources.energy = 100;
    state.stats.attack = 20;
    state.stats.intelligence = 10;
    const runtime = createInitialCombatRuntime(state);
    runtime.enemy.currentHp = 200;

    const result = castCombatSpell(runtime, state, "arcane_bolt", () => 0.5);

    expect(result.state.resources.energy).toBe(75);
    expect(result.runtime.spellCooldowns?.arcane_bolt).toBe(6000);
    expect(
      result.events.some(
        (event) => event.type === "playerHit" && event.attackSource === "spell",
      ),
    ).toBe(true);
    expect(result.runtime.enemy.currentHp).toBeLessThan(
      runtime.enemy.currentHp,
    );
  });

  it("prevents combat consumables from being used again while on cooldown", () => {
    const state = createDefaultState();
    state.inventory = [
      {
        uid: "health-1",
        itemId: "health_potion",
        quantity: 2,
        level: 1,
      },
    ];
    state.combat.playerCurrentHp = 20;
    const runtime = createInitialCombatRuntime(state);

    const firstUse = useCombatConsumable(runtime, state, "health-1");
    const secondUse = useCombatConsumable(
      firstUse.runtime,
      firstUse.state,
      "health-1",
    );

    expect(
      firstUse.events.some((event) => event.type === "consumableUsed"),
    ).toBe(true);
    expect(firstUse.runtime.consumableCooldowns?.health_potion).toBe(12000);
    expect(secondUse.events).toHaveLength(0);
    expect(secondUse.state.inventory[0]?.quantity).toBe(1);
  });

  it("resolves boss loot with guaranteed equipment and improved rewards", () => {
    const boss = createEnemyInstance(5);
    const drops = resolveBossLootDrops(boss, () => 0);

    expect(drops.length).toBeGreaterThan(2);
    expect(drops.some((drop) => drop.itemId === "health_potion")).toBe(true);
    expect(
      drops.some((drop) => {
        const itemDef = getItemDefSafe(drop.itemId);
        return (
          itemDef?.type === "weapon" ||
          itemDef?.type === "armor" ||
          itemDef?.type === "accessory"
        );
      }),
    ).toBe(true);
    expect(
      drops.some((drop) => {
        const itemDef = getItemDefSafe(drop.itemId);
        return (
          (itemDef?.type === "weapon" ||
            itemDef?.type === "armor" ||
            itemDef?.type === "accessory") &&
          (drop.itemLevel ?? 1) > 1
        );
      }),
    ).toBe(true);
  });

  it("adds boss equipment to inventory with bonus item levels", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    const state = createDefaultState();
    const runtime = createInitialCombatRuntime(state);
    runtime.currentLevel = 15;
    runtime.enemy = createEnemyInstance(15);
    runtime.enemy.currentHp = 1;

    const result = runCombatTick(runtime, state, 2000, () => 0);
    const leveledEquipment = result.state.inventory.find((item) => {
      const itemDef = getItemDefSafe(item.itemId);
      return (
        (itemDef?.type === "weapon" ||
          itemDef?.type === "armor" ||
          itemDef?.type === "accessory") &&
        item.level > 1
      );
    });

    expect(leveledEquipment).toBeDefined();
    expect(leveledEquipment?.level).toBeGreaterThanOrEqual(4);
  });

  it("emits loot events with item levels for boss equipment drops", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    const state = createDefaultState();
    const runtime = createInitialCombatRuntime(state);
    runtime.currentLevel = 10;
    runtime.enemy = createEnemyInstance(10);
    runtime.enemy.currentHp = 1;

    const result = runCombatTick(runtime, state, 2000, () => 0);
    const equipmentLootEvent = result.events.find((event) => {
      if (event.type !== "lootGranted") return false;
      const itemDef = getItemDefSafe(event.itemId ?? "");
      return (
        itemDef?.type === "weapon" ||
        itemDef?.type === "armor" ||
        itemDef?.type === "accessory"
      );
    });

    expect(equipmentLootEvent?.itemLevel).toBeGreaterThan(1);
  });

  it("resolves offline expected-value combat progression", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    const state = createDefaultState();
    state.stats.attack = 40;

    const runtime = createInitialCombatRuntime(state);
    const result = resolveOfflineCombatExpected(
      runtime,
      state,
      20_000,
      () => 0.2,
    );

    expect(result.levelsCleared).toBeGreaterThan(0);
    expect(result.state.playerProgress.totalXpEarned).toBeGreaterThan(0);
    expect(result.itemsGained).toBeGreaterThanOrEqual(0);
  });

  it("emits level-up and system unlock events from combat rewards", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    const state = createDefaultState();
    state.playerProgress.level = 7;
    state.playerProgress.xp = 3000;

    const runtime = createInitialCombatRuntime(state);
    runtime.currentLevel = 25;
    runtime.enemy = createEnemyInstance(25);
    runtime.enemy.currentHp = 1;

    const result = runCombatTick(runtime, state, 2000, () => 0.1);

    expect(result.events.some((event) => event.type === "levelUp")).toBe(true);
    expect(
      result.events.some(
        (event) =>
          event.type === "systemUnlocked" && event.systemId === "spells",
      ),
    ).toBe(true);
  });
});
