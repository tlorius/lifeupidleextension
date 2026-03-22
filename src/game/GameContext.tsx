import { createContext, useContext, useState, useEffect, useRef } from "react";
import type { GameState } from "./types";
import { defaultState } from "./state";
import { load, save } from "./storage";
import { applyIdle } from "./engine";

const GameContext = createContext<{
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
} | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(() => {
    let s = load() ?? structuredClone(defaultState);
    const delta = Date.now() - s.meta.lastUpdate;
    applyIdle(s, delta);
    return s;
  });

  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        const next = structuredClone(prev);
        applyIdle(next, 1000);
        save(next);
        return next;
      });
    }, 1000);

    // Save on page unload to prevent data loss
    // Use stateRef to get current state synchronously
    const handleBeforeUnload = () => {
      const currentState = structuredClone(stateRef.current);
      save(currentState);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return (
    <GameContext.Provider value={{ state, setState }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside GameProvider");
  return ctx;
}
