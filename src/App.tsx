import { lazy, Suspense, useState } from "react";
import { Main } from "./components/Main";
import { ResourcesDisplay } from "./components/ResourcesDisplay";
import { TokenRewardModal } from "./components/TokenRewardModal";
import { IdleEarningsModal } from "./components/IdleEarningsModal";
import { useGame } from "./game/GameContext";

const Inventory = lazy(() =>
  import("./components/Inventory").then((module) => ({
    default: module.Inventory,
  })),
);
const Character = lazy(() =>
  import("./components/Equipment").then((module) => ({
    default: module.Character,
  })),
);
const Upgrades = lazy(() =>
  import("./components/Upgrades").then((module) => ({
    default: module.Upgrades,
  })),
);
const Garden = lazy(() =>
  import("./components/Garden").then((module) => ({
    default: module.Garden,
  })),
);
const Fight = lazy(() =>
  import("./components/Fight").then((module) => ({
    default: module.Fight,
  })),
);
const Shop = lazy(() => import("./components/Shop"));

type Screen =
  | "main"
  | "inventory"
  | "character"
  | "upgrades"
  | "garden"
  | "fight"
  | "shop";

function App() {
  const { state } = useGame();
  const [screen, setScreen] = useState<Screen>("main");
  const [isDebugShopEnabled, setIsDebugShopEnabled] = useState(false);

  const remainingPlaytimeMs = state.playtime.remainingMs ?? 0;
  const capPlaytimeMs = state.playtime.capMs ?? 0;
  const formatPlaytime = (ms: number): string => {
    const safeMs = Math.max(0, ms);
    const totalSeconds = Math.floor(safeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };
  const playtimeExhausted = remainingPlaytimeMs <= 0;

  return (
    <div style={{ padding: 16 }}>
      {playtimeExhausted ? (
        <div
          style={{
            minHeight: "72vh",
            display: "grid",
            placeItems: "center",
          }}
        >
          <div
            className="ui-card-tonal"
            style={{
              width: "min(720px, 95vw)",
              padding: "24px 22px",
              textAlign: "center",
              border: "1px solid #3a536a",
            }}
          >
            <h2 style={{ marginBottom: 10 }}>Playtime Used Up</h2>
            <p style={{ color: "#b7c8d8", marginBottom: 8 }}>
              You have used your current session playtime.
            </p>
            <p style={{ color: "#91a9bf", marginBottom: 14 }}>
              Redeem a valid playtime token URL to continue playing.
            </p>
            <div style={{ fontSize: 13, color: "#d8e7f6" }}>
              Remaining: <strong>{formatPlaytime(remainingPlaytimeMs)}</strong>
              {" / "}
              <span>{formatPlaytime(capPlaytimeMs)}</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div
            style={{
              marginBottom: 12,
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              alignItems: "stretch",
            }}
          >
            <div style={{ flex: "0 1 360px", minWidth: 240 }}>
              <ResourcesDisplay compact />
            </div>

            <div
              style={{
                flex: "1 1 520px",
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <button
                className={screen === "main" ? "btn-selected" : ""}
                style={{ flex: "1 1 auto" }}
                onClick={() => setScreen("main")}
              >
                Main
              </button>
              <button
                className={screen === "inventory" ? "btn-selected" : ""}
                style={{ flex: "1 1 auto" }}
                onClick={() => setScreen("inventory")}
              >
                Inventory
              </button>
              <button
                className={screen === "character" ? "btn-selected" : ""}
                style={{ flex: "1 1 auto" }}
                onClick={() => setScreen("character")}
              >
                Character
              </button>
              <button
                className={screen === "upgrades" ? "btn-selected" : ""}
                style={{ flex: "1 1 auto" }}
                onClick={() => setScreen("upgrades")}
              >
                Upgrades
              </button>
              <button
                className={screen === "garden" ? "btn-selected" : ""}
                style={{ flex: "1 1 auto" }}
                onClick={() => setScreen("garden")}
              >
                Garden
              </button>
              <button
                className={screen === "fight" ? "btn-selected" : ""}
                style={{ flex: "1 1 auto" }}
                onClick={() => setScreen("fight")}
              >
                Fight
              </button>
              <button
                className={screen === "shop" ? "btn-selected" : ""}
                style={{ flex: "1 1 auto" }}
                onClick={() => setScreen("shop")}
              >
                Shop
              </button>
            </div>
          </div>

          {screen === "inventory" && (
            <Suspense fallback={<p>Loading screen...</p>}>
              <Inventory />
            </Suspense>
          )}
          {screen === "character" && (
            <Suspense fallback={<p>Loading screen...</p>}>
              <Character />
            </Suspense>
          )}
          {screen === "upgrades" && (
            <Suspense fallback={<p>Loading screen...</p>}>
              <Upgrades />
            </Suspense>
          )}
          {screen === "garden" && (
            <Suspense fallback={<p>Loading screen...</p>}>
              <Garden />
            </Suspense>
          )}
          {screen === "fight" && (
            <Suspense fallback={<p>Loading screen...</p>}>
              <Fight />
            </Suspense>
          )}
          {screen === "shop" && (
            <Suspense fallback={<p>Loading screen...</p>}>
              <Shop isDebugShopEnabled={isDebugShopEnabled} />
            </Suspense>
          )}
          {screen === "main" && (
            <Main
              isDebugShopEnabled={isDebugShopEnabled}
              onDebugShopToggle={setIsDebugShopEnabled}
            />
          )}
        </>
      )}

      <IdleEarningsModal />
      <TokenRewardModal />
    </div>
  );
}

export default App;
