import { idxToFileRank, fileRankToIdx } from "../utils/coords";
import { inCheck, isSquareAttacked, opposite, pieceColor } from "./rules";

/**
 * Move format used throughout:
 * {
 *   from: number,
 *   to: number,
 *   piece: string,          // piece moved
 *   captured?: string|null,
 *   promotion?: string|null, // piece char to promote to (same color)
 *   isEnPassant?: boolean,
 *   isCastle?: "K"|"Q"|"k"|"q"|null
 * }
 */

// PUBLIC_INTERFACE
export function generateLegalMoves(position, fromSquare = null) {
  /** This is a public function. Generates all legal moves; if fromSquare provided, only moves from that square. */
  const pseudo = generatePseudoLegalMoves(position, fromSquare);
  const legal = [];
  for (const mv of pseudo) {
    const next = applyMove(position, mv);
    if (!inCheck(next.board, position.sideToMove, next.castling, next.epSquare)) {
      legal.push(mv);
    }
  }
  return legal;
}

// PUBLIC_INTERFACE
export function generatePseudoLegalMoves(position, fromSquare = null) {
  /** This is a public function. Generates pseudo-legal moves (king safety not enforced). */
  const { board, sideToMove, castling, epSquare } = position;
  const moves = [];

  for (let i = 0; i < 64; i += 1) {
    if (fromSquare != null && i !== fromSquare) continue;
    const piece = board[i];
    if (!piece) continue;
    if (pieceColor(piece) !== sideToMove) continue;

    const pc = piece.toLowerCase();
    if (pc === "p") genPawnMoves(position, i, piece, moves);
    else if (pc === "n") genKnightMoves(position, i, piece, moves);
    else if (pc === "b") genSlidingMoves(position, i, piece, moves, [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ]);
    else if (pc === "r") genSlidingMoves(position, i, piece, moves, [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ]);
    else if (pc === "q") genSlidingMoves(position, i, piece, moves, [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ]);
    else if (pc === "k") {
      genKingMoves(position, i, piece, moves);

      // Castling (pseudo-legal: ensure squares empty and not attacked)
      if (sideToMove === "w") {
        if (castling.K) maybeAddCastle(position, moves, "K");
        if (castling.Q) maybeAddCastle(position, moves, "Q");
      } else {
        if (castling.k) maybeAddCastle(position, moves, "k");
        if (castling.q) maybeAddCastle(position, moves, "q");
      }
    }
  }

  // epSquare currently handled in pawn generator.
  void epSquare;
  return moves;
}

function genPawnMoves(position, from, piece, moves) {
  const { board, sideToMove, epSquare } = position;
  const { file, rank } = idxToFileRank(from);
  const dir = sideToMove === "w" ? -1 : 1;
  const startRank = sideToMove === "w" ? 6 : 1;
  const promoRank = sideToMove === "w" ? 0 : 7;

  const oneIdx = fileRankToIdx(file, rank + dir);
  if (oneIdx != null && !board[oneIdx]) {
    addPawnAdvance(position, from, oneIdx, piece, moves, promoRank);

    const twoIdx = fileRankToIdx(file, rank + 2 * dir);
    if (rank === startRank && twoIdx != null && !board[twoIdx]) {
      moves.push({ from, to: twoIdx, piece });
    }
  }

  // Captures
  for (const df of [-1, 1]) {
    const capIdx = fileRankToIdx(file + df, rank + dir);
    if (capIdx == null) continue;
    const target = board[capIdx];
    if (target && pieceColor(target) !== sideToMove) {
      addPawnCapture(position, from, capIdx, piece, target, moves, promoRank);
    }

    // En passant
    if (epSquare != null && capIdx === epSquare) {
      // capture pawn behind the ep square
      const capturedPawnIdx = fileRankToIdx(file + df, rank);
      const captured = capturedPawnIdx != null ? board[capturedPawnIdx] : null;
      if (captured && captured.toLowerCase() === "p" && pieceColor(captured) !== sideToMove) {
        moves.push({
          from,
          to: capIdx,
          piece,
          captured,
          isEnPassant: true,
        });
      }
    }
  }
}

function addPawnAdvance(position, from, to, piece, moves, promoRank) {
  const { rank } = idxToFileRank(to);
  if (rank === promoRank) {
    // default promote to queen; UI may override via promotionChoice flag.
    moves.push({ from, to, piece, promotion: promotePiece(pieceColor(piece), "q") });
  } else {
    moves.push({ from, to, piece });
  }
}

function addPawnCapture(position, from, to, piece, captured, moves, promoRank) {
  const { rank } = idxToFileRank(to);
  if (rank === promoRank) {
    moves.push({
      from,
      to,
      piece,
      captured,
      promotion: promotePiece(pieceColor(piece), "q"),
    });
  } else {
    moves.push({ from, to, piece, captured });
  }
}

function promotePiece(color, pcLower) {
  const ch = pcLower.toLowerCase();
  return color === "w" ? ch.toUpperCase() : ch;
}

function genKnightMoves(position, from, piece, moves) {
  const { board, sideToMove } = position;
  const { file, rank } = idxToFileRank(from);
  const deltas = [
    [1, 2],
    [2, 1],
    [2, -1],
    [1, -2],
    [-1, -2],
    [-2, -1],
    [-2, 1],
    [-1, 2],
  ];
  for (const [df, dr] of deltas) {
    const idx = fileRankToIdx(file + df, rank + dr);
    if (idx == null) continue;
    const target = board[idx];
    if (!target || pieceColor(target) !== sideToMove) {
      moves.push({ from, to: idx, piece, captured: target || null });
    }
  }
}

function genSlidingMoves(position, from, piece, moves, directions) {
  const { board, sideToMove } = position;
  const { file, rank } = idxToFileRank(from);

  for (const [df, dr] of directions) {
    let f = file + df;
    let r = rank + dr;
    while (true) {
      const idx = fileRankToIdx(f, r);
      if (idx == null) break;
      const target = board[idx];
      if (!target) {
        moves.push({ from, to: idx, piece });
      } else {
        if (pieceColor(target) !== sideToMove) moves.push({ from, to: idx, piece, captured: target });
        break;
      }
      f += df;
      r += dr;
    }
  }
}

function genKingMoves(position, from, piece, moves) {
  const { board, sideToMove } = position;
  const { file, rank } = idxToFileRank(from);
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let df = -1; df <= 1; df += 1) {
      if (df === 0 && dr === 0) continue;
      const idx = fileRankToIdx(file + df, rank + dr);
      if (idx == null) continue;
      const target = board[idx];
      if (!target || pieceColor(target) !== sideToMove) {
        moves.push({ from, to: idx, piece, captured: target || null });
      }
    }
  }
}

function maybeAddCastle(position, moves, side) {
  const { board, sideToMove, castling } = position;

  const kingFrom = sideToMove === "w" ? 60 : 4;
  const rookFrom = sideToMove === "w" ? (side === "K" ? 63 : 56) : side === "k" ? 7 : 0;

  const kingPiece = board[kingFrom];
  const rookPiece = board[rookFrom];
  if (!kingPiece || kingPiece.toLowerCase() !== "k") return;
  if (!rookPiece || rookPiece.toLowerCase() !== "r") return;

  if (side === "K" || side === "k") {
    const through1 = kingFrom + 1;
    const through2 = kingFrom + 2;
    if (board[through1] || board[through2]) return;
    // cannot be in check or pass through attacked squares
    if (inCheck(board, sideToMove, castling, position.epSquare)) return;
    if (isSquareAttacked(board, through1, opposite(sideToMove))) return;
    if (isSquareAttacked(board, through2, opposite(sideToMove))) return;
    moves.push({ from: kingFrom, to: through2, piece: kingPiece, isCastle: side });
  } else {
    const through1 = kingFrom - 1;
    const through2 = kingFrom - 2;
    const emptyNeeded = [kingFrom - 1, kingFrom - 2, kingFrom - 3];
    if (emptyNeeded.some((sq) => board[sq])) return;
    if (inCheck(board, sideToMove, castling, position.epSquare)) return;
    if (isSquareAttacked(board, through1, opposite(sideToMove))) return;
    if (isSquareAttacked(board, through2, opposite(sideToMove))) return;
    moves.push({ from: kingFrom, to: through2, piece: kingPiece, isCastle: side });
  }
}

// PUBLIC_INTERFACE
export function applyMove(position, move) {
  /** This is a public function. Returns a new position after applying move. */
  const { board, sideToMove, castling } = position;
  const nextBoard = board.slice();

  const piece = move.piece;
  const from = move.from;
  const to = move.to;

  // Reset en-passant unless pawn double-step.
  let nextEp = null;

  // Update halfmove clock: reset on capture or pawn move.
  const isPawn = piece.toLowerCase() === "p";
  const didCapture = Boolean(move.captured) || Boolean(move.isEnPassant);

  // Handle en passant capture
  if (move.isEnPassant) {
    const fromFR = idxToFileRank(from);
    const capIdx = fileRankToIdx(idxToFileRank(to).file, fromFR.rank);
    if (capIdx != null) nextBoard[capIdx] = null;
  }

  // Move piece
  nextBoard[from] = null;

  // Promotion
  let placedPiece = piece;
  if (move.promotion) placedPiece = move.promotion;

  nextBoard[to] = placedPiece;

  // Castling rook move
  let nextCastling = { ...castling };
  if (move.isCastle) {
    if (move.isCastle === "K") {
      nextBoard[63] = null;
      nextBoard[61] = "R";
    } else if (move.isCastle === "Q") {
      nextBoard[56] = null;
      nextBoard[59] = "R";
    } else if (move.isCastle === "k") {
      nextBoard[7] = null;
      nextBoard[5] = "r";
    } else if (move.isCastle === "q") {
      nextBoard[0] = null;
      nextBoard[3] = "r";
    }
  }

  // Update castling rights if king or rooks move/captured.
  if (piece === "K") nextCastling = { ...nextCastling, K: false, Q: false };
  if (piece === "k") nextCastling = { ...nextCastling, k: false, q: false };
  if (from === 63 || to === 63) nextCastling = { ...nextCastling, K: false };
  if (from === 56 || to === 56) nextCastling = { ...nextCastling, Q: false };
  if (from === 7 || to === 7) nextCastling = { ...nextCastling, k: false };
  if (from === 0 || to === 0) nextCastling = { ...nextCastling, q: false };

  // Pawn double-step sets en-passant square
  if (isPawn) {
    const fr = idxToFileRank(from);
    const tr = idxToFileRank(to);
    if (Math.abs(tr.rank - fr.rank) === 2) {
      const midRank = (fr.rank + tr.rank) / 2;
      nextEp = fileRankToIdx(fr.file, midRank);
    }
  }

  const nextSide = opposite(sideToMove);

  const nextHalfmove = isPawn || didCapture ? 0 : (position.halfmoveClock ?? 0) + 1;
  const nextFullmove = sideToMove === "b" ? (position.fullmoveNumber ?? 1) + 1 : position.fullmoveNumber ?? 1;

  return {
    ...position,
    board: nextBoard,
    sideToMove: nextSide,
    castling: nextCastling,
    epSquare: nextEp,
    halfmoveClock: nextHalfmove,
    fullmoveNumber: nextFullmove,
  };
}
