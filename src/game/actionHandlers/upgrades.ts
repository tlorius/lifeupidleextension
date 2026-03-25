import { buyUpgrade } from "../upgrades";
import type { GameState } from "../types";

export type UpgradeAction = { type: "upgrade/buy"; upgradeId: string };

export function reduceUpgradeAction(
  state: GameState,
  action: UpgradeAction,
): GameState {
  switch (action.type) {
    case "upgrade/buy":
      return buyUpgrade(state, action.upgradeId);
  }
}
