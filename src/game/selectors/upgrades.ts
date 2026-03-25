import {
  areUpgradePrerequisitesMet,
  getUnlockedUpgrades,
  getUpgradeDef,
  getUpgradeLevel,
  getUpgradeTrees,
  getUpgradesByTree,
  isUpgradeUnlocked,
} from "../upgrades";
import type { GameState, Upgrade } from "../types";

export interface UpgradeTreeSummary {
  tree: string;
  icon: string;
  title: string;
  upgradesCount: number;
  unlockedCount: number;
  totalLevel: number;
}

export interface UpgradePresentation {
  upgrade: Upgrade;
  icon: string;
  level: number;
  cost: number;
  canAfford: boolean;
  prerequisites: string[];
  isUnlocked: boolean;
  preqsMet: boolean;
  unlockedByThis: string[];
  canPurchase: boolean;
  prereqText: string;
  linkedText: string;
  actionLabel: "Locked" | "Unlock" | "Upgrade";
  actionTitle: string;
  prerequisiteNames: string[];
  linkedNames: string[];
}

export interface UpgradeTierEntry {
  tier: number;
  upgrades: UpgradePresentation[];
}

export interface UpgradeTreeConnector {
  key: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  controlY1: number;
  controlY2: number;
  purchased: boolean;
}

export interface UpgradeTreeLayout {
  isMobileTree: boolean;
  treeNodeWidth: number;
  treeColumnGap: number;
  treeNodeHeight: number;
  treeRowGap: number;
  treeHeaderHeight: number;
  treeNodePadding: number;
  treeTitleFontSize: number;
  treeMetaFontSize: number;
  treeBadgeFontSize: number;
  treeIconSize: number;
  treeBoardWidth: number;
  treeBoardHeight: number;
}

export interface UpgradeTreeViewModel {
  tree: string;
  treeIcon: string;
  treeTitle: string;
  upgrades: UpgradePresentation[];
  tierEntries: UpgradeTierEntry[];
  treeConnectors: UpgradeTreeConnector[];
  layout: UpgradeTreeLayout;
  selectedModalPresentation: UpgradePresentation | null;
}

export function getTreeIcon(tree: string): string {
  switch (tree) {
    case "combat":
      return "⚔️";
    case "resource":
      return "💰";
    case "magic":
      return "✨";
    case "farming":
      return "🌿";
    case "expedition":
      return "🧭";
    default:
      return "🌳";
  }
}

export function getUpgradeIcon(upgradeDef: Upgrade): string {
  if (upgradeDef.id.includes("attack") || upgradeDef.id.includes("blade")) {
    return "⚔️";
  }
  if (upgradeDef.id.includes("defense") || upgradeDef.id.includes("skin")) {
    return "🛡️";
  }
  if (upgradeDef.id.includes("gold") || upgradeDef.id.includes("wealth")) {
    return "💰";
  }
  if (upgradeDef.id.includes("energy") || upgradeDef.id.includes("mana")) {
    return "⚡";
  }
  if (upgradeDef.id.includes("gem")) {
    return "💎";
  }
  if (upgradeDef.id.includes("water")) {
    return "💧";
  }
  if (upgradeDef.id.includes("plant") || upgradeDef.tree === "farming") {
    return "🌿";
  }
  if (upgradeDef.id.includes("mage") || upgradeDef.id.includes("arcane")) {
    return "🔮";
  }
  if (upgradeDef.id.includes("spell")) {
    return "✨";
  }
  return getTreeIcon(upgradeDef.tree);
}

export function selectUpgradeTreeSummaries(
  state: GameState,
): UpgradeTreeSummary[] {
  return getUpgradeTrees().map((tree) => {
    const upgrades = getUpgradesByTree(tree);
    return {
      tree,
      icon: getTreeIcon(tree),
      title: `${capitalize(tree)} Tree`,
      upgradesCount: upgrades.length,
      unlockedCount: upgrades.filter((upgrade) =>
        isUpgradeUnlocked(state, upgrade.id),
      ).length,
      totalLevel: upgrades.reduce(
        (sum, upgrade) => sum + getUpgradeLevel(state, upgrade.id),
        0,
      ),
    };
  });
}

export function selectUpgradePresentation(
  state: GameState,
  upgradeDef: Upgrade,
): UpgradePresentation {
  const level = getUpgradeLevel(state, upgradeDef.id);
  const cost = Math.ceil(
    upgradeDef.baseCost * Math.pow(upgradeDef.scaling, level),
  );
  const canAfford = state.resources.gold >= cost;
  const prerequisites = upgradeDef.prerequisites ?? [];
  const isUnlocked = isUpgradeUnlocked(state, upgradeDef.id);
  const preqsMet = areUpgradePrerequisitesMet(state, upgradeDef.id);
  const unlockedByThis = getUnlockedUpgrades(state, upgradeDef.id);
  const canPurchase = isUnlocked && preqsMet && canAfford;

  const prereqText =
    prerequisites.length > 0
      ? `Requires: ${prerequisites
          .map((preqId) => {
            const preqDef = getUpgradeDef(preqId);
            const linkedRequirement = preqDef?.linkedUpgrades?.find(
              (linked) => linked.upgradeId === upgradeDef.id,
            );
            const requiredLevel = linkedRequirement?.unlocksAtLevel ?? 1;
            return `${preqDef?.name} (Lvl ${requiredLevel})`;
          })
          .join(", ")}`
      : "";

  const linkedText =
    unlockedByThis.length > 0
      ? `Unlocks: ${unlockedByThis
          .map((unlockId) => {
            const unlockDef = getUpgradeDef(unlockId);
            const linkedUpgrade = upgradeDef.linkedUpgrades?.find(
              (linked) => linked.upgradeId === unlockId,
            );
            const requiredLevel = linkedUpgrade?.unlocksAtLevel ?? 1;
            return `${unlockDef?.name} (at level ${requiredLevel})`;
          })
          .join(", ")}`
      : "";

  return {
    upgrade: upgradeDef,
    icon: getUpgradeIcon(upgradeDef),
    level,
    cost,
    canAfford,
    prerequisites,
    isUnlocked,
    preqsMet,
    unlockedByThis,
    canPurchase,
    prereqText,
    linkedText,
    actionLabel: !isUnlocked ? "Locked" : level === 0 ? "Unlock" : "Upgrade",
    actionTitle: !isUnlocked
      ? "Prerequisites not met"
      : !preqsMet
        ? "Previous upgrade level required"
        : !canAfford
          ? "Not enough gold"
          : "",
    prerequisiteNames: prerequisites
      .map((preqId) => getUpgradeDef(preqId)?.name)
      .filter((name): name is string => Boolean(name)),
    linkedNames: (upgradeDef.linkedUpgrades ?? [])
      .map((linked) => {
        const unlockDef = getUpgradeDef(linked.upgradeId);
        return unlockDef
          ? `${unlockDef.name} @ Lv ${linked.unlocksAtLevel ?? 1}`
          : null;
      })
      .filter((name): name is string => Boolean(name)),
  };
}

export function selectUpgradeTreeView(
  state: GameState,
  tree: string,
  viewportWidth: number,
  treeModalUpgradeId: string | null,
): UpgradeTreeViewModel {
  const upgrades = getUpgradesByTree(tree);
  const upgradesById = new Map(
    upgrades.map((upgrade) => [upgrade.id, upgrade]),
  );
  const tierCache = new Map<string, number>();

  const getUpgradeTier = (upgradeId: string): number => {
    const cachedTier = tierCache.get(upgradeId);
    if (cachedTier !== undefined) return cachedTier;

    const upgradeDef = upgradesById.get(upgradeId);
    if (!upgradeDef) return 0;

    const localPrerequisites = (upgradeDef.prerequisites ?? []).filter((id) =>
      upgradesById.has(id),
    );

    const tier =
      localPrerequisites.length === 0
        ? 0
        : Math.max(...localPrerequisites.map(getUpgradeTier)) + 1;

    tierCache.set(upgradeId, tier);
    return tier;
  };

  const presentations = upgrades.map((upgradeDef) =>
    selectUpgradePresentation(state, upgradeDef),
  );
  const presentationsById = new Map(
    presentations.map((presentation) => [
      presentation.upgrade.id,
      presentation,
    ]),
  );

  const tierEntries = Object.entries(
    upgrades.reduce<Record<number, UpgradePresentation[]>>(
      (acc, upgradeDef) => {
        const tier = getUpgradeTier(upgradeDef.id);
        if (!acc[tier]) {
          acc[tier] = [];
        }
        const presentation = presentationsById.get(upgradeDef.id);
        if (presentation) {
          acc[tier].push(presentation);
        }
        return acc;
      },
      {},
    ),
  )
    .map(([tier, tierUpgrades]) => ({
      tier: Number(tier),
      upgrades: tierUpgrades.sort((left, right) =>
        left.upgrade.name.localeCompare(right.upgrade.name),
      ),
    }))
    .sort((left, right) => left.tier - right.tier);

  const layout = getUpgradeTreeLayout(viewportWidth, tierEntries);
  const nodeLookup = new Map<string, { x: number; y: number }>();

  tierEntries.forEach((tierEntry, tierIndex) => {
    tierEntry.upgrades.forEach((presentation, rowIndex) => {
      const tierWidth =
        tierEntry.upgrades.length * layout.treeNodeWidth +
        Math.max(0, tierEntry.upgrades.length - 1) * layout.treeColumnGap;
      const xOffset = (layout.treeBoardWidth - tierWidth) / 2;
      const x =
        xOffset + rowIndex * (layout.treeNodeWidth + layout.treeColumnGap);
      const y =
        tierIndex *
          (layout.treeHeaderHeight +
            layout.treeNodeHeight +
            layout.treeRowGap) +
        layout.treeHeaderHeight;
      nodeLookup.set(presentation.upgrade.id, { x, y });
    });
  });

  const treeConnectors = tierEntries.flatMap((tierEntry) =>
    tierEntry.upgrades.flatMap((presentation) => {
      const childNode = nodeLookup.get(presentation.upgrade.id);
      if (!childNode) return [];

      return (presentation.upgrade.prerequisites ?? [])
        .map((preqId) => {
          const parentNode = nodeLookup.get(preqId);
          if (!parentNode) return null;

          const startX = parentNode.x + layout.treeNodeWidth / 2;
          const startY = parentNode.y + layout.treeNodeHeight;
          const endX = childNode.x + layout.treeNodeWidth / 2;
          const endY = childNode.y;
          const verticalDistance = endY - startY;
          const bendOffset = Math.max(28, verticalDistance * 0.45);

          return {
            key: `${preqId}-${presentation.upgrade.id}`,
            startX,
            startY,
            endX,
            endY,
            controlY1: startY + bendOffset,
            controlY2: endY - bendOffset,
            purchased: getUpgradeLevel(state, preqId) > 0,
          };
        })
        .filter(
          (connector): connector is UpgradeTreeConnector => connector !== null,
        );
    }),
  );

  return {
    tree,
    treeIcon: getTreeIcon(tree),
    treeTitle: `${capitalize(tree)} Tree`,
    upgrades: presentations,
    tierEntries,
    treeConnectors,
    layout,
    selectedModalPresentation: treeModalUpgradeId
      ? (presentationsById.get(treeModalUpgradeId) ?? null)
      : null,
  };
}

function getUpgradeTreeLayout(
  viewportWidth: number,
  tierEntries: UpgradeTierEntry[],
): UpgradeTreeLayout {
  const isMobileTree = viewportWidth <= 768;
  const treeNodeWidth = isMobileTree ? 160 : 220;
  const treeColumnGap = isMobileTree ? 12 : 26;
  const treeNodeHeight = isMobileTree ? 170 : 188;
  const treeRowGap = isMobileTree ? 32 : 54;
  const treeHeaderHeight = isMobileTree ? 28 : 34;
  const treeNodePadding = isMobileTree ? 10 : 12;
  const treeTitleFontSize = isMobileTree ? 12 : 13;
  const treeMetaFontSize = isMobileTree ? 10 : 11;
  const treeBadgeFontSize = isMobileTree ? 9 : 10;
  const treeIconSize = isMobileTree ? 20 : 24;
  const maxTierSize = Math.max(
    1,
    ...tierEntries.map((tierEntry) => tierEntry.upgrades.length),
  );
  const treeBoardWidth =
    maxTierSize * treeNodeWidth + Math.max(0, maxTierSize - 1) * treeColumnGap;
  const treeBoardHeight =
    tierEntries.length * (treeHeaderHeight + treeNodeHeight) +
    Math.max(0, tierEntries.length - 1) * treeRowGap;

  return {
    isMobileTree,
    treeNodeWidth,
    treeColumnGap,
    treeNodeHeight,
    treeRowGap,
    treeHeaderHeight,
    treeNodePadding,
    treeTitleFontSize,
    treeMetaFontSize,
    treeBadgeFontSize,
    treeIconSize,
    treeBoardWidth,
    treeBoardHeight,
  };
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
