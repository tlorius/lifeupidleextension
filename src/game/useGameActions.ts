import { useGame } from "./GameContext";
import type { ClassId } from "./classes";

export function useGameActions() {
  const { dispatch, tickSpeedMultiplier, setTickSpeedMultiplier } = useGame();

  return {
    addGold: (amount: number) => dispatch({ type: "resource/addGold", amount }),
    addGems: (amount: number) => dispatch({ type: "resource/addGems", amount }),
    addEnergy: (amount: number) =>
      dispatch({ type: "resource/addEnergy", amount }),
    addGoldAndGems: (goldAmount: number, gemsAmount: number) =>
      dispatch({ type: "resource/addGoldAndGems", goldAmount, gemsAmount }),
    addSkillPoints: (amount: number) =>
      dispatch({ type: "character/addSkillPoints", amount }),

    switchClass: (classId: ClassId) =>
      dispatch({ type: "class/switch", classId }),
    freeRespecClass: (classId: ClassId) =>
      dispatch({ type: "class/freeRespec", classId }),
    upgradeClassNode: (classId: ClassId, nodeId: string) =>
      dispatch({ type: "class/upgradeNode", classId, nodeId }),
    setClassSpellSlot: (
      classId: ClassId,
      slotIndex: number,
      spellId: string | null,
    ) => dispatch({ type: "class/setSpellSlot", classId, slotIndex, spellId }),

    equipItem: (itemUid: string, slot?: "accessory1" | "accessory2") =>
      dispatch({ type: "inventory/equipItem", itemUid, slot }),
    upgradeItem: (itemUid: string) =>
      dispatch({ type: "inventory/upgradeItem", itemUid }),
    upgradeItemMax: (itemUid: string) =>
      dispatch({ type: "inventory/upgradeItemMax", itemUid }),
    sellItem: (itemUid: string) =>
      dispatch({ type: "inventory/sellItem", itemUid }),
    usePotion: (itemUid: string) =>
      dispatch({ type: "inventory/usePotion", itemUid }),
    sellSelectedItems: (itemUids: string[]) =>
      dispatch({ type: "inventory/sellSelectedItems", itemUids }),
    buyShopItem: (
      itemId: string,
      currency: "gold" | "gems" | "ruby",
      costPerItem: number,
      quantity: number = 1,
    ) =>
      dispatch({
        type: "inventory/buyShopItem",
        itemId,
        currency,
        costPerItem,
        quantity,
      }),

    addDebugItems: () => dispatch({ type: "inventory/addDebugItems" }),
    buyUpgrade: (upgradeId: string) =>
      dispatch({ type: "upgrade/buy", upgradeId }),
    resetState: () => dispatch({ type: "state/resetToDefault" }),

    combatClickAttack: () => dispatch({ type: "combat/clickAttack" }),
    combatUseConsumable: (itemUid: string) =>
      dispatch({ type: "combat/useConsumable", itemUid }),
    combatCastSpell: (spellId: string) =>
      dispatch({ type: "combat/castSpell", spellId }),
    combatSetFightMode: (
      mode: "progression" | "farming",
      targetLevel?: number,
    ) => dispatch({ type: "combat/setFightMode", mode, targetLevel }),

    configurePlaytime: (capMinutes: number, tokenUnitMinutes: number) =>
      dispatch({
        type: "playtime/configure",
        capMs: Math.max(1, Math.floor(capMinutes)) * 60 * 1000,
        tokenUnitMs: Math.max(1, Math.floor(tokenUnitMinutes)) * 60 * 1000,
      }),

    tickSpeedMultiplier,
    setTickSpeedMultiplier: (multiplier: 1 | 10 | 100) =>
      setTickSpeedMultiplier(multiplier),
  };
}
