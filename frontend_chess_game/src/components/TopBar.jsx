import React from "react";

// PUBLIC_INTERFACE
export default function TopBar({
  mode,
  onModeChange,
  canUndo,
  onUndo,
  onNewGame,
  aiEnabled,
  aiDepth,
  onAiDepthChange,
  featureFlags,
}) {
  /** This is a public function. Renders the application title and top game controls. */
  return (
    <div className="topBar">
      <div className="topBar__left">
        <h1 className="appTitle">Chess Playmate</h1>
        <div className="tagline">
          A lightweight chess board with legal moves and optional AI.
        </div>
      </div>

      <div className="topBar__right">
        <div className="controlRow" role="group" aria-label="Game controls">
          <button className="btn" type="button" onClick={onNewGame}>
            New game
          </button>

          <label className="selectLabel">
            Mode
            <select
              className="select"
              value={mode}
              onChange={(e) => onModeChange(e.target.value)}
              aria-label="Select game mode"
            >
              <option value="pvp">Two player</option>
              {featureFlags.ai ? <option value="ai">Vs AI</option> : null}
            </select>
          </label>

          {featureFlags.undo ? (
            <button
              className="btn btn--secondary"
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
            >
              Undo
            </button>
          ) : null}

          {aiEnabled ? (
            <label className="selectLabel">
              AI depth
              <select
                className="select"
                value={aiDepth}
                onChange={(e) => onAiDepthChange(Number(e.target.value))}
                aria-label="Select AI depth"
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </label>
          ) : null}
        </div>
      </div>
    </div>
  );
}
