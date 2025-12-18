import React from "react";
import Square from "./Square";
import { FILES, RANKS, idxToCoord } from "../utils/coords";

const PIECE_NAME = {
  K: "White king",
  Q: "White queen",
  R: "White rook",
  B: "White bishop",
  N: "White knight",
  P: "White pawn",
  k: "Black king",
  q: "Black queen",
  r: "Black rook",
  b: "Black bishop",
  n: "Black knight",
  p: "Black pawn",
};

function pieceSrc(piece, theme = "default") {
  if (!piece) return null;
  // assets path is relative to this file (src/components -> src/assets)
  // Theme scaffold: keep "default" now; structure supports adding more later.
  return `../assets/pieces/${theme}/${piece === piece.toUpperCase() ? "w" : "b"}${piece.toUpperCase()}.svg`;
}

// PUBLIC_INTERFACE
export default function Board({
  board,
  selected,
  legalMoves,
  lastMove,
  onSquareClick,
  showCoordinates,
  pieceTheme = "default",
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

          const src = piece ? pieceSrc(piece, pieceTheme) : null;
          const alt = piece ? PIECE_NAME[piece] ?? `${piece}` : "";

          return (
            <div key={idx} className="boardCell">
              <Square
                dark={dark}
                selected={isSelected}
                highlight={isHighlight}
                lastMove={isLast}
                onClick={() => onSquareClick(idx)}
              >
                <span className="pieceLayer" aria-label={piece ? `${alt} on ${idxToCoord(idx)}` : `Empty ${idxToCoord(idx)}`}>
                  {piece ? (
                    <img
                      className="pieceImg"
                      src={src}
                      alt={alt}
                      draggable="false"
                    />
                  ) : null}
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
