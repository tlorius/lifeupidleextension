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

interface MockRewardTokenDefinition {
  displayName: string;
  rewards: TokenRewardItem[];
}

const RUBY_CURRENCY_REWARD_ITEM_ID = "ruby_currency";

const MOCK_REWARD_TOKEN_DEFINITIONS: Record<string, MockRewardTokenDefinition> =
  {
    "starter-pack": {
      displayName: "Starter Pack",
      rewards: [
        { itemId: "health_potion", quantity: 3 },
        { itemId: "mana_potion", quantity: 2 },
        { itemId: "ring_1", quantity: 1 },
      ],
    },
    "gardener-kit": {
      displayName: "Gardener Kit",
      rewards: [
        { itemId: "sunflower_seed_common", quantity: 20 },
        { itemId: "carrot_seed_common", quantity: 20 },
        { itemId: "wateringcan_common", quantity: 1 },
      ],
    },
    "legendary-bundle": {
      displayName: "Legendary Bundle",
      rewards: [
        { itemId: "excalibur", quantity: 1 },
        { itemId: "excalibur_armor", quantity: 1 },
        { itemId: "infinity_gem", quantity: 1 },
      ],
    },
    "pet-lover": {
      displayName: "Pet Lover",
      rewards: [
        { itemId: "wolf_pup", quantity: 1 },
        { itemId: "fire_fox", quantity: 1 },
        { itemId: "ice_dragon", quantity: 1 },
      ],
    },
    "alchemy-cache": {
      displayName: "Alchemy Cache",
      rewards: [
        { itemId: "health_potion", quantity: 5 },
        { itemId: "mana_potion", quantity: 3 },
        { itemId: "elixir", quantity: 1 },
        { itemId: "fortitude_brew", quantity: 1 },
      ],
    },
    "harvest-surge": {
      displayName: "Harvest Surge",
      rewards: [
        { itemId: "sunflower_seed_common", quantity: 50 },
        { itemId: "carrot_seed_common", quantity: 50 },
        { itemId: "apple_seed_common", quantity: 30 },
        { itemId: "mint_seed_common", quantity: 30 },
        { itemId: "wateringcan_rare", quantity: 1 },
      ],
    },
    "progression-early": {
      displayName: "Progression Pack: Early",
      rewards: [
        { itemId: "health_potion", quantity: 8 },
        { itemId: "mana_potion", quantity: 8 },
        { itemId: "ring_1", quantity: 1 },
        { itemId: "wolf_pup", quantity: 1 },
      ],
    },
    "progression-mid": {
      displayName: "Progression Pack: Mid",
      rewards: [
        { itemId: "elixir", quantity: 3 },
        { itemId: "fortitude_brew", quantity: 2 },
        { itemId: "storm_blade", quantity: 1 },
        { itemId: "fire_fox", quantity: 1 },
      ],
    },
    "progression-late": {
      displayName: "Progression Pack: Late",
      rewards: [
        { itemId: "immortal_brew", quantity: 2 },
        { itemId: "sunlance", quantity: 1 },
        { itemId: "runesteel_plate", quantity: 1 },
        { itemId: "storm_griffin", quantity: 1 },
      ],
    },
    "progression-endgame": {
      displayName: "Progression Pack: Endgame",
      rewards: [
        { itemId: "excalibur", quantity: 1 },
        { itemId: "aegis_of_ages", quantity: 1 },
        { itemId: "infinity_gem", quantity: 1 },
        { itemId: "astral_phoenix", quantity: 1 },
      ],
    },
    "seed-bundle-common": {
      displayName: "Seed Bundle: Common",
      rewards: [
        { itemId: "sunflower_seed_common", quantity: 60 },
        { itemId: "carrot_seed_common", quantity: 60 },
        { itemId: "apple_seed_common", quantity: 60 },
        { itemId: "mint_seed_common", quantity: 60 },
        { itemId: "wheat_seed_common", quantity: 60 },
        { itemId: "grape_seed_common", quantity: 60 },
      ],
    },
    "seed-bundle-rare": {
      displayName: "Seed Bundle: Rare",
      rewards: [
        { itemId: "rose_seed_rare", quantity: 35 },
        { itemId: "starlime_seed_rare", quantity: 35 },
        { itemId: "coralfern_seed_rare", quantity: 35 },
        { itemId: "cabbage_seed_rare", quantity: 35 },
        { itemId: "berry_seed_rare", quantity: 35 },
        { itemId: "corn_seed_rare", quantity: 35 },
      ],
    },
    "seed-bundle-epic": {
      displayName: "Seed Bundle: Epic",
      rewards: [
        { itemId: "moonpalm_seed_epic", quantity: 18 },
        { itemId: "dragonfruit_seed_epic", quantity: 18 },
        { itemId: "astral_lotus_seed_epic", quantity: 18 },
      ],
    },
    "seed-bundle-legendary": {
      displayName: "Seed Bundle: Legendary",
      rewards: [
        { itemId: "aurora_orchid_seed_legendary", quantity: 10 },
        { itemId: "lava_blossom_seed_legendary", quantity: 10 },
        { itemId: "void_truffle_seed_legendary", quantity: 10 },
      ],
    },
    "seed-bundle-unique": {
      displayName: "Seed Bundle: Unique",
      rewards: [{ itemId: "phoenix_bloom_seed_unique", quantity: 5 }],
    },
    "farm-automation-starter": {
      displayName: "Farm Automation Bundle: Starter",
      rewards: [
        { itemId: "wateringcan_common", quantity: 1 },
        { itemId: "sprinkler_common", quantity: 1 },
        { itemId: "harvester_common", quantity: 1 },
        { itemId: "planter_common", quantity: 1 },
        { itemId: "seedbag_common", quantity: 1 },
      ],
    },
    "farm-automation-rare": {
      displayName: "Farm Automation Bundle: Rare",
      rewards: [
        { itemId: "wateringcan_rare", quantity: 1 },
        { itemId: "sprinkler_rare", quantity: 1 },
        { itemId: "harvester_rare", quantity: 1 },
        { itemId: "planter_rare", quantity: 1 },
        { itemId: "seedbag_rare", quantity: 1 },
      ],
    },
    "farm-automation-epic": {
      displayName: "Farm Automation Bundle: Epic",
      rewards: [
        { itemId: "wateringcan_epic", quantity: 1 },
        { itemId: "sprinkler_epic", quantity: 1 },
        { itemId: "harvester_epic", quantity: 1 },
        { itemId: "planter_epic", quantity: 1 },
        { itemId: "seedbag_epic", quantity: 1 },
      ],
    },
    "farm-automation-legendary": {
      displayName: "Farm Automation Bundle: Legendary",
      rewards: [
        { itemId: "wateringcan_legendary", quantity: 1 },
        { itemId: "sprinkler_legendary", quantity: 1 },
        { itemId: "harvester_legendary", quantity: 1 },
        { itemId: "planter_legendary", quantity: 1 },
        { itemId: "seedbag_legendary", quantity: 1 },
      ],
    },
    "farm-automation-unique": {
      displayName: "Farm Automation Bundle: Unique",
      rewards: [
        { itemId: "wateringcan_unique", quantity: 1 },
        { itemId: "sprinkler_unique", quantity: 1 },
        { itemId: "harvester_unique", quantity: 1 },
        { itemId: "planter_unique", quantity: 1 },
        { itemId: "seedbag_unique", quantity: 1 },
      ],
    },
    "ruby-pack-1": {
      displayName: "Ruby Pack (1)",
      rewards: [{ itemId: RUBY_CURRENCY_REWARD_ITEM_ID, quantity: 1 }],
    },
    "ruby-pack-5": {
      displayName: "Ruby Pack (5)",
      rewards: [{ itemId: RUBY_CURRENCY_REWARD_ITEM_ID, quantity: 5 }],
    },
    "ruby-pack-10": {
      displayName: "Ruby Pack (10)",
      rewards: [{ itemId: RUBY_CURRENCY_REWARD_ITEM_ID, quantity: 10 }],
    },
  };

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

export function resolveRewardTokenDisplayName(token: string): string | null {
  const normalized = token.trim().toLowerCase();
  return MOCK_REWARD_TOKEN_DEFINITIONS[normalized]?.displayName ?? null;
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
  return MOCK_REWARD_TOKEN_DEFINITIONS[normalized]?.rewards ?? [];
}

export function applyTokenRewards(
  state: GameState,
  rewards: TokenRewardItem[],
): GameState {
  const normalizedRewards = normalizeTokenRewards(rewards);
  let nextState = state;

  for (const reward of normalizedRewards) {
    const quantity = reward.quantity;
    if (reward.itemId === RUBY_CURRENCY_REWARD_ITEM_ID) {
      nextState = {
        ...nextState,
        resources: {
          ...nextState.resources,
          ruby: (nextState.resources.ruby ?? 0) + quantity,
        },
      };
      continue;
    }
    nextState = addItem(nextState, reward.itemId, quantity);
  }

  return nextState;
}

export function normalizeTokenRewards(
  rewards: TokenRewardItem[],
): NormalizedTokenRewardItem[] {
  const normalized: NormalizedTokenRewardItem[] = [];

  for (const reward of rewards) {
    if (!reward?.itemId) continue;
    if (
      reward.itemId !== RUBY_CURRENCY_REWARD_ITEM_ID &&
      !getItemDefSafe(reward.itemId)
    ) {
      continue;
    }
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
