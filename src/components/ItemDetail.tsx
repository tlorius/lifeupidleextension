import { useGame } from "../game/GameContext";
import { getItemDefSafe } from "../game/items";
import {
  getItemStats,
  calculateUpgradeCost,
  isItemEquipped,
  equipItem,
  upgradeItem,
  sellItem,
  usePotion,
} from "../game/engine";
import { useState } from "react";
import type { Equipment, Stats } from "../game/types";
import { formatCompactNumber } from "../game/numberFormat";
import type { ItemInstance } from "../game/types";

export type PotionToastTone = "positive" | "mixed" | "negative" | "neutral";

export interface PotionToastPayload {
  message: string;
  tone: PotionToastTone;
}

interface ItemDetailProps {
  item: ItemInstance;
  onClose: () => void;
  onPotionUsed?: (payload: PotionToastPayload) => void;
}

export function ItemDetail({ item, onClose, onPotionUsed }: ItemDetailProps) {
  const { state, setState } = useGame();
  const [accessoryTargetSlot, setAccessoryTargetSlot] = useState<
    "accessory1" | "accessory2"
  >("accessory1");
  const def = getItemDefSafe(item.itemId);

  if (!def) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
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
            backgroundColor: "#162433",
            padding: 20,
            borderRadius: 10,
            border: "1px solid #35506a",
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
  const isSprinkler = def.type === "tool" && def.id.includes("sprinkler");
  const isPotion = def.type === "potion";
  const canUpgradeItem = !isPotion;
  const canAffordUpgrade =
    canUpgradeItem && (state.resources.gems ?? 0) >= upgradeCost;
  const isEquipableType =
    ["weapon", "armor", "accessory", "pet", "tool"].includes(def.type) &&
    !isSprinkler;

  const comparableSlots: (keyof Equipment)[] =
    def.type === "accessory"
      ? ["accessory1", "accessory2"]
      : def.type === "weapon"
        ? ["weapon"]
        : def.type === "armor"
          ? ["armor"]
          : def.type === "pet"
            ? ["pet"]
            : def.type === "tool"
              ? ["tool"]
              : [];

  const bothAccessorySlotsFilled =
    def.type === "accessory" &&
    !!state.equipment.accessory1 &&
    !!state.equipment.accessory2;

  const slotLabel: Record<keyof Equipment, string> = {
    weapon: "Weapon",
    armor: "Armor",
    accessory1: "Accessory 1",
    accessory2: "Accessory 2",
    pet: "Pet",
    tool: "Tool",
  };

  // Get rarity color
  const rarityColors: Record<string, string> = {
    common: "#999999",
    rare: "#4169E1",
    epic: "#9932CC",
    legendary: "#FFD700",
    unique: "#FF8C00",
  };

  const rarityColor = rarityColors[def.rarity] || "#999999";

  const renderDotIndicator = (
    selectedValue: number,
    equippedValue: number,
    showIndicator: boolean,
    side: "selected" | "equipped",
  ) => {
    if (!showIndicator) return null;
    if (selectedValue === equippedValue) return null;

    const selectedWins = selectedValue > equippedValue;
    const sideWins = side === "selected" ? selectedWins : !selectedWins;

    return (
      <span
        style={{
          marginLeft: 6,
          width: 9,
          height: 9,
          borderRadius: "50%",
          display: "inline-block",
          backgroundColor: sideWins ? "#4CAF50" : "#EF5350",
          verticalAlign: "middle",
        }}
      />
    );
  };

  const formatDelta = (value: number): string => {
    if (value > 0) return `+${value}`;
    return `${value}`;
  };

  const getPotionEffectToastMessage = (
    previous: typeof state,
    next: typeof state,
  ): PotionToastPayload => {
    const parts: string[] = [];
    let positiveCount = 0;
    let negativeCount = 0;

    const energyDelta =
      (next.resources.energy ?? 0) - (previous.resources.energy ?? 0);
    if (energyDelta > 0) {
      parts.push(`Energy ${formatDelta(energyDelta)}`);
      positiveCount += 1;
    }

    const attackDelta = (next.stats.attack ?? 0) - (previous.stats.attack ?? 0);
    const defenseDelta =
      (next.stats.defense ?? 0) - (previous.stats.defense ?? 0);
    const intelligenceDelta =
      (next.stats.intelligence ?? 0) - (previous.stats.intelligence ?? 0);

    if (attackDelta !== 0) {
      parts.push(`Attack ${formatDelta(attackDelta)}`);
      if (attackDelta > 0) positiveCount += 1;
      if (attackDelta < 0) negativeCount += 1;
    }
    if (defenseDelta !== 0) {
      parts.push(`Defense ${formatDelta(defenseDelta)}`);
      if (defenseDelta > 0) positiveCount += 1;
      if (defenseDelta < 0) negativeCount += 1;
    }
    if (intelligenceDelta !== 0) {
      parts.push(`Intelligence ${formatDelta(intelligenceDelta)}`);
      if (intelligenceDelta > 0) positiveCount += 1;
      if (intelligenceDelta < 0) negativeCount += 1;
    }

    const now = Date.now();
    const tempBeforeActive =
      (previous.temporaryEffects?.goldIncomeBoostUntil ?? 0) > now
        ? (previous.temporaryEffects?.goldIncomeBoostPercent ?? 0)
        : 0;
    const tempAfterActive =
      (next.temporaryEffects?.goldIncomeBoostUntil ?? 0) > now
        ? (next.temporaryEffects?.goldIncomeBoostPercent ?? 0)
        : 0;
    const tempDelta = tempAfterActive - tempBeforeActive;

    if (tempAfterActive > 0 && tempDelta >= 0) {
      const msLeft = Math.max(
        0,
        (next.temporaryEffects?.goldIncomeBoostUntil ?? 0) - now,
      );
      const minutes = Math.floor(msLeft / 60000);
      const seconds = Math.ceil((msLeft % 60000) / 1000);
      const durationLabel =
        minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
      parts.push(`Gold Income +${tempAfterActive}% (${durationLabel})`);
      positiveCount += 1;
    }

    if (parts.length === 0) {
      return { message: "Potion used", tone: "neutral" };
    }

    const tone: PotionToastTone =
      positiveCount > 0 && negativeCount > 0
        ? "mixed"
        : negativeCount > 0
          ? "negative"
          : "positive";

    return {
      message: `Gained: ${parts.join(" | ")}`,
      tone,
    };
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
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
          backgroundColor: "#162433",
          padding: 20,
          borderRadius: 10,
          border: "1px solid #35506a",
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
            borderBottom: "1px solid #2e4256",
          }}
        >
          <h2 style={{ margin: "0 0 8px 0", color: rarityColor }}>
            {def.name}
          </h2>
          <p style={{ margin: "4px 0", fontSize: 14, color: "#9eb0c2" }}>
            Lvl {item.level} • {def.rarity}
          </p>
        </div>

        {Object.keys(stats).length > 0 && (
          <div
            style={{
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: "1px solid #2e4256",
            }}
          >
            <h3 style={{ margin: "0 0 8px 0", fontSize: 14 }}>Stats</h3>
            {Object.entries(stats).map(([key, value]) => (
              <div key={key} style={{ fontSize: 13, marginBottom: 4 }}>
                <strong>{key}:</strong>{" "}
                {typeof value === "number"
                  ? formatCompactNumber(value, { minCompactValue: 1000 })
                  : value}
              </div>
            ))}
          </div>
        )}

        {isEquipableType && comparableSlots.length > 0 && (
          <div
            style={{
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: "1px solid #2e4256",
            }}
          >
            <h3 style={{ margin: "0 0 8px 0", fontSize: 14 }}>
              Comparison vs Equipped
            </h3>

            {comparableSlots.map((slot) => {
              const equippedUid = state.equipment[slot];
              const equippedItem = equippedUid
                ? (state.inventory.find((i) => i.uid === equippedUid) ?? null)
                : null;
              const equippedDef = equippedItem
                ? getItemDefSafe(equippedItem.itemId)
                : null;
              const equippedStats =
                equippedItem && equippedDef
                  ? getItemStats(equippedItem, equippedDef)
                  : ({} as Partial<Stats>);

              const statKeys = Array.from(
                new Set([...Object.keys(stats), ...Object.keys(equippedStats)]),
              ) as (keyof Stats)[];

              return (
                <div
                  key={slot}
                  style={{
                    marginBottom: 10,
                    padding: 10,
                    border: "1px solid #345068",
                    borderRadius: 6,
                    backgroundColor: "#1e2e3f",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: "bold",
                      marginBottom: 6,
                      color: "#dce6f0",
                    }}
                  >
                    {slotLabel[slot]}: {equippedDef?.name ?? "(empty)"}
                  </div>

                  {equippedDef && statKeys.length > 0 ? (
                    <div style={{ display: "grid", gap: 4 }}>
                      {statKeys.map((statKey) => {
                        const selectedHasStat =
                          stats[statKey] !== undefined &&
                          stats[statKey] !== null;
                        const equippedHasStat =
                          equippedStats[statKey] !== undefined &&
                          equippedStats[statKey] !== null;

                        const selectedValue = stats[statKey] ?? 0;
                        const equippedValue = equippedStats[statKey] ?? 0;

                        return (
                          <div
                            key={`${slot}-${String(statKey)}`}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "88px 1fr 1fr",
                              alignItems: "center",
                              columnGap: 8,
                              fontSize: 12,
                            }}
                          >
                            <span style={{ color: "#9eb0c2" }}>{statKey}</span>

                            <span style={{ color: "#e5edf5" }}>
                              <strong>
                                {formatCompactNumber(selectedValue, {
                                  minCompactValue: 1000,
                                })}
                              </strong>
                              {renderDotIndicator(
                                selectedValue,
                                equippedValue,
                                selectedHasStat,
                                "selected",
                              )}
                            </span>

                            <span style={{ color: "#c7d3df" }}>
                              <strong>
                                {formatCompactNumber(equippedValue, {
                                  minCompactValue: 1000,
                                })}
                              </strong>
                              {renderDotIndicator(
                                selectedValue,
                                equippedValue,
                                equippedHasStat,
                                "equipped",
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: "#9eb0c2" }}>
                      No item equipped in this slot.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div
          style={{
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: "1px solid #2e4256",
          }}
        >
          <h3 style={{ margin: "0 0 8px 0", fontSize: 14 }}>Actions</h3>

          {isPotion && (
            <div
              style={{
                marginBottom: 10,
                padding: 8,
                borderRadius: 6,
                border: "1px solid #35506a",
                backgroundColor: "#1d3042",
                color: "#c7d3df",
                fontSize: 12,
              }}
            >
              {def.id === "health_potion" && "Use: Restore 50 energy."}
              {def.id === "mana_potion" &&
                "Use: +25% gold income for 10 minutes."}
              {def.id === "elixir" &&
                "Use: Restore 30 energy and +60% gold income for 20 minutes."}
              {def.id === "immortal_brew" &&
                "Use: Full energy, permanent +2 to attack/defense/intelligence, and +100% gold income for 30 minutes."}
              {def.id === "swift_tonic" &&
                "Use: +200% gold income for 5 minutes. Short but powerful burst."}
              {def.id === "fortitude_brew" &&
                "Use: Restore full energy and permanently gain +3 defense."}
              {def.id === "scholars_draught" &&
                "Use: Permanently gain +5 intelligence and +50% gold income for 15 minutes."}
              {def.id === "berserkers_tonic" &&
                "Use: Permanently gain +10 attack, but lose 3 defense permanently. High risk, high reward."}
              {def.id === "chaos_potion" &&
                "Use: Chaotic outcome — 20% chance each: permanent +15 attack, +15 defense, +15 intelligence, or +300% gold income for 10 minutes. 20% chance: cursed — lose 10 attack, defense, and intelligence permanently."}
            </div>
          )}

          {isPotion && (
            <button
              className="btn-primary"
              style={{
                padding: "10px 12px",
                fontSize: "14px",
                width: "100%",
                marginBottom: 8,
                borderRadius: 4,
              }}
              onClick={() => {
                let toastPayload: PotionToastPayload = {
                  message: "Potion used",
                  tone: "neutral",
                };
                setState((prev) => {
                  const next = usePotion(prev, item.uid);
                  toastPayload = getPotionEffectToastMessage(prev, next);
                  return next;
                });
                onPotionUsed?.(toastPayload);
                onClose();
              }}
            >
              Use Potion
            </button>
          )}

          {isSprinkler && (
            <div
              style={{
                marginBottom: 8,
                fontSize: 12,
                color: "#9eb0c2",
              }}
            >
              Sprinklers are placed directly from the Garden tool wheel and are
              not equipped as character gear.
            </div>
          )}

          {/* Equip Button */}
          {!isPotion &&
            !isSprinkler &&
            (isEquipableType && bothAccessorySlotsFilled && !equipped ? (
              <div style={{ marginBottom: 8 }}>
                <div
                  style={{ fontSize: 12, color: "#9eb0c2", marginBottom: 6 }}
                >
                  Both accessory slots are filled. Choose a slot to replace:
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  {(["accessory1", "accessory2"] as const).map((slot) => {
                    const equippedUid = state.equipment[slot];
                    const equippedItem = equippedUid
                      ? state.inventory.find((i) => i.uid === equippedUid)
                      : null;
                    const equippedDef = equippedItem
                      ? getItemDefSafe(equippedItem.itemId)
                      : null;

                    return (
                      <button
                        key={slot}
                        className={
                          accessoryTargetSlot === slot ? "btn-selected" : ""
                        }
                        style={{ flex: 1, fontSize: 12 }}
                        onClick={() => setAccessoryTargetSlot(slot)}
                      >
                        {slotLabel[slot]}: {equippedDef?.name ?? "Empty"}
                      </button>
                    );
                  })}
                </div>
                <button
                  className="btn-primary"
                  style={{
                    padding: "10px 12px",
                    fontSize: "14px",
                    width: "100%",
                    borderRadius: 4,
                  }}
                  onClick={() => {
                    setState((prev) =>
                      equipItem(prev, item.uid, accessoryTargetSlot),
                    );
                  }}
                >
                  Equip in {slotLabel[accessoryTargetSlot]}
                </button>
              </div>
            ) : (
              <button
                className={!equipped && isEquipableType ? "btn-primary" : ""}
                style={{
                  padding: "10px 12px",
                  fontSize: "14px",
                  width: "100%",
                  marginBottom: 8,
                  borderRadius: 4,
                  cursor:
                    !equipped && isEquipableType ? "pointer" : "not-allowed",
                  opacity: !equipped && isEquipableType ? 1 : 0.6,
                }}
                onClick={() => {
                  if (!equipped && isEquipableType) {
                    setState((prev) => equipItem(prev, item.uid));
                  }
                }}
                disabled={equipped || !isEquipableType}
              >
                {equipped ? "Already Equipped" : "Equip"}
              </button>
            ))}

          {/* Upgrade Button */}
          <button
            className={canAffordUpgrade ? "btn-primary" : ""}
            style={{
              padding: "10px 12px",
              fontSize: "14px",
              width: "100%",
              marginBottom: 8,
              borderRadius: 4,
              cursor: canAffordUpgrade ? "pointer" : "not-allowed",
              opacity: canUpgradeItem ? 1 : 0.65,
            }}
            onClick={() => {
              if (canAffordUpgrade) {
                setState((prev) => upgradeItem(prev, item.uid));
              }
            }}
            disabled={!canAffordUpgrade}
          >
            {canUpgradeItem
              ? `Upgrade (${formatCompactNumber(upgradeCost)}💎)`
              : "Potions cannot be upgraded"}
          </button>

          {/* Sell Button */}
          <button
            className="btn-danger"
            style={{
              padding: "10px 12px",
              fontSize: "14px",
              width: "100%",
              borderRadius: 4,
            }}
            onClick={() => {
              setState((prev) => sellItem(prev, item.uid));
              onClose();
            }}
          >
            Sell ({formatCompactNumber(def.sellPrice || 0)}🪙)
          </button>
        </div>

        <button
          style={{
            padding: "10px 12px",
            fontSize: "14px",
            width: "100%",
            borderRadius: 4,
          }}
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
