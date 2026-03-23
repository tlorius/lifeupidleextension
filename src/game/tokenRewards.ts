import { addItem } from "./engine";
import { getItemDefSafe } from "./items";
import type { GameState } from "./types";

export interface TokenRewardItem {
  itemId: string;
  quantity?: number;
}

export interface NormalizedTokenRewardItem {
  itemId: string;
  quantity: number;
}

export interface GrantedTokenRewardItem extends NormalizedTokenRewardItem {
  level: number;
}

const PROCESSED_TOKENS_KEY = "idle_processed_reward_tokens";

export function extractRewardToken(search: string): string | null {
  const params = new URLSearchParams(search);
  return params.get("token") ?? params.get("rewardToken");
}

export function removeRewardTokenFromUrl(search: string): string {
  const params = new URLSearchParams(search);
  params.delete("token");
  params.delete("rewardToken");
  const next = params.toString();
  return next ? `?${next}` : "";
}

export function loadProcessedTokens(storage: Storage): Set<string> {
  try {
    const raw = storage.getItem(PROCESSED_TOKENS_KEY);
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set<string>();
    return new Set(parsed.filter((entry) => typeof entry === "string"));
  } catch {
    return new Set<string>();
  }
}

export function saveProcessedTokens(
  storage: Storage,
  tokens: Set<string>,
): void {
  storage.setItem(PROCESSED_TOKENS_KEY, JSON.stringify(Array.from(tokens)));
}

export async function resolveTokenRewards(
  token: string,
): Promise<TokenRewardItem[]> {
  // Placeholder for real API call. Keep the mock path active for now.
  // const response = await fetch(`/api/reward-token?token=${encodeURIComponent(token)}`);
  // if (!response.ok) throw new Error("Failed to resolve reward token");
  // const json = await response.json();
  // return Array.isArray(json) ? json : [];

  return mockResolveTokenRewards(token);
}

function mockResolveTokenRewards(token: string): TokenRewardItem[] {
  const normalized = token.trim().toLowerCase();

  if (normalized === "starter-pack") {
    return [
      { itemId: "health_potion", quantity: 3 },
      { itemId: "mana_potion", quantity: 2 },
      { itemId: "ring_1", quantity: 1 },
    ];
  }

  if (normalized === "gardener-kit") {
    return [
      { itemId: "sunflower_seed_common", quantity: 20 },
      { itemId: "carrot_seed_common", quantity: 20 },
      { itemId: "wateringcan_common", quantity: 1 },
    ];
  }

  if (normalized === "legendary-bundle") {
    return [
      { itemId: "excalibur", quantity: 1 },
      { itemId: "excalibur_armor", quantity: 1 },
      { itemId: "infinity_gem", quantity: 1 },
    ];
  }

  if (normalized === "pet-lover") {
    return [
      { itemId: "wolf_pup", quantity: 1 },
      { itemId: "fire_fox", quantity: 1 },
      { itemId: "ice_dragon", quantity: 1 },
    ];
  }

  if (normalized === "alchemy-cache") {
    return [
      { itemId: "health_potion", quantity: 5 },
      { itemId: "mana_potion", quantity: 3 },
      { itemId: "elixir", quantity: 1 },
      { itemId: "fortitude_brew", quantity: 1 },
    ];
  }

  if (normalized === "harvest-surge") {
    return [
      { itemId: "sunflower_seed_common", quantity: 50 },
      { itemId: "carrot_seed_common", quantity: 50 },
      { itemId: "apple_seed_common", quantity: 30 },
      { itemId: "mint_seed_common", quantity: 30 },
      { itemId: "wateringcan_rare", quantity: 1 },
    ];
  }

  return [];
}

export function applyTokenRewards(
  state: GameState,
  rewards: TokenRewardItem[],
): GameState {
  const normalizedRewards = normalizeTokenRewards(rewards);
  let nextState = state;

  for (const reward of normalizedRewards) {
    const quantity = reward.quantity;
    nextState = addItem(nextState, reward.itemId, quantity);
  }

  return nextState;
}

export function normalizeTokenRewards(
  rewards: TokenRewardItem[],
): NormalizedTokenRewardItem[] {
  const normalized: NormalizedTokenRewardItem[] = [];

  for (const reward of rewards) {
    if (!reward?.itemId || !getItemDefSafe(reward.itemId)) continue;
    normalized.push({
      itemId: reward.itemId,
      quantity: Math.max(1, Math.floor(reward.quantity ?? 1)),
    });
  }

  return normalized;
}

export function toGrantedTokenRewards(
  rewards: NormalizedTokenRewardItem[],
): GrantedTokenRewardItem[] {
  return rewards.map((reward) => ({
    ...reward,
    level: 1,
  }));
}
