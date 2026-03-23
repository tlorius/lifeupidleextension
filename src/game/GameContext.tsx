import { createContext, useContext, useState, useEffect, useRef } from "react";
import type { GameState } from "./types";
import { defaultState } from "./state";
import { load, save } from "./storage";
import { applyIdle } from "./engine";
import {
  applyTokenRewards,
  extractRewardToken,
  type GrantedTokenRewardItem,
  loadProcessedTokens,
  normalizeTokenRewards,
  removeRewardTokenFromUrl,
  resolveTokenRewards,
  saveProcessedTokens,
  toGrantedTokenRewards,
} from "./tokenRewards";

const GameContext = createContext<{
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  tokenRewardModalItems: GrantedTokenRewardItem[];
  dismissTokenRewardModal: () => void;
} | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(() => {
    let s = load() ?? structuredClone(defaultState);
    const delta = Date.now() - s.meta.lastUpdate;
    applyIdle(s, delta);
    return s;
  });

  const stateRef = useRef(state);
  const [tokenRewardModalItems, setTokenRewardModalItems] = useState<
    GrantedTokenRewardItem[]
  >([]);

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

  useEffect(() => {
    let cancelled = false;

    const token = extractRewardToken(window.location.search);
    if (!token) return;

    const processedTokens = loadProcessedTokens(localStorage);
    if (processedTokens.has(token)) {
      const nextSearch = removeRewardTokenFromUrl(window.location.search);
      const nextUrl = `${window.location.pathname}${nextSearch}${window.location.hash}`;
      window.history.replaceState({}, "", nextUrl);
      return;
    }

    processedTokens.add(token);
    saveProcessedTokens(localStorage, processedTokens);

    void resolveTokenRewards(token)
      .then((rewards) => {
        if (cancelled || rewards.length === 0) return;
        const normalizedRewards = normalizeTokenRewards(rewards);
        if (normalizedRewards.length === 0) return;
        setState((prev) => {
          const next = applyTokenRewards(prev, normalizedRewards);
          save(next);
          return next;
        });
        setTokenRewardModalItems(toGrantedTokenRewards(normalizedRewards));
      })
      .catch((error) => {
        // Keep placeholder error handling lightweight until API integration is finalized.
        console.error("Failed to resolve reward token", error);
      })
      .finally(() => {
        const nextSearch = removeRewardTokenFromUrl(window.location.search);
        const nextUrl = `${window.location.pathname}${nextSearch}${window.location.hash}`;
        window.history.replaceState({}, "", nextUrl);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <GameContext.Provider
      value={{
        state,
        setState,
        tokenRewardModalItems,
        dismissTokenRewardModal: () => setTokenRewardModalItems([]),
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside GameProvider");
  return ctx;
}
