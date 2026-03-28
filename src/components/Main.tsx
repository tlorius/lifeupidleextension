import { useState } from "react";
import { useGameActions } from "../game/useGameActions";
import { createSignedMockPlaytimeToken } from "../game/tokenRewards";

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
    configurePlaytime,
    resetState,
    tickSpeedMultiplier,
    setTickSpeedMultiplier,
  } = useGameActions();

  const [playtimeCapMinutesInput, setPlaytimeCapMinutesInput] =
    useState<string>("5");
  const [playtimeTokenUnitMinutesInput, setPlaytimeTokenUnitMinutesInput] =
    useState<string>("5");

  const sampleSignedPlaytimeToken = createSignedMockPlaytimeToken({
    units: 1,
    expiresAt: Date.now() + 1000 * 60 * 60,
    nonce: "sample",
  });
  const sampleSignedPlaytimeUrl = `${window.location.origin}${window.location.pathname}?playtimeToken=${encodeURIComponent(sampleSignedPlaytimeToken)}`;

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

      <div
        style={{
          marginBottom: 14,
          padding: 10,
          border: "1px solid #395067",
          borderRadius: 8,
          background: "rgba(20, 33, 47, 0.6)",
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 13 }}>
          Developer Playtime Settings
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
        >
          <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
            Session cap (minutes)
            <input
              type="number"
              min={1}
              value={playtimeCapMinutesInput}
              onChange={(event) =>
                setPlaytimeCapMinutesInput(event.target.value)
              }
            />
          </label>
          <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
            Token unit (minutes)
            <input
              type="number"
              min={1}
              value={playtimeTokenUnitMinutesInput}
              onChange={(event) =>
                setPlaytimeTokenUnitMinutesInput(event.target.value)
              }
            />
          </label>
        </div>
        <button
          style={{ marginTop: 8, width: "100%" }}
          onClick={() => {
            const cap = Number(playtimeCapMinutesInput);
            const unit = Number(playtimeTokenUnitMinutesInput);
            if (!Number.isFinite(cap) || !Number.isFinite(unit)) return;
            configurePlaytime(cap, unit);
          }}
        >
          Apply Playtime Config
        </button>
        <div style={{ marginTop: 10, fontSize: 11, color: "#9bb1c6" }}>
          Sample signed playtime token URL:
        </div>
        <textarea
          readOnly
          value={sampleSignedPlaytimeUrl}
          style={{
            marginTop: 6,
            width: "100%",
            minHeight: 56,
            resize: "vertical",
            background: "#0f1924",
            color: "#dce9f5",
            border: "1px solid #37536e",
            borderRadius: 6,
            padding: 8,
            fontSize: 11,
          }}
        />
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
