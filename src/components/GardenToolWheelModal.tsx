import { ModalShell } from "./ui/ModalShell";

interface ToolWheelToolEntry {
  key: string;
  equipValue: string;
  toolId: string;
  level: number;
  name: string;
  icon: string;
  description: string;
  isEquipped: boolean;
}

interface ToolWheelSeedEntry {
  seedId: string;
  icon: string;
  label: string;
  count: number;
}

interface GardenToolWheelModalProps {
  isOpen: boolean;
  isMobile: boolean;
  toolTypeFilter: string | null;
  filteredTools: ToolWheelToolEntry[];
  isSeedBagToolEquipped: boolean;
  isPlanterToolEquipped: boolean;
  seedBag: ToolWheelSeedEntry[];
  activeSeedBagSeedId: string | null;
  selectedPlanterSeedId: string | null;
  onClose: () => void;
  onToolTypeFilterChange: (next: string | null) => void;
  onEquipTool: (equipValue: string) => void;
  onSelectSeedBagSeed: (seedId: string) => void;
  onSelectPlanterSeed: (seedId: string) => void;
}

export function GardenToolWheelModal({
  isOpen,
  isMobile,
  toolTypeFilter,
  filteredTools,
  isSeedBagToolEquipped,
  isPlanterToolEquipped,
  seedBag,
  activeSeedBagSeedId,
  selectedPlanterSeedId,
  onClose,
  onToolTypeFilterChange,
  onEquipTool,
  onSelectSeedBagSeed,
  onSelectPlanterSeed,
}: GardenToolWheelModalProps) {
  if (!isOpen) {
    return null;
  }

  const filterTypes = [
    "pickaxe",
    "shovel",
    "wateringcan",
    "sprinkler",
    "harvester",
    "planter",
    "scythe",
    "seedbag",
  ];

  return (
    <ModalShell
      onClose={onClose}
      overlayStyle={{ zIndex: 1000 }}
      panelStyle={{
        ["--modal-width" as string]: "560px",
        ["--modal-width-mobile" as string]: isMobile ? "94vw" : "95vw",
        ["--modal-max-height" as string]: "80vh",
        ["--modal-max-height-mobile" as string]: isMobile ? "88vh" : "88vh",
        ["--modal-padding" as string]: isMobile ? "10px" : "12px",
      }}
    >
      <div className="ui-modal-header" style={{ marginBottom: 8 }}>
        <span>Available Tools</span>
        <button className="ui-modal-close" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="ui-toolwheel-filter-row">
        <button
          className={`${toolTypeFilter === null ? "btn-selected" : ""} ui-toolwheel-filter-btn ui-touch-target`}
          onClick={() => onToolTypeFilterChange(null)}
        >
          All
        </button>
        {filterTypes.map((type) => (
          <button
            key={type}
            className={`${toolTypeFilter === type ? "btn-selected" : ""} ui-toolwheel-filter-btn ui-toolwheel-filter-type ui-touch-target`}
            onClick={() => onToolTypeFilterChange(type)}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="ui-toolwheel-list">
        {filteredTools.length === 0 ? (
          <div className="ui-toolwheel-empty">
            {toolTypeFilter === "harvester"
              ? "Acquire a harvester to use this function."
              : toolTypeFilter === "planter"
                ? "Acquire a planter to use this function."
                : toolTypeFilter === "sprinkler"
                  ? "Acquire a sprinkler to use this function."
                  : "No tools in inventory yet."}
          </div>
        ) : (
          filteredTools.map((tool) => (
            <button
              key={tool.key}
              className="ui-toolwheel-tool-btn ui-touch-target"
              style={{
                padding: isMobile ? 12 : 10,
                backgroundColor: tool.isEquipped ? "#1f7f43" : "#1b2d3f",
                color: tool.isEquipped ? "white" : "#e5edf5",
                fontSize: isMobile ? 12 : 11,
                fontWeight: tool.isEquipped ? "bold" : "normal",
              }}
              onClick={() => onEquipTool(tool.equipValue)}
              title={tool.description}
            >
              <div className="ui-toolwheel-tool-name">
                {tool.icon} {tool.name}
              </div>
              <div className="ui-toolwheel-tool-level">Level {tool.level}</div>
              <div className="ui-toolwheel-tool-desc">{tool.description}</div>
            </button>
          ))
        )}
      </div>

      {isSeedBagToolEquipped && (
        <div className="ui-toolwheel-seed-section">
          <div className="ui-toolwheel-seed-title">
            Seed Bag Tool: Select Seed
          </div>
          {seedBag.length === 0 ? (
            <div className="ui-toolwheel-seed-empty">No seeds available.</div>
          ) : (
            <div className="ui-toolwheel-seed-list">
              {seedBag.map((seed) => (
                <button
                  key={seed.seedId}
                  className={`${activeSeedBagSeedId === seed.seedId ? "btn-selected" : ""} ui-toolwheel-seed-btn ui-touch-target`}
                  onClick={() => onSelectSeedBagSeed(seed.seedId)}
                  title={seed.label}
                >
                  <span>{seed.icon}</span>
                  <span>
                    {seed.label} x{seed.count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {isPlanterToolEquipped && (
        <div className="ui-toolwheel-seed-section">
          <div className="ui-toolwheel-seed-title">
            Planter Tool: Select Seed
          </div>
          {seedBag.length === 0 ? (
            <div className="ui-toolwheel-seed-empty">No seeds available.</div>
          ) : (
            <div className="ui-toolwheel-seed-list">
              {seedBag.map((seed) => (
                <button
                  key={`planter-${seed.seedId}`}
                  className={`${selectedPlanterSeedId === seed.seedId ? "btn-selected" : ""} ui-toolwheel-seed-btn ui-touch-target`}
                  onClick={() => onSelectPlanterSeed(seed.seedId)}
                  title={seed.label}
                >
                  <span>{seed.icon}</span>
                  <span>
                    {seed.label} x{seed.count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </ModalShell>
  );
}
