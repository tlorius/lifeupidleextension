import { PROGRESSION_CONFIG } from "./progressionConfig";
import type { GameState, Stats } from "./types";

export function isSpellSystemUnlocked(level: number): boolean {
  return level >= PROGRESSION_CONFIG.unlocks.spellsAtLevel;
}

export function getXpForNextLevel(level: number): number {
  const normalizedLevel = Math.max(1, Math.floor(level));
  const { base, quadratic, linear } = PROGRESSION_CONFIG.xpFormula;
  return Math.round(
    base + normalizedLevel ** 2 * quadratic + normalizedLevel * linear,
  );
}

export function getLevelUpGains(reachedLevel: number): Partial<Stats> {
  const level = Math.max(1, Math.floor(reachedLevel));
  const gains: Partial<Stats> = {
    hp: PROGRESSION_CONFIG.levelUpGains.hpPerLevel,
    attack: PROGRESSION_CONFIG.levelUpGains.attackPerLevel,
  };

  if (level % PROGRESSION_CONFIG.levelUpGains.agilityEveryLevels === 0) {
    gains.agility = PROGRESSION_CONFIG.levelUpGains.agilityPerTrigger;
  }

  if (level % PROGRESSION_CONFIG.levelUpGains.critEveryLevels === 0) {
    gains.critChance = PROGRESSION_CONFIG.levelUpGains.critPerTrigger;
  }

  return gains;
}

export function getLevelGainPreview(currentLevel: number): Partial<Stats> {
  return getLevelUpGains(Math.max(1, Math.floor(currentLevel)) + 1);
}

export function grantPlayerXp(state: GameState, xpAmount: number): GameState {
  const grantedXp = Math.max(0, xpAmount);
  if (grantedXp <= 0) return state;

  const nextProgress = {
    ...state.playerProgress,
    xp: state.playerProgress.xp + grantedXp,
    totalXpEarned: state.playerProgress.totalXpEarned + grantedXp,
  };
  const nextStats: Stats = {
    ...state.stats,
  };

  let leveledUp = false;
  let nextRequiredXp = getXpForNextLevel(nextProgress.level);

  while (nextProgress.xp >= nextRequiredXp) {
    nextProgress.xp -= nextRequiredXp;
    nextProgress.level += 1;
    leveledUp = true;

    const gains = getLevelUpGains(nextProgress.level);
    for (const [key, value] of Object.entries(gains)) {
      const statKey = key as keyof Stats;
      nextStats[statKey] = (nextStats[statKey] ?? 0) + (value ?? 0);
    }

    nextRequiredXp = getXpForNextLevel(nextProgress.level);
  }

  nextProgress.unlockedSystems = {
    ...nextProgress.unlockedSystems,
    spells: isSpellSystemUnlocked(nextProgress.level),
  };

  if (leveledUp) {
    nextProgress.lastLevelUpAt = Date.now();
  }

  return {
    ...state,
    stats: nextStats,
    playerProgress: nextProgress,
  };
}
