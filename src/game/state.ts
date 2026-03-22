import type { GameState } from "./types"

export const defaultState: GameState = {
  meta: {
    version: 1,
    lastUpdate: Date.now()
  },
  resources: {
    gold: 0
  },
  stats: {
    attack: 10
  }
}