import type { CSSProperties } from "react";
import { formatCompactNumber } from "../game/numberFormat";
import type {
  UpgradePresentation,
  UpgradeTreeSummary,
  UpgradeTreeViewModel,
} from "../game/selectors/upgrades";
import { ModalShell } from "./ui/ModalShell";

interface UpgradesTreeSelectorProps {
  trees: UpgradeTreeSummary[];
  hasItems: boolean;
  panelStyle: CSSProperties;
  onSelectTree: (tree: string) => void;
}

export function UpgradesTreeSelector({
  trees,
  hasItems,
  panelStyle,
  onSelectTree,
}: UpgradesTreeSelectorProps) {
  return (
    <div className="ui-screen-pad">
      <h2 style={{ marginBottom: 16 }}>Upgrade Trees</h2>

      {!hasItems && (
        <div
          className="ui-notice-card"
          style={{ marginBottom: 16, fontSize: 13 }}
        >
          Your inventory is currently empty. Upgrades still work, but item-based
          stat bonuses stay at zero until you add or find equipment.
        </div>
      )}

      {trees.length === 0 && (
        <div className="ui-notice-card ui-notice-card--warning">
          No upgrade trees are available.
        </div>
      )}

      <div className="ui-grid-gap-10" style={{ gridTemplateColumns: "1fr" }}>
        {trees.map((tree) => (
          <button
            key={tree.tree}
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
            onClick={() => onSelectTree(tree.tree)}
            onMouseEnter={(event) => {
              event.currentTarget.style.backgroundColor = "#22364b";
              event.currentTarget.style.borderColor = "#4f6b84";
              event.currentTarget.style.boxShadow =
                "0 14px 32px rgba(0, 0, 0, 0.3)";
              event.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.backgroundColor = "#1b2d3f";
              event.currentTarget.style.borderColor = "#34516a";
              event.currentTarget.style.boxShadow =
                "0 10px 24px rgba(0, 0, 0, 0.22)";
              event.currentTarget.style.transform = "translateY(0)";
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
              {tree.title.replace(/ Tree$/, "")}
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
              {tree.upgradesCount} upgrades ({tree.unlockedCount} unlocked) •
              Level{" "}
              {formatCompactNumber(tree.totalLevel, {
                minCompactValue: 1000,
              })}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

interface UpgradesTreePanelProps {
  treeView: UpgradeTreeViewModel;
  panelStyle: CSSProperties;
  onOpenUpgradeModal: (upgradeId: string) => void;
}

interface UpgradesTreeScreenProps {
  treeView: UpgradeTreeViewModel;
  isTreeView: boolean;
  panelStyle: CSSProperties;
  onBackToTrees: () => void;
  onToggleTreeView: () => void;
  onOpenUpgradeModal: (upgradeId: string) => void;
  onCloseUpgradeModal: () => void;
  onBuyUpgrade: (upgradeId: string) => void;
}

export function UpgradesTreeScreen({
  treeView,
  isTreeView,
  panelStyle,
  onBackToTrees,
  onToggleTreeView,
  onOpenUpgradeModal,
  onCloseUpgradeModal,
  onBuyUpgrade,
}: UpgradesTreeScreenProps) {
  const { upgrades, selectedModalPresentation, treeIcon, treeTitle } = treeView;

  return (
    <div className="ui-screen-pad">
      <div className="ui-view-toolbar">
        <button className="btn-primary ui-touch-target" onClick={onBackToTrees}>
          ← Back to Trees
        </button>
        <button
          className="ui-inline-toggle-btn ui-touch-target"
          style={{
            backgroundColor: isTreeView ? "#2c8f84" : "#253649",
            borderColor: isTreeView ? "#2c8f84" : "#3f546a",
          }}
          onClick={onToggleTreeView}
          aria-label="Toggle tree view"
          title={isTreeView ? "Switch to normal view" : "Switch to tree view"}
        >
          <span>{treeIcon}</span>
          <span>{isTreeView ? "Normal View" : "Tree View"}</span>
        </button>
      </div>

      <h2 className="ui-heading-inline">
        <span>{treeIcon}</span>
        <span>{treeTitle}</span>
      </h2>

      {upgrades.length === 0 && (
        <div
          className="ui-notice-card ui-notice-card--warning"
          style={{ borderRadius: 8, marginBottom: 16 }}
        >
          No upgrades were found for this tree.
        </div>
      )}

      {isTreeView ? (
        <UpgradesTreePanel
          treeView={treeView}
          panelStyle={panelStyle}
          onOpenUpgradeModal={onOpenUpgradeModal}
        />
      ) : (
        <UpgradesListPanel
          upgrades={upgrades}
          panelStyle={panelStyle}
          onBuyUpgrade={onBuyUpgrade}
        />
      )}

      {isTreeView && selectedModalPresentation && (
        <UpgradesTreeModal
          presentation={selectedModalPresentation}
          panelStyle={panelStyle}
          onClose={onCloseUpgradeModal}
          onBuyUpgrade={onBuyUpgrade}
        />
      )}
    </div>
  );
}

export function UpgradesTreePanel({
  treeView,
  panelStyle,
  onOpenUpgradeModal,
}: UpgradesTreePanelProps) {
  const {
    tierEntries,
    treeConnectors,
    layout: {
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
    },
  } = treeView;

  return (
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
        Tree mode groups upgrades by tier. Each node shows its blockers and
        unlocks. Click a node to open its full details.
      </div>

      <div
        style={{
          overflowX: "auto",
          overflowY: "hidden",
          paddingBottom: 4,
          marginInline: isMobileTree ? -4 : 0,
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
                }}
              >
                <div
                  style={{
                    height: treeHeaderHeight,
                    fontSize: isMobileTree ? 10 : 11,
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
                  {tierEntry.upgrades.map((presentation) => (
                    <button
                      key={presentation.upgrade.id}
                      style={{
                        ...panelStyle,
                        position: "relative",
                        padding: treeNodePadding,
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
                        onOpenUpgradeModal(presentation.upgrade.id)
                      }
                      title={`Open ${presentation.upgrade.name}`}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span style={{ fontSize: treeIconSize }}>
                          {presentation.icon}
                        </span>
                        <span
                          style={{
                            fontSize: treeMetaFontSize,
                            fontWeight: "bold",
                            padding: "2px 8px",
                            borderRadius: 999,
                            backgroundColor:
                              presentation.level > 0
                                ? "rgba(44, 143, 132, 0.24)"
                                : "rgba(63, 84, 106, 0.35)",
                            color:
                              presentation.level > 0 ? "#8ce3d9" : "#c8d7e5",
                          }}
                        >
                          Lv {presentation.level}
                        </span>
                      </div>

                      <div>
                        <div
                          style={{
                            fontSize: treeTitleFontSize,
                            fontWeight: "bold",
                            color: "#f3f7fb",
                            marginBottom: 4,
                          }}
                        >
                          {presentation.upgrade.name}
                        </div>
                        <div
                          style={{
                            fontSize: treeMetaFontSize,
                            color: "#9eb0c2",
                          }}
                        >
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
                          {presentation.prerequisiteNames.length > 0 ? (
                            presentation.prerequisiteNames.map((name) => (
                              <span
                                key={name}
                                style={{
                                  fontSize: treeBadgeFontSize,
                                  color: "#c8d7e5",
                                  backgroundColor: "rgba(116, 192, 252, 0.14)",
                                  border: "1px solid rgba(116, 192, 252, 0.28)",
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
                                fontSize: treeBadgeFontSize,
                                color: "#7fdc8b",
                                backgroundColor: "rgba(127, 220, 139, 0.12)",
                                border: "1px solid rgba(127, 220, 139, 0.24)",
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
                          {presentation.linkedNames.length > 0 ? (
                            presentation.linkedNames.map((name) => (
                              <span
                                key={name}
                                style={{
                                  fontSize: treeBadgeFontSize,
                                  color: "#d9f8de",
                                  backgroundColor: "rgba(127, 220, 139, 0.12)",
                                  border: "1px solid rgba(127, 220, 139, 0.24)",
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
                                fontSize: treeBadgeFontSize,
                                color: "#9eb0c2",
                                backgroundColor: "rgba(63, 84, 106, 0.24)",
                                border: "1px solid rgba(63, 84, 106, 0.42)",
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
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface UpgradesListPanelProps {
  upgrades: UpgradePresentation[];
  panelStyle: CSSProperties;
  onBuyUpgrade: (upgradeId: string) => void;
}

export function UpgradesListPanel({
  upgrades,
  panelStyle,
  onBuyUpgrade,
}: UpgradesListPanelProps) {
  return (
    <div className="ui-upgrade-list-stack">
      {upgrades.map((presentation) => {
        const upgradeDef = presentation.upgrade;

        return (
          <div
            key={upgradeDef.id}
            className="ui-upgrade-list-card"
            style={{
              ...panelStyle,
              border: presentation.isUnlocked
                ? "1px solid #2f455b"
                : "1px solid #7a3f46",
              backgroundColor: presentation.isUnlocked ? "#16212d" : "#26171b",
              opacity: presentation.isUnlocked ? 1 : 0.88,
            }}
          >
            <div style={{ marginBottom: 8 }}>
              <div className="ui-upgrade-head-row">
                <h3 className="ui-upgrade-title">{upgradeDef.name}</h3>
                {!presentation.isUnlocked && (
                  <span className="ui-upgrade-locked-pill">LOCKED</span>
                )}
              </div>
              {upgradeDef.description && (
                <p className="ui-upgrade-desc">{upgradeDef.description}</p>
              )}
              {presentation.prereqText && (
                <p
                  className="ui-upgrade-line"
                  style={{
                    color: presentation.preqsMet ? "#7fdc8b" : "#f08b91",
                    fontStyle: "italic",
                  }}
                >
                  {presentation.prereqText}
                </p>
              )}
              {presentation.linkedText && (
                <p className="ui-upgrade-line" style={{ color: "#74c0fc" }}>
                  {presentation.linkedText}
                </p>
              )}
            </div>

            <div className="ui-upgrade-meta-row">
              <span style={{ fontSize: 13 }}>
                Level: <strong>{presentation.level}</strong>
              </span>
              <span className="ui-upgrade-next-cost">
                Next: {formatCompactNumber(presentation.cost)}🪙
              </span>
            </div>

            <button
              className={`${presentation.canPurchase ? "btn-primary" : ""} ui-upgrade-buy-btn ui-touch-target`}
              style={{
                cursor: presentation.purchaseDisabled
                  ? "not-allowed"
                  : "pointer",
                backgroundColor: presentation.canPurchase
                  ? undefined
                  : "#243445",
                borderColor: presentation.canPurchase ? undefined : "#3f546a",
                color: presentation.canPurchase ? undefined : "#8ea3b8",
              }}
              onClick={() => onBuyUpgrade(upgradeDef.id)}
              disabled={presentation.purchaseDisabled}
              title={presentation.actionTitle}
            >
              {presentation.actionLabel}
            </button>
          </div>
        );
      })}
    </div>
  );
}

interface UpgradesTreeModalProps {
  presentation: UpgradePresentation;
  panelStyle: CSSProperties;
  onClose: () => void;
  onBuyUpgrade: (upgradeId: string) => void;
}

export function UpgradesTreeModal({
  presentation,
  panelStyle,
  onClose,
  onBuyUpgrade,
}: UpgradesTreeModalProps) {
  return (
    <ModalShell
      onClose={onClose}
      overlayStyle={{ zIndex: 1000 }}
      panelStyle={{
        ...panelStyle,
        ["--modal-width" as string]: "560px",
        ["--modal-width-mobile" as string]: "96vw",
        ["--modal-padding" as string]: "16px",
        border: presentation.isUnlocked
          ? "1px solid #34516a"
          : "1px solid #7a3f46",
        backgroundColor: presentation.isUnlocked ? "#16212d" : "#26171b",
      }}
    >
      <div className="ui-upgrade-modal-head">
        <div className="ui-upgrade-modal-title-row">
          <span style={{ fontSize: 28 }}>{presentation.icon}</span>
          <div>
            <h3 style={{ margin: 0 }}>{presentation.upgrade.name}</h3>
            <div style={{ fontSize: 12, color: "#9eb0c2", marginTop: 4 }}>
              Level {presentation.level} • Next cost{" "}
              {formatCompactNumber(presentation.cost)}🪙
            </div>
          </div>
        </div>
        <button className="ui-touch-target" onClick={onClose}>
          Close
        </button>
      </div>

      {presentation.upgrade.description && (
        <p style={{ color: "#c8d7e5", marginBottom: 10 }}>
          {presentation.upgrade.description}
        </p>
      )}

      {presentation.prereqText && (
        <p
          style={{
            marginBottom: 8,
            fontSize: 12,
            color: presentation.preqsMet ? "#7fdc8b" : "#f08b91",
          }}
        >
          {presentation.prereqText}
        </p>
      )}

      {presentation.linkedText && (
        <p style={{ marginBottom: 12, fontSize: 12, color: "#74c0fc" }}>
          {presentation.linkedText}
        </p>
      )}

      <button
        className={`${presentation.canPurchase ? "btn-primary" : ""} ui-upgrade-buy-btn ui-touch-target`}
        style={{
          cursor: presentation.purchaseDisabled ? "not-allowed" : "pointer",
          backgroundColor: presentation.canPurchase ? undefined : "#243445",
          borderColor: presentation.canPurchase ? undefined : "#3f546a",
          color: presentation.canPurchase ? undefined : "#8ea3b8",
        }}
        onClick={() => onBuyUpgrade(presentation.upgrade.id)}
        disabled={presentation.purchaseDisabled}
        title={presentation.actionTitle}
      >
        {presentation.actionLabel}
      </button>
    </ModalShell>
  );
}
