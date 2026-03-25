import { createContext, useContext, useState, useEffect, useRef } from "react";
import type { GameState } from "./types";
import { createDefaultState } from "./state";
import { load, save } from "./storage";
import { applyIdle } from "./engine";
import { applyIdlerDailyCheckIn } from "./classes";
import { applyGardenIdle } from "./garden";
import {
  resolveOfflineCombatExpected,
  runCombatTick,
  type CombatEvent,
} from "./combat";
import {
  extractRewardToken,
  type GrantedTokenRewardItem,
  loadProcessedTokens,
  normalizeTokenRewards,
  removeRewardTokenFromUrl,
  resolveTokenRewards,
  saveProcessedTokens,
  toGrantedTokenRewards,
} from "./tokenRewards";
import { applyGameAction, type GameAction } from "./actions";

export interface IdleEarningItem {
  resourceId: string;
  label: string;
  amount: number;
  icon: string;
}

export interface IdleFightReview {
  playerLevelsGained: number;
  gemsGained: number;
  itemsGained: number;
  newEnemiesDefeated: number;
}

type InitializationResult = {
  state: GameState;
  idleEarnings: IdleEarningItem[];
  idleDurationMs: number;
  idleFightReview: IdleFightReview | null;
};

function initializeGameState(): InitializationResult {
  let initialState = load() ?? createDefaultState();
  const dailyCheckIn = applyIdlerDailyCheckIn(initialState);
  initialState = dailyCheckIn.state;
  const now = Date.now();
  const lastUpdate =
    typeof initialState.meta.lastUpdate === "number"
      ? initialState.meta.lastUpdate
      : now;
  const delta = Math.max(0, now - lastUpdate);
  const beforeGold = initialState.resources.gold;
  const beforeGems = initialState.resources.gems ?? 0;
  const beforePlayerLevel = initialState.playerProgress.level;
  const beforeHighestLevelReached = initialState.combat.highestLevelReached;
  let idleFightReview: IdleFightReview | null = null;

  if (delta > 0) {
    applyIdle(initialState, delta);
    applyGardenIdle(initialState, delta);

    const offlineCombat = resolveOfflineCombatExpected(
      initialState.combat,
      initialState,
      delta,
    );
    initialState = {
      ...offlineCombat.state,
      combat: offlineCombat.runtime,
    };

    const playerLevelsGained = Math.max(
      0,
      initialState.playerProgress.level - beforePlayerLevel,
    );
    const gemsGained = Math.max(
      0,
      (initialState.resources.gems ?? 0) - beforeGems,
    );
    const newEnemiesDefeated = Math.max(
      0,
      offlineCombat.runtime.highestLevelReached - beforeHighestLevelReached,
    );

    if (
      playerLevelsGained > 0 ||
      gemsGained > 0 ||
      offlineCombat.itemsGained > 0 ||
      newEnemiesDefeated > 0
    ) {
      idleFightReview = {
        playerLevelsGained,
        gemsGained,
        itemsGained: offlineCombat.itemsGained,
        newEnemiesDefeated,
      };
    }
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

  if (dailyCheckIn.gemsGranted > 0) {
    idleEarnings.push({
      resourceId: "gems",
      label: "Daily Check-In Gems",
      amount: dailyCheckIn.gemsGranted,
      icon: "💎",
    });
  }

  return {
    state: initialState,
    idleEarnings,
    idleDurationMs: delta,
    idleFightReview,
  };
}

const GameContext = createContext<{
  state: GameState;
  dispatch: (action: GameAction) => void;
  tokenRewardModalItems: GrantedTokenRewardItem[];
  dismissTokenRewardModal: () => void;
  idleEarningsModalItems: IdleEarningItem[];
  idleDurationMs: number;
  idleFightReview: IdleFightReview | null;
  dismissIdleEarningsModal: () => void;
  combatEvents: CombatEvent[];
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
  const [idleFightReview, setIdleFightReview] =
    useState<IdleFightReview | null>(initializationRef.current.idleFightReview);
  const [combatEvents, setCombatEvents] = useState<CombatEvent[]>([]);
  const [pendingRewardToken, setPendingRewardToken] = useState<string | null>(
    () => extractRewardToken(window.location.search),
  );

  const dispatch = (action: GameAction) => {
    let nextCombatEvents: CombatEvent[] = [];

    setState((prev) => {
      const result = applyGameAction(prev, action);
      nextCombatEvents = result.combatEvents;
      if (result.state === prev) {
        return prev;
      }
      save(result.state);
      return result.state;
    });

    if (action.type.startsWith("combat/")) {
      setCombatEvents(nextCombatEvents);
    }
  };

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const interval = setInterval(() => {
      let tickCombatEvents: CombatEvent[] = [];
      setState((prev) => {
        const next = structuredClone(prev);
        applyIdle(next, 1000);
        applyGardenIdle(next, 1000);

        const combatResult = runCombatTick(next.combat, next, 1000);
        tickCombatEvents = combatResult.events;

        const withCombat: GameState = {
          ...combatResult.state,
          combat: combatResult.runtime,
        };

        save(withCombat);
        return withCombat;
      });

      setCombatEvents(tickCombatEvents);
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
        dispatch({ type: "rewards/applyTokenRewards", normalizedRewards });
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
        dispatch,
        tokenRewardModalItems,
        dismissTokenRewardModal: () => setTokenRewardModalItems([]),
        idleEarningsModalItems,
        idleDurationMs,
        idleFightReview,
        dismissIdleEarningsModal: () => {
          setIdleEarningsModalItems([]);
          setIdleDurationMs(0);
          setIdleFightReview(null);
        },
        combatEvents,
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
