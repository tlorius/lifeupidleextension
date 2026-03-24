import { useGame } from "./GameContext";
import type { ClassId } from "./classes";

export function useGameActions() {
  const {
    dispatch,
    performCombatClickAttack,
    useCombatConsumable,
    castCombatSpell,
  } = useGame();

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
    resetState: () => dispatch({ type: "state/resetToDefault" }),

    // Combat wrappers intentionally keep existing runtime internals untouched.
    combatClickAttack: () => performCombatClickAttack(),
    combatUseConsumable: (itemUid: string) => useCombatConsumable(itemUid),
    combatCastSpell: (spellId: string) => castCombatSpell(spellId),
  };
}
