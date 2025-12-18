import { idxToFileRank, fileRankToIdx } from "../utils/coords";

const WHITE = "w";
const BLACK = "b";

// PUBLIC_INTERFACE
export function pieceColor(piece) {
  /** This is a public function. Returns "w" | "b" | null for a piece char. */
  if (!piece) return null;
  return piece === piece.toUpperCase() ? WHITE : BLACK;
}

// PUBLIC_INTERFACE
export function opposite(color) {
  /** This is a public function. Returns the opposite side color. */
  return color === WHITE ? BLACK : WHITE;
}

// PUBLIC_INTERFACE
export function isKing(piece) {
  /** This is a public function. Checks if a piece is king. */
  return piece?.toLowerCase() === "k";
}

// PUBLIC_INTERFACE
export function isPawn(piece) {
  /** This is a public function. Checks if a piece is pawn. */
  return piece?.toLowerCase() === "p";
}

// PUBLIC_INTERFACE
export function isSquareAttacked(board, squareIdx, byColor, epSquare = null) {
  /** This is a public function. Returns true if squareIdx is attacked by byColor. */
  // epSquare unused here but kept for signature stability if future enhancements needed.
  void epSquare;

  for (let i = 0; i < 64; i += 1) {
    const p = board[i];
    if (!p) continue;
    if (pieceColor(p) !== byColor) continue;
    if (attacksSquare(board, i, p, squareIdx)) return true;
  }
  return false;
}

function attacksSquare(board, from, piece, target) {
  const pc = piece.toLowerCase();
  const fromFR = idxToFileRank(from);
  const toFR = idxToFileRank(target);
  const df = toFR.file - fromFR.file;
  const dr = toFR.rank - fromFR.rank;

  if (pc === "p") {
    const dir = pieceColor(piece) === WHITE ? -1 : 1; // ranks increase downward (towards rank1), so white moves up (rank-1)
    // Pawn attacks diagonally forward
    return dr === dir && Math.abs(df) === 1;
  }

  if (pc === "n") {
    return (
      (Math.abs(df) === 1 && Math.abs(dr) === 2) ||
      (Math.abs(df) === 2 && Math.abs(dr) === 1)
    );
  }

  if (pc === "k") {
    return Math.max(Math.abs(df), Math.abs(dr)) === 1;
  }

  // Sliding pieces
  const isBishop = pc === "b";
  const isRook = pc === "r";
  const isQueen = pc === "q";

  if (isBishop || isQueen) {
    if (Math.abs(df) === Math.abs(dr) && df !== 0) {
      return rayClear(board, fromFR, toFR, Math.sign(df), Math.sign(dr));
    }
  }

  if (isRook || isQueen) {
    if ((df === 0 && dr !== 0) || (dr === 0 && df !== 0)) {
      return rayClear(board, fromFR, toFR, Math.sign(df), Math.sign(dr));
    }
  }

  return false;
}

function rayClear(board, fromFR, toFR, stepF, stepR) {
  let f = fromFR.file + stepF;
  let r = fromFR.rank + stepR;
  while (true) {
    const idx = fileRankToIdx(f, r);
    if (idx == null) return false;
    if (f === toFR.file && r === toFR.rank) return true;
    if (board[idx]) return false;
    f += stepF;
    r += stepR;
  }
}

// PUBLIC_INTERFACE
export function findKing(board, color) {
  /** This is a public function. Finds the king square index for color or null if missing. */
  const target = color === WHITE ? "K" : "k";
  for (let i = 0; i < 64; i += 1) {
    if (board[i] === target) return i;
  }
  return null;
}

// PUBLIC_INTERFACE
export function inCheck(board, color, castling, epSquare) {
  /** This is a public function. True if side color is in check. */
  void castling;
  const kingIdx = findKing(board, color);
  if (kingIdx == null) return false;
  return isSquareAttacked(board, kingIdx, opposite(color), epSquare);
}
