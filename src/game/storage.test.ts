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
    expect(loaded?.garden.cropStorage.current.flower).toBe(10);
    expect(loaded?.garden.cropStorage.current.vegetable).toBe(
      defaultState.garden.cropStorage.current.vegetable,
    );
    expect(loaded?.meta.version).toBe(defaultState.meta.version);
    expect(loaded?.meta.lastUpdate).toBe(now);
  });
});
