import { addItem } from "./engine";
import { getItemDefSafe } from "./items";
import type { GameState } from "./types";

const PLAYTIME_MOCK_SIGNATURE_SECRET = "playtime-mock-signature-v1";

export interface PlaytimeTokenResolveResult {
  isValid: boolean;
  units: number;
}

export interface SignedMockPlaytimeTokenPayload {
  units: number;
  expiresAt?: number;
  nonce?: string;
}

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

export function extractRewardToken(search: string): string | null {
  const params = new URLSearchParams(search);
  return params.get("token") ?? params.get("rewardToken");
}

export function extractPlaytimeToken(search: string): string | null {
  const params = new URLSearchParams(search);
  return params.get("playtimeToken") ?? params.get("gameTimeToken");
}

export function removeRewardTokenFromUrl(search: string): string {
  const params = new URLSearchParams(search);
  params.delete("token");
  params.delete("rewardToken");
  const next = params.toString();
  return next ? `?${next}` : "";
}

export function removePlaytimeTokenFromUrl(search: string): string {
  const params = new URLSearchParams(search);
  params.delete("playtimeToken");
  params.delete("gameTimeToken");
  const next = params.toString();
  return next ? `?${next}` : "";
}

export async function resolvePlaytimeToken(
  token: string,
): Promise<PlaytimeTokenResolveResult> {
  return mockVerifyPlaytimeToken(token);
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

function mockVerifyPlaytimeToken(token: string): PlaytimeTokenResolveResult {
  const signed = verifySignedMockPlaytimeToken(token);
  if (signed) {
    return {
      isValid: true,
      units: Math.max(0, Math.floor(signed.units)),
    };
  }

  const normalized = token.trim().toLowerCase();
  const aliases: Record<string, number> = {
    "mock-playtime=1u": 1,
    "play-5m=1u": 1,
    "play-15m=3u": 3,
    "play-30m=6u": 6,
    "play-60m=12u": 12,
  };

  const units = aliases[normalized] ?? 0;
  return {
    isValid: units > 0,
    units,
  };
}

export function createSignedMockPlaytimeToken(
  payload: SignedMockPlaytimeTokenPayload,
): string {
  const normalizedPayload: SignedMockPlaytimeTokenPayload = {
    units: Math.max(0, Math.floor(payload.units ?? 0)),
    expiresAt: payload.expiresAt,
    nonce: payload.nonce,
  };
  const encodedPayload = encodeTokenPayload(normalizedPayload);
  const signature = hashTokenPayload(
    `${encodedPayload}.${PLAYTIME_MOCK_SIGNATURE_SECRET}`,
  );
  return `${encodedPayload}.${signature}`;
}

export function verifySignedMockPlaytimeToken(
  token: string,
): SignedMockPlaytimeTokenPayload | null {
  const normalizedToken = token.trim();
  const separatorIndex = normalizedToken.lastIndexOf(".");
  if (separatorIndex <= 0 || separatorIndex >= normalizedToken.length - 1) {
    return null;
  }

  const encodedPayload = normalizedToken.slice(0, separatorIndex);
  const signature = normalizedToken.slice(separatorIndex + 1);
  const expectedSignature = hashTokenPayload(
    `${encodedPayload}.${PLAYTIME_MOCK_SIGNATURE_SECRET}`,
  );
  if (signature !== expectedSignature) {
    return null;
  }

  const payloadJson = decodeBase64Url(encodedPayload);
  if (!payloadJson) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(payloadJson);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  const payload = parsed as SignedMockPlaytimeTokenPayload;
  const units = Math.max(0, Math.floor(payload.units ?? 0));
  if (units <= 0) {
    return null;
  }

  if (
    payload.expiresAt !== undefined &&
    (!Number.isFinite(payload.expiresAt) || payload.expiresAt <= Date.now())
  ) {
    return null;
  }

  return {
    units,
    expiresAt: payload.expiresAt,
    nonce: payload.nonce,
  };
}

function encodeTokenPayload(payload: SignedMockPlaytimeTokenPayload): string {
  return encodeBase64Url(JSON.stringify(payload));
}

function hashTokenPayload(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function encodeBase64Url(input: string): string {
  if (typeof btoa === "function") {
    return btoa(input)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(input: string): string | null {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  try {
    if (typeof atob === "function") {
      return atob(padded);
    }
    return Buffer.from(padded, "base64").toString("utf8");
  } catch {
    return null;
  }
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
