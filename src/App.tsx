import { lazy, Suspense, useState } from "react";
import { Main } from "./components/Main";
import { ResourcesDisplay } from "./components/ResourcesDisplay";
import { TokenRewardModal } from "./components/TokenRewardModal";
import { IdleEarningsModal } from "./components/IdleEarningsModal";

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

type Screen =
  | "main"
  | "inventory"
  | "character"
  | "upgrades"
  | "garden"
  | "fight";

function App() {
  const [screen, setScreen] = useState<Screen>("main");

  return (
    <div style={{ padding: 16 }}>
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
      {screen === "main" && <Main />}

      <IdleEarningsModal />
      <TokenRewardModal />
    </div>
  );
}

export default App;
