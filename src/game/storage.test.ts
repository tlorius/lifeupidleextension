import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultState } from "./state";
import { load, save } from "./storage";

type MockStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

function createLocalStorageMock(): MockStorage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
}

describe("storage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    const localStorageMock = createLocalStorageMock();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: localStorageMock,
    });
  });

  it("saves state with updated lastUpdate timestamp", () => {
    const now = 1_700_000_000_000;
    vi.spyOn(Date, "now").mockReturnValue(now);

    const state = JSON.parse(JSON.stringify(defaultState));
    save(state);

    const raw = localStorage.getItem("idle_save");
    expect(raw).not.toBeNull();

    const parsed = JSON.parse(raw!);
    expect(parsed.meta.lastUpdate).toBe(now);
    expect(parsed.resources.gold).toBe(state.resources.gold);
  });

  it("handles localStorage write failures without throwing", () => {
    const setItemSpy = vi
      .spyOn(localStorage, "setItem")
      .mockImplementation(() => {
        throw new Error("quota exceeded");
      });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const state = JSON.parse(JSON.stringify(defaultState));

    expect(() => save(state)).not.toThrow();
    expect(setItemSpy).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
  });

  it("returns null when no saved data exists", () => {
    expect(load()).toBeNull();
  });

  it("loads and migrates partial state while preserving defaults", () => {
    const now = 1_700_000_123_456;
    vi.spyOn(Date, "now").mockReturnValue(now);

    const partial = {
      meta: {
        version: 0,
        lastUpdate: 1,
      },
      resources: {
        gold: 77,
      },
      garden: {
        cropStorage: {
          current: {
            flower: 10,
          },
          limits: {
            flower: 999,
          },
        },
      },
    };

    localStorage.setItem("idle_save", JSON.stringify(partial));
    const loaded = load();

    expect(loaded).not.toBeNull();
    expect(loaded?.resources.gold).toBe(77);
    expect(loaded?.resources.gems).toBe(defaultState.resources.gems);
    expect(loaded?.playerProgress.level).toBe(
      defaultState.playerProgress.level,
    );
    expect(loaded?.stats.hp).toBe(defaultState.stats.hp);
    expect(loaded?.garden.cropStorage.current.flower).toBe(10);
    expect(loaded?.garden.cropStorage.current.vegetable).toBe(
      defaultState.garden.cropStorage.current.vegetable,
    );
    expect(loaded?.meta.version).toBe(defaultState.meta.version);
    expect(loaded?.meta.lastUpdate).toBe(1);
  });

  it("sets lastUpdate to now when migrated save has invalid timestamp", () => {
    const now = 1_700_000_123_456;
    vi.spyOn(Date, "now").mockReturnValue(now);

    localStorage.setItem(
      "idle_save",
      JSON.stringify({
        meta: {
          version: 0,
          lastUpdate: "bad-value",
        },
      }),
    );

    const loaded = load();
    expect(loaded?.meta.lastUpdate).toBe(now);
  });

  it("sets lastUpdate to now when migrated save has non-finite timestamp", () => {
    const now = 1_700_000_123_456;
    vi.spyOn(Date, "now").mockReturnValue(now);

    localStorage.setItem(
      "idle_save",
      JSON.stringify({
        meta: {
          version: 0,
          lastUpdate: Number.NEGATIVE_INFINITY,
        },
      }),
    );

    const loaded = load();
    expect(loaded?.meta.lastUpdate).toBe(now);
  });

  it("returns null and logs when saved JSON is malformed", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    localStorage.setItem("idle_save", "{not-valid-json");

    expect(load()).toBeNull();
    expect(errorSpy).toHaveBeenCalled();
  });

  it("migrates legacy v0 payload with cereal storage keys", () => {
    const now = 1_700_000_123_456;
    vi.spyOn(Date, "now").mockReturnValue(now);

    localStorage.setItem(
      "idle_save",
      JSON.stringify({
        meta: {
          version: 0,
          lastUpdate: 100,
        },
        garden: {
          cropStorage: {
            current: {
              cereal: 12,
            },
            limits: {
              cereal: 345,
            },
          },
        },
      }),
    );

    const loaded = load();

    expect(loaded?.meta.version).toBe(defaultState.meta.version);
    expect(loaded?.garden.cropStorage.current.grains).toBe(12);
    expect(loaded?.garden.cropStorage.limits.grains).toBe(345);
    expect("cereal" in (loaded?.garden.cropStorage.current ?? {})).toBe(false);
    expect("cereal" in (loaded?.garden.cropStorage.limits ?? {})).toBe(false);
  });

  it("migrates v1 payload and preserves explicit grains values", () => {
    localStorage.setItem(
      "idle_save",
      JSON.stringify({
        meta: {
          version: 1,
          lastUpdate: 200,
        },
        garden: {
          cropStorage: {
            current: {
              grains: 88,
            },
            limits: {
              grains: 777,
            },
          },
        },
      }),
    );

    const loaded = load();

    expect(loaded?.meta.version).toBe(defaultState.meta.version);
    expect(loaded?.garden.cropStorage.current.grains).toBe(88);
    expect(loaded?.garden.cropStorage.limits.grains).toBe(777);
  });

  it("normalizes unexpected future-version payloads to current schema version", () => {
    localStorage.setItem(
      "idle_save",
      JSON.stringify({
        meta: {
          version: 999,
          lastUpdate: 123,
        },
      }),
    );

    const loaded = load();
    expect(loaded?.meta.version).toBe(defaultState.meta.version);
  });
});
