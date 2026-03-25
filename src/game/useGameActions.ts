import { useGame } from "./GameContext";
import type { ClassId } from "./classes";

export function useGameActions() {
  const { dispatch } = useGame();

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
    sellItem: (itemUid: string) =>
      dispatch({ type: "inventory/sellItem", itemUid }),
    usePotion: (itemUid: string) =>
      dispatch({ type: "inventory/usePotion", itemUid }),
    sellSelectedItems: (itemUids: string[]) =>
      dispatch({ type: "inventory/sellSelectedItems", itemUids }),

    addDebugItems: () => dispatch({ type: "inventory/addDebugItems" }),
    buyUpgrade: (upgradeId: string) =>
      dispatch({ type: "upgrade/buy", upgradeId }),
    resetState: () => dispatch({ type: "state/resetToDefault" }),

    combatClickAttack: () => dispatch({ type: "combat/clickAttack" }),
    combatUseConsumable: (itemUid: string) =>
      dispatch({ type: "combat/useConsumable", itemUid }),
    combatCastSpell: (spellId: string) =>
      dispatch({ type: "combat/castSpell", spellId }),
  };
}
