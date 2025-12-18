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

/**
 * CRA (react-scripts) will correctly bundle static assets if they are referenced via import/require.
 * Building string paths like "../assets/..." results in broken <img src> at runtime.
 *
 * We use require.context so:
 * - all 12 piece SVGs are included in the build
 * - we can map piece codes ("K", "p", ...) to resolved URLs deterministically
 */
const DEFAULT_PIECES_CTX = require.context("../assets/pieces/default", false, /\.svg$/);

function buildPieceUrlMap(ctx) {
  const map = {};
  ctx.keys().forEach((k) => {
    // keys are like "./wK.svg"
    const filename = k.replace("./", "");
    map[filename] = ctx(k);
  });
  return map;
}

const DEFAULT_PIECE_URLS = buildPieceUrlMap(DEFAULT_PIECES_CTX);

function pieceFilename(piece) {
  if (!piece) return null;
  const colorPrefix = piece === piece.toUpperCase() ? "w" : "b";
  // internal board uses uppercase letter for piece type (K,Q,R,B,N,P)
  return `${colorPrefix}${piece.toUpperCase()}.svg`;
}

function pieceSrc(piece, theme = "default") {
  if (!piece) return null;

  // Theme scaffold: currently only "default" exists on disk.
  // If additional themes are added later, wire them up similarly with require.context.
  if (theme !== "default") {
    // fallback to default for unknown themes
    // (keeps UI functioning if theme select is extended before assets exist)
    theme = "default";
  }

  const filename = pieceFilename(piece);
  if (!filename) return null;

  // For CRA, ctx(modulePath) returns a URL string for <img src>.
  // Keys in our map are "wK.svg", "bQ.svg", etc.
  return DEFAULT_PIECE_URLS[filename] || null;
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
                <span
                  className="pieceLayer"
                  aria-label={
                    piece
                      ? `${alt} on ${idxToCoord(idx)}`
                      : `Empty ${idxToCoord(idx)}`
                  }
                >
                  {piece && src ? (
                    <img
                      className="pieceImg"
                      src={src}
                      alt={alt}
                      width={64}
                      height={64}
                      draggable="false"
                      onError={(e) => {
                        // If something goes wrong, hide broken icon rather than showing a generic image placeholder.
                        e.currentTarget.style.visibility = "hidden";
                      }}
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
