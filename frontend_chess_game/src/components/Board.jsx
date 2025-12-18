import React from "react";
import Square from "./Square";
import { FILES, RANKS, idxToCoord } from "../utils/coords";

const PIECE_GLYPH = {
  K: "♔",
  Q: "♕",
  R: "♖",
  B: "♗",
  N: "♘",
  P: "♙",
  k: "♚",
  q: "♛",
  r: "♜",
  b: "♝",
  n: "♞",
  p: "♟",
};

// PUBLIC_INTERFACE
export default function Board({
  board,
  selected,
  legalMoves,
  lastMove,
  onSquareClick,
  showCoordinates,
}) {
  /** This is a public function. Renders the 8x8 board grid and handles square selection. */
  const legalDestinations = new Set((legalMoves || []).map((m) => m.to));
  const lastFrom = lastMove?.from ?? null;
  const lastTo = lastMove?.to ?? null;

  return (
    <div className="boardWrap">
      <div className="board" role="grid" aria-label="Chess board">
        {board.map((piece, idx) => {
          const file = idx % 8;
          const rank = Math.floor(idx / 8);
          const dark = (file + rank) % 2 === 1;
          const isSelected = selected === idx;
          const isHighlight = legalDestinations.has(idx);
          const isLast = idx === lastFrom || idx === lastTo;

          return (
            <div key={idx} className="boardCell">
              <Square
                dark={dark}
                selected={isSelected}
                highlight={isHighlight}
                lastMove={isLast}
                onClick={() => onSquareClick(idx)}
              >
                <span
                  className="piece"
                  aria-label={
                    piece
                      ? `${piece} on ${idxToCoord(idx)}`
                      : `Empty ${idxToCoord(idx)}`
                  }
                >
                  {piece ? PIECE_GLYPH[piece] : ""}
                </span>

                {showCoordinates ? (
                  <span className="coord">
                    {FILES[file]}
                    {RANKS[rank]}
                  </span>
                ) : null}

                {isHighlight ? <span className="dot" aria-hidden="true" /> : null}
              </Square>
            </div>
          );
        })}
      </div>
    </div>
  );
}
