/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
  within,
} from "@testing-library/react";
import App from "./App";
import { createEnemyInstance } from "./game/combat";
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

async function dismissIdleEarningsModalIfShown() {
  if (!screen.queryByText("Welcome back! Idle earnings")) return;

  fireEvent.click(screen.getByRole("button", { name: "Collect" }));

  await waitFor(() => {
    expect(screen.queryByText("Welcome back! Idle earnings")).toBeNull();
  });
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
    await dismissIdleEarningsModalIfShown();

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

  it("hides ruby resource chip before first level 50 kill", async () => {
    const seeded = createDefaultState();
    seeded.meta.lastUpdate = Date.now();
    seeded.combat.currentLevel = 50;
    seeded.combat.highestLevelReached = 50;
    seeded.resources.ruby = 9;
    localStorage.setItem("idle_save", JSON.stringify(seeded));

    renderApp();
    await dismissIdleEarningsModalIfShown();

    expect(screen.queryByTitle("Ruby")).toBeNull();
  });

  it("shows ruby resource chip after first level 50 kill", async () => {
    const seeded = createDefaultState();
    seeded.meta.lastUpdate = Date.now();
    seeded.combat.currentLevel = 51;
    seeded.combat.highestLevelReached = 51;
    seeded.resources.ruby = 9;
    localStorage.setItem("idle_save", JSON.stringify(seeded));

    renderApp();
    await dismissIdleEarningsModalIfShown();

    expect(screen.getByTitle("Ruby")).toBeTruthy();
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

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Manage Spells" }),
      ).toBeTruthy();
    });
    fireEvent.click(screen.getByRole("button", { name: "Manage Spells" }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Spell Selection" }),
      ).toBeTruthy();
    });
  });

  it("shows enemy hp dropping to zero before the next enemy appears on one-shot kills", async () => {
    const seeded = createDefaultState();
    seeded.meta.lastUpdate = Date.now();
    seeded.combat.currentLevel = 14;
    seeded.combat.highestLevelReached = 14;
    seeded.combat.enemy = createEnemyInstance(14);
    seeded.stats.attack = 1_000_000;
    seeded.stats.intelligence = 1_000_000;
    localStorage.setItem("idle_save", JSON.stringify(seeded));

    renderApp();
    await dismissIdleEarningsModalIfShown();

    fireEvent.click(screen.getByRole("button", { name: "Fight" }));

    await waitFor(() => {
      expect(screen.getByTestId("fight-enemy-hp-label")).toBeTruthy();
    });

    const enemyHpLabelBefore = screen.getByTestId(
      "fight-enemy-hp-label",
    ).textContent;
    expect(enemyHpLabelBefore).toContain("/");

    fireEvent.click(
      screen.getByRole("button", { name: /Tap \/ Click To Strike/i }),
    );

    await waitFor(
      () => {
        expect(screen.getByTestId("fight-enemy-hp-label").textContent).toMatch(
          /^HP: 0 \/ /,
        );
        expect(
          (screen.getByTestId("fight-enemy-hp-fill") as HTMLElement).style
            .width,
        ).toBe("0%");
      },
      { timeout: 1500 },
    );

    await waitFor(
      () => {
        expect(
          screen.getByTestId("fight-enemy-hp-label").textContent,
        ).not.toMatch(/^HP: 0 \/ /);
        expect(screen.getByTestId("fight-enemy-hp-label").textContent).not.toBe(
          enemyHpLabelBefore,
        );
      },
      { timeout: 1500 },
    );
  });

  it("keeps HP at 0 during the death window even when subsequent combat events fire", async () => {
    // Regression: the combined useEffect had deps [currentHp, enemyId, combatEvents].
    // A new combatEvents batch (next auto-attack tick) would trigger the cleanup
    // registered on the previous render, cancelling the pending death-animation
    // timers within ~16 ms.  This test fires another attack immediately after the
    // kill to simulate that next-tick event and confirms the HP:0 state persists.
    const seeded = createDefaultState();
    seeded.meta.lastUpdate = Date.now();
    seeded.combat.currentLevel = 14;
    seeded.combat.highestLevelReached = 14;
    seeded.combat.enemy = createEnemyInstance(14);
    seeded.stats.attack = 1_000_000;
    seeded.stats.intelligence = 1_000_000;
    localStorage.setItem("idle_save", JSON.stringify(seeded));

    renderApp();
    await dismissIdleEarningsModalIfShown();

    fireEvent.click(screen.getByRole("button", { name: "Fight" }));

    await waitFor(() => {
      expect(screen.getByTestId("fight-enemy-hp-label")).toBeTruthy();
    });

    const attackBtn = screen.getByRole("button", {
      name: /Tap \/ Click To Strike/i,
    });

    // Kill the enemy.
    fireEvent.click(attackBtn);

    // Immediately fire additional clicks to simulate rapid combatEvents changes
    // (equivalent to the auto-attack loop ticking during the death window).
    // This is the regression scenario: without the isDeathAnimationPendingRef
    // guard in the HP-drain effect, these clicks would cause it to overwrite
    // visualEnemyHp with the new enemy's HP before the drop timer fires.
    fireEvent.click(attackBtn);
    fireEvent.click(attackBtn);
    fireEvent.click(attackBtn);

    // The death animation should still complete: HP must reach 0 ...
    await waitFor(
      () => {
        expect(screen.getByTestId("fight-enemy-hp-label").textContent).toMatch(
          /^HP: 0 \/ /,
        );
      },
      { timeout: 1500 },
    );

    // ... and the bar must read 0% width (not just the label).
    expect(
      (screen.getByTestId("fight-enemy-hp-fill") as HTMLElement).style.width,
    ).toBe("0%");

    // Fire even more clicks while we're at 0% to confirm the 0% state holds.
    fireEvent.click(attackBtn);
    fireEvent.click(attackBtn);

    // HP:0 must persist through those additional events (guard still active).
    expect(screen.getByTestId("fight-enemy-hp-label").textContent).toMatch(
      /^HP: 0 \/ /,
    );
    expect(
      (screen.getByTestId("fight-enemy-hp-fill") as HTMLElement).style.width,
    ).toBe("0%");

    // After the hold the new enemy must appear without the user doing anything.
    await waitFor(
      () => {
        expect(
          screen.getByTestId("fight-enemy-hp-label").textContent,
        ).not.toMatch(/^HP: 0 \/ /);
      },
      { timeout: 1500 },
    );
  });

  it("prevents equipped inventory items from mass-sell selection", async () => {
    const seeded = createDefaultState();
    seeded.meta.lastUpdate = Date.now();
    localStorage.setItem("idle_save", JSON.stringify(seeded));

    renderApp();
    await dismissIdleEarningsModalIfShown();

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

  it("supports garden storage and empty-field automation mode flow", async () => {
    const seeded = createDefaultState();
    seeded.meta.lastUpdate = Date.now();
    localStorage.setItem("idle_save", JSON.stringify(seeded));

    renderApp();
    await dismissIdleEarningsModalIfShown();

    fireEvent.click(screen.getByRole("button", { name: "Garden" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Garden/ })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Open crop storage" }));
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "🛢️ Crop Silos" }),
      ).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "🛢️ Crop Silos" }),
      ).toBeNull();
    });

    fireEvent.click(
      screen.getAllByLabelText(
        "Empty field - click to manage planting or sprinkler",
      )[0],
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Field Options @/ }),
      ).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Automation" }));
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Automation Tools @/ }),
      ).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Field Options @/ }),
      ).toBeTruthy();
    });
  });

  it("assigns a spell from spell selection and exposes it in fight panel", async () => {
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
    await dismissIdleEarningsModalIfShown();

    fireEvent.click(screen.getByRole("button", { name: "Character" }));
    fireEvent.click(screen.getByRole("button", { name: "Switch Class" }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Select Your Class" }),
      ).toBeTruthy();
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Select" })[0]);

    fireEvent.click(screen.getByRole("button", { name: "Fight" }));
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Manage Spells" }),
      ).toBeTruthy();
    });
    fireEvent.click(screen.getByRole("button", { name: "Manage Spells" }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Spell Selection" }),
      ).toBeTruthy();
    });

    fireEvent.click(screen.getAllByRole("button", { name: /Arcane Bolt/ })[0]);

    const spellSelectionHeader = screen.getByRole("heading", {
      name: "Spell Selection",
    });
    const spellSelectionHeaderRow = spellSelectionHeader.parentElement;
    expect(spellSelectionHeaderRow).toBeTruthy();
    fireEvent.click(
      within(spellSelectionHeaderRow as HTMLElement).getByRole("button", {
        name: "Close",
      }),
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Arcane Bolt/ })).toBeTruthy();
    });
  });

  it("queues reward token bundle and redeems from inbox", async () => {
    const seeded = createDefaultState();
    seeded.meta.lastUpdate = Date.now();
    localStorage.setItem("idle_save", JSON.stringify(seeded));
    window.history.replaceState({}, "", "/?token=starter-pack");

    renderApp();
    await dismissIdleEarningsModalIfShown();

    await waitFor(() => {
      expect(window.location.search).toBe("");
    });

    fireEvent.click(screen.getByRole("button", { name: "Open reward inbox" }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Reward Inbox" }),
      ).toBeTruthy();
    });

    expect(screen.getByText(/Bundle #/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Redeem" }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          name: "Congrats! You have earned items",
        }),
      ).toBeTruthy();
    });

    expect(screen.getAllByText("Health Potion").length).toBeGreaterThan(0);
  });

  it("applies playtime token before reward token and removes both params", async () => {
    const seeded = createDefaultState();
    seeded.meta.lastUpdate = Date.now();
    seeded.playtime.remainingMs = 0;
    localStorage.setItem("idle_save", JSON.stringify(seeded));

    window.history.replaceState(
      {},
      "",
      "/?playtimeToken=play-5m=1u&token=starter-pack",
    );

    renderApp();

    await waitFor(() => {
      expect(screen.queryByText("Playtime Used Up")).toBeNull();
    });

    expect(window.location.search).toBe("");

    fireEvent.click(screen.getByRole("button", { name: "Open reward inbox" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Redeem" })).toBeTruthy();
    });
  });

  it("shows playtime gate when session time is exhausted", async () => {
    const seeded = createDefaultState();
    seeded.meta.lastUpdate = Date.now();
    seeded.playtime.remainingMs = 0;
    localStorage.setItem("idle_save", JSON.stringify(seeded));

    renderApp();

    await waitFor(() => {
      expect(screen.getByText("Playtime Used Up")).toBeTruthy();
    });
    expect(screen.queryByText("Idle RPG")).toBeNull();
  });

  it("hides spell management controls when spell system is locked", async () => {
    const seeded = createDefaultState();
    seeded.meta.lastUpdate = Date.now();
    seeded.playerProgress.level = 10;
    seeded.resources.gems = 500;
    localStorage.setItem("idle_save", JSON.stringify(seeded));

    renderApp();
    await dismissIdleEarningsModalIfShown();

    fireEvent.click(screen.getByRole("button", { name: "Character" }));
    fireEvent.click(screen.getByRole("button", { name: "Switch Class" }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Select Your Class" }),
      ).toBeTruthy();
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Select" })[0]);

    fireEvent.click(screen.getByRole("button", { name: "Fight" }));

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Manage Spells" }),
      ).toBeNull();
    });
  });
});
