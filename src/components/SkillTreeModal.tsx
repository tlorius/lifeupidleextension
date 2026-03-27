import { useState } from "react";
import { useGame } from "../game/GameContext";
import { useGameActions } from "../game/useGameActions";
import {
  allClassDefinitions,
  canUpgradeClassNode,
  getClassNodeRank,
} from "../game/classes";
import { ModalShell } from "./ui/ModalShell";

interface SkillTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SkillTreeModal({ isOpen, onClose }: SkillTreeModalProps) {
  const { state } = useGame();
  const { upgradeClassNode } = useGameActions();
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null);
  const [isConnectedView, setIsConnectedView] = useState(false);

  const activeClassId = state.character.activeClassId;
  const activeClass = allClassDefinitions.find((c) => c.id === activeClassId);

  if (!isOpen || !activeClass) return null;

  const nodes = activeClass.nodes;
  const dependentNodesById = nodes.reduce<Record<string, string[]>>(
    (accumulator, node) => {
      for (const prerequisiteId of node.prerequisites ?? []) {
        if (!accumulator[prerequisiteId]) {
          accumulator[prerequisiteId] = [];
        }
        accumulator[prerequisiteId].push(node.id);
      }
      return accumulator;
    },
    {},
  );

  return (
    <ModalShell
      onClose={onClose}
      panelStyle={{
        width: "min(900px, 100%)",
      }}
    >
      {/* Header */}
      <div className="ui-modal-header" style={{ marginBottom: 16 }}>
        <h2 className="ui-modal-title">{activeClass.name} Skill Tree</h2>
        <button className="ui-modal-close" onClick={onClose}>
          Close
        </button>
      </div>

      {/* Class Description */}
      <div className="ui-section-divider">
        <div className="ui-skill-fantasy">{activeClass.fantasy}</div>
        <div className="ui-skill-class-summary">{activeClass.summary}</div>
      </div>

      {/* Skill Points Display */}
      <div className="ui-section-divider ui-skill-points-row">
        <div className="ui-skill-points-label">
          Available Skill Points: {state.character.availableSkillPoints}
        </div>
        <button
          className="ui-skill-view-toggle"
          onClick={() => setIsConnectedView((value) => !value)}
        >
          {isConnectedView ? "Card View" : "Connected View"}
        </button>
      </div>

      {isConnectedView ? (
        <div className="ui-skill-connected-list">
          {nodes.map((node) => {
            const rank = getClassNodeRank(state, activeClass.id, node.id);
            const canUpgrade = canUpgradeClassNode(
              state,
              activeClass.id,
              node.id,
            );
            const prerequisiteIds = node.prerequisites ?? [];
            const dependentIds = dependentNodesById[node.id] ?? [];

            return (
              <div key={node.id} className="ui-skill-connected-node">
                <div className="ui-skill-node-head" style={{ marginBottom: 6 }}>
                  <div style={{ flex: 1 }}>
                    <div className="ui-skill-node-title">{node.name}</div>
                    <div className="ui-skill-node-rank">
                      Rank {rank}/{node.maxRank}
                    </div>
                  </div>
                  <button
                    className="ui-skill-node-plus ui-touch-target"
                    disabled={!canUpgrade}
                    onClick={() => upgradeClassNode(activeClass.id, node.id)}
                    style={{
                      color: canUpgrade ? "#d6ecff" : "#666",
                      cursor: canUpgrade ? "pointer" : "not-allowed",
                      opacity: canUpgrade ? 1 : 0.5,
                    }}
                  >
                    +
                  </button>
                </div>

                <div className="ui-skill-connected-effect">
                  {node.description}
                </div>

                <div className="ui-skill-connected-links">
                  <div>
                    <strong>Requires:</strong>{" "}
                    {prerequisiteIds.length === 0
                      ? "None"
                      : prerequisiteIds
                          .map(
                            (id) =>
                              nodes.find((entry) => entry.id === id)?.name ??
                              id,
                          )
                          .join(" | ")}
                  </div>
                  <div>
                    <strong>Unlocks:</strong>{" "}
                    {dependentIds.length === 0
                      ? "None"
                      : dependentIds
                          .map(
                            (id) =>
                              nodes.find((entry) => entry.id === id)?.name ??
                              id,
                          )
                          .join(" | ")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="ui-skill-node-grid">
          {nodes.map((node) => {
            const rank = getClassNodeRank(state, activeClass.id, node.id);
            const canUpgrade = canUpgradeClassNode(
              state,
              activeClass.id,
              node.id,
            );
            const isExpanded = expandedNodeId === node.id;

            return (
              <div
                key={node.id}
                className="ui-skill-node-card"
                onClick={() => setExpandedNodeId(isExpanded ? null : node.id)}
              >
                <div
                  className="ui-skill-node-head"
                  style={{ marginBottom: isExpanded ? 8 : 0 }}
                >
                  <div style={{ flex: 1 }}>
                    <div className="ui-skill-node-title">{node.name}</div>
                    <div className="ui-skill-node-rank">
                      Rank {rank}/{node.maxRank}
                    </div>
                  </div>
                  <button
                    className="ui-skill-node-plus ui-touch-target"
                    disabled={!canUpgrade}
                    onClick={(event) => {
                      event.stopPropagation();
                      upgradeClassNode(activeClass.id, node.id);
                    }}
                    style={{
                      color: canUpgrade ? "#d6ecff" : "#666",
                      cursor: canUpgrade ? "pointer" : "not-allowed",
                      opacity: canUpgrade ? 1 : 0.5,
                    }}
                  >
                    +
                  </button>
                </div>

                {isExpanded && (
                  <div className="ui-skill-node-body">
                    <div style={{ marginBottom: 6 }}>
                      <strong>Effect:</strong>
                      <div style={{ opacity: 0.9, marginTop: 2 }}>
                        {node.description}
                      </div>
                    </div>

                    {node.prerequisites && node.prerequisites.length > 0 && (
                      <div className="ui-skill-node-reqs">
                        <strong style={{ fontSize: 9 }}>Requires:</strong>
                        <div
                          style={{
                            fontSize: 9,
                            opacity: 0.8,
                            marginTop: 2,
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                          }}
                        >
                          {node.prerequisites.map((preqId) => {
                            const preqNode = nodes.find((n) => n.id === preqId);
                            const preqRank = getClassNodeRank(
                              state,
                              activeClass.id,
                              preqId,
                            );
                            return (
                              <div key={preqId}>
                                {preqNode?.name} (Rank {preqRank}/
                                {preqNode?.maxRank})
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Legend/Info */}
      <div className="ui-section-divider-top ui-skill-legend-grid">
        <div>
          ✓ <strong>Passive:</strong> Effects are always active. No slots
          needed.
        </div>
        <div>
          🔗 <strong>Prerequisites:</strong> Unlock nodes in order.
        </div>
        <div>
          ⬆ <strong>Click +:</strong> Upgrade when you have skill points.
        </div>
        <div>
          💡 <strong>Click node:</strong> Expand to see full details.
        </div>
      </div>
    </ModalShell>
  );
}
