import type { ItemInstance, Stats } from "./types";

const rarityMultipliers = {
  common: { statScale: 1, costScale: 1, perLevelScale: 0.02 },
  rare: { statScale: 1.2, costScale: 1.3, perLevelScale: 0.02 },
  epic: { statScale: 3.2, costScale: 2.1, perLevelScale: 0.08 },
  legendary: { statScale: 9, costScale: 4.4, perLevelScale: 0.22 },
  unique: { statScale: 30, costScale: 8.5, perLevelScale: 0.6 },
};

export function calculateItemStat(
  baseStat: number,
  level: number,
  rarity: string,
  bonusMultiplier: number = 1,
): number {
  const multiplier =
    rarityMultipliers[rarity as keyof typeof rarityMultipliers];
  if (!multiplier) return baseStat;

  let stat = baseStat * multiplier.statScale * bonusMultiplier;
  const tenLevelBonus = 1 + Math.floor(level / 10) * 0.05;
  stat *= tenLevelBonus;

  stat +=
    baseStat *
    multiplier.perLevelScale *
    (level - 1) *
    multiplier.statScale *
    bonusMultiplier;

  return stat;
}

export function getItemStats(
  item: ItemInstance,
  def: { stats?: Partial<Stats>; rarity?: string },
  bonusMultipliers?: Partial<Record<keyof Stats, number>>,
): Partial<Stats> {
  if (!def.stats) return {};

  const stats: Partial<Stats> = {};
  for (const [key, value] of Object.entries(def.stats)) {
    if (value !== undefined && typeof value === "number") {
      const bonus = bonusMultipliers?.[key as keyof Stats] ?? 1;
      stats[key as keyof Stats] = calculateItemStat(
        value,
        item.level,
        def.rarity || "common",
        bonus,
      );
    }
  }
  return stats;
}

export function calculateUpgradeCost(
  currentLevel: number,
  rarity: string,
  baseCost: number = 10,
  costBonusMultiplier: number = 1,
): number {
  const multiplier =
    rarityMultipliers[rarity as keyof typeof rarityMultipliers];
  if (!multiplier) return baseCost * currentLevel * costBonusMultiplier;

  const cost =
    baseCost * currentLevel * multiplier.costScale * costBonusMultiplier;
  return Math.ceil(cost);
}
