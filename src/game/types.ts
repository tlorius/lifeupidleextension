export interface Meta {
  version: number
  lastUpdate: number
}

export interface Resources {
  gold: number
}

export interface Stats {
  attack: number
}

export interface GameState {
  meta: Meta
  resources: Resources
  stats: Stats
}