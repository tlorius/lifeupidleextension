import { getTotalStats } from "./engine";
import type { GameState } from "./types";
import type {
  CombatAttackSource,
  CombatEvent,
  CombatRng,
  CombatRuntimeState,
  CombatTickResult,
} from "./combat";

interface CombatAttackModifiers {
  damageMultiplier: number;
  lifeStealPercent: number;
  manaOnHit: number;
  petProcChance: number;
  petProcDamageMultiplier: number;
  incomingDamageMultiplier: number;
  lethalSaveChance: number;
  lethalSaveHpRatio: number;
}

export function applyPlayerAttack(
  runtime: CombatRuntimeState,
  state: GameState,
  rng: CombatRng,
  attackSource: CombatAttackSource = "auto",
  combatModifiers: CombatAttackModifiers,
  calculatePlayerHit: (
    state: GameState,
    rng: CombatRng,
    attackSource: CombatAttackSource,
  ) => { damage: number; isCrit: boolean },
  getPlayerMaxHp: (state: GameState) => number,
  applyEnemyReward: (
    runtime: CombatRuntimeState,
    state: GameState,
    rng: CombatRng,
  ) => { runtime: CombatRuntimeState; state: GameState; events: CombatEvent[] },
): CombatTickResult {
  const { damage, isCrit } = calculatePlayerHit(state, rng, attackSource);
  const totalStats = getTotalStats(state);
  let nextEnemyHp = Math.max(0, runtime.enemy.currentHp - damage);
  let nextState = state;

  const lifeSteal = Math.max(
    0,
    Math.round(damage * (combatModifiers.lifeStealPercent / 100)),
  );
  const manaGain = Math.max(0, combatModifiers.manaOnHit);
  let healedRuntime = runtime;
  if (lifeSteal > 0) {
    const maxHp = getPlayerMaxHp(state);
    healedRuntime = {
      ...runtime,
      playerCurrentHp: Math.min(maxHp, runtime.playerCurrentHp + lifeSteal),
    };
  }
  if (manaGain > 0) {
    nextState = {
      ...nextState,
      resources: {
        ...nextState.resources,
        energy: Math.min(100, (nextState.resources.energy ?? 0) + manaGain),
      },
    };
  }

  const shouldTriggerPetProc =
    combatModifiers.petProcChance > 0 && rng() < combatModifiers.petProcChance;
  let petProcDamage = 0;
  if (shouldTriggerPetProc) {
    petProcDamage = Math.max(
      1,
      Math.round(
        ((totalStats.attack ?? 1) * 0.42 +
          (totalStats.petStrength ?? 0) * 0.22) *
          (1 + combatModifiers.petProcDamageMultiplier),
      ),
    );
    nextEnemyHp = Math.max(0, nextEnemyHp - petProcDamage);
  }

  const attackedRuntime: CombatRuntimeState = {
    ...healedRuntime,
    enemy: {
      ...healedRuntime.enemy,
      currentHp: nextEnemyHp,
    },
  };

  const events: CombatEvent[] = [
    { type: "playerHit", value: damage, isCrit, attackSource },
  ];
  if (petProcDamage > 0) {
    events.push({
      type: "playerHit",
      value: petProcDamage,
      attackSource: "pet",
    });
  }

  if (nextEnemyHp > 0) {
    return {
      runtime: attackedRuntime,
      state: nextState,
      events,
    };
  }

  const rewarded = applyEnemyReward(attackedRuntime, nextState, rng);
  return {
    runtime: rewarded.runtime,
    state: rewarded.state,
    events: events.concat(rewarded.events),
  };
}

export function applyEnemyAttack(
  runtime: CombatRuntimeState,
  state: GameState,
  rng: CombatRng,
  combatModifiers: CombatAttackModifiers,
  getDamageAfterDefense: (rawDamage: number, defense: number) => number,
  getPlayerMaxHp: (state: GameState) => number,
  createEnemyInstance: (level: number) => any,
): CombatTickResult {
  const totalStats = getTotalStats(state);
  const defense = totalStats.defense ?? 0;
  const damage = Math.max(
    1,
    Math.round(
      getDamageAfterDefense(runtime.enemy.damage, defense) *
        combatModifiers.incomingDamageMultiplier,
    ),
  );
  const nextPlayerHp = Math.max(0, runtime.playerCurrentHp - damage);

  if (nextPlayerHp <= 0) {
    if (rng() < combatModifiers.lethalSaveChance) {
      const rescuedHp = Math.max(
        1,
        Math.round(getPlayerMaxHp(state) * combatModifiers.lethalSaveHpRatio),
      );
      return {
        runtime: {
          ...runtime,
          playerCurrentHp: rescuedHp,
        },
        state,
        events: [{ type: "enemyHit", value: damage }],
      };
    }

    const defeated = resolvePlayerDefeat(
      runtime,
      state,
      getPlayerMaxHp,
      createEnemyInstance,
    );
    return {
      runtime: defeated.runtime,
      state: defeated.state,
      events: [{ type: "enemyHit", value: damage }, ...defeated.events],
    };
  }

  return {
    runtime: {
      ...runtime,
      playerCurrentHp: nextPlayerHp,
    },
    state,
    events: [{ type: "enemyHit", value: damage }],
  };
}

function resolvePlayerDefeat(
  runtime: CombatRuntimeState,
  state: GameState,
  getPlayerMaxHp: (state: GameState) => number,
  createEnemyInstance: (level: number) => any,
): CombatTickResult {
  const resetLevel = Math.max(1, runtime.lastBossCheckpointLevel || 1);
  return {
    runtime: {
      ...runtime,
      currentLevel: resetLevel,
      playerCurrentHp: getPlayerMaxHp(state),
      enemy: createEnemyInstance(resetLevel),
      playerAttackRemainderMs: 0,
      enemyAttackRemainderMs: 0,
    },
    state,
    events: [{ type: "playerDefeated" }],
  };
}
