import { createDefaultState } from "./state";
import type { GameState } from "./types";
import type { CombatEvent } from "./combat";
import {
  freeRespecClass,
  setClassSpellSlot,
  switchClass,
  upgradeClassNode,
  type ClassId,
} from "./classes";
import { applyCombatAction, type CombatAction } from "./actionHandlers/combat";
import {
  reduceInventoryAction,
  type InventoryAction,
} from "./actionHandlers/inventory";
import {
  reduceUpgradeAction,
  type UpgradeAction,
} from "./actionHandlers/upgrades";
import { applyGardenAction, type GardenAction } from "./actionHandlers/garden";
import {
  applyTokenRewards,
  type NormalizedTokenRewardItem,
} from "./tokenRewards";

export type GameAction =
  | { type: "resource/addGold"; amount: number }
  | { type: "resource/addGems"; amount: number }
  | { type: "resource/addEnergy"; amount: number }
  | {
      type: "resource/addGoldAndGems";
      goldAmount: number;
      gemsAmount: number;
    }
  | { type: "character/addSkillPoints"; amount: number }
  | { type: "class/switch"; classId: ClassId }
  | { type: "class/freeRespec"; classId: ClassId }
  | { type: "class/upgradeNode"; classId: ClassId; nodeId: string }
  | {
      type: "class/setSpellSlot";
      classId: ClassId;
      slotIndex: number;
      spellId: string | null;
    }
  | CombatAction
  | InventoryAction
  | UpgradeAction
  | GardenAction
  | {
      type: "rewards/applyTokenRewards";
      normalizedRewards: NormalizedTokenRewardItem[];
    }
  | { type: "playtime/addTokenUnits"; units: number }
  | { type: "playtime/consumeMs"; amountMs: number }
  | {
      type: "playtime/configure";
      capMs: number;
      tokenUnitMs: number;
    }
  | {
      type: "rewards/enqueueTokenBundle";
      sourceToken: string;
      sourceLabel?: string;
      rewards: NormalizedTokenRewardItem[];
      receivedAt: number;
    }
  | {
      type: "rewards/redeemInboxBundle";
      bundleId: number;
    }
  | { type: "state/resetToDefault" }
  | { type: "config/reload" };

export interface GameActionResult {
  state: GameState;
  combatEvents: CombatEvent[];
}

export function applyGameAction(
  state: GameState,
  action: GameAction,
): GameActionResult {
  switch (action.type) {
    case "resource/addGold":
      return {
        state: {
          ...state,
          resources: {
            ...state.resources,
            gold: state.resources.gold + action.amount,
          },
        },
        combatEvents: [],
      };

    case "resource/addGems":
      return {
        state: {
          ...state,
          resources: {
            ...state.resources,
            gems: (state.resources.gems ?? 0) + action.amount,
          },
        },
        combatEvents: [],
      };

    case "resource/addEnergy":
      return {
        state: {
          ...state,
          resources: {
            ...state.resources,
            energy: (state.resources.energy ?? 0) + action.amount,
          },
        },
        combatEvents: [],
      };

    case "resource/addGoldAndGems":
      return {
        state: {
          ...state,
          resources: {
            ...state.resources,
            gold: state.resources.gold + action.goldAmount,
            gems: (state.resources.gems ?? 0) + action.gemsAmount,
          },
        },
        combatEvents: [],
      };

    case "character/addSkillPoints":
      return {
        state: {
          ...state,
          character: {
            ...state.character,
            availableSkillPoints:
              state.character.availableSkillPoints + action.amount,
          },
        },
        combatEvents: [],
      };

    case "class/switch":
      return {
        state: switchClass(state, action.classId),
        combatEvents: [],
      };

    case "class/freeRespec":
      return {
        state: freeRespecClass(state, action.classId),
        combatEvents: [],
      };

    case "class/upgradeNode":
      return {
        state: upgradeClassNode(state, action.classId, action.nodeId),
        combatEvents: [],
      };

    case "class/setSpellSlot":
      return {
        state: setClassSpellSlot(
          state,
          action.classId,
          action.slotIndex,
          action.spellId,
        ),
        combatEvents: [],
      };

    case "combat/clickAttack":
    case "combat/useConsumable":
    case "combat/castSpell":
    case "combat/setFightMode":
      return applyCombatAction(state, action);

    case "inventory/equipItem":
    case "inventory/upgradeItem":
    case "inventory/upgradeItemMax":
    case "inventory/sellItem":
    case "inventory/usePotion":
    case "inventory/sellSelectedItems":
    case "inventory/addDebugItems":
    case "inventory/buyShopItem":
      return {
        state: reduceInventoryAction(state, action),
        combatEvents: [],
      };

    case "upgrade/buy":
      return {
        state: reduceUpgradeAction(state, action),
        combatEvents: [],
      };

    case "rewards/applyTokenRewards":
      return {
        state: applyTokenRewards(state, action.normalizedRewards),
        combatEvents: [],
      };

    case "playtime/addTokenUnits": {
      const units = Math.max(0, Math.floor(action.units));
      if (units <= 0) return { state, combatEvents: [] };

      const addMs = units * Math.max(60_000, state.playtime.tokenUnitMs);
      const nextRemaining = state.playtime.remainingMs + addMs;

      return {
        state: {
          ...state,
          playtime: {
            ...state.playtime,
            remainingMs: nextRemaining,
          },
        },
        combatEvents: [],
      };
    }

    case "playtime/consumeMs": {
      const amountMs = Math.max(0, Math.floor(action.amountMs));
      if (amountMs <= 0) return { state, combatEvents: [] };

      return {
        state: {
          ...state,
          playtime: {
            ...state.playtime,
            remainingMs: Math.max(0, state.playtime.remainingMs - amountMs),
          },
        },
        combatEvents: [],
      };
    }

    case "playtime/configure": {
      const nextCapMs = Math.max(60_000, Math.floor(action.capMs));
      const nextUnitMs = Math.max(60_000, Math.floor(action.tokenUnitMs));
      return {
        state: {
          ...state,
          playtime: {
            ...state.playtime,
            capMs: nextCapMs,
            tokenUnitMs: nextUnitMs,
            remainingMs: Math.min(state.playtime.remainingMs, nextCapMs),
          },
        },
        combatEvents: [],
      };
    }

    case "rewards/enqueueTokenBundle": {
      const rewards = action.rewards
        .map((entry) => ({
          itemId: entry.itemId,
          quantity: Math.max(1, Math.floor(entry.quantity)),
        }))
        .filter((entry) => entry.itemId.length > 0);
      if (rewards.length === 0) return { state, combatEvents: [] };

      const nextBundle = {
        id: state.rewardInbox.nextBundleId,
        sourceToken: action.sourceToken,
        sourceLabel: action.sourceLabel,
        rewards,
        receivedAt: action.receivedAt,
      };

      return {
        state: {
          ...state,
          rewardInbox: {
            bundles: [...state.rewardInbox.bundles, nextBundle],
            nextBundleId: state.rewardInbox.nextBundleId + 1,
          },
        },
        combatEvents: [],
      };
    }

    case "rewards/redeemInboxBundle": {
      const target = state.rewardInbox.bundles.find(
        (bundle) => bundle.id === action.bundleId,
      );
      if (!target) {
        return { state, combatEvents: [] };
      }

      const rewardedState = applyTokenRewards(state, target.rewards);
      return {
        state: {
          ...rewardedState,
          rewardInbox: {
            ...rewardedState.rewardInbox,
            bundles: rewardedState.rewardInbox.bundles.filter(
              (bundle) => bundle.id !== action.bundleId,
            ),
          },
        },
        combatEvents: [],
      };
    }

    case "garden/reconcileRocks":
    case "garden/craftSeed":
    case "garden/startSeedMaker":
    case "garden/stopSeedMaker":
    case "garden/selectSeedMakerRecipe":
    case "garden/selectPlanterSeed":
    case "garden/assignPlanterTileSeed":
    case "garden/plantCrop":
    case "garden/harvestCrop":
    case "garden/prestigeCrop":
    case "garden/unlockField":
    case "garden/reduceCropGrowthTime":
    case "garden/setCropSprinkler":
    case "garden/placeSprinkler":
    case "garden/removeSprinkler":
    case "garden/breakRock":
    case "garden/moveCropArea":
    case "garden/toggleSprinkler":
    case "garden/placeHarvester":
    case "garden/removeHarvester":
    case "garden/placePlanter":
    case "garden/removePlanter":
    case "garden/scytheHarvestArea":
    case "garden/waterArea":
    case "garden/seedBagPlantArea":
    case "garden/equipTool":
    case "garden/unequipTool":
      return {
        state: applyGardenAction(state, action),
        combatEvents: [],
      };

    case "state/resetToDefault":
      return {
        state: createDefaultState(),
        combatEvents: [],
      };

    case "config/reload":
      // Config reload doesn't mutate state, but triggers side effects in GameContext
      return {
        state,
        combatEvents: [],
      };

    default:
      return {
        state,
        combatEvents: [],
      };
  }
}

export function reduceGameAction(
  state: GameState,
  action: GameAction,
): GameState {
  return applyGameAction(state, action).state;
}
