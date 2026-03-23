import { describe, expect, it } from "vitest";
import { defaultState } from "./state";
import {
  applyTokenRewards,
  extractRewardToken,
  loadProcessedTokens,
  normalizeTokenRewards,
  resolveTokenRewards,
  removeRewardTokenFromUrl,
  saveProcessedTokens,
  toGrantedTokenRewards,
} from "./tokenRewards";

class InMemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

describe("tokenRewards", () => {
  it("extracts token from supported query parameters", () => {
    expect(extractRewardToken("?token=abc123")).toBe("abc123");
    expect(extractRewardToken("?rewardToken=xyz789")).toBe("xyz789");
    expect(extractRewardToken("?foo=bar")).toBeNull();
  });

  it("removes reward token params but preserves other params", () => {
    expect(removeRewardTokenFromUrl("?token=abc&foo=bar")).toBe("?foo=bar");
    expect(removeRewardTokenFromUrl("?rewardToken=abc")).toBe("");
  });

  it("loads and saves processed tokens", () => {
    const storage = new InMemoryStorage();
    const tokens = new Set<string>(["one", "two"]);

    saveProcessedTokens(storage, tokens);

    expect(loadProcessedTokens(storage)).toEqual(tokens);
  });

  it("applies only valid reward items and enforces quantity minimum", () => {
    const state = structuredClone(defaultState);

    const next = applyTokenRewards(state, [
      { itemId: "mana_potion", quantity: 2 },
      { itemId: "not_real_item", quantity: 4 },
      { itemId: "ring_1", quantity: 0 },
    ]);

    expect(next.inventory).toHaveLength(2);
    expect(next.inventory[0].itemId).toBe("mana_potion");
    expect(next.inventory[0].quantity).toBe(2);
    expect(next.inventory[1].itemId).toBe("ring_1");
    expect(next.inventory[1].quantity).toBe(1);
  });

  it("normalizes rewards into valid item entries", () => {
    const normalized = normalizeTokenRewards([
      { itemId: "mana_potion", quantity: 2.8 },
      { itemId: "unknown", quantity: 9 },
      { itemId: "ring_1", quantity: 0 },
    ]);

    expect(normalized).toEqual([
      { itemId: "mana_potion", quantity: 2 },
      { itemId: "ring_1", quantity: 1 },
    ]);
  });

  it("maps normalized rewards to granted reward entries with level", () => {
    expect(
      toGrantedTokenRewards([
        { itemId: "mana_potion", quantity: 2 },
        { itemId: "ring_1", quantity: 1 },
      ]),
    ).toEqual([
      { itemId: "mana_potion", quantity: 2, level: 1 },
      { itemId: "ring_1", quantity: 1, level: 1 },
    ]);
  });

  it("resolves starter pack mock rewards", async () => {
    await expect(resolveTokenRewards("starter-pack")).resolves.toEqual([
      { itemId: "health_potion", quantity: 3 },
      { itemId: "mana_potion", quantity: 2 },
      { itemId: "ring_1", quantity: 1 },
    ]);
  });

  it("resolves legendary bundle mock rewards", async () => {
    await expect(resolveTokenRewards("legendary-bundle")).resolves.toEqual([
      { itemId: "excalibur", quantity: 1 },
      { itemId: "excalibur_armor", quantity: 1 },
      { itemId: "infinity_gem", quantity: 1 },
    ]);
  });

  it("returns empty rewards for unknown token", async () => {
    await expect(resolveTokenRewards("unknown-token")).resolves.toEqual([]);
  });
});
