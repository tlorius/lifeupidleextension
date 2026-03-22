import { useState } from "react";
import { Inventory } from "./components/Inventory";
import { Equipment } from "./components/Equipment";
import { Main } from "./components/Main";
import { Upgrades } from "./components/Upgrades";
import { Garden } from "./components/Garden";
import { ResourcesDisplay } from "./components/ResourcesDisplay";

type Screen = "main" | "inventory" | "equipment" | "upgrades" | "garden";

function App() {
  const [screen, setScreen] = useState<Screen>("main");

  return (
    <div style={{ padding: 16 }}>
      <ResourcesDisplay />

      <div
        style={{ marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}
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
          className={screen === "equipment" ? "btn-selected" : ""}
          style={{ flex: "1 1 auto" }}
          onClick={() => setScreen("equipment")}
        >
          Equipment
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
      </div>

      {screen === "inventory" && <Inventory />}
      {screen === "equipment" && <Equipment />}
      {screen === "upgrades" && <Upgrades />}
      {screen === "garden" && <Garden />}
      {screen === "main" && <Main />}
    </div>
  );
}

export default App;
