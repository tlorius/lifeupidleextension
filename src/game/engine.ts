import type { GameState } from "./types"

export function applyIdle(state: GameState, deltaMs: number): void {
  const seconds = deltaMs / 1000
  state.resources.gold += state.stats.attack * seconds
}