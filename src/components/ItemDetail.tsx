import { useGame } from "../game/GameContext";
import { getItemDefSafe } from "../game/items";
import {
  getItemStats,
  calculateUpgradeCost,
  isItemEquipped,
  equipItem,
  upgradeItem,
  sellItem,
} from "../game/engine";
import type { ItemInstance } from "../game/types";

interface ItemDetailProps {
  item: ItemInstance;
  onClose: () => void;
}

export function ItemDetail({ item, onClose }: ItemDetailProps) {
  const { state, setState } = useGame();
  const def = getItemDefSafe(item.itemId);

  if (!def) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
        onClick={onClose}
      >
        <div
          style={{
            backgroundColor: "white",
            padding: 20,
            borderRadius: 8,
            maxWidth: 400,
            width: "90%",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <p>Unknown item</p>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  const stats = getItemStats(item, def);
  const equipped = isItemEquipped(state, item.uid);
  const upgradeCost = calculateUpgradeCost(item.level, def.rarity);
  const canAffordUpgrade = (state.resources.gems ?? 0) >= upgradeCost;

  // Get rarity color
  const rarityColors: Record<string, string> = {
    common: "#999999",
    rare: "#4169E1",
    epic: "#9932CC",
    legendary: "#FFD700",
    unique: "#FF8C00",
  };

  const rarityColor = rarityColors[def.rarity] || "#999999";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: 20,
          borderRadius: 8,
          maxWidth: 400,
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: "1px solid #eee",
          }}
        >
          <h2 style={{ margin: "0 0 8px 0", color: rarityColor }}>
            {def.name}
          </h2>
          <p style={{ margin: "4px 0", fontSize: 14, color: "#666" }}>
            Lvl {item.level} • {def.rarity}
          </p>
        </div>

        {Object.keys(stats).length > 0 && (
          <div
            style={{
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: "1px solid #eee",
            }}
          >
            <h3 style={{ margin: "0 0 8px 0", fontSize: 14 }}>Stats</h3>
            {Object.entries(stats).map(([key, value]) => (
              <div key={key} style={{ fontSize: 13, marginBottom: 4 }}>
                <strong>{key}:</strong>{" "}
                {typeof value === "number" ? value.toFixed(1) : value}
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: "1px solid #eee",
          }}
        >
          <h3 style={{ margin: "0 0 8px 0", fontSize: 14 }}>Actions</h3>

          {/* Equip Button */}
          <button
            style={{
              padding: "10px 12px",
              fontSize: "14px",
              width: "100%",
              marginBottom: 8,
              backgroundColor: equipped ? "#ff6b6b" : "#51cf66",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: equipped ? "not-allowed" : "pointer",
              opacity: equipped ? 0.6 : 1,
            }}
            onClick={() => {
              if (!equipped) {
                setState((prev) => equipItem(prev, item.uid));
              }
            }}
            disabled={equipped}
          >
            {equipped ? "Already Equipped" : "Equip"}
          </button>

          {/* Upgrade Button */}
          <button
            style={{
              padding: "10px 12px",
              fontSize: "14px",
              width: "100%",
              marginBottom: 8,
              backgroundColor: canAffordUpgrade ? "#405DE6" : "#ccc",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: canAffordUpgrade ? "pointer" : "not-allowed",
            }}
            onClick={() => {
              if (canAffordUpgrade) {
                setState((prev) => upgradeItem(prev, item.uid));
              }
            }}
            disabled={!canAffordUpgrade}
          >
            Upgrade ({upgradeCost}💎)
          </button>

          {/* Sell Button */}
          <button
            style={{
              padding: "10px 12px",
              fontSize: "14px",
              width: "100%",
              backgroundColor: "#ff6b6b",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
            onClick={() => {
              setState((prev) => sellItem(prev, item.uid));
              onClose();
            }}
          >
            Sell ({def.sellPrice || 0}🪙)
          </button>
        </div>

        <button
          style={{
            padding: "10px 12px",
            fontSize: "14px",
            width: "100%",
            backgroundColor: "#f0f0f0",
            border: "1px solid #ddd",
            borderRadius: 4,
            cursor: "pointer",
          }}
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
