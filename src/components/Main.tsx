import { useGameActions } from "../game/useGameActions";

export function Main() {
  const {
    addDebugItems,
    addEnergy,
    addGems,
    addGold,
    addGoldAndGems,
    addSkillPoints,
    resetState,
  } = useGameActions();
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
        onClick={() => addGold(10)}
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
        onClick={() => addGold(1000)}
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
        onClick={() => addGems(100)}
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
        onClick={() => addGems(1000)}
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
        onClick={() => addGoldAndGems(100000, 100000)}
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
        onClick={() => addEnergy(1000)}
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
        onClick={() => addSkillPoints(100)}
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
        onClick={addDebugItems}
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
            resetState();
          }
        }}
      >
        Reset Game State
      </button>
    </div>
  );
}
