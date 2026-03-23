import { useGame } from "../game/GameContext";
import { getItemDefSafe } from "../game/items";
import type { ItemType } from "../game/types";

function getItemIcon(itemType: ItemType): string {
  const typeIcons: Record<ItemType, string> = {
    weapon: "⚔️",
    armor: "🛡️",
    accessory: "💍",
    tool: "🔧",
    potion: "🧪",
    seed: "🌱",
    pet: "🐕",
  };

  return typeIcons[itemType] || "📦";
}

function shouldShowLevel(itemType: ItemType): boolean {
  return (
    itemType === "weapon" ||
    itemType === "armor" ||
    itemType === "accessory" ||
    itemType === "tool" ||
    itemType === "pet"
  );
}

export function TokenRewardModal() {
  const { tokenRewardModalItems, dismissTokenRewardModal } = useGame();

  const rarityAccent: Record<string, { border: string; glow: string }> = {
    common: { border: "#6d7b89", glow: "rgba(109, 123, 137, 0.18)" },
    rare: { border: "#4f7df1", glow: "rgba(79, 125, 241, 0.2)" },
    epic: { border: "#a05bf8", glow: "rgba(160, 91, 248, 0.2)" },
    legendary: { border: "#e1b22f", glow: "rgba(225, 178, 47, 0.22)" },
    unique: { border: "#ff9652", glow: "rgba(255, 150, 82, 0.22)" },
  };

  if (tokenRewardModalItems.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(6, 10, 14, 0.74)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1700,
      }}
      onClick={dismissTokenRewardModal}
    >
      <div
        style={{
          width: "min(540px, 92vw)",
          maxHeight: "84vh",
          overflowY: "auto",
          borderRadius: 10,
          border: "1px solid #3b5670",
          backgroundColor: "#162433",
          boxShadow: "0 20px 42px rgba(0, 0, 0, 0.48)",
          padding: 14,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
            gap: 8,
          }}
        >
          <h3 style={{ margin: 0, color: "#e8f1fa", fontSize: 16 }}>
            Congrats! You have earned items
          </h3>
          <button
            style={{ padding: "6px 10px", fontSize: 12 }}
            onClick={dismissTokenRewardModal}
          >
            Close
          </button>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          {tokenRewardModalItems.map((reward, index) => {
            const definition = getItemDefSafe(reward.itemId);
            if (!definition) return null;
            const accent =
              rarityAccent[definition.rarity] ?? rarityAccent.common;

            return (
              <div
                key={`${reward.itemId}-${index}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "74px 34px 1fr auto",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  border: `1px solid ${accent.border}`,
                  borderRadius: 8,
                  backgroundColor: "#1c2e3f",
                  boxShadow: `inset 0 0 0 1px ${accent.glow}`,
                }}
              >
                <div
                  style={{
                    color: "#f4d67f",
                    fontWeight: "bold",
                    fontSize: 14,
                  }}
                >
                  {reward.quantity}x
                </div>

                <div style={{ fontSize: 20, textAlign: "center" }}>
                  {getItemIcon(definition.type)}
                </div>

                <div>
                  <div style={{ color: "#e5edf6", fontWeight: "bold" }}>
                    {definition.name}
                  </div>
                  <div style={{ color: "#95a8bb", fontSize: 11 }}>
                    {definition.rarity} {definition.type}
                  </div>
                </div>

                {shouldShowLevel(definition.type) ? (
                  <div
                    style={{
                      color: "#cfe0f1",
                      fontSize: 12,
                      fontWeight: "bold",
                    }}
                  >
                    Lvl {reward.level}
                  </div>
                ) : (
                  <div style={{ color: "#6f869d", fontSize: 12 }}>-</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
