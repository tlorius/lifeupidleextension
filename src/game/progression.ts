import { getPROGRESSION_CONFIG } from "./progressionConfig";
import type { GameState, Stats } from "./types";

export function isSpellSystemUnlocked(level: number): boolean {
  return level >= getPROGRESSION_CONFIG().unlocks.spellsAtLevel;
}

export function isClassSystemUnlocked(level: number): boolean {
  return level >= getPROGRESSION_CONFIG().unlocks.classesAtLevel;
}

export function isDpsMeterUnlocked(state: GameState): boolean {
  const dpsMeterUpgrade = state.upgrades.find((u) => u.id === "dps_goblin");
  return dpsMeterUpgrade ? dpsMeterUpgrade.level > 0 : false;
}

export function getHardLevelCap(state?: GameState): number {
  const baseCap = getPROGRESSION_CONFIG().levelCaps.hardCapLevel;
  if (!state) {
    return baseCap;
  }
  const hardCapUpgrade = state.upgrades.find(
    (u) => u.id === "chaos_hardcap_core",
  );
  return baseCap + Math.max(0, hardCapUpgrade?.level ?? 0);
}

export function isLevelHardCapped(level: number, state?: GameState): boolean {
  return Math.max(1, Math.floor(level)) >= getHardLevelCap(state);
}

export function getXpForNextLevel(level: number, state?: GameState): number {
  const normalizedLevel = Math.max(1, Math.floor(level));
  if (isLevelHardCapped(normalizedLevel, state)) {
    return Number.POSITIVE_INFINITY;
  }

  const cfg = getPROGRESSION_CONFIG();
  const {
    base,
    quadratic,
    linear,
    postTenLinearMultiplierPerLevel,
    postSixtyLinearMultiplierPerLevel,
    postSoftCapExponentialMultiplier,
  } = cfg.xpFormula;

  const baseXp =
    base + normalizedLevel ** 2 * quadratic + normalizedLevel * linear;
  const postTenLevels = Math.max(0, normalizedLevel - 10);
  const postTenMultiplier = 1 + postTenLevels * postTenLinearMultiplierPerLevel;
  const postSixtyLevels = Math.max(0, normalizedLevel - 60);
  const postSixtyMultiplier =
    1 + postSixtyLevels * postSixtyLinearMultiplierPerLevel;
  const postSoftCapLevels = Math.max(
    0,
    normalizedLevel - cfg.levelCaps.softCapLevel,
  );
  const postSoftCapMultiplier =
    postSoftCapLevels > 0
      ? Math.pow(postSoftCapExponentialMultiplier, postSoftCapLevels)
      : 1;

  return Math.round(
    baseXp * postTenMultiplier * postSixtyMultiplier * postSoftCapMultiplier,
  );
}

export function getLevelUpGains(reachedLevel: number): Partial<Stats> {
  const level = Math.max(1, Math.floor(reachedLevel));
  const cfg = getPROGRESSION_CONFIG();
  const gains: Partial<Stats> = {
    hp: cfg.levelUpGains.hpPerLevel,
    attack: cfg.levelUpGains.attackPerLevel,
  };

  if (level >= cfg.levelUpGains.midgameBoostStartsAtLevel) {
    gains.hp = (gains.hp ?? 0) + cfg.levelUpGains.midgameHpBonusPerLevel;
    gains.attack =
      (gains.attack ?? 0) + cfg.levelUpGains.midgameAttackBonusPerLevel;
  }

  if (level >= cfg.levelUpGains.endgameBoostStartsAtLevel) {
    gains.hp = (gains.hp ?? 0) + cfg.levelUpGains.endgameHpBonusPerLevel;
    gains.attack =
      (gains.attack ?? 0) + cfg.levelUpGains.endgameAttackBonusPerLevel;
    gains.defense =
      (gains.defense ?? 0) + cfg.levelUpGains.endgameDefenseBonusPerLevel;
    gains.intelligence =
      (gains.intelligence ?? 0) +
      cfg.levelUpGains.endgameIntelligenceBonusPerLevel;
    gains.agility =
      (gains.agility ?? 0) + cfg.levelUpGains.endgameAgilityBonusPerLevel;
  }

  if (level % cfg.levelUpGains.agilityEveryLevels === 0) {
    gains.agility = (gains.agility ?? 0) + cfg.levelUpGains.agilityPerTrigger;
  }

  if (level % cfg.levelUpGains.milestoneEveryLevels === 0) {
    gains.defense =
      (gains.defense ?? 0) + cfg.levelUpGains.milestoneDefenseBonus;
    gains.intelligence =
      (gains.intelligence ?? 0) + cfg.levelUpGains.milestoneIntelligenceBonus;
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
  let nextRequiredXp = getXpForNextLevel(nextProgress.level, state);
  const hardCap = getHardLevelCap(state);

  while (nextProgress.level < hardCap && nextProgress.xp >= nextRequiredXp) {
    nextProgress.xp -= nextRequiredXp;
    nextProgress.level += 1;
    leveledUp = true;

    if (nextProgress.level >= getPROGRESSION_CONFIG().unlocks.classesAtLevel) {
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

    nextRequiredXp = getXpForNextLevel(nextProgress.level, state);
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
