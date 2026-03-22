import { useEffect, useState } from "react"
import { defaultState } from "./game/state"
import { load, save } from "./game/storage"
import { applyIdle } from "./game/engine"
import type { GameState } from "./game/types"

function App() {
  const [state, setState] = useState<GameState>(() => {
    let s = load() ?? structuredClone(defaultState)

    const now = Date.now()
    const delta = now - s.meta.lastUpdate

    applyIdle(s, delta)
    return s
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        const next: GameState = {
          ...prev,
          resources: { ...prev.resources },
          stats: { ...prev.stats },
          meta: { ...prev.meta }
        }

        applyIdle(next, 1000)
        save(next)
        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ padding: 20 }}>
      <h1>Idle RPG</h1>
      <p>Gold: {Math.floor(state.resources.gold)}</p>

      <button
        onClick={() => {
          setState(prev => ({
            ...prev,
            resources: {
              ...prev.resources,
              gold: prev.resources.gold + 10
            }
          }))
        }}
      >
        +10 Gold
      </button>
    </div>
  )
}

export default App