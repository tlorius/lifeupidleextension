import { useGame } from "../game/GameContext";

export function Main() {
  const { dispatch } = useGame();
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
        onClick={() => dispatch({ type: "resource/addGold", amount: 10 })}
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
        onClick={() => dispatch({ type: "resource/addGold", amount: 1000 })}
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
        onClick={() => dispatch({ type: "resource/addGems", amount: 100 })}
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
        onClick={() => dispatch({ type: "resource/addGems", amount: 1000 })}
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
        onClick={() =>
          dispatch({
            type: "resource/addGoldAndGems",
            goldAmount: 100000,
            gemsAmount: 100000,
          })
        }
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
        onClick={() => dispatch({ type: "resource/addEnergy", amount: 1000 })}
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
        onClick={() =>
          dispatch({ type: "character/addSkillPoints", amount: 100 })
        }
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
        onClick={() => dispatch({ type: "inventory/addDebugItems" })}
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
            dispatch({ type: "state/resetToDefault" });
          }
        }}
      >
        Reset Game State
      </button>
    </div>
  );
}
