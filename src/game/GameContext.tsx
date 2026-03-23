import { createContext, useContext, useState, useEffect, useRef } from "react";
import type { GameState } from "./types";
import { createDefaultState } from "./state";
import { load, save } from "./storage";
import { applyIdle } from "./engine";
import { applyGardenIdle } from "./garden";
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

export interface IdleEarningItem {
  resourceId: string;
  label: string;
  amount: number;
  icon: string;
}

type InitializationResult = {
  state: GameState;
  idleEarnings: IdleEarningItem[];
  idleDurationMs: number;
};

function initializeGameState(): InitializationResult {
  const initialState = load() ?? createDefaultState();
  const now = Date.now();
  const lastUpdate =
    typeof initialState.meta.lastUpdate === "number"
      ? initialState.meta.lastUpdate
      : now;
  const delta = Math.max(0, now - lastUpdate);
  const beforeGold = initialState.resources.gold;

  if (delta > 0) {
    applyIdle(initialState, delta);
    applyGardenIdle(initialState, delta);
  }

  initialState.meta.lastUpdate = now;

  const earnedGold = Math.max(0, initialState.resources.gold - beforeGold);
  const idleEarnings: IdleEarningItem[] =
    earnedGold > 0
      ? [
          {
            resourceId: "gold",
            label: "Gold",
            amount: earnedGold,
            icon: "🪙",
          },
        ]
      : [];

  return {
    state: initialState,
    idleEarnings,
    idleDurationMs: delta,
  };
}

const GameContext = createContext<{
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  tokenRewardModalItems: GrantedTokenRewardItem[];
  dismissTokenRewardModal: () => void;
  idleEarningsModalItems: IdleEarningItem[];
  idleDurationMs: number;
  dismissIdleEarningsModal: () => void;
} | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const initializationRef = useRef<InitializationResult | null>(null);
  if (!initializationRef.current) {
    initializationRef.current = initializeGameState();
  }

  const [state, setState] = useState<GameState>(
    initializationRef.current.state,
  );

  const stateRef = useRef(state);
  const [tokenRewardModalItems, setTokenRewardModalItems] = useState<
    GrantedTokenRewardItem[]
  >([]);
  const [idleEarningsModalItems, setIdleEarningsModalItems] = useState<
    IdleEarningItem[]
  >(initializationRef.current.idleEarnings);
  const [idleDurationMs, setIdleDurationMs] = useState<number>(
    initializationRef.current.idleDurationMs,
  );
  const [pendingRewardToken, setPendingRewardToken] = useState<string | null>(
    () => extractRewardToken(window.location.search),
  );

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        const next = structuredClone(prev);
        applyIdle(next, 1000);
        applyGardenIdle(next, 1000);
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

    const token = pendingRewardToken;
    if (!token) return;
    if (idleEarningsModalItems.length > 0) return;

    const processedTokens = loadProcessedTokens(localStorage);
    if (processedTokens.has(token)) {
      const nextSearch = removeRewardTokenFromUrl(window.location.search);
      const nextUrl = `${window.location.pathname}${nextSearch}${window.location.hash}`;
      window.history.replaceState({}, "", nextUrl);
      setPendingRewardToken(null);
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
        setPendingRewardToken(null);
      });

    return () => {
      cancelled = true;
    };
  }, [pendingRewardToken, idleEarningsModalItems.length]);

  return (
    <GameContext.Provider
      value={{
        state,
        setState,
        tokenRewardModalItems,
        dismissTokenRewardModal: () => setTokenRewardModalItems([]),
        idleEarningsModalItems,
        idleDurationMs,
        dismissIdleEarningsModal: () => {
          setIdleEarningsModalItems([]);
          setIdleDurationMs(0);
        },
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
