import { getActiveClassNodeRank } from "./classes";
import { getTotalStats } from "./engine";
import type { CombatSpellDefinition } from "./combatSpells";
import type { GameState } from "./types";
import type {
  CombatAttackSource,
  CombatEvent,
  CombatRng,
  CombatRuntimeState,
} from "./combat";

interface CombatSpellModifiers {
  spellDamageMultiplier: number;
  petDamageMultiplier: number;
  healMultiplier: number;
  manaRestoreMultiplier: number;
}

interface ExecuteCombatSpellEffectOptions {
  runtime: CombatRuntimeState;
  state: GameState;
  spell: CombatSpellDefinition;
  rng: CombatRng;
  combatModifiers: CombatSpellModifiers;
  applyEnemyReward: (
    runtime: CombatRuntimeState,
    state: GameState,
    rng: CombatRng,
  ) => { runtime: CombatRuntimeState; state: GameState; events: CombatEvent[] };
  getPlayerMaxHp: (state: GameState) => number;
}

export function executeCombatSpellEffect({
  runtime,
  state,
  spell,
  rng,
  combatModifiers,
  applyEnemyReward,
  getPlayerMaxHp,
}: ExecuteCombatSpellEffectOptions): {
  runtime: CombatRuntimeState;
  state: GameState;
  events: CombatEvent[];
} {
  const events: CombatEvent[] = [{ type: "spellCast", spellId: spell.id }];
  let nextState = state;
  let nextRuntime = runtime;

  const applySpellHit = (
    rawDamage: number,
    attackSource: CombatAttackSource = "spell",
  ): boolean => {
    const damageScale =
      attackSource === "pet"
        ? combatModifiers.petDamageMultiplier
        : combatModifiers.spellDamageMultiplier;
    const damage = Math.max(1, Math.round(rawDamage * damageScale));
    const nextEnemyHp = Math.max(0, nextRuntime.enemy.currentHp - damage);
    nextRuntime = {
      ...nextRuntime,
      enemy: {
        ...nextRuntime.enemy,
        currentHp: nextEnemyHp,
      },
    };
    events.push({
      type: "playerHit",
      value: damage,
      attackSource,
      spellId: spell.id,
    });

    if (nextEnemyHp <= 0) {
      const rewarded = applyEnemyReward(nextRuntime, nextState, rng);
      nextRuntime = rewarded.runtime;
      nextState = rewarded.state;
      events.push(...rewarded.events);
      return true;
    }

    return false;
  };

  const healPlayer = (rawHeal: number): void => {
    const maxHp = getPlayerMaxHp(nextState);
    const healAmount = Math.max(
      1,
      Math.round(rawHeal * combatModifiers.healMultiplier),
    );
    nextRuntime = {
      ...nextRuntime,
      playerCurrentHp: Math.min(
        maxHp,
        nextRuntime.playerCurrentHp + healAmount,
      ),
    };
    events[0].value = healAmount;
  };

  const restoreMana = (rawMana: number): number => {
    const manaRestore = Math.max(
      1,
      Math.round(rawMana * combatModifiers.manaRestoreMultiplier),
    );
    nextState = {
      ...nextState,
      resources: {
        ...nextState.resources,
        energy: Math.min(100, (nextState.resources.energy ?? 0) + manaRestore),
      },
    };
    return manaRestore;
  };

  const sorceressAegisRank = getActiveClassNodeRank(nextState, "sorceress_4");
  if (sorceressAegisRank > 0) {
    const shieldHeal = Math.max(2, sorceressAegisRank * 3);
    healPlayer(shieldHeal);
  }

  const sorceressRunicRecoveryRank = getActiveClassNodeRank(
    nextState,
    "sorceress_8",
  );
  if (sorceressRunicRecoveryRank > 0) {
    restoreMana(sorceressRunicRecoveryRank * 1.5);
  }

  if (spell.id === "arcane_bolt") {
    const totalStats = getTotalStats(nextState);
    const baseDamage =
      (totalStats.attack ?? 1) * 1.2 + (totalStats.intelligence ?? 0) * 2.4;
    applySpellHit(baseDamage);
  } else if (spell.id === "second_wind") {
    const totalStats = getTotalStats(nextState);
    const maxHp = getPlayerMaxHp(nextState);
    healPlayer(
      Math.max(12, maxHp * 0.3 + (totalStats.intelligence ?? 0) * 1.5),
    );
  } else if (spell.id === "mana_surge") {
    events[0].value = restoreMana(42);
  } else if (spell.id === "ember_lance") {
    const totalStats = getTotalStats(nextState);
    const baseDamage =
      (totalStats.attack ?? 1) * 0.7 + (totalStats.intelligence ?? 0) * 4.2;
    applySpellHit(baseDamage);
  } else if (spell.id === "berserker_warcry") {
    const totalStats = getTotalStats(nextState);
    const roarRank = getActiveClassNodeRank(nextState, "berserker_7");
    const baseDamage = (totalStats.attack ?? 1) * (3.2 + roarRank * 0.18);
    applySpellHit(baseDamage);
  } else if (spell.id === "berserker_execution") {
    const totalStats = getTotalStats(nextState);
    const missingHpRatio =
      1 - nextRuntime.enemy.currentHp / Math.max(1, nextRuntime.enemy.maxHp);
    const rankBonus =
      getActiveClassNodeRank(nextState, "berserker_10") * 0.12 +
      getActiveClassNodeRank(nextState, "berserker_9") * 0.04;
    const executionDamage =
      (totalStats.attack ?? 1) * (2.4 + missingHpRatio * 2.8 + rankBonus);
    applySpellHit(executionDamage);
  } else if (spell.id === "farmer_regrowth") {
    const maxHp = getPlayerMaxHp(nextState);
    healPlayer(Math.max(20, maxHp * 0.35));
  } else if (spell.id === "farmer_harvest_guard") {
    const totalStats = getTotalStats(nextState);
    const maxHp = getPlayerMaxHp(nextState);
    const sustainRank = getActiveClassNodeRank(nextState, "farmer_1");
    const healAmount =
      maxHp * (0.22 + sustainRank * 0.02) + (totalStats.defense ?? 0) * 0.8;
    healPlayer(healAmount);
    const manaRestore = restoreMana(8 + (totalStats.intelligence ?? 0) * 0.2);
    events.push({
      type: "spellCast",
      spellId: spell.id,
      value: manaRestore,
    });
  } else if (spell.id === "archer_hailfire") {
    const totalStats = getTotalStats(nextState);
    const rhythmRank = getActiveClassNodeRank(nextState, "archer_7");
    const baseDamage =
      (totalStats.attack ?? 1) * (1.6 + rhythmRank * 0.05) +
      (totalStats.agility ?? 0) * 12;
    applySpellHit(baseDamage);
  } else if (spell.id === "archer_pinpoint") {
    const totalStats = getTotalStats(nextState);
    const stormQuiverRank = getActiveClassNodeRank(nextState, "archer_10");
    const volleyCount =
      3 +
      getActiveClassNodeRank(nextState, "archer_2") +
      Math.floor(stormQuiverRank / 2);
    const perVolleyDamage =
      (totalStats.attack ?? 1) * 0.5 + (totalStats.agility ?? 0) * 2.2;

    for (let index = 0; index < volleyCount; index += 1) {
      if (applySpellHit(perVolleyDamage)) {
        break;
      }
    }
  } else if (spell.id === "sorceress_nova") {
    const totalStats = getTotalStats(nextState);
    const overchargeRank = getActiveClassNodeRank(nextState, "sorceress_5");
    const baseDamage =
      (totalStats.attack ?? 1) * (1.1 + overchargeRank * 0.03) +
      (totalStats.intelligence ?? 0) * 5.1;
    applySpellHit(baseDamage);
  } else if (spell.id === "sorceress_hexfire") {
    const totalStats = getTotalStats(nextState);
    const ignitionRank = getActiveClassNodeRank(nextState, "sorceress_3");
    const detonationRank = getActiveClassNodeRank(nextState, "sorceress_10");
    const tickCount = 3 + Math.floor(ignitionRank / 2) + detonationRank;
    const tickDamage =
      (totalStats.attack ?? 1) * 0.35 +
      (totalStats.intelligence ?? 0) * (1.8 + ignitionRank * 0.12);

    for (let index = 0; index < tickCount; index += 1) {
      if (applySpellHit(tickDamage)) {
        break;
      }
    }
  } else if (spell.id === "idler_dividend") {
    const totalStats = getTotalStats(nextState);
    const now = Date.now();
    const idleMs = Math.max(0, now - (nextState.meta.lastUpdate ?? now));
    const idleSeconds = Math.min(8 * 60 * 60, Math.floor(idleMs / 1000));
    const streakRank = getActiveClassNodeRank(nextState, "idler_7");
    const returnMomentumRank = getActiveClassNodeRank(nextState, "idler_9");
    const convertedDamage =
      (totalStats.attack ?? 1) * 0.8 +
      idleSeconds * (0.02 + streakRank * 0.004 + returnMomentumRank * 0.0025);
    applySpellHit(convertedDamage);
  } else if (spell.id === "idler_timebank") {
    const momentumRank = getActiveClassNodeRank(nextState, "idler_9");
    const reserveRank = getActiveClassNodeRank(nextState, "idler_10");
    const manaRestore = restoreMana(24 + momentumRank * 4);
    events[0].value = manaRestore;

    const cooldownReductionMs = 6000 + momentumRank * 500 + reserveRank * 450;
    const reducedCooldowns: Record<string, number> = {};
    for (const [key, remaining] of Object.entries(
      nextRuntime.spellCooldowns ?? {},
    )) {
      const reduced = Math.max(0, remaining - cooldownReductionMs);
      if (reduced > 0) {
        reducedCooldowns[key] = reduced;
      }
    }
    nextRuntime = {
      ...nextRuntime,
      spellCooldowns: reducedCooldowns,
    };
  } else if (spell.id === "tamer_pack_howl") {
    const totalStats = getTotalStats(nextState);
    const frenzyRank = getActiveClassNodeRank(nextState, "tamer_10");
    const petBurstDamage =
      (totalStats.attack ?? 1) * 1.3 +
      (totalStats.petStrength ?? 0) * (20 + frenzyRank * 1.5);
    applySpellHit(petBurstDamage, "pet");
  } else if (spell.id === "tamer_beast_sync") {
    const totalStats = getTotalStats(nextState);
    const bondRank = getActiveClassNodeRank(nextState, "tamer_1");
    const alphaRank = getActiveClassNodeRank(nextState, "tamer_9");
    const petHit =
      (totalStats.attack ?? 1) * 0.95 +
      (totalStats.petStrength ?? 0) * (14 + bondRank * 2 + alphaRank * 0.8);
    const playerFollowup =
      (totalStats.attack ?? 1) * 1.05 + (totalStats.agility ?? 0) * 3.4;

    const defeatedOnFirst = applySpellHit(petHit, "pet");
    if (!defeatedOnFirst) {
      applySpellHit(playerFollowup, "spell");
    }
  } else if (spell.source === "class") {
    const totalStats = getTotalStats(nextState);
    const fallbackDamage =
      (totalStats.attack ?? 1) * 1.8 + (totalStats.intelligence ?? 0) * 1.6;
    applySpellHit(fallbackDamage);
  }

  return {
    runtime: nextRuntime,
    state: nextState,
    events,
  };
}
