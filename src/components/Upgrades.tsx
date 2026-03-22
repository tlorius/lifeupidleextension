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

export function Upgrades() {
  const { state, setState } = useGame();
  const [selectedTree, setSelectedTree] = useState<string | null>(null);

  const trees = getUpgradeTrees();
  const hasItems = state.inventory.length > 0;

  if (selectedTree) {
    const upgrades = getUpgradesByTree(selectedTree);
    return (
      <div style={{ padding: 16 }}>
        <button
          style={{
            marginBottom: 16,
            padding: "8px 12px",
            backgroundColor: "#999",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
          onClick={() => setSelectedTree(null)}
        >
          ← Back to Trees
        </button>

        <h2>
          {selectedTree.charAt(0).toUpperCase() + selectedTree.slice(1)} Tree
        </h2>

        {upgrades.length === 0 && (
          <div
            style={{
              padding: 12,
              borderRadius: 6,
              backgroundColor: "#fff8e1",
              color: "#8a6d3b",
              marginBottom: 16,
            }}
          >
            No upgrades were found for this tree.
          </div>
        )}

        {upgrades.map((upgradeDef) => {
          const level = getUpgradeLevel(state, upgradeDef.id);
          const cost = Math.ceil(
            upgradeDef.baseCost * Math.pow(upgradeDef.scaling, level),
          );
          const canAfford = state.resources.gold >= cost;
          const prerequisites = upgradeDef.prerequisites ?? [];
          const isUnlocked = isUpgradeUnlocked(state, upgradeDef.id);
          const preqsMet = areUpgradePrerequisitesMet(state, upgradeDef.id);
          const unlockedByThis = getUnlockedUpgrades(state, upgradeDef.id);

          // Can purchase if: unlocked, prerequisites met, and can afford
          const canPurchase = isUnlocked && preqsMet && canAfford;

          // Build prerequisite display text
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

          // Build linked upgrades display
          const linkedText =
            unlockedByThis.length > 0
              ? `Unlocks: ${unlockedByThis
                  .map((unlockId) => {
                    const unlockDef = getUpgradeDef(unlockId);
                    const linkedUpgrade = upgradeDef.linkedUpgrades?.find(
                      (l) => l.upgradeId === unlockId,
                    );
                    const requiredLevel = linkedUpgrade?.unlocksAtLevel ?? 1;
                    return `${unlockDef?.name} (at level ${requiredLevel})`;
                  })
                  .join(", ")}`
              : "";

          return (
            <div
              key={upgradeDef.id}
              style={{
                border: isUnlocked ? "1px solid #ddd" : "2px solid #ffb3b3",
                borderRadius: 6,
                padding: 12,
                marginBottom: 12,
                backgroundColor: isUnlocked ? "#fafafa" : "#fff5f5",
                opacity: isUnlocked ? 1 : 0.7,
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
                  <h3 style={{ margin: 0, fontSize: 14 }}>{upgradeDef.name}</h3>
                  {!isUnlocked && (
                    <span
                      style={{
                        fontSize: 10,
                        backgroundColor: "#ff9999",
                        color: "white",
                        padding: "2px 6px",
                        borderRadius: 3,
                        fontWeight: "bold",
                      }}
                    >
                      LOCKED
                    </span>
                  )}
                </div>
                {upgradeDef.description && (
                  <p style={{ margin: "4px 0", fontSize: 12, color: "#666" }}>
                    {upgradeDef.description}
                  </p>
                )}
                {prereqText && (
                  <p
                    style={{
                      margin: "4px 0",
                      fontSize: 11,
                      color: preqsMet ? "#51cf66" : "#ff9999",
                      fontStyle: "italic",
                    }}
                  >
                    {prereqText}
                  </p>
                )}
                {linkedText && (
                  <p
                    style={{ margin: "4px 0", fontSize: 11, color: "#4169E1" }}
                  >
                    {linkedText}
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
                  Level: <strong>{level}</strong>
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: "#999",
                  }}
                >
                  Next: {cost}🪙
                </span>
              </div>

              <button
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  backgroundColor: !isUnlocked
                    ? "#999"
                    : canPurchase
                      ? "#51cf66"
                      : "#ccc",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor:
                    !isUnlocked || !canPurchase ? "not-allowed" : "pointer",
                  fontSize: 12,
                  fontWeight: "bold",
                }}
                onClick={() => {
                  setState((prev) => buyUpgrade(prev, upgradeDef.id));
                }}
                disabled={!isUnlocked || !canPurchase}
                title={
                  !isUnlocked
                    ? "Prerequisites not met"
                    : !preqsMet
                      ? "Previous upgrade level required"
                      : !canAfford
                        ? "Not enough gold"
                        : ""
                }
              >
                {!isUnlocked ? "Locked" : level === 0 ? "Unlock" : "Upgrade"}
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Upgrade Trees</h2>

      {!hasItems && (
        <div
          style={{
            padding: 12,
            borderRadius: 6,
            backgroundColor: "#eef6ff",
            color: "#36506c",
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
            borderRadius: 6,
            backgroundColor: "#fff8e1",
            color: "#8a6d3b",
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
              style={{
                padding: 16,
                backgroundColor: "#f5f5f5",
                border: "1px solid #ddd",
                borderRadius: 6,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onClick={() => setSelectedTree(tree)}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  "#e8e8e8";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  "#f5f5f5";
              }}
            >
              <h3
                style={{ margin: "0 0 8px 0", fontSize: 16, textAlign: "left" }}
              >
                {tree.charAt(0).toUpperCase() + tree.slice(1)}
              </h3>
              <p
                style={{
                  margin: "0",
                  fontSize: 12,
                  color: "#666",
                  textAlign: "left",
                }}
              >
                {upgrades.length} upgrades ({unlockedCount} unlocked) • Level{" "}
                {totalLevel}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
