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
      <h1>Idle RPG</h1>

      <ResourcesDisplay />

      <div
        style={{ marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}
      >
        <button
          style={{
            flex: "1 1 auto",
            padding: "8px 12px",
            backgroundColor: screen === "main" ? "#51cf66" : "#f0f0f0",
            color: screen === "main" ? "white" : "black",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 12,
          }}
          onClick={() => setScreen("main")}
        >
          Main
        </button>
        <button
          style={{
            flex: "1 1 auto",
            padding: "8px 12px",
            backgroundColor: screen === "inventory" ? "#51cf66" : "#f0f0f0",
            color: screen === "inventory" ? "white" : "black",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 12,
          }}
          onClick={() => setScreen("inventory")}
        >
          Inventory
        </button>
        <button
          style={{
            flex: "1 1 auto",
            padding: "8px 12px",
            backgroundColor: screen === "equipment" ? "#51cf66" : "#f0f0f0",
            color: screen === "equipment" ? "white" : "black",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 12,
          }}
          onClick={() => setScreen("equipment")}
        >
          Equipment
        </button>
        <button
          style={{
            flex: "1 1 auto",
            padding: "8px 12px",
            backgroundColor: screen === "upgrades" ? "#51cf66" : "#f0f0f0",
            color: screen === "upgrades" ? "white" : "black",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 12,
          }}
          onClick={() => setScreen("upgrades")}
        >
          Upgrades
        </button>
        <button
          style={{
            flex: "1 1 auto",
            padding: "8px 12px",
            backgroundColor: screen === "garden" ? "#51cf66" : "#f0f0f0",
            color: screen === "garden" ? "white" : "black",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 12,
          }}
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
