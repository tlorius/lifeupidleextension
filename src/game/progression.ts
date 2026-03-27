import { PROGRESSION_CONFIG } from "./progressionConfig";
import type { GameState, Stats } from "./types";

export function isSpellSystemUnlocked(level: number): boolean {
  return level >= PROGRESSION_CONFIG.unlocks.spellsAtLevel;
}

export function isClassSystemUnlocked(level: number): boolean {
  return level >= PROGRESSION_CONFIG.unlocks.classesAtLevel;
}

export function isDpsMeterUnlocked(state: GameState): boolean {
  const dpsMeterUpgrade = state.upgrades.find((u) => u.id === "dps_goblin");
  return dpsMeterUpgrade ? dpsMeterUpgrade.level > 0 : false;
}

export function getHardLevelCap(): number {
  return PROGRESSION_CONFIG.levelCaps.hardCapLevel;
}

export function isLevelHardCapped(level: number): boolean {
  return Math.max(1, Math.floor(level)) >= getHardLevelCap();
}

export function getXpForNextLevel(level: number): number {
  const normalizedLevel = Math.max(1, Math.floor(level));
  if (isLevelHardCapped(normalizedLevel)) {
    return Number.POSITIVE_INFINITY;
  }

  const {
    base,
    quadratic,
    linear,
    postSixtyLinearMultiplierPerLevel,
    postSoftCapExponentialMultiplier,
  } = PROGRESSION_CONFIG.xpFormula;

  const baseXp =
    base + normalizedLevel ** 2 * quadratic + normalizedLevel * linear;
  const postSixtyLevels = Math.max(0, normalizedLevel - 60);
  const postSixtyMultiplier =
    1 + postSixtyLevels * postSixtyLinearMultiplierPerLevel;
  const postSoftCapLevels = Math.max(
    0,
    normalizedLevel - PROGRESSION_CONFIG.levelCaps.softCapLevel,
  );
  const postSoftCapMultiplier =
    postSoftCapLevels > 0
      ? Math.pow(postSoftCapExponentialMultiplier, postSoftCapLevels)
      : 1;

  return Math.round(baseXp * postSixtyMultiplier * postSoftCapMultiplier);
}

export function getLevelUpGains(reachedLevel: number): Partial<Stats> {
  const level = Math.max(1, Math.floor(reachedLevel));
  const gains: Partial<Stats> = {
    hp: PROGRESSION_CONFIG.levelUpGains.hpPerLevel,
    attack: PROGRESSION_CONFIG.levelUpGains.attackPerLevel,
  };

  if (level >= PROGRESSION_CONFIG.levelUpGains.midgameBoostStartsAtLevel) {
    gains.hp =
      (gains.hp ?? 0) + PROGRESSION_CONFIG.levelUpGains.midgameHpBonusPerLevel;
    gains.attack =
      (gains.attack ?? 0) +
      PROGRESSION_CONFIG.levelUpGains.midgameAttackBonusPerLevel;
  }

  if (level >= PROGRESSION_CONFIG.levelUpGains.endgameBoostStartsAtLevel) {
    gains.hp =
      (gains.hp ?? 0) + PROGRESSION_CONFIG.levelUpGains.endgameHpBonusPerLevel;
    gains.attack =
      (gains.attack ?? 0) +
      PROGRESSION_CONFIG.levelUpGains.endgameAttackBonusPerLevel;
    gains.defense =
      (gains.defense ?? 0) +
      PROGRESSION_CONFIG.levelUpGains.endgameDefenseBonusPerLevel;
    gains.intelligence =
      (gains.intelligence ?? 0) +
      PROGRESSION_CONFIG.levelUpGains.endgameIntelligenceBonusPerLevel;
    gains.agility =
      (gains.agility ?? 0) +
      PROGRESSION_CONFIG.levelUpGains.endgameAgilityBonusPerLevel;
  }

  if (level % PROGRESSION_CONFIG.levelUpGains.agilityEveryLevels === 0) {
    gains.agility =
      (gains.agility ?? 0) + PROGRESSION_CONFIG.levelUpGains.agilityPerTrigger;
  }

  if (level % PROGRESSION_CONFIG.levelUpGains.milestoneEveryLevels === 0) {
    gains.defense =
      (gains.defense ?? 0) +
      PROGRESSION_CONFIG.levelUpGains.milestoneDefenseBonus;
    gains.intelligence =
      (gains.intelligence ?? 0) +
      PROGRESSION_CONFIG.levelUpGains.milestoneIntelligenceBonus;
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
  const hardCap = getHardLevelCap();

  while (nextProgress.level < hardCap && nextProgress.xp >= nextRequiredXp) {
    nextProgress.xp -= nextRequiredXp;
    nextProgress.level += 1;
    leveledUp = true;

    if (nextProgress.level >= PROGRESSION_CONFIG.unlocks.classesAtLevel) {
      state = {
        ...state,
        character: {
          ...state.character,
          availableSkillPoints: state.character.availableSkillPoints + 1,
        },
      };
    }

    const gains = getLevelUpGains(nextProgress.level);
    for (const [key, value] of Object.entries(gains)) {
      const statKey = key as keyof Stats;
      nextStats[statKey] = (nextStats[statKey] ?? 0) + (value ?? 0);
    }

    nextRequiredXp = getXpForNextLevel(nextProgress.level);
  }

  if (nextProgress.level >= hardCap) {
    nextProgress.level = hardCap;
    nextProgress.xp = 0;
  }

  nextProgress.unlockedSystems = {
    ...nextProgress.unlockedSystems,
    spells: isSpellSystemUnlocked(nextProgress.level),
    classes: isClassSystemUnlocked(nextProgress.level),
    dpsMeter: isDpsMeterUnlocked(state),
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
