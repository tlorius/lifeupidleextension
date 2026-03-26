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

  it("opens class and skill tree modals from character and spell modal from fight", async () => {
    const seeded = createDefaultState();
    seeded.meta.lastUpdate = Date.now();
    seeded.playerProgress.level = 10;
    seeded.playerProgress.unlockedSystems = {
      ...(seeded.playerProgress.unlockedSystems ?? {}),
      spells: true,
    };
    seeded.resources.gems = 500;
    localStorage.setItem("idle_save", JSON.stringify(seeded));

    renderApp();

    fireEvent.click(screen.getByRole("button", { name: "Character" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Character" })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Switch Class" }));
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Select Your Class" }),
      ).toBeTruthy();
    });

    const selectButtons = screen.getAllByRole("button", { name: "Select" });
    fireEvent.click(selectButtons[0]);

    fireEvent.click(screen.getByRole("button", { name: "Open Skill Tree" }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Skill Tree/ })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: /Skill Tree/ })).toBeNull();
    });

    fireEvent.click(screen.getByRole("button", { name: "Fight" }));
    fireEvent.click(screen.getByRole("button", { name: "Manage Spells" }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Spell Selection" }),
      ).toBeTruthy();
    });
  });

  it("prevents equipped inventory items from mass-sell selection", async () => {
    const seeded = createDefaultState();
    seeded.meta.lastUpdate = Date.now();
    localStorage.setItem("idle_save", JSON.stringify(seeded));

    renderApp();

    fireEvent.click(screen.getByRole("button", { name: "Add Items to debug" }));
    fireEvent.click(screen.getByRole("button", { name: "Inventory" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Inventory" })).toBeTruthy();
    });

    fireEvent.click(screen.getByText("Rusty Sword"));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Equip" })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole("button", { name: "Equip" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Already Equipped" }),
      ).toBeTruthy();
    });
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    fireEvent.click(screen.getByRole("button", { name: "Mass Select" }));

    await waitFor(() => {
      expect(
        screen.getByText("Equipped items cannot be selected for mass sell."),
      ).toBeTruthy();
    });

    const swordCheckbox = screen.getByRole("checkbox", {
      name: "Select Rusty Sword for selling",
    });
    expect(swordCheckbox.hasAttribute("disabled")).toBe(true);
  });
});
