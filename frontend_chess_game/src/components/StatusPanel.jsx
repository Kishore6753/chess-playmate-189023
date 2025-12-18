import React from "react";

export default function StatusPanel({ status, mode, aiEnabled }) {
  return (
    <div className="panel">
      <div className="panel__title">Status</div>
      <div className="statusLine">
        <strong>{status?.message}</strong>
      </div>
      <div className="statusMeta">
        <div>
          Mode: <strong>{mode === "ai" ? "Vs AI" : "Two player"}</strong>
        </div>
        {aiEnabled ? <div>AI plays: <strong>Black</strong></div> : null}
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
