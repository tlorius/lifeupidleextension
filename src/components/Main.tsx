import { useGame } from "../game/GameContext";
import { addDebugItems } from "../game/items";
import { defaultState } from "../game/state";

export function Main() {
  const { setState } = useGame();
  return (
    <div style={{ padding: 20 }}>
      <h1>Idle RPG</h1>

      <button
        style={{
          padding: "12px",
          fontSize: "16px",
          width: "100%",
          marginBottom: 8,
        }}
        onClick={() => {
          setState((prev) => ({
            ...prev,
            resources: {
              ...prev.resources,
              gold: prev.resources.gold + 10,
            },
          }));
        }}
      >
        +10 Gold
      </button>

      <button
        style={{
          padding: "12px",
          fontSize: "16px",
          width: "100%",
          marginBottom: 8,
        }}
        onClick={() => {
          setState((prev) => ({
            ...prev,
            resources: {
              ...prev.resources,
              gems: (prev.resources.gems ?? 0) + 100,
            },
          }));
        }}
      >
        +100 Gems
      </button>

      <button
        style={{
          padding: "12px",
          fontSize: "16px",
          width: "100%",
          marginBottom: 8,
        }}
        onClick={() => {
          setState((prev) => addDebugItems(prev));
        }}
      >
        Add Items to debug
      </button>

      <button
        style={{
          padding: "12px",
          fontSize: "16px",
          width: "100%",
          backgroundColor: "#ff6b6b",
          color: "white",
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
        }}
        onClick={() => {
          if (
            confirm("Are you sure you want to reset the entire game state?")
          ) {
            setState(defaultState);
          }
        }}
      >
        Reset Game State
      </button>
    </div>
  );
}
