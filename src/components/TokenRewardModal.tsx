import { useGame } from "../game/GameContext";
import { getItemDefSafe } from "../game/items";
import type { ItemType } from "../game/types";
import { ModalShell } from "./ui/ModalShell";

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
    <ModalShell
      onClose={dismissTokenRewardModal}
      overlayStyle={{ zIndex: 1700, backgroundColor: "rgba(6, 10, 14, 0.74)" }}
      panelStyle={{
        ["--modal-width" as string]: "540px",
        ["--modal-width-mobile" as string]: "92vw",
        ["--modal-max-height" as string]: "84vh",
        ["--modal-padding" as string]: "14px",
      }}
    >
      <div className="ui-modal-header" style={{ marginBottom: 10, gap: 8 }}>
        <h3 style={{ margin: 0, color: "#e8f1fa", fontSize: 16 }}>
          Congrats! You have earned items
        </h3>
        <button
          className="ui-modal-btn-compact ui-touch-target"
          onClick={dismissTokenRewardModal}
        >
          Close
        </button>
      </div>

      <div className="ui-grid-gap-8">
        {tokenRewardModalItems.map((reward, index) => {
          const definition = getItemDefSafe(reward.itemId);
          const isRubyReward = reward.itemId === "ruby_currency";
          if (!definition && !isRubyReward) return null;
          const rarityKey = definition?.rarity ?? "common";
          const accent = rarityAccent[rarityKey] ?? rarityAccent.common;
          const icon = isRubyReward
            ? "♦️"
            : getItemIcon(definition?.type as ItemType);
          const name = isRubyReward
            ? "Ruby"
            : (definition?.name ?? reward.itemId);
          const subtitle = isRubyReward
            ? "resource"
            : `${definition?.rarity} ${definition?.type}`;
          const showLevel = isRubyReward
            ? false
            : shouldShowLevel(definition?.type as ItemType);

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

              <div style={{ fontSize: 20, textAlign: "center" }}>{icon}</div>

              <div>
                <div style={{ color: "#e5edf6", fontWeight: "bold" }}>
                  {name}
                </div>
                <div style={{ color: "#95a8bb", fontSize: 11 }}>{subtitle}</div>
              </div>

              {showLevel ? (
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
    </ModalShell>
  );
}
