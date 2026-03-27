import { getActiveClassNodeRank } from "./classes";
import { getTotalStats } from "./engine";
import { getActiveSpellSetDamageMultiplier } from "./itemSets";
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
  spellCastDamageMultiplier: number;
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
  const setSpellMultiplier = getActiveSpellSetDamageMultiplier(state, spell.id);

  const applySpellHit = (
    rawDamage: number,
    attackSource: CombatAttackSource = "spell",
  ): boolean => {
    const damageScale =
      attackSource === "pet"
        ? combatModifiers.petDamageMultiplier
        : combatModifiers.spellDamageMultiplier * setSpellMultiplier;
    const damage = Math.max(
      1,
      Math.round(
        rawDamage * damageScale * combatModifiers.spellCastDamageMultiplier,
      ),
    );
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

  const applyRepeatingHits = (
    hitCount: number,
    damageAtIndex: (index: number) => number,
    attackSource: CombatAttackSource = "spell",
  ): boolean => {
    for (let index = 0; index < hitCount; index += 1) {
      if (applySpellHit(damageAtIndex(index), attackSource)) {
        return true;
      }
    }
    return false;
  };

  const getIdleSeconds = (capHours = 12): number => {
    const now = Date.now();
    const idleMs = Math.max(0, now - (nextState.meta.lastUpdate ?? now));
    return Math.min(capHours * 60 * 60, Math.floor(idleMs / 1000));
  };

  const reduceSpellCooldowns = (reductionMs: number): void => {
    const reducedCooldowns: Record<string, number> = {};
    for (const [key, remaining] of Object.entries(
      nextRuntime.spellCooldowns ?? {},
    )) {
      const reduced = Math.max(0, remaining - reductionMs);
      if (reduced > 0) {
        reducedCooldowns[key] = reduced;
      }
    }
    nextRuntime = {
      ...nextRuntime,
      spellCooldowns: reducedCooldowns,
    };
  };

  const getRemainingCooldownTotal = (): number => {
    return Object.values(nextRuntime.spellCooldowns ?? {}).reduce(
      (sum, remaining) => sum + remaining,
      0,
    );
  };

  const applyGenericFallbackClassSpell = (): void => {
    const totalStats = getTotalStats(nextState);
    const tier = Math.max(1, Math.floor((spell.requiredLevel - 10) / 4) + 1);
    const genericDamage =
      (totalStats.attack ?? 1) * (3 + tier * 0.35) +
      (totalStats.intelligence ?? 0) * (2.4 + tier * 0.28);
    applySpellHit(genericDamage);
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
      (totalStats.attack ?? 1) * 2 + (totalStats.intelligence ?? 0) * 5;
    applySpellHit(baseDamage);
  } else if (spell.id === "second_wind") {
    const totalStats = getTotalStats(nextState);
    const maxHp = getPlayerMaxHp(nextState);
    healPlayer(
      Math.max(18, maxHp * 0.42 + (totalStats.intelligence ?? 0) * 2.2),
    );
  } else if (spell.id === "mana_surge") {
    events[0].value = restoreMana(60);
  } else if (spell.id === "ember_lance") {
    const totalStats = getTotalStats(nextState);
    const baseDamage =
      (totalStats.attack ?? 1) * 1.6 + (totalStats.intelligence ?? 0) * 7;
    applySpellHit(baseDamage);
  } else if (spell.id === "berserker_warcry") {
    const totalStats = getTotalStats(nextState);
    const roarRank = getActiveClassNodeRank(nextState, "berserker_7");
    const baseDamage =
      (totalStats.attack ?? 1) * (6.2 + roarRank * 0.35) +
      (totalStats.hp ?? 0) * 0.04;
    applySpellHit(baseDamage);
  } else if (spell.id === "berserker_execution") {
    const totalStats = getTotalStats(nextState);
    const missingHpRatio =
      1 - nextRuntime.enemy.currentHp / Math.max(1, nextRuntime.enemy.maxHp);
    const rankBonus =
      getActiveClassNodeRank(nextState, "berserker_10") * 0.12 +
      getActiveClassNodeRank(nextState, "berserker_9") * 0.04;
    const executionDamage =
      (totalStats.attack ?? 1) * (5 + missingHpRatio * 6.2 + rankBonus * 1.8);
    applySpellHit(executionDamage);
  } else if (spell.id === "berserker_ruin_crash") {
    const totalStats = getTotalStats(nextState);
    const enemyHpRatio =
      nextRuntime.enemy.currentHp / Math.max(1, nextRuntime.enemy.maxHp);
    const baseDamage =
      (totalStats.attack ?? 1) * (5.1 + enemyHpRatio * 1.9) +
      (totalStats.hp ?? 0) * 0.04;
    applySpellHit(baseDamage);
  } else if (spell.id === "berserker_blood_comet") {
    const totalStats = getTotalStats(nextState);
    const baseDamage =
      (totalStats.attack ?? 1) * 5.7 +
      (totalStats.agility ?? 0) * 3.8 +
      (totalStats.hp ?? 0) * 0.025;
    applySpellHit(baseDamage);
    healPlayer(baseDamage * 0.1);
  } else if (spell.id === "berserker_chain_rend") {
    const totalStats = getTotalStats(nextState);
    const missingHpRatio =
      1 - nextRuntime.enemy.currentHp / Math.max(1, nextRuntime.enemy.maxHp);
    applyRepeatingHits(4, (index) => {
      return (
        (totalStats.attack ?? 1) *
          (1.4 + index * 0.35 + missingHpRatio * 0.65) +
        (totalStats.agility ?? 0) * 1.4
      );
    });
  } else if (spell.id === "berserker_slaughter_drive") {
    const totalStats = getTotalStats(nextState);
    const baseDamage =
      (totalStats.attack ?? 1) * 7 +
      (totalStats.critChance ?? 0) * 1.4 +
      (totalStats.hp ?? 0) * 0.02;
    applySpellHit(baseDamage);
  } else if (spell.id === "berserker_iron_meteor") {
    const totalStats = getTotalStats(nextState);
    const enemyHpRatio =
      nextRuntime.enemy.currentHp / Math.max(1, nextRuntime.enemy.maxHp);
    const baseDamage =
      (totalStats.attack ?? 1) * (7.2 + enemyHpRatio * 1.6) +
      (totalStats.hp ?? 0) * 0.06;
    applySpellHit(baseDamage);
  } else if (spell.id === "berserker_skull_banner") {
    const totalStats = getTotalStats(nextState);
    applySpellHit(
      (totalStats.attack ?? 1) * 2.8 + (totalStats.critChance ?? 0) * 2.2,
    );
    applyRepeatingHits(2, (index) => {
      return (
        (totalStats.attack ?? 1) * (2.6 + index * 0.7) +
        (totalStats.agility ?? 0) * 1.1
      );
    });
  } else if (spell.id === "berserker_cataclysm_chop") {
    const totalStats = getTotalStats(nextState);
    applyRepeatingHits(2, (index) => {
      return (
        (totalStats.attack ?? 1) * (4.8 + index * 2.3) +
        (totalStats.hp ?? 0) * 0.04
      );
    });
  } else if (spell.id === "berserker_doom_feast") {
    const totalStats = getTotalStats(nextState);
    const missingHpRatio =
      1 - nextRuntime.enemy.currentHp / Math.max(1, nextRuntime.enemy.maxHp);
    const openingDamage =
      (totalStats.attack ?? 1) * (7.2 + missingHpRatio * 2.8) +
      (totalStats.hp ?? 0) * 0.08;
    const defeated = applySpellHit(openingDamage);
    healPlayer(openingDamage * 0.12);
    if (!defeated && missingHpRatio > 0.35) {
      applySpellHit(
        (totalStats.attack ?? 1) * 4.8 + (totalStats.hp ?? 0) * 0.05,
      );
    }
  } else if (spell.id === "farmer_regrowth") {
    const maxHp = getPlayerMaxHp(nextState);
    const totalStats = getTotalStats(nextState);
    healPlayer(Math.max(28, maxHp * 0.46 + (totalStats.defense ?? 0) * 0.8));
  } else if (spell.id === "farmer_harvest_guard") {
    const totalStats = getTotalStats(nextState);
    const maxHp = getPlayerMaxHp(nextState);
    const sustainRank = getActiveClassNodeRank(nextState, "farmer_1");
    const healAmount =
      maxHp * (0.28 + sustainRank * 0.025) + (totalStats.defense ?? 0) * 1.4;
    healPlayer(healAmount);
    const manaRestore = restoreMana(12 + (totalStats.intelligence ?? 0) * 0.35);
    events.push({
      type: "spellCast",
      spellId: spell.id,
      value: manaRestore,
    });
    applySpellHit(
      (totalStats.attack ?? 1) * 1.8 + (totalStats.defense ?? 0) * 3.5,
    );
  } else if (spell.id === "farmer_briar_cannon") {
    const totalStats = getTotalStats(nextState);
    const baseDamage =
      (totalStats.attack ?? 1) * 3.4 + (totalStats.defense ?? 0) * 3.2;
    applySpellHit(baseDamage);
  } else if (spell.id === "farmer_silo_breaker") {
    const totalStats = getTotalStats(nextState);
    const baseDamage =
      (totalStats.attack ?? 1) * 4 + (totalStats.defense ?? 0) * 3.6;
    applySpellHit(baseDamage);
    healPlayer(baseDamage * 0.08);
  } else if (spell.id === "farmer_thornwake") {
    const totalStats = getTotalStats(nextState);
    applyRepeatingHits(4, (index) => {
      return (
        (totalStats.attack ?? 1) * (1.15 + index * 0.18) +
        (totalStats.defense ?? 0) * 1.7
      );
    });
  } else if (spell.id === "farmer_orchard_stampede") {
    const totalStats = getTotalStats(nextState);
    applyRepeatingHits(3, (index) => {
      return (
        (totalStats.attack ?? 1) * (2 + index * 0.55) +
        (totalStats.defense ?? 0) * 2.4
      );
    });
    healPlayer(
      getPlayerMaxHp(nextState) * 0.06 + (totalStats.defense ?? 0) * 0.6,
    );
  } else if (spell.id === "farmer_solstice_reap") {
    const totalStats = getTotalStats(nextState);
    const damage =
      (totalStats.attack ?? 1) * 5.4 + (totalStats.defense ?? 0) * 4.1;
    applySpellHit(damage);
    healPlayer(damage * 0.12);
    events.push({
      type: "spellCast",
      spellId: spell.id,
      value: restoreMana(16 + (totalStats.intelligence ?? 0) * 0.2),
    });
  } else if (spell.id === "farmer_ironroot_burst") {
    const totalStats = getTotalStats(nextState);
    applyRepeatingHits(2, (index) => {
      return (
        (totalStats.attack ?? 1) * (2.7 + index * 1.45) +
        (totalStats.defense ?? 0) * (2.2 + index * 0.5)
      );
    });
  } else if (spell.id === "farmer_seasons_wrath") {
    const totalStats = getTotalStats(nextState);
    const seasonalMultipliers = [2.4, 2.8, 3.2, 4.4];
    applyRepeatingHits(4, (index) => {
      return (
        (totalStats.attack ?? 1) * seasonalMultipliers[index] +
        (totalStats.defense ?? 0) * (1.8 + index * 0.6)
      );
    });
  } else if (spell.id === "farmer_verdant_end") {
    const totalStats = getTotalStats(nextState);
    const firstDamage =
      (totalStats.attack ?? 1) * 6 + (totalStats.defense ?? 0) * 4.8;
    const defeated = applySpellHit(firstDamage);
    healPlayer(firstDamage * 0.16);
    if (
      !defeated &&
      nextRuntime.enemy.currentHp / Math.max(1, nextRuntime.enemy.maxHp) < 0.5
    ) {
      applySpellHit(
        (totalStats.attack ?? 1) * 4.2 + (totalStats.defense ?? 0) * 3.6,
      );
    }
  } else if (spell.id === "archer_hailfire") {
    const totalStats = getTotalStats(nextState);
    const rhythmRank = getActiveClassNodeRank(nextState, "archer_7");
    const baseDamage =
      (totalStats.attack ?? 1) * (2.8 + rhythmRank * 0.09) +
      (totalStats.agility ?? 0) * 20;
    applySpellHit(baseDamage);
  } else if (spell.id === "archer_pinpoint") {
    const totalStats = getTotalStats(nextState);
    const stormQuiverRank = getActiveClassNodeRank(nextState, "archer_10");
    const volleyCount =
      4 +
      getActiveClassNodeRank(nextState, "archer_2") +
      Math.floor(stormQuiverRank / 2);
    const perVolleyDamage =
      (totalStats.attack ?? 1) * 0.85 + (totalStats.agility ?? 0) * 4.2;

    for (let index = 0; index < volleyCount; index += 1) {
      if (applySpellHit(perVolleyDamage)) {
        break;
      }
    }
  } else if (spell.id === "archer_ricochet_gale") {
    const totalStats = getTotalStats(nextState);
    applyRepeatingHits(4, (index) => {
      return (
        (totalStats.attack ?? 1) * (1.2 + index * 0.28) +
        (totalStats.agility ?? 0) * (3.8 + index * 0.55)
      );
    });
  } else if (spell.id === "archer_deadeye_brand") {
    const totalStats = getTotalStats(nextState);
    const baseDamage =
      (totalStats.attack ?? 1) * 6.4 +
      (totalStats.agility ?? 0) * 6.2 +
      (totalStats.critChance ?? 0) * 1.6;
    applySpellHit(baseDamage);
  } else if (spell.id === "archer_featherstorm") {
    const totalStats = getTotalStats(nextState);
    applyRepeatingHits(6, (index) => {
      return (
        (totalStats.attack ?? 1) * (0.9 + index * 0.12) +
        (totalStats.agility ?? 0) * (2.8 + index * 0.18)
      );
    });
  } else if (spell.id === "archer_splitshot_drive") {
    const totalStats = getTotalStats(nextState);
    applyRepeatingHits(3, (index) => {
      return (
        (totalStats.attack ?? 1) * (2.2 + index * 0.8) +
        (totalStats.agility ?? 0) * (4.2 + index * 0.5)
      );
    });
  } else if (spell.id === "archer_horizon_break") {
    const totalStats = getTotalStats(nextState);
    const enemyHpRatio =
      nextRuntime.enemy.currentHp / Math.max(1, nextRuntime.enemy.maxHp);
    applySpellHit(
      (totalStats.attack ?? 1) * (5.8 + enemyHpRatio * 1.7) +
        (totalStats.agility ?? 0) * 5.2,
    );
    applySpellHit(
      (totalStats.attack ?? 1) * 2 + (totalStats.agility ?? 0) * 3.5,
    );
  } else if (spell.id === "archer_siege_volley") {
    const totalStats = getTotalStats(nextState);
    applyRepeatingHits(5, (index) => {
      return (
        (totalStats.attack ?? 1) * (1.7 + index * 0.34) +
        (totalStats.agility ?? 0) * (3.8 + index * 0.4)
      );
    });
  } else if (spell.id === "archer_falconfall") {
    const totalStats = getTotalStats(nextState);
    applyRepeatingHits(4, (index) => {
      return (
        (totalStats.attack ?? 1) * (1.5 + index * 0.38) +
        (totalStats.agility ?? 0) * (4.6 + index * 0.75)
      );
    });
  } else if (spell.id === "archer_zenith_barrage") {
    const totalStats = getTotalStats(nextState);
    applyRepeatingHits(8, (index) => {
      return (
        (totalStats.attack ?? 1) * (0.95 + index * 0.14) +
        (totalStats.agility ?? 0) * (3.2 + index * 0.26)
      );
    });
  } else if (spell.id === "sorceress_nova") {
    const totalStats = getTotalStats(nextState);
    const overchargeRank = getActiveClassNodeRank(nextState, "sorceress_5");
    const baseDamage =
      (totalStats.attack ?? 1) * (2.2 + overchargeRank * 0.06) +
      (totalStats.intelligence ?? 0) * 8.6;
    applySpellHit(baseDamage);
  } else if (spell.id === "sorceress_hexfire") {
    const totalStats = getTotalStats(nextState);
    const ignitionRank = getActiveClassNodeRank(nextState, "sorceress_3");
    const detonationRank = getActiveClassNodeRank(nextState, "sorceress_10");
    const tickCount = 4 + Math.floor(ignitionRank / 2) + detonationRank;
    const tickDamage =
      (totalStats.attack ?? 1) * 0.55 +
      (totalStats.intelligence ?? 0) * (3.4 + ignitionRank * 0.18);

    for (let index = 0; index < tickCount; index += 1) {
      if (applySpellHit(tickDamage)) {
        break;
      }
    }
  } else if (spell.id === "sorceress_comet_spear") {
    const totalStats = getTotalStats(nextState);
    const primaryDamage =
      (totalStats.attack ?? 1) * 2.6 + (totalStats.intelligence ?? 0) * 7.6;
    const defeated = applySpellHit(primaryDamage);
    if (!defeated) {
      applySpellHit(
        (totalStats.attack ?? 1) * 1.2 + (totalStats.intelligence ?? 0) * 3.4,
      );
    }
  } else if (spell.id === "sorceress_void_pulse") {
    const totalStats = getTotalStats(nextState);
    applyRepeatingHits(3, (index) => {
      return (
        (totalStats.attack ?? 1) * (1.5 + index * 0.25) +
        (totalStats.intelligence ?? 0) * (4.6 + index * 0.95)
      );
    });
  } else if (spell.id === "sorceress_crown_of_cinders") {
    const totalStats = getTotalStats(nextState);
    applyRepeatingHits(5, (index) => {
      return (
        (totalStats.attack ?? 1) * (0.7 + index * 0.08) +
        (totalStats.intelligence ?? 0) * (2.9 + index * 0.42)
      );
    });
  } else if (spell.id === "sorceress_prism_collapse") {
    const totalStats = getTotalStats(nextState);
    const damage =
      (totalStats.attack ?? 1) * 3.1 + (totalStats.intelligence ?? 0) * 9.2;
    applySpellHit(damage);
    events[0].value = restoreMana(12 + (totalStats.intelligence ?? 0) * 0.18);
  } else if (spell.id === "sorceress_astral_scythe") {
    const totalStats = getTotalStats(nextState);
    applyRepeatingHits(2, (index) => {
      return (
        (totalStats.attack ?? 1) * (2.4 + index * 0.9) +
        (totalStats.intelligence ?? 0) * (5.6 + index * 1.2)
      );
    });
  } else if (spell.id === "sorceress_rift_torrent") {
    const totalStats = getTotalStats(nextState);
    applyRepeatingHits(6, (index) => {
      return (
        (totalStats.attack ?? 1) * (0.8 + index * 0.12) +
        (totalStats.intelligence ?? 0) * (2.8 + index * 0.45)
      );
    });
  } else if (spell.id === "sorceress_supernova_sigil") {
    const totalStats = getTotalStats(nextState);
    applySpellHit(
      (totalStats.attack ?? 1) * 1.2 + (totalStats.intelligence ?? 0) * 2.8,
    );
    applySpellHit(
      (totalStats.attack ?? 1) * 3.8 + (totalStats.intelligence ?? 0) * 11.2,
    );
  } else if (spell.id === "sorceress_eclipse_verdict") {
    const totalStats = getTotalStats(nextState);
    applyRepeatingHits(3, (index) => {
      return (
        (totalStats.attack ?? 1) * (2.1 + index * 0.7) +
        (totalStats.intelligence ?? 0) * (5.8 + index * 1.9)
      );
    });
    restoreMana(10 + (totalStats.intelligence ?? 0) * 0.12);
  } else if (spell.id === "idler_dividend") {
    const totalStats = getTotalStats(nextState);
    const now = Date.now();
    const idleMs = Math.max(0, now - (nextState.meta.lastUpdate ?? now));
    const idleSeconds = Math.min(8 * 60 * 60, Math.floor(idleMs / 1000));
    const streakRank = getActiveClassNodeRank(nextState, "idler_7");
    const returnMomentumRank = getActiveClassNodeRank(nextState, "idler_9");
    const convertedDamage =
      (totalStats.attack ?? 1) * 1.8 +
      idleSeconds * (0.045 + streakRank * 0.007 + returnMomentumRank * 0.005);
    applySpellHit(convertedDamage);
  } else if (spell.id === "idler_timebank") {
    const momentumRank = getActiveClassNodeRank(nextState, "idler_9");
    const reserveRank = getActiveClassNodeRank(nextState, "idler_10");
    const manaRestore = restoreMana(34 + momentumRank * 6);
    events[0].value = manaRestore;

    const cooldownReductionMs = 8500 + momentumRank * 650 + reserveRank * 700;
    reduceSpellCooldowns(cooldownReductionMs);
    applySpellHit(
      (getTotalStats(nextState).attack ?? 1) * 2.1 + momentumRank * 18,
    );
  } else if (spell.id === "idler_stored_force") {
    const totalStats = getTotalStats(nextState);
    const idleSeconds = getIdleSeconds(10);
    const damage =
      (totalStats.attack ?? 1) * 2.8 +
      idleSeconds * 0.065 +
      getRemainingCooldownTotal() * 0.0012;
    applySpellHit(damage);
  } else if (spell.id === "idler_quietus_loop") {
    const totalStats = getTotalStats(nextState);
    const idleSeconds = getIdleSeconds(10);
    applyRepeatingHits(3, (index) => {
      return (
        (totalStats.attack ?? 1) * (1.7 + index * 0.45) +
        idleSeconds * (0.02 + index * 0.004)
      );
    });
  } else if (spell.id === "idler_delayed_crash") {
    const totalStats = getTotalStats(nextState);
    const cooldownPool = getRemainingCooldownTotal();
    const damage =
      (totalStats.attack ?? 1) * 4 +
      cooldownPool * 0.0018 +
      getIdleSeconds(10) * 0.03;
    applySpellHit(damage);
  } else if (spell.id === "idler_reserve_flare") {
    const totalStats = getTotalStats(nextState);
    const manaRestore = restoreMana(18 + getIdleSeconds(10) * 0.01);
    events[0].value = manaRestore;
    applySpellHit((totalStats.attack ?? 1) * 3.8 + getIdleSeconds(10) * 0.05);
  } else if (spell.id === "idler_echo_ledger") {
    const totalStats = getTotalStats(nextState);
    applyRepeatingHits(3, (index) => {
      return (
        (totalStats.attack ?? 1) * (1.9 + index * 0.5) +
        getIdleSeconds(10) * (0.015 + index * 0.004)
      );
    });
    reduceSpellCooldowns(2500);
  } else if (spell.id === "idler_patience_breaker") {
    const totalStats = getTotalStats(nextState);
    const idleSeconds = getIdleSeconds();
    applySpellHit((totalStats.attack ?? 1) * 4.8 + idleSeconds * 0.08);
  } else if (spell.id === "idler_long_wake") {
    const totalStats = getTotalStats(nextState);
    const idleSeconds = getIdleSeconds();
    applySpellHit((totalStats.attack ?? 1) * 3 + idleSeconds * 0.045);
    applySpellHit((totalStats.attack ?? 1) * 2.2 + idleSeconds * 0.035);
    events[0].value = restoreMana(14 + idleSeconds * 0.004);
  } else if (spell.id === "idler_epoch_cashout") {
    const totalStats = getTotalStats(nextState);
    const idleSeconds = getIdleSeconds();
    events[0].value = restoreMana(22 + idleSeconds * 0.005);
    reduceSpellCooldowns(6000 + Math.floor(idleSeconds * 0.2));
    applySpellHit((totalStats.attack ?? 1) * 5.8 + idleSeconds * 0.11);
  } else if (spell.id === "tamer_pack_howl") {
    const totalStats = getTotalStats(nextState);
    const frenzyRank = getActiveClassNodeRank(nextState, "tamer_10");
    const petBurstDamage =
      (totalStats.attack ?? 1) * 2.1 +
      (totalStats.petStrength ?? 0) * (28 + frenzyRank * 2);
    applySpellHit(petBurstDamage, "pet");
  } else if (spell.id === "tamer_beast_sync") {
    const totalStats = getTotalStats(nextState);
    const bondRank = getActiveClassNodeRank(nextState, "tamer_1");
    const alphaRank = getActiveClassNodeRank(nextState, "tamer_9");
    const petHit =
      (totalStats.attack ?? 1) * 1.4 +
      (totalStats.petStrength ?? 0) * (20 + bondRank * 2.4 + alphaRank * 1.2);
    const playerFollowup =
      (totalStats.attack ?? 1) * 1.5 + (totalStats.agility ?? 0) * 5.2;

    const defeatedOnFirst = applySpellHit(petHit, "pet");
    if (!defeatedOnFirst) {
      applySpellHit(playerFollowup, "spell");
    }
  } else if (spell.id === "tamer_alpha_pounce") {
    const totalStats = getTotalStats(nextState);
    const pounceDamage =
      (totalStats.attack ?? 1) * 1.8 + (totalStats.petStrength ?? 0) * 20;
    const defeated = applySpellHit(pounceDamage, "pet");
    if (!defeated) {
      applySpellHit(
        (totalStats.attack ?? 1) * 1.8 + (totalStats.agility ?? 0) * 4.8,
      );
    }
  } else if (spell.id === "tamer_fang_relay") {
    const totalStats = getTotalStats(nextState);
    applyRepeatingHits(
      3,
      (index) => {
        return (
          (totalStats.attack ?? 1) * (1 + index * 0.22) +
          (totalStats.petStrength ?? 0) * (10 + index * 3)
        );
      },
      "pet",
    );
  } else if (spell.id === "tamer_den_stampede") {
    const totalStats = getTotalStats(nextState);
    const opening = applyRepeatingHits(
      2,
      (index) => {
        return (
          (totalStats.attack ?? 1) * (1.1 + index * 0.18) +
          (totalStats.petStrength ?? 0) * (12 + index * 3.5)
        );
      },
      "pet",
    );
    if (!opening) {
      applyRepeatingHits(2, (index) => {
        return (
          (totalStats.attack ?? 1) * (1.8 + index * 0.5) +
          (totalStats.agility ?? 0) * 2.6
        );
      });
    }
  } else if (spell.id === "tamer_spirit_lash") {
    const totalStats = getTotalStats(nextState);
    const spectralHit =
      (totalStats.attack ?? 1) * 1.4 + (totalStats.petStrength ?? 0) * 16;
    const defeated = applySpellHit(spectralHit, "pet");
    if (!defeated) {
      applySpellHit(
        (totalStats.attack ?? 1) * 2.4 + (totalStats.agility ?? 0) * 3.4,
      );
    }
  } else if (spell.id === "tamer_packbreaker") {
    const totalStats = getTotalStats(nextState);
    const petHit =
      (totalStats.attack ?? 1) * 2.3 + (totalStats.petStrength ?? 0) * 24;
    const defeated = applySpellHit(petHit, "pet");
    if (!defeated) {
      applySpellHit(
        (totalStats.attack ?? 1) * 2 + (totalStats.petStrength ?? 0) * 8,
      );
    }
  } else if (spell.id === "tamer_sovereign_call") {
    const totalStats = getTotalStats(nextState);
    applyRepeatingHits(
      3,
      (index) => {
        return (
          (totalStats.attack ?? 1) * (1.4 + index * 0.26) +
          (totalStats.petStrength ?? 0) * (15 + index * 4.5)
        );
      },
      "pet",
    );
  } else if (spell.id === "tamer_bestial_eclipse") {
    const totalStats = getTotalStats(nextState);
    const defeated = applyRepeatingHits(
      5,
      (index) => {
        return (
          (totalStats.attack ?? 1) * (0.85 + index * 0.12) +
          (totalStats.petStrength ?? 0) * (9 + index * 2.6)
        );
      },
      "pet",
    );
    if (!defeated) {
      applySpellHit(
        (totalStats.attack ?? 1) * 2.2 + (totalStats.agility ?? 0) * 3.2,
      );
    }
  } else if (spell.id === "tamer_wild_hunt") {
    const totalStats = getTotalStats(nextState);
    const petDefeated = applyRepeatingHits(
      4,
      (index) => {
        return (
          (totalStats.attack ?? 1) * (1 + index * 0.18) +
          (totalStats.petStrength ?? 0) * (14 + index * 3.8)
        );
      },
      "pet",
    );
    if (!petDefeated) {
      applyRepeatingHits(2, (index) => {
        return (
          (totalStats.attack ?? 1) * (2 + index * 0.7) +
          (totalStats.agility ?? 0) * 3.4
        );
      });
    }
  } else if (spell.source === "class") {
    applyGenericFallbackClassSpell();
  }

  return {
    runtime: nextRuntime,
    state: nextState,
    events,
  };
}
