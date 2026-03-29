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
  extractPlaytimeToken,
  extractRewardToken,
  type GrantedTokenRewardItem,
  normalizeTokenRewards,
  removePlaytimeTokenFromUrl,
  removeRewardTokenFromUrl,
  resolveRewardTokenDisplayName,
  resolvePlaytimeToken,
  resolveTokenRewards,
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

const MAX_OFFLINE_CATCHUP_MS = 1000 * 60 * 60 * 24 * 14;

function initializeGameState(): InitializationResult {
  let initialState = load() ?? createDefaultState();
  const dailyCheckIn = applyIdlerDailyCheckIn(initialState);
  initialState = dailyCheckIn.state;
  const now = Date.now();
  const lastUpdate =
    typeof initialState.meta.lastUpdate === "number"
      ? initialState.meta.lastUpdate
      : now;
  const rawDelta = now - lastUpdate;
  const delta = Number.isFinite(rawDelta)
    ? Math.max(0, Math.min(rawDelta, MAX_OFFLINE_CATCHUP_MS))
    : 0;
  const beforeGold = initialState.resources.gold;
  const beforeGems = initialState.resources.gems ?? 0;
  const beforePlayerLevel = initialState.playerProgress.level;
  const beforeHighestLevelReached = initialState.combat.highestLevelReached;
  let idleFightReview: IdleFightReview | null = null;

  let afterPassiveGold = beforeGold;

  if (delta > 0) {
    applyIdle(initialState, delta);
    applyGardenIdle(initialState, delta);
    afterPassiveGold = initialState.resources.gold;

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
  // Persist immediately so that if beforeunload fails (mobile, crash, hard
  // refresh before the first tick), the next load uses this timestamp and
  // doesn't re-award the same offline earnings.
  save(initialState);

  const passiveGold = Math.max(0, afterPassiveGold - beforeGold);
  const combatGold = Math.max(
    0,
    initialState.resources.gold - afterPassiveGold,
  );
  const idleEarnings: IdleEarningItem[] = [];
  if (passiveGold > 0) {
    idleEarnings.push({
      resourceId: "gold:passive",
      label: "Idle Gold",
      amount: passiveGold,
      icon: "🪙",
    });
  }
  if (combatGold > 0) {
    idleEarnings.push({
      resourceId: "gold:combat",
      label: "Combat Gold",
      amount: combatGold,
      icon: "⚔️",
    });
  }

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
  tickSpeedMultiplier: number;
  setTickSpeedMultiplier: (multiplier: number) => void;
  tokenRewardModalItems: GrantedTokenRewardItem[];
  dismissTokenRewardModal: () => void;
  rewardInboxBundles: GameState["rewardInbox"]["bundles"];
  unreadRewardBundleCount: number;
  redeemRewardInboxBundle: (bundleId: number) => void;
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
  const [tickSpeedMultiplier, setTickSpeedMultiplier] = useState<number>(1);

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
  const [pendingPlaytimeToken, setPendingPlaytimeToken] = useState<
    string | null
  >(() => extractPlaytimeToken(window.location.search));
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
      const deltaMs = 1000 * tickSpeedMultiplier;
      setState((prev) => {
        const next = structuredClone(prev);
        applyIdle(next, deltaMs);
        applyGardenIdle(next, deltaMs);

        const combatResult = runCombatTick(next.combat, next, deltaMs);
        tickCombatEvents = combatResult.events;

        const withCombat: GameState = {
          ...combatResult.state,
          combat: combatResult.runtime,
        };

        const withPlaytimeConsumed = applyGameAction(withCombat, {
          type: "playtime/consumeMs",
          amountMs: 1000,
        }).state;

        save(withPlaytimeConsumed);
        return withPlaytimeConsumed;
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
  }, [tickSpeedMultiplier]);

  useEffect(() => {
    let cancelled = false;

    if (!pendingPlaytimeToken && !pendingRewardToken) return;

    void (async () => {
      let nextSearch = window.location.search;

      if (pendingPlaytimeToken) {
        try {
          const result = await resolvePlaytimeToken(pendingPlaytimeToken);
          if (!cancelled && result.isValid && result.units > 0) {
            dispatch({ type: "playtime/addTokenUnits", units: result.units });
            nextSearch = removePlaytimeTokenFromUrl(nextSearch);
          }
        } catch (error) {
          console.error("Failed to resolve playtime token", error);
        }
      }

      if (pendingRewardToken) {
        try {
          const rewards = await resolveTokenRewards(pendingRewardToken);
          if (!cancelled && rewards.length > 0) {
            const normalizedRewards = normalizeTokenRewards(rewards);
            if (normalizedRewards.length > 0) {
              dispatch({
                type: "rewards/enqueueTokenBundle",
                sourceToken: pendingRewardToken,
                sourceLabel:
                  resolveRewardTokenDisplayName(pendingRewardToken) ??
                  pendingRewardToken,
                rewards: normalizedRewards,
                receivedAt: Date.now(),
              });
              nextSearch = removeRewardTokenFromUrl(nextSearch);
            }
          }
        } catch (error) {
          console.error("Failed to resolve reward token", error);
        }
      }

      if (!cancelled) {
        const nextUrl = `${window.location.pathname}${nextSearch}${window.location.hash}`;
        window.history.replaceState({}, "", nextUrl);
        setPendingPlaytimeToken(null);
        setPendingRewardToken(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pendingPlaytimeToken, pendingRewardToken]);

  const redeemRewardInboxBundle = (bundleId: number) => {
    const bundle = stateRef.current.rewardInbox.bundles.find(
      (entry) => entry.id === bundleId,
    );
    if (!bundle) return;

    dispatch({
      type: "rewards/redeemInboxBundle",
      bundleId,
    });
    setTokenRewardModalItems(toGrantedTokenRewards(bundle.rewards));
  };

  const unreadRewardBundleCount = state.rewardInbox.bundles.length;

  return (
    <GameContext.Provider
      value={{
        state,
        dispatch,
        tickSpeedMultiplier,
        setTickSpeedMultiplier,
        tokenRewardModalItems,
        dismissTokenRewardModal: () => setTokenRewardModalItems([]),
        rewardInboxBundles: state.rewardInbox.bundles,
        unreadRewardBundleCount,
        redeemRewardInboxBundle,
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
