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
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(6, 10, 14, 0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          padding: isMobile ? 10 : 12,
          backgroundColor: "#16212d",
          borderRadius: 8,
          border: "1px solid #2a3a4c",
          width: isMobile ? "94vw" : "560px",
          maxWidth: "560px",
          maxHeight: isMobile ? "88vh" : "80vh",
          overflow: "auto",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            fontWeight: "bold",
            marginBottom: 8,
            color: "#e5edf5",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Available Tools</span>
          <button
            style={{
              padding: "4px 8px",
              backgroundColor: "#253649",
              border: "1px solid #3f546a",
              color: "#eaf2fb",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 12,
            }}
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 8,
            flexWrap: "wrap",
          }}
        >
          <button
            className={toolTypeFilter === null ? "btn-selected" : ""}
            style={{
              padding: "4px 8px",
              fontSize: 11,
              border: "1px solid #3f546a",
              borderRadius: 3,
              backgroundColor: "#1b2a39",
              color: "#e5edf5",
            }}
            onClick={() => onToolTypeFilterChange(null)}
          >
            All
          </button>
          {filterTypes.map((type) => (
            <button
              key={type}
              className={toolTypeFilter === type ? "btn-selected" : ""}
              style={{
                padding: "4px 8px",
                fontSize: 11,
                border: "1px solid #3f546a",
                borderRadius: 3,
                textTransform: "capitalize",
                backgroundColor: "#1b2a39",
                color: "#e5edf5",
              }}
              onClick={() => onToolTypeFilterChange(type)}
            >
              {type}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
          {filteredTools.length === 0 ? (
            <div
              style={{
                padding: 10,
                border: "1px solid #34516a",
                borderRadius: 4,
                fontSize: 11,
                color: "#9eb0c2",
                backgroundColor: "#1b2d3f",
              }}
            >
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
                style={{
                  padding: isMobile ? 12 : 10,
                  backgroundColor: tool.isEquipped ? "#1f7f43" : "#1b2d3f",
                  color: tool.isEquipped ? "white" : "#e5edf5",
                  border: "1px solid #34516a",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: isMobile ? 12 : 11,
                  fontWeight: tool.isEquipped ? "bold" : "normal",
                  textAlign: "left",
                }}
                onClick={() => onEquipTool(tool.equipValue)}
                title={tool.description}
              >
                <div style={{ fontWeight: "bold" }}>
                  {tool.icon} {tool.name}
                </div>
                <div style={{ fontSize: 10, opacity: 0.92, marginTop: 2 }}>
                  Level {tool.level}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    opacity: 0.78,
                    marginTop: 4,
                    whiteSpace: "normal",
                  }}
                >
                  {tool.description}
                </div>
              </button>
            ))
          )}
        </div>

        {isSeedBagToolEquipped && (
          <div
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: "1px solid #2a3a4c",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: "bold",
                color: "#e5edf5",
                marginBottom: 8,
              }}
            >
              Seed Bag Tool: Select Seed
            </div>
            {seedBag.length === 0 ? (
              <div style={{ fontSize: 11, color: "#9eb0c2" }}>
                No seeds available.
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {seedBag.map((seed) => (
                  <button
                    key={seed.seedId}
                    className={
                      activeSeedBagSeedId === seed.seedId ? "btn-selected" : ""
                    }
                    style={{
                      padding: "4px 8px",
                      fontSize: 11,
                      border: "1px solid #3f546a",
                      borderRadius: 3,
                      backgroundColor: "#1b2a39",
                      color: "#e5edf5",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
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
          <div
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: "1px solid #2a3a4c",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: "bold",
                color: "#e5edf5",
                marginBottom: 8,
              }}
            >
              Planter Tool: Select Seed
            </div>
            {seedBag.length === 0 ? (
              <div style={{ fontSize: 11, color: "#9eb0c2" }}>
                No seeds available.
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {seedBag.map((seed) => (
                  <button
                    key={`planter-${seed.seedId}`}
                    className={
                      selectedPlanterSeedId === seed.seedId
                        ? "btn-selected"
                        : ""
                    }
                    style={{
                      padding: "4px 8px",
                      fontSize: 11,
                      border: "1px solid #3f546a",
                      borderRadius: 3,
                      backgroundColor: "#1b2a39",
                      color: "#e5edf5",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
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
      </div>
    </div>
  );
}
