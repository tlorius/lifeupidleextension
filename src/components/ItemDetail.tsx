import { useGame } from "../game/GameContext";
import { useGameActions } from "../game/useGameActions";
import {
  getClassLabel,
  getSetPieceCount,
  hasSetPieceThreshold,
  uniqueSetDefinitions,
} from "../game/itemSets";
import { getGardenCategoryIcon } from "../game/selectors/garden";
import { getItemDefSafe } from "../game/items";
import {
  getItemStats,
  calculateItemUpgradeCosts,
  getSellRewardsForDefinition,
  isItemEquipped,
} from "../game/engine";
import { useState } from "react";
import type { Equipment, Stats } from "../game/types";
import { formatCompactNumber } from "../game/numberFormat";
import type { ItemInstance } from "../game/types";
import { reduceGameAction } from "../game/actions";
import { ModalShell } from "./ui/ModalShell";

export type PotionToastTone = "positive" | "mixed" | "negative" | "neutral";

export interface PotionToastPayload {
  message: string;
  tone: PotionToastTone;
}

interface ItemDetailProps {
  item: ItemInstance;
  onClose: () => void;
  onPotionUsed?: (payload: PotionToastPayload) => void;
  readOnly?: boolean;
}

export function ItemDetail({
  item,
  onClose,
  onPotionUsed,
  readOnly = false,
}: ItemDetailProps) {
  const { state } = useGame();
  const { equipItem, sellItem, upgradeItem, upgradeItemMax, usePotion } =
    useGameActions();
  const [accessoryTargetSlot, setAccessoryTargetSlot] = useState<
    "accessory1" | "accessory2"
  >("accessory1");
  const def = getItemDefSafe(item.itemId);

  if (!def) {
    return (
      <ModalShell
        onClose={onClose}
        panelStyle={{
          ["--modal-width" as string]: "400px",
          ["--modal-width-mobile" as string]: "92vw",
          ["--modal-padding" as string]: "20px",
        }}
      >
        <div>
          <p>Unknown item</p>
          <button onClick={onClose}>Close</button>
        </div>
      </ModalShell>
    );
  }

  const stats = getItemStats(item, def);
  const equipped = isItemEquipped(state, item.uid);
  const upgradeCosts = calculateItemUpgradeCosts(item.level, def);
  const isSprinkler = def.type === "tool" && def.id.includes("sprinkler");
  const isPotion = def.type === "potion";
  const canUpgradeItem = !isPotion;
  const canAffordCurrency =
    upgradeCosts.currency === "gems"
      ? (state.resources.gems ?? 0) >= upgradeCosts.currencyCost
      : (state.resources.ruby ?? 0) >= upgradeCosts.currencyCost;
  const canAffordFarm = upgradeCosts.farmResourceCost
    ? (state.garden.cropStorage.current[
        upgradeCosts.farmResourceCost.category
      ] ?? 0) >= upgradeCosts.farmResourceCost.cost
    : true;
  const canAffordUpgrade = canUpgradeItem && canAffordCurrency && canAffordFarm;
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
  const setDef = def.setId ? uniqueSetDefinitions[def.setId] : null;
  const sellRewards = getSellRewardsForDefinition(def);
  const sellActionLabel =
    def.rarity === "unique"
      ? `Dismantle (${formatCompactNumber(sellRewards.ruby, { minCompactValue: 1000 })}♦️)`
      : `Sell (${formatCompactNumber(sellRewards.gold, { minCompactValue: 1000 })}🪙)`;
  const setPieceCount = def.setId ? getSetPieceCount(state, def.setId) : 0;
  const setClassActive = setDef
    ? state.character.activeClassId === setDef.classId
    : false;
  const twoPieceActive = setDef
    ? hasSetPieceThreshold(state, setDef, 2)
    : false;
  const fourPieceActive = setDef
    ? hasSetPieceThreshold(state, setDef, 4)
    : false;
  const fivePieceActive = setDef
    ? hasSetPieceThreshold(state, setDef, 5)
    : false;

  const formatStatLabel = (stat: string): string =>
    stat.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
  const fourPieceEntries = setDef ? Object.entries(setDef.fourPiece) : [];

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

  const formatUpgradeCostLabel = (): string => {
    const currencyIcon = upgradeCosts.currency === "gems" ? "💎" : "♦️";
    const currencySegment = `${formatCompactNumber(upgradeCosts.currencyCost)}${currencyIcon}`;
    if (!upgradeCosts.farmResourceCost) {
      return currencySegment;
    }

    const farmIcon = getGardenCategoryIcon(
      upgradeCosts.farmResourceCost.category,
    );
    const farmLabel = upgradeCosts.farmResourceCost.category
      .charAt(0)
      .toUpperCase()
      .concat(upgradeCosts.farmResourceCost.category.slice(1));
    return `${currencySegment} + ${formatCompactNumber(upgradeCosts.farmResourceCost.cost)}${farmIcon} ${farmLabel}`;
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
      parts.push(`Mana ${formatDelta(energyDelta)}`);
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
    <ModalShell
      onClose={onClose}
      panelStyle={{
        ["--modal-width" as string]: "400px",
        ["--modal-width-mobile" as string]: "92vw",
        ["--modal-max-height" as string]: "90vh",
        ["--modal-padding" as string]: "20px",
      }}
    >
      <div>
        <div className="ui-detail-section">
          <h2 style={{ margin: "0 0 8px 0", color: rarityColor }}>
            {def.name}
          </h2>
          <p style={{ margin: "4px 0", fontSize: 14, color: "#9eb0c2" }}>
            Lvl {item.level} • {def.rarity}
          </p>
        </div>

        {Object.keys(stats).length > 0 && (
          <div className="ui-detail-section">
            <h3 className="ui-detail-title">Stats</h3>
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

        {def.setId && (
          <div className="ui-detail-section">
            <h3 className="ui-detail-title">Set</h3>
            <div style={{ fontSize: 13, color: "#9fe6da", marginBottom: 6 }}>
              {setDef?.name ?? def.setId}
            </div>
            {setDef ? (
              <>
                <div
                  style={{ fontSize: 12, color: "#c7d3df", marginBottom: 8 }}
                >
                  Equipped pieces: {setPieceCount}/5
                </div>
                <div
                  style={{ fontSize: 12, color: "#c7d3df", marginBottom: 8 }}
                >
                  Class lock: {getClassLabel(setDef.classId)} only{" "}
                  {!setClassActive ? "(currently inactive)" : "(active)"}
                </div>
                <div
                  style={{ fontSize: 12, color: "#dce6f0", marginBottom: 6 }}
                >
                  <strong
                    style={{
                      color: twoPieceActive ? "#73dc9a" : "#9eb0c2",
                    }}
                  >
                    2-piece {twoPieceActive ? "(active)" : "(inactive)"}
                  </strong>
                  <div style={{ marginTop: 4 }}>
                    {Object.entries(setDef.twoPiece).map(([key, value]) => (
                      <div key={`two-${key}`} style={{ fontSize: 12 }}>
                        +
                        {formatCompactNumber(value ?? 0, {
                          minCompactValue: 1000,
                        })}{" "}
                        {formatStatLabel(key)}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#dce6f0" }}>
                  <strong
                    style={{
                      color: fourPieceActive ? "#73dc9a" : "#9eb0c2",
                    }}
                  >
                    4-piece {fourPieceActive ? "(active)" : "(inactive)"}
                  </strong>
                  <div style={{ marginTop: 4 }}>
                    {(setDef.fourPieceSetStatBonusPercent ?? 0) > 0 ? (
                      <div style={{ fontSize: 12 }}>
                        +{setDef.fourPieceSetStatBonusPercent}% to all equipped
                        set item stats
                      </div>
                    ) : null}
                    {fourPieceEntries.map(([key, value]) => (
                      <div key={`four-${key}`} style={{ fontSize: 12 }}>
                        +
                        {formatCompactNumber(value ?? 0, {
                          minCompactValue: 1000,
                        })}{" "}
                        {formatStatLabel(key)}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#dce6f0", marginTop: 6 }}>
                  <strong
                    style={{
                      color: fivePieceActive ? "#73dc9a" : "#9eb0c2",
                    }}
                  >
                    5-piece {fivePieceActive ? "(active)" : "(inactive)"}
                  </strong>
                  <div style={{ marginTop: 4 }}>
                    {Object.entries(setDef.fivePiece).map(([key, value]) => (
                      <div key={`five-${key}`} style={{ fontSize: 12 }}>
                        +
                        {formatCompactNumber(value ?? 0, {
                          minCompactValue: 1000,
                        })}{" "}
                        {formatStatLabel(key)}
                      </div>
                    ))}
                    {setDef.fivePieceSpellBonus ? (
                      <div
                        style={{ fontSize: 12, marginTop: 4, color: "#ffd28a" }}
                      >
                        {setDef.fivePieceSpellBonus.description}
                      </div>
                    ) : null}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: "#9eb0c2" }}>
                Set bonuses are not defined for this set yet.
              </div>
            )}
          </div>
        )}

        {isEquipableType && comparableSlots.length > 0 && (
          <div className="ui-detail-section">
            <h3 className="ui-detail-title">Comparison vs Equipped</h3>

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
                <div key={slot} className="ui-compare-card">
                  <div className="ui-compare-slot-title">
                    {slotLabel[slot]}: {equippedDef?.name ?? "(empty)"}
                  </div>

                  {equippedDef && statKeys.length > 0 ? (
                    <div className="ui-compare-grid">
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
                            className="ui-compare-row"
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

        <div className="ui-detail-section">
          <h3 className="ui-detail-title">Actions</h3>

          {readOnly && (
            <div className="ui-effect-card" style={{ marginBottom: 8 }}>
              Preview mode: actions are disabled in shop item inspection.
            </div>
          )}

          {isPotion && (
            <div className="ui-effect-card">
              {def.id === "health_potion" && "Use: Restore 50 mana."}
              {def.id === "mana_potion" &&
                "Use: +25% gold income for 10 minutes."}
              {def.id === "elixir" &&
                "Use: Restore 30 mana and +60% gold income for 20 minutes."}
              {def.id === "immortal_brew" &&
                "Use: Full mana, permanent +2 to attack/defense/intelligence, and +100% gold income for 30 minutes."}
              {def.id === "swift_tonic" &&
                "Use: +200% gold income for 5 minutes. Short but powerful burst."}
              {def.id === "fortitude_brew" &&
                "Use: Restore full mana and permanently gain +3 defense."}
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
              className="btn-primary ui-full-width-btn ui-touch-target"
              style={{ marginBottom: 8 }}
              disabled={readOnly}
              onClick={() => {
                if (readOnly) return;
                const projectedState = reduceGameAction(state, {
                  type: "inventory/usePotion",
                  itemUid: item.uid,
                });
                const toastPayload = getPotionEffectToastMessage(
                  state,
                  projectedState,
                );

                usePotion(item.uid);
                onPotionUsed?.(toastPayload);
                onClose();
              }}
            >
              {readOnly ? "Use Potion (Preview)" : "Use Potion"}
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
                <div className="ui-detail-option-row">
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
                        className={`${accessoryTargetSlot === slot ? "btn-selected" : ""} ui-touch-target`}
                        style={{ flex: 1, fontSize: 12 }}
                        onClick={() => setAccessoryTargetSlot(slot)}
                      >
                        {slotLabel[slot]}: {equippedDef?.name ?? "Empty"}
                      </button>
                    );
                  })}
                </div>
                <button
                  className="btn-primary ui-full-width-btn ui-touch-target"
                  disabled={readOnly}
                  onClick={() => {
                    if (readOnly) return;
                    equipItem(item.uid, accessoryTargetSlot);
                  }}
                >
                  {readOnly
                    ? `Equip in ${slotLabel[accessoryTargetSlot]} (Preview)`
                    : `Equip in ${slotLabel[accessoryTargetSlot]}`}
                </button>
              </div>
            ) : (
              <button
                className={`${!equipped && isEquipableType ? "btn-primary" : ""} ui-full-width-btn ui-touch-target`}
                style={{
                  marginBottom: 8,
                  cursor:
                    !readOnly && !equipped && isEquipableType
                      ? "pointer"
                      : "not-allowed",
                  opacity: !equipped && isEquipableType ? 1 : 0.6,
                }}
                onClick={() => {
                  if (!readOnly && !equipped && isEquipableType) {
                    equipItem(item.uid);
                  }
                }}
                disabled={readOnly || equipped || !isEquipableType}
              >
                {readOnly
                  ? "Equip (Preview)"
                  : equipped
                    ? "Already Equipped"
                    : "Equip"}
              </button>
            ))}

          {/* Upgrade Buttons */}
          <div className="ui-detail-option-row" style={{ marginBottom: 8 }}>
            <button
              className={`${canAffordUpgrade ? "btn-primary" : ""} ui-full-width-btn ui-touch-target`}
              style={{
                marginBottom: 0,
                cursor:
                  !readOnly && canAffordUpgrade ? "pointer" : "not-allowed",
                opacity: canUpgradeItem ? 1 : 0.65,
                flex: 1,
              }}
              onClick={() => {
                if (!readOnly && canAffordUpgrade) {
                  upgradeItem(item.uid);
                }
              }}
              disabled={readOnly || !canAffordUpgrade}
            >
              {readOnly
                ? "Upgrade (Preview)"
                : canUpgradeItem
                  ? `Upgrade (${formatUpgradeCostLabel()})`
                  : "Potions cannot be upgraded"}
            </button>

            {canUpgradeItem ? (
              <button
                className="ui-touch-target"
                style={{
                  minWidth: 110,
                  fontSize: 12,
                  padding: "8px 10px",
                  cursor:
                    !readOnly && canAffordUpgrade ? "pointer" : "not-allowed",
                  opacity: canAffordUpgrade ? 1 : 0.6,
                }}
                onClick={() => {
                  if (!readOnly && canAffordUpgrade) {
                    upgradeItemMax(item.uid);
                  }
                }}
                disabled={readOnly || !canAffordUpgrade}
                title={
                  readOnly
                    ? "Upgrade max (Preview)"
                    : "Upgrade until you run out of required resources"
                }
              >
                {readOnly ? "Max (Preview)" : "Upgrade Max"}
              </button>
            ) : null}
          </div>

          {/* Sell Button */}
          <button
            className="btn-danger ui-full-width-btn ui-touch-target"
            disabled={readOnly}
            onClick={() => {
              if (readOnly) return;
              sellItem(item.uid);
              onClose();
            }}
          >
            {readOnly ? "Sell (Preview)" : sellActionLabel}
          </button>
        </div>

        <button className="ui-full-width-btn ui-touch-target" onClick={onClose}>
          Close
        </button>
      </div>
    </ModalShell>
  );
}
