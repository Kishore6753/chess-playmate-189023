import React from "react";
import { idxToCoord } from "../utils/coords";

function moveLabel(move) {
  if (!move) return "";
  const promo = move.promotion ? `=${move.promotion.toUpperCase()}` : "";
  const capture = move.captured ? "x" : "-";
  const castle =
    move.isCastle === "K" || move.isCastle === "k"
      ? "O-O"
      : move.isCastle === "Q" || move.isCastle === "q"
        ? "O-O-O"
        : null;

  if (castle) return castle;
  return `${idxToCoord(move.from)}${capture}${idxToCoord(move.to)}${promo}`;
}

export default function MoveList({ history }) {
  return (
    <div className="panel">
      <div className="panel__title">Moves</div>
      <ol className="moveList">
        {history.map((h, idx) => (
          <li key={idx} className="moveItem">
            {moveLabel(h.move)}
          </li>
        ))}
        {!history.length ? <li className="moveItem moveItem--muted">No moves yet.</li> : null}
      </ol>
    </div>
  );
}
