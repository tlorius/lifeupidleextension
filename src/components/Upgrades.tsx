import { useState } from "react";
import { useGame } from "../game/GameContext";
import {
  getUpgradeTrees,
  getUpgradesByTree,
  getUpgradeLevel,
  buyUpgrade,
  getUpgradeDef,
  isUpgradeUnlocked,
  areUpgradePrerequisitesMet,
  getUnlockedUpgrades,
} from "../game/upgrades";
import { formatCompactNumber } from "../game/numberFormat";
import type { Upgrade } from "../game/types";

export function Upgrades() {
  const { state, setState } = useGame();
  const [selectedTree, setSelectedTree] = useState<string | null>(null);
  const [isTreeView, setIsTreeView] = useState(false);
  const [treeModalUpgradeId, setTreeModalUpgradeId] = useState<string | null>(
    null,
  );

  const trees = getUpgradeTrees();
  const hasItems = state.inventory.length > 0;
  const panelStyle = {
    backgroundColor: "#16212d",
    border: "1px solid #2a3a4c",
    borderRadius: 10,
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.24)",
  };

  const getTreeIcon = (tree: string): string => {
    switch (tree) {
      case "combat":
        return "⚔️";
      case "resource":
        return "💰";
      case "magic":
        return "✨";
      case "farming":
        return "🌿";
      default:
        return "🌳";
    }
  };

  const getUpgradeIcon = (upgradeDef: Upgrade): string => {
    if (upgradeDef.id.includes("attack") || upgradeDef.id.includes("blade")) {
      return "⚔️";
    }
    if (upgradeDef.id.includes("defense") || upgradeDef.id.includes("skin")) {
      return "🛡️";
    }
    if (upgradeDef.id.includes("gold") || upgradeDef.id.includes("wealth")) {
      return "💰";
    }
    if (upgradeDef.id.includes("energy")) {
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
  };

  const getUpgradePresentation = (upgradeDef: Upgrade) => {
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
              const preqLevel = getUpgradeLevel(state, preqId);
              return `${preqDef?.name} (Lvl ${preqLevel})`;
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
    };
  };

  if (selectedTree) {
    const upgrades = getUpgradesByTree(selectedTree);
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

    const tierEntries = Object.entries(
      upgrades.reduce<Record<number, Upgrade[]>>((acc, upgradeDef) => {
        const tier = getUpgradeTier(upgradeDef.id);
        if (!acc[tier]) {
          acc[tier] = [];
        }
        acc[tier].push(upgradeDef);
        return acc;
      }, {}),
    )
      .map(([tier, tierUpgrades]) => ({
        tier: Number(tier),
        upgrades: tierUpgrades.sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.tier - b.tier);

    const selectedModalUpgrade = treeModalUpgradeId
      ? getUpgradeDef(treeModalUpgradeId)
      : null;
    const selectedModalPresentation = selectedModalUpgrade
      ? getUpgradePresentation(selectedModalUpgrade)
      : null;
    const treeNodeWidth = 220;
    const treeColumnGap = 26;
    const treeNodeHeight = 188;
    const treeRowGap = 54;
    const treeHeaderHeight = 34;
    const maxTierSize = Math.max(
      1,
      ...tierEntries.map((tierEntry) => tierEntry.upgrades.length),
    );
    const treeBoardWidth =
      maxTierSize * treeNodeWidth +
      Math.max(0, maxTierSize - 1) * treeColumnGap;
    const treeBoardHeight =
      tierEntries.length * (treeHeaderHeight + treeNodeHeight) +
      Math.max(0, tierEntries.length - 1) * treeRowGap;
    const nodeLookup = new Map<
      string,
      { tierIndex: number; rowIndex: number; x: number; y: number }
    >();

    tierEntries.forEach((tierEntry, tierIndex) => {
      tierEntry.upgrades.forEach((upgradeDef, rowIndex) => {
        const tierWidth =
          tierEntry.upgrades.length * treeNodeWidth +
          Math.max(0, tierEntry.upgrades.length - 1) * treeColumnGap;
        const xOffset = (treeBoardWidth - tierWidth) / 2;
        const x = xOffset + rowIndex * (treeNodeWidth + treeColumnGap);
        const y =
          tierIndex * (treeHeaderHeight + treeNodeHeight + treeRowGap) +
          treeHeaderHeight;
        nodeLookup.set(upgradeDef.id, { tierIndex, rowIndex, x, y });
      });
    });

    const treeConnectors = tierEntries.flatMap((tierEntry) =>
      tierEntry.upgrades.flatMap((upgradeDef) => {
        const childNode = nodeLookup.get(upgradeDef.id);
        if (!childNode) return [];

        return (upgradeDef.prerequisites ?? [])
          .map((preqId) => {
            const parentNode = nodeLookup.get(preqId);
            if (!parentNode) return null;

            const startX = parentNode.x + treeNodeWidth / 2;
            const startY = parentNode.y + treeNodeHeight;
            const endX = childNode.x + treeNodeWidth / 2;
            const endY = childNode.y;
            const verticalDistance = endY - startY;
            const bendOffset = Math.max(28, verticalDistance * 0.45);

            return {
              key: `${preqId}-${upgradeDef.id}`,
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
            (
              connector,
            ): connector is {
              key: string;
              startX: number;
              startY: number;
              endX: number;
              endY: number;
              controlY1: number;
              controlY2: number;
              purchased: boolean;
            } => connector !== null,
          );
      }),
    );

    return (
      <div style={{ padding: 16, color: "#e5edf5" }}>
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <button
            className="btn-primary"
            style={{
              padding: "8px 12px",
            }}
            onClick={() => {
              setSelectedTree(null);
              setTreeModalUpgradeId(null);
              setIsTreeView(false);
            }}
          >
            ← Back to Trees
          </button>
          <button
            style={{
              padding: "8px 12px",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              backgroundColor: isTreeView ? "#2c8f84" : "#253649",
              borderColor: isTreeView ? "#2c8f84" : "#3f546a",
              color: "#ffffff",
            }}
            onClick={() => setIsTreeView((prev) => !prev)}
            aria-label="Toggle tree view"
            title={isTreeView ? "Switch to normal view" : "Switch to tree view"}
          >
            <span>{getTreeIcon(selectedTree)}</span>
            <span>{isTreeView ? "Normal View" : "Tree View"}</span>
          </button>
        </div>

        <h2
          style={{
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span>{getTreeIcon(selectedTree)}</span>
          <span>
            {selectedTree.charAt(0).toUpperCase() + selectedTree.slice(1)} Tree
          </span>
        </h2>

        {upgrades.length === 0 && (
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              backgroundColor: "#2b2318",
              color: "#f2d39b",
              border: "1px solid #6f5630",
              marginBottom: 16,
            }}
          >
            No upgrades were found for this tree.
          </div>
        )}

        {isTreeView ? (
          <div
            style={{
              ...panelStyle,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ fontSize: 12, color: "#9eb0c2" }}>
              Tree mode groups upgrades by tier. Each node shows its blockers
              and unlocks. Click a node to open its full details.
            </div>

            <div
              style={{
                overflowX: "auto",
                paddingBottom: 4,
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: treeBoardWidth,
                  minHeight: treeBoardHeight,
                }}
              >
                <svg
                  width={treeBoardWidth}
                  height={treeBoardHeight}
                  viewBox={`0 0 ${treeBoardWidth} ${treeBoardHeight}`}
                  style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    overflow: "visible",
                  }}
                  aria-hidden="true"
                >
                  {treeConnectors.map((connector) => (
                    <g key={connector.key}>
                      <path
                        d={`M ${connector.startX} ${connector.startY} C ${connector.startX} ${connector.controlY1}, ${connector.endX} ${connector.controlY2}, ${connector.endX} ${connector.endY}`}
                        fill="none"
                        stroke={
                          connector.purchased
                            ? "rgba(143, 222, 151, 0.9)"
                            : "rgba(116, 192, 252, 0.55)"
                        }
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <circle
                        cx={connector.endX}
                        cy={connector.endY}
                        r="4"
                        fill={
                          connector.purchased
                            ? "rgba(143, 222, 151, 0.95)"
                            : "rgba(116, 192, 252, 0.75)"
                        }
                      />
                    </g>
                  ))}
                </svg>

                <div
                  style={{
                    position: "relative",
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    rowGap: treeRowGap,
                    alignItems: "start",
                  }}
                >
                  {tierEntries.map((tierEntry) => (
                    <div
                      key={tierEntry.tier}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                        minWidth: 0,
                        paddingTop: 0,
                      }}
                    >
                      <div
                        style={{
                          height: treeHeaderHeight,
                          fontSize: 11,
                          fontWeight: "bold",
                          letterSpacing: 0.6,
                          textTransform: "uppercase",
                          color: "#9eb0c2",
                          padding: "0 4px",
                        }}
                      >
                        Tier {tierEntry.tier + 1}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          gap: treeColumnGap,
                          flexWrap: "nowrap",
                        }}
                      >
                        {tierEntry.upgrades.map((upgradeDef) => {
                          const presentation =
                            getUpgradePresentation(upgradeDef);
                          const prerequisiteNames = presentation.prerequisites
                            .map((preqId) => getUpgradeDef(preqId)?.name)
                            .filter(Boolean);
                          const linkedNames = (upgradeDef.linkedUpgrades ?? [])
                            .map((linked) => {
                              const unlockDef = getUpgradeDef(linked.upgradeId);
                              return unlockDef
                                ? `${unlockDef.name} @ Lv ${linked.unlocksAtLevel ?? 1}`
                                : null;
                            })
                            .filter(Boolean);

                          return (
                            <button
                              key={upgradeDef.id}
                              style={{
                                ...panelStyle,
                                position: "relative",
                                padding: 12,
                                backgroundColor: presentation.isUnlocked
                                  ? "#1b2d3f"
                                  : "#26171b",
                                border: presentation.isUnlocked
                                  ? "1px solid #34516a"
                                  : "1px solid #7a3f46",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "stretch",
                                gap: 8,
                                textAlign: "left",
                                height: treeNodeHeight,
                                overflow: "hidden",
                                width: treeNodeWidth,
                                flex: `0 0 ${treeNodeWidth}px`,
                              }}
                              onClick={() =>
                                setTreeModalUpgradeId(upgradeDef.id)
                              }
                              title={`Open ${upgradeDef.name}`}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <span style={{ fontSize: 24 }}>
                                  {getUpgradeIcon(upgradeDef)}
                                </span>
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: "bold",
                                    padding: "2px 8px",
                                    borderRadius: 999,
                                    backgroundColor:
                                      presentation.level > 0
                                        ? "rgba(44, 143, 132, 0.24)"
                                        : "rgba(63, 84, 106, 0.35)",
                                    color:
                                      presentation.level > 0
                                        ? "#8ce3d9"
                                        : "#c8d7e5",
                                  }}
                                >
                                  Lv {presentation.level}
                                </span>
                              </div>

                              <div>
                                <div
                                  style={{
                                    fontSize: 13,
                                    fontWeight: "bold",
                                    color: "#f3f7fb",
                                    marginBottom: 4,
                                  }}
                                >
                                  {upgradeDef.name}
                                </div>
                                <div style={{ fontSize: 11, color: "#9eb0c2" }}>
                                  Next: {formatCompactNumber(presentation.cost)}
                                  🪙
                                </div>
                              </div>

                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 6,
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 6,
                                    minHeight: 28,
                                  }}
                                >
                                  {prerequisiteNames.length > 0 ? (
                                    prerequisiteNames.map((name) => (
                                      <span
                                        key={name}
                                        style={{
                                          fontSize: 10,
                                          color: "#c8d7e5",
                                          backgroundColor:
                                            "rgba(116, 192, 252, 0.14)",
                                          border:
                                            "1px solid rgba(116, 192, 252, 0.28)",
                                          borderRadius: 999,
                                          padding: "2px 6px",
                                        }}
                                      >
                                        ← {name}
                                      </span>
                                    ))
                                  ) : (
                                    <span
                                      style={{
                                        fontSize: 10,
                                        color: "#7fdc8b",
                                        backgroundColor:
                                          "rgba(127, 220, 139, 0.12)",
                                        border:
                                          "1px solid rgba(127, 220, 139, 0.24)",
                                        borderRadius: 999,
                                        padding: "2px 6px",
                                      }}
                                    >
                                      Root node
                                    </span>
                                  )}
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 6,
                                    minHeight: 28,
                                  }}
                                >
                                  {linkedNames.length > 0 ? (
                                    linkedNames.map((name) => (
                                      <span
                                        key={name}
                                        style={{
                                          fontSize: 10,
                                          color: "#d9f8de",
                                          backgroundColor:
                                            "rgba(127, 220, 139, 0.12)",
                                          border:
                                            "1px solid rgba(127, 220, 139, 0.24)",
                                          borderRadius: 999,
                                          padding: "2px 6px",
                                        }}
                                      >
                                        {name} →
                                      </span>
                                    ))
                                  ) : (
                                    <span
                                      style={{
                                        fontSize: 10,
                                        color: "#9eb0c2",
                                        backgroundColor:
                                          "rgba(63, 84, 106, 0.24)",
                                        border:
                                          "1px solid rgba(63, 84, 106, 0.42)",
                                        borderRadius: 999,
                                        padding: "2px 6px",
                                      }}
                                    >
                                      Leaf node
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          upgrades.map((upgradeDef) => {
            const presentation = getUpgradePresentation(upgradeDef);

            return (
              <div
                key={upgradeDef.id}
                style={{
                  ...panelStyle,
                  border: presentation.isUnlocked
                    ? "1px solid #2f455b"
                    : "1px solid #7a3f46",
                  borderRadius: 10,
                  padding: 14,
                  marginBottom: 12,
                  backgroundColor: presentation.isUnlocked
                    ? "#16212d"
                    : "#26171b",
                  opacity: presentation.isUnlocked ? 1 : 0.88,
                }}
              >
                <div style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: 14 }}>
                      {upgradeDef.name}
                    </h3>
                    {!presentation.isUnlocked && (
                      <span
                        style={{
                          fontSize: 10,
                          backgroundColor: "#8f1d1d",
                          color: "#fff4f4",
                          padding: "2px 6px",
                          borderRadius: 999,
                          fontWeight: "bold",
                          letterSpacing: 0.4,
                        }}
                      >
                        LOCKED
                      </span>
                    )}
                  </div>
                  {upgradeDef.description && (
                    <p
                      style={{
                        margin: "4px 0",
                        fontSize: 12,
                        color: "#c8d7e5",
                      }}
                    >
                      {upgradeDef.description}
                    </p>
                  )}
                  {presentation.prereqText && (
                    <p
                      style={{
                        margin: "4px 0",
                        fontSize: 11,
                        color: presentation.preqsMet ? "#7fdc8b" : "#f08b91",
                        fontStyle: "italic",
                      }}
                    >
                      {presentation.prereqText}
                    </p>
                  )}
                  {presentation.linkedText && (
                    <p
                      style={{
                        margin: "4px 0",
                        fontSize: 11,
                        color: "#74c0fc",
                      }}
                    >
                      {presentation.linkedText}
                    </p>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontSize: 13 }}>
                    Level: <strong>{presentation.level}</strong>
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: "#9eb0c2",
                    }}
                  >
                    Next: {formatCompactNumber(presentation.cost)}🪙
                  </span>
                </div>

                <button
                  className={presentation.canPurchase ? "btn-primary" : ""}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    cursor:
                      !presentation.isUnlocked || !presentation.canPurchase
                        ? "not-allowed"
                        : "pointer",
                    fontSize: 12,
                    fontWeight: "bold",
                    backgroundColor: presentation.canPurchase
                      ? undefined
                      : "#243445",
                    borderColor: presentation.canPurchase
                      ? undefined
                      : "#3f546a",
                    color: presentation.canPurchase ? undefined : "#8ea3b8",
                  }}
                  onClick={() => {
                    setState((prev) => buyUpgrade(prev, upgradeDef.id));
                  }}
                  disabled={
                    !presentation.isUnlocked || !presentation.canPurchase
                  }
                  title={
                    !presentation.isUnlocked
                      ? "Prerequisites not met"
                      : !presentation.preqsMet
                        ? "Previous upgrade level required"
                        : !presentation.canAfford
                          ? "Not enough gold"
                          : ""
                  }
                >
                  {!presentation.isUnlocked
                    ? "Locked"
                    : presentation.level === 0
                      ? "Unlock"
                      : "Upgrade"}
                </button>
              </div>
            );
          })
        )}

        {isTreeView && selectedModalUpgrade && selectedModalPresentation && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(6, 10, 14, 0.72)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: 16,
            }}
            onClick={() => setTreeModalUpgradeId(null)}
          >
            <div
              style={{
                ...panelStyle,
                width: "min(560px, 96vw)",
                padding: 16,
                border: selectedModalPresentation.isUnlocked
                  ? "1px solid #34516a"
                  : "1px solid #7a3f46",
                backgroundColor: selectedModalPresentation.isUnlocked
                  ? "#16212d"
                  : "#26171b",
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 28 }}>
                    {getUpgradeIcon(selectedModalUpgrade)}
                  </span>
                  <div>
                    <h3 style={{ margin: 0 }}>{selectedModalUpgrade.name}</h3>
                    <div
                      style={{ fontSize: 12, color: "#9eb0c2", marginTop: 4 }}
                    >
                      Level {selectedModalPresentation.level} • Next cost{" "}
                      {formatCompactNumber(selectedModalPresentation.cost)}🪙
                    </div>
                  </div>
                </div>
                <button onClick={() => setTreeModalUpgradeId(null)}>
                  Close
                </button>
              </div>

              {selectedModalUpgrade.description && (
                <p style={{ color: "#c8d7e5", marginBottom: 10 }}>
                  {selectedModalUpgrade.description}
                </p>
              )}

              {selectedModalPresentation.prereqText && (
                <p
                  style={{
                    marginBottom: 8,
                    fontSize: 12,
                    color: selectedModalPresentation.preqsMet
                      ? "#7fdc8b"
                      : "#f08b91",
                  }}
                >
                  {selectedModalPresentation.prereqText}
                </p>
              )}

              {selectedModalPresentation.linkedText && (
                <p style={{ marginBottom: 12, fontSize: 12, color: "#74c0fc" }}>
                  {selectedModalPresentation.linkedText}
                </p>
              )}

              <button
                className={
                  selectedModalPresentation.canPurchase ? "btn-primary" : ""
                }
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  cursor:
                    !selectedModalPresentation.isUnlocked ||
                    !selectedModalPresentation.canPurchase
                      ? "not-allowed"
                      : "pointer",
                  backgroundColor: selectedModalPresentation.canPurchase
                    ? undefined
                    : "#243445",
                  borderColor: selectedModalPresentation.canPurchase
                    ? undefined
                    : "#3f546a",
                  color: selectedModalPresentation.canPurchase
                    ? undefined
                    : "#8ea3b8",
                }}
                onClick={() => {
                  setState((prev) => buyUpgrade(prev, selectedModalUpgrade.id));
                }}
                disabled={
                  !selectedModalPresentation.isUnlocked ||
                  !selectedModalPresentation.canPurchase
                }
              >
                {!selectedModalPresentation.isUnlocked
                  ? "Locked"
                  : selectedModalPresentation.level === 0
                    ? "Unlock"
                    : "Upgrade"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: 16, color: "#e5edf5" }}>
      <h2 style={{ marginBottom: 16 }}>Upgrade Trees</h2>

      {!hasItems && (
        <div
          style={{
            padding: 12,
            borderRadius: 10,
            backgroundColor: "#162433",
            color: "#c7d9ec",
            border: "1px solid #35506a",
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          Your inventory is currently empty. Upgrades still work, but item-based
          stat bonuses stay at zero until you add or find equipment.
        </div>
      )}

      {trees.length === 0 && (
        <div
          style={{
            padding: 12,
            borderRadius: 10,
            backgroundColor: "#2b2318",
            color: "#f2d39b",
            border: "1px solid #6f5630",
          }}
        >
          No upgrade trees are available.
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 10,
        }}
      >
        {trees.map((tree) => {
          const upgrades = getUpgradesByTree(tree);
          const totalLevel = upgrades.reduce(
            (sum, u) => sum + getUpgradeLevel(state, u.id),
            0,
          );
          const unlockedCount = upgrades.filter((u) =>
            isUpgradeUnlocked(state, u.id),
          ).length;

          return (
            <button
              key={tree}
              className="btn-selected"
              style={{
                ...panelStyle,
                padding: 18,
                border: "1px solid #34516a",
                backgroundColor: "#1b2d3f",
                textAlign: "left",
                transition:
                  "transform 0.12s ease, border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease",
                boxShadow: "0 10px 24px rgba(0, 0, 0, 0.22)",
              }}
              onClick={() => {
                setSelectedTree(tree);
                setIsTreeView(false);
                setTreeModalUpgradeId(null);
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  "#22364b";
                (e.currentTarget as HTMLElement).style.borderColor = "#4f6b84";
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 14px 32px rgba(0, 0, 0, 0.3)";
                (e.currentTarget as HTMLElement).style.transform =
                  "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  "#1b2d3f";
                (e.currentTarget as HTMLElement).style.borderColor = "#34516a";
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 10px 24px rgba(0, 0, 0, 0.22)";
                (e.currentTarget as HTMLElement).style.transform =
                  "translateY(0)";
              }}
            >
              <h3
                style={{
                  margin: "0 0 8px 0",
                  fontSize: 18,
                  textAlign: "left",
                  color: "#f3f7fb",
                }}
              >
                {tree.charAt(0).toUpperCase() + tree.slice(1)}
              </h3>
              <p
                style={{
                  margin: "0",
                  fontSize: 12,
                  color: "#9eb0c2",
                  textAlign: "left",
                  lineHeight: 1.45,
                }}
              >
                {upgrades.length} upgrades ({unlockedCount} unlocked) • Level{" "}
                {formatCompactNumber(totalLevel, { minCompactValue: 1000 })}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
