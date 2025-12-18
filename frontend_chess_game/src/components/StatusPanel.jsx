import React from "react";

// PUBLIC_INTERFACE
export default function StatusPanel({ status, mode, aiEnabled, clock }) {
  /** This is a public function. Shows game status (including timeout results when clocks are enabled). */
  const winnerLabel =
    status?.winner === "w" ? "White" : status?.winner === "b" ? "Black" : null;

  const timeoutLine =
    status?.result === "timeout" && winnerLabel
      ? `Winner: ${winnerLabel} (timeout)`
      : null;

  return (
    <div className="panel">
      <div className="panel__title">Status</div>
      <div className="statusLine">
        <strong>{status?.message}</strong>
      </div>

      <div className="statusMeta">
        {timeoutLine ? <div>{timeoutLine}</div> : null}
        <div>
          Mode: <strong>{mode === "ai" ? "Vs AI" : "Two player"}</strong>
        </div>
        {aiEnabled ? (
          <div>
            AI plays: <strong>Black</strong>
          </div>
        ) : null}
        {clock?.enabled ? (
          <div>
            Time control:{" "}
            <strong>
              {clock.preset?.label}{" "}
              ({clock.settings?.mode === "bronstein" ? "Bronstein" : "Fischer"})
            </strong>
          </div>
        ) : null}
      </div>

      <div className="panel__title panel__title--small">How to play</div>
      <ul className="helpList">
        <li>Click a piece to see its legal moves.</li>
        <li>Click a highlighted square to move.</li>
        <li>Castling, en passant and promotion are supported.</li>
      </ul>
    </div>
  );
}
