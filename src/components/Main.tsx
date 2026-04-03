import { useState } from "react";
import { useGameActions } from "../game/useGameActions";
import { useGame } from "../game/GameContext";
import { createSignedMockPlaytimeToken } from "../game/tokenRewards";

interface MainProps {
  isDebugShopEnabled: boolean;
  onDebugShopToggle: (enabled: boolean) => void;
}

function ConfigReloadButton() {
  const { reloadConfig } = useGame();
  const [isLoading, setIsLoading] = useState(false);

  const handleReload = async () => {
    setIsLoading(true);
    try {
      reloadConfig();
      alert("✓ Game config reloaded successfully!");
    } catch (error) {
      console.error("Failed to reload config:", error);
      alert("✗ Failed to reload config. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      style={{
        padding: "12px",
        fontSize: "15px",
        width: "100%",
        marginBottom: 8,
        background: "#5a4a3a",
        borderColor: "#7a6a5a",
        opacity: isLoading ? 0.7 : 1,
        cursor: isLoading ? "not-allowed" : "pointer",
      }}
      onClick={handleReload}
      disabled={isLoading}
    >
      {isLoading ? "Reloading..." : "Reload Game Config"}
    </button>
  );
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
  const [lastCopiedPlaytimeToken, setLastCopiedPlaytimeToken] = useState<
    string | null
  >(null);
  const [playtimeTokenGeneratedAtMs, setPlaytimeTokenGeneratedAtMs] =
    useState<number>(() => Date.now());

  const sampleSignedPlaytimeToken = createSignedMockPlaytimeToken({
    units: 1,
    expiresAt: playtimeTokenGeneratedAtMs + 1000 * 60 * 60,
    nonce: `sample-${playtimeTokenGeneratedAtMs}`,
  });
  const sampleSignedPlaytimeUrl = `${window.location.origin}${window.location.pathname}?playtimeToken=${encodeURIComponent(sampleSignedPlaytimeToken)}`;

  const makePlaytimeUrl = (token: string): string =>
    `${window.location.origin}${window.location.pathname}?playtimeToken=${encodeURIComponent(token)}`;

  const aliasPlaytimeTokens: Array<{ label: string; token: string }> = [
    { label: "5m (1 unit)", token: "play-5m=1u" },
    { label: "15m (3 units)", token: "play-15m=3u" },
    { label: "30m (6 units)", token: "play-30m=6u" },
    { label: "60m (12 units)", token: "play-60m=12u" },
  ];

  const signedPlaytimeTokens: Array<{ label: string; token: string }> = [
    {
      label: "Signed 5m (1 unit)",
      token: createSignedMockPlaytimeToken({
        units: 1,
        expiresAt: playtimeTokenGeneratedAtMs + 1000 * 60 * 60,
        nonce: `signed-1-${playtimeTokenGeneratedAtMs}`,
      }),
    },
    {
      label: "Signed 15m (3 units)",
      token: createSignedMockPlaytimeToken({
        units: 3,
        expiresAt: playtimeTokenGeneratedAtMs + 1000 * 60 * 60,
        nonce: `signed-3-${playtimeTokenGeneratedAtMs}`,
      }),
    },
    {
      label: "Signed 30m (6 units)",
      token: createSignedMockPlaytimeToken({
        units: 6,
        expiresAt: playtimeTokenGeneratedAtMs + 1000 * 60 * 60,
        nonce: `signed-6-${playtimeTokenGeneratedAtMs}`,
      }),
    },
  ];

  const copyText = async (text: string, label: string) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setLastCopiedPlaytimeToken(label);
      }
    } catch {
      setLastCopiedPlaytimeToken(null);
    }
  };

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
        <button
          style={{ marginTop: 8, width: "100%" }}
          onClick={() => {
            setPlaytimeTokenGeneratedAtMs(Date.now());
            setLastCopiedPlaytimeToken(null);
          }}
        >
          Generate Fresh Signed Tokens
        </button>
        <div style={{ marginTop: 6, fontSize: 11, color: "#9bb1c6" }}>
          Generated at:{" "}
          {new Date(playtimeTokenGeneratedAtMs).toLocaleTimeString()}
        </div>
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

        <div style={{ marginTop: 10, fontSize: 11, color: "#9bb1c6" }}>
          Valid mock alias tokens
        </div>
        <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
          {aliasPlaytimeTokens.map((entry) => {
            const url = makePlaytimeUrl(entry.token);
            return (
              <div
                key={entry.token}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto",
                  gap: 6,
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: 11, color: "#d2e2f0" }}>
                  {entry.label}: {entry.token}
                </div>
                <button
                  type="button"
                  className="ui-modal-btn-compact"
                  onClick={() => copyText(entry.token, `${entry.label} token`)}
                >
                  Copy token
                </button>
                <button
                  type="button"
                  className="ui-modal-btn-compact"
                  onClick={() => copyText(url, `${entry.label} URL`)}
                >
                  Copy URL
                </button>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 10, fontSize: 11, color: "#9bb1c6" }}>
          Valid signed mock tokens
        </div>
        <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
          {signedPlaytimeTokens.map((entry) => {
            const url = makePlaytimeUrl(entry.token);
            return (
              <div
                key={entry.label}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto",
                  gap: 6,
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: 11, color: "#d2e2f0" }}>
                  {entry.label}
                </div>
                <button
                  type="button"
                  className="ui-modal-btn-compact"
                  onClick={() => copyText(entry.token, `${entry.label} token`)}
                >
                  Copy token
                </button>
                <button
                  type="button"
                  className="ui-modal-btn-compact"
                  onClick={() => copyText(url, `${entry.label} URL`)}
                >
                  Copy URL
                </button>
              </div>
            );
          })}
        </div>

        {lastCopiedPlaytimeToken ? (
          <div style={{ marginTop: 8, fontSize: 11, color: "#98d7ac" }}>
            Copied: {lastCopiedPlaytimeToken}
          </div>
        ) : null}
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

      <div
        style={{
          marginTop: 14,
          marginBottom: 14,
          padding: 10,
          border: "1px solid #5a4a3a",
          borderRadius: 8,
          background: "rgba(47, 37, 27, 0.6)",
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 13 }}>
          Developer Config Settings
        </div>
        <ConfigReloadButton />
        <div style={{ fontSize: 11, color: "#d2d2a0", marginTop: 8 }}>
          Reloads config from public/config/ JSON files and environment
          variables.
          <br />
          Changes take effect immediately for new game mechanics.
        </div>
      </div>
    </div>
  );
}
