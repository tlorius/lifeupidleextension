import { useState } from "react";
import { useGame } from "../game/GameContext";
import { useGameActions } from "../game/useGameActions";
import {
  allClassDefinitions,
  canUpgradeClassNode,
  getClassNodeRank,
} from "../game/classes";

interface SkillTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SkillTreeModal({ isOpen, onClose }: SkillTreeModalProps) {
  const { state } = useGame();
  const { upgradeClassNode } = useGameActions();
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null);

  const activeClassId = state.character.activeClassId;
  const activeClass = allClassDefinitions.find((c) => c.id === activeClassId);

  if (!isOpen || !activeClass) return null;

  const nodes = activeClass.nodes;

  // Group nodes by level for better visualization
  const nodesByLevel = new Map<number, typeof nodes>();
  nodes.forEach((node) => {
    const level = node.prerequisites?.length ?? 0;
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, []);
    }
    nodesByLevel.get(level)!.push(node);
  });

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(6, 10, 16, 0.72)",
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "min(900px, 100%)",
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: 12,
          border: "1px solid #3b5670",
          background: "linear-gradient(170deg, #111b27 0%, #1b2b3c 100%)",
          padding: 16,
          boxShadow: "0 16px 44px rgba(0, 0, 0, 0.45)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 20, color: "#eaf3fb" }}>
            {activeClass.name} Skill Tree
          </h2>
          <button
            onClick={onClose}
            style={{
              borderRadius: 6,
              border: "1px solid rgba(130, 170, 204, 0.4)",
              background: "rgba(20, 35, 50, 0.65)",
              color: "#d8ecff",
              padding: "6px 12px",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            Close
          </button>
        </div>

        {/* Class Description */}
        <div
          style={{
            marginBottom: 14,
            paddingBottom: 14,
            borderBottom: "1px solid rgba(109, 144, 173, 0.25)",
          }}
        >
          <div style={{ color: "#b6d6ea", fontSize: 13, marginBottom: 4 }}>
            {activeClass.fantasy}
          </div>
          <div style={{ color: "#8bc9e9", fontSize: 12 }}>
            {activeClass.summary}
          </div>
        </div>

        {/* Skill Points Display */}
        <div
          style={{
            marginBottom: 14,
            paddingBottom: 14,
            borderBottom: "1px solid rgba(109, 144, 173, 0.25)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ color: "#cfe1ef", fontSize: 13, fontWeight: 600 }}>
            Available Skill Points: {state.character.availableSkillPoints}
          </div>
        </div>

        {/* Nodes Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 10,
          }}
        >
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
                style={{
                  border: "1px solid rgba(107, 138, 166, 0.35)",
                  borderRadius: 8,
                  padding: 8,
                  background: "rgba(13, 23, 34, 0.55)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onClick={() => setExpandedNodeId(isExpanded ? null : node.id)}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(107, 138, 166, 0.65)";
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    "rgba(13, 23, 34, 0.75)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(107, 138, 166, 0.35)";
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    "rgba(13, 23, 34, 0.55)";
                }}
              >
                {/* Compact Node Display */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: isExpanded ? 8 : 0,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#eaf3fb",
                        marginBottom: 2,
                        lineHeight: 1.2,
                      }}
                    >
                      {node.name}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "#99b9d6",
                        marginBottom: 3,
                      }}
                    >
                      Rank {rank}/{node.maxRank}
                    </div>
                  </div>
                  <button
                    disabled={!canUpgrade}
                    onClick={(event) => {
                      event.stopPropagation();
                      upgradeClassNode(activeClass.id, node.id);
                    }}
                    style={{
                      borderRadius: 4,
                      border: "1px solid rgba(125, 168, 200, 0.5)",
                      background: "rgba(24, 40, 58, 0.8)",
                      color: canUpgrade ? "#d6ecff" : "#666",
                      padding: "2px 6px",
                      cursor: canUpgrade ? "pointer" : "not-allowed",
                      fontSize: 10,
                      fontWeight: 600,
                      opacity: canUpgrade ? 1 : 0.5,
                    }}
                  >
                    +
                  </button>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div
                    style={{
                      paddingTop: 8,
                      borderTop: "1px solid rgba(109, 144, 173, 0.25)",
                      fontSize: 10,
                      color: "#c7d3df",
                      lineHeight: 1.5,
                    }}
                  >
                    <div style={{ marginBottom: 6 }}>
                      <strong>Effect:</strong>
                      <div style={{ opacity: 0.9, marginTop: 2 }}>
                        {node.description}
                      </div>
                    </div>

                    {node.prerequisites && node.prerequisites.length > 0 && (
                      <div
                        style={{
                          marginBottom: 4,
                          paddingTop: 6,
                          borderTop: "1px solid rgba(109, 144, 173, 0.15)",
                        }}
                      >
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

        {/* Legend/Info */}
        <div
          style={{
            marginTop: 16,
            paddingTop: 14,
            borderTop: "1px solid rgba(109, 144, 173, 0.25)",
            fontSize: 11,
            color: "#8ea4b7",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
          }}
        >
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
      </div>
    </div>
  );
}
