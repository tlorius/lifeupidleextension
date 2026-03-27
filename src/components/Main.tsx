import { useGameActions } from "../game/useGameActions";

interface MainProps {
  isDebugShopEnabled: boolean;
  onDebugShopToggle: (enabled: boolean) => void;
}

export function Main({ isDebugShopEnabled, onDebugShopToggle }: MainProps) {
  const {
    addDebugItems,
    addEnergy,
    addGems,
    addGold,
    addGoldAndGems,
    addSkillPoints,
    resetState,
    tickSpeedMultiplier,
    setTickSpeedMultiplier,
  } = useGameActions();

  const tickSpeedOptions: Array<1 | 10 | 100> = [1, 10, 100];
  return (
    <div style={{ padding: 20 }}>
      <h1>Idle RPG</h1>

      <div style={{ marginBottom: 10 }}>
        <div style={{ marginBottom: 6, fontSize: 13, color: "#9eb0c2" }}>
          Debug Tick Speed
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {tickSpeedOptions.map((multiplier) => (
            <button
              key={multiplier}
              className={
                tickSpeedMultiplier === multiplier ? "btn-selected" : ""
              }
              onClick={() => setTickSpeedMultiplier(multiplier)}
              style={{ flex: 1 }}
            >
              {multiplier}x
            </button>
          ))}
        </div>
      </div>

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

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
          fontSize: 14,
        }}
      >
        <input
          type="checkbox"
          checked={isDebugShopEnabled}
          onChange={(event) => onDebugShopToggle(event.target.checked)}
        />
        Enable debug shop tab section
      </label>

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
