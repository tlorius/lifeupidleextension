import type { GameState, Upgrade } from "./types";

type UpgradeDefinitionResolver = (upgradeId: string) => Upgrade | null;

export function areUpgradePrerequisitesMet(
  state: GameState,
  upgradeId: string,
  getUpgradeDef: UpgradeDefinitionResolver,
): boolean {
  const upgradeDef = getUpgradeDef(upgradeId);
  if (!upgradeDef || !upgradeDef.prerequisites) return true;

  return upgradeDef.prerequisites.every((prerequisiteId) => {
    const prerequisiteUpgrade = state.upgrades.find(
      (upgrade) => upgrade.id === prerequisiteId,
    );
    return prerequisiteUpgrade !== undefined && prerequisiteUpgrade.level > 0;
  });
}

export function isUpgradeUnlocked(
  state: GameState,
  upgradeId: string,
  getUpgradeDef: UpgradeDefinitionResolver,
): boolean {
  const upgradeDef = getUpgradeDef(upgradeId);
  if (!upgradeDef) return false;

  if (!upgradeDef.prerequisites || upgradeDef.prerequisites.length === 0) {
    return true;
  }

  return upgradeDef.prerequisites.every((prerequisiteId) => {
    const prerequisiteUpgrade = state.upgrades.find(
      (upgrade) => upgrade.id === prerequisiteId,
    );
    const prerequisiteLevel = prerequisiteUpgrade?.level ?? 0;
    if (prerequisiteLevel <= 0) return false;

    const prerequisiteDef = getUpgradeDef(prerequisiteId);
    const linkedRequirement = prerequisiteDef?.linkedUpgrades?.find(
      (linked) => linked.upgradeId === upgradeId,
    );

    if (!linkedRequirement) {
      return true;
    }

    const requiredLevel = linkedRequirement.unlocksAtLevel ?? 1;
    return prerequisiteLevel >= requiredLevel;
  });
}

export function getUnlockedUpgrades(
  state: GameState,
  upgradeId: string,
  getUpgradeDef: UpgradeDefinitionResolver,
): string[] {
  const unlockedIds: string[] = [];
  const parentUpgrade = state.upgrades.find(
    (upgrade) => upgrade.id === upgradeId,
  );

  if (!parentUpgrade) return unlockedIds;

  const parentDef = getUpgradeDef(upgradeId);
  if (!parentDef || !parentDef.linkedUpgrades) return unlockedIds;

  for (const linked of parentDef.linkedUpgrades) {
    const requiredLevel = linked.unlocksAtLevel ?? 1;
    if (parentUpgrade.level >= requiredLevel) {
      unlockedIds.push(linked.upgradeId);
    }
  }

  return unlockedIds;
}
