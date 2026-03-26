/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react";
import App from "./App";
import { GameProvider } from "./game/GameContext";
import { createDefaultState } from "./game/state";

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

function renderApp() {
  return render(
    <GameProvider>
      <App />
    </GameProvider>,
  );
}

describe("app integration", () => {
  beforeEach(() => {
    cleanup();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: createLocalStorageMock(),
    });
    window.history.replaceState({}, "", "/");
  });

  it("navigates between main and inventory screens", async () => {
    const seeded = createDefaultState();
    seeded.meta.lastUpdate = Date.now();
    localStorage.setItem("idle_save", JSON.stringify(seeded));

    renderApp();

    expect(screen.getByText("Idle RPG")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Inventory" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Inventory" })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Main" }));

    await waitFor(() => {
      expect(screen.getByText("Idle RPG")).toBeTruthy();
    });
  });

  it("shows and dismisses idle earnings modal for away-time saves", async () => {
    const seeded = createDefaultState();
    seeded.meta.lastUpdate = Date.now() - 60_000;
    localStorage.setItem("idle_save", JSON.stringify(seeded));

    renderApp();

    await waitFor(() => {
      expect(screen.getByText("Welcome back! Idle earnings")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Collect" }));

    await waitFor(() => {
      expect(screen.queryByText("Welcome back! Idle earnings")).toBeNull();
    });
  });
});
