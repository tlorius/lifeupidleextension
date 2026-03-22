import type { GameState } from "./types"

const KEY = "idle_save"

export function save(state: GameState): void {
  state.meta.lastUpdate = Date.now()
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function load(): GameState | null {
  const raw = localStorage.getItem(KEY)
  return raw ? (JSON.parse(raw) as GameState) : null
}