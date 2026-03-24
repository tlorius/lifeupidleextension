import { useGame } from "../game/GameContext";
import { addDebugItems } from "../game/items";
import { createDefaultState } from "../game/state";

export function Main() {
  const { setState } = useGame();
  return (
    <div style={{ padding: 20 }}>
      <h1>Idle RPG</h1>

      <button
        style={{
          padding: "12px",
          fontSize: "15px",
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
          fontSize: "15px",
          width: "100%",
          marginBottom: 8,
        }}
        onClick={() => {
          setState((prev) => ({
            ...prev,
            resources: {
              ...prev.resources,
              gold: prev.resources.gold + 1000,
            },
          }));
        }}
      >
        +1000 Gold
      </button>

      <button
        style={{
          padding: "12px",
          fontSize: "15px",
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
          fontSize: "15px",
          width: "100%",
          marginBottom: 8,
        }}
        onClick={() => {
          setState((prev) => ({
            ...prev,
            resources: {
              ...prev.resources,
              gems: (prev.resources.gems ?? 0) + 1000,
            },
          }));
        }}
      >
        +1000 Gems
      </button>

      <button
        style={{
          padding: "12px",
          fontSize: "15px",
          width: "100%",
          marginBottom: 8,
        }}
        onClick={() => {
          setState((prev) => ({
            ...prev,
            resources: {
              ...prev.resources,
              gold: prev.resources.gold + 100000,
              gems: (prev.resources.gems ?? 0) + 100000,
            },
          }));
        }}
      >
        +100000 Gold & Gems
      </button>

      <button
        style={{
          padding: "12px",
          fontSize: "15px",
          width: "100%",
          marginBottom: 8,
        }}
        onClick={() => {
          setState((prev) => ({
            ...prev,
            resources: {
              ...prev.resources,
              energy: (prev.resources.energy ?? 0) + 1000,
            },
          }));
        }}
      >
        +1000 Mana
      </button>

      <button
        style={{
          padding: "12px",
          fontSize: "15px",
          width: "100%",
          marginBottom: 8,
        }}
        onClick={() => {
          setState((prev) => ({
            ...prev,
            character: {
              ...prev.character,
              availableSkillPoints: prev.character.availableSkillPoints + 100,
            },
          }));
        }}
      >
        +100 Skill Points
      </button>

      <button
        style={{
          padding: "12px",
          fontSize: "15px",
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
        className="btn-danger"
        style={{
          padding: "12px",
          fontSize: "15px",
          width: "100%",
        }}
        onClick={() => {
          if (
            confirm("Are you sure you want to reset the entire game state?")
          ) {
            setState(createDefaultState());
          }
        }}
      >
        Reset Game State
      </button>
    </div>
  );
}
