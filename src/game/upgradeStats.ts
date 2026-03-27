import type { GameState, Stats, Upgrade } from "./types";

export function aggregateUpgradeBonuses(upgrades: Upgrade[]): Partial<Stats> {
  const stats: Partial<Stats> = {};

  for (const upgrade of upgrades) {
    for (const bonus of upgrade.bonuses ?? []) {
      if (bonus.statsFlat) {
        for (const [key, value] of Object.entries(bonus.statsFlat)) {
          if (value !== undefined && typeof value === "number") {
            stats[key as keyof Stats] =
              (stats[key as keyof Stats] ?? 0) + value * upgrade.level;
          }
        }
      }

      if (bonus.percentBonusType && bonus.percentBonusAmount !== undefined) {
        const bonusType = bonus.percentBonusType;
        const bonusPercentage = bonus.percentBonusAmount * upgrade.level * 100;
        stats[bonusType] = (stats[bonusType] ?? 0) + bonusPercentage;
      }
    }
  }

  return stats;
}

export function getUpgradeStats(state: GameState): Partial<Stats> {
  return aggregateUpgradeBonuses(state.upgrades);
}
