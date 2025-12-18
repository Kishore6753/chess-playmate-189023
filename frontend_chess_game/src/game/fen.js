import { FILES, RANKS } from "../utils/coords";

const PIECE_FROM_FEN = {
  p: "p",
  n: "n",
  b: "b",
  r: "r",
  q: "q",
  k: "k",
  P: "P",
  N: "N",
  B: "B",
  R: "R",
  Q: "Q",
  K: "K",
};

const FEN_FROM_PIECE = {
  p: "p",
  n: "n",
  b: "b",
  r: "r",
  q: "q",
  k: "k",
  P: "P",
  N: "N",
  B: "B",
  R: "R",
  Q: "Q",
  K: "K",
};

export const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/**
 * @typedef {{
 *  board: (string|null)[],
 *  sideToMove: "w"|"b",
 *  castling: {K:boolean,Q:boolean,k:boolean,q:boolean},
 *  epSquare: number|null,
 *  halfmoveClock: number,
 *  fullmoveNumber: number
 * }} ParsedFEN
 */

// PUBLIC_INTERFACE
export function parseFEN(fen) {
  /** This is a public function. Parses a FEN string into board/state fields. */
  const parts = String(fen).trim().split(/\s+/);
  if (parts.length < 4) {
    throw new Error("Invalid FEN: expected at least 4 fields");
  }

  const [placement, stm, castlingStr, epStr, halfStr = "0", fullStr = "1"] = parts;

  const board = new Array(64).fill(null);
  const ranks = placement.split("/");
  if (ranks.length !== 8) throw new Error("Invalid FEN: placement must have 8 ranks");

  let idx = 0;
  for (let r = 0; r < 8; r += 1) {
    const row = ranks[r];
    for (let i = 0; i < row.length; i += 1) {
      const ch = row[i];
      if (/\d/.test(ch)) {
        idx += Number(ch);
      } else {
        const piece = PIECE_FROM_FEN[ch];
        if (!piece) throw new Error(`Invalid FEN piece: ${ch}`);
        board[idx] = piece;
        idx += 1;
      }
    }
    if (idx !== (r + 1) * 8) throw new Error("Invalid FEN: rank does not sum to 8");
  }

  const castling = {
    K: castlingStr.includes("K"),
    Q: castlingStr.includes("Q"),
    k: castlingStr.includes("k"),
    q: castlingStr.includes("q"),
  };

  const epSquare = epStr === "-" ? null : coordToIdxStrict(epStr);

  const sideToMove = stm === "w" ? "w" : "b";
  return {
    board,
    sideToMove,
    castling,
    epSquare,
    halfmoveClock: Number(halfStr) || 0,
    fullmoveNumber: Number(fullStr) || 1,
  };
}

function coordToIdxStrict(coord) {
  const fileChar = coord[0];
  const rankChar = coord[1];
  const file = FILES.indexOf(fileChar);
  const rank = RANKS.indexOf(rankChar);
  if (file === -1 || rank === -1) throw new Error(`Invalid coordinate: ${coord}`);
  return rank * 8 + file;
}

// PUBLIC_INTERFACE
export function toFEN(state) {
  /** This is a public function. Serializes core state fields to a FEN string. */
  const { board, sideToMove, castling, epSquare, halfmoveClock, fullmoveNumber } = state;

  const ranks = [];
  for (let r = 0; r < 8; r += 1) {
    let empty = 0;
    let s = "";
    for (let f = 0; f < 8; f += 1) {
      const piece = board[r * 8 + f];
      if (!piece) {
        empty += 1;
      } else {
        if (empty) {
          s += String(empty);
          empty = 0;
        }
        s += FEN_FROM_PIECE[piece] || "?";
      }
    }
    if (empty) s += String(empty);
    ranks.push(s);
  }

  const c =
    (castling.K ? "K" : "") +
    (castling.Q ? "Q" : "") +
    (castling.k ? "k" : "") +
    (castling.q ? "q" : "");
  const castleStr = c || "-";
  const epStr = epSquare == null ? "-" : idxToCoordStrict(epSquare);

  return `${ranks.join("/")} ${sideToMove} ${castleStr} ${epStr} ${halfmoveClock ?? 0} ${fullmoveNumber ?? 1}`;
}

function idxToCoordStrict(idx) {
  const file = idx % 8;
  const rank = Math.floor(idx / 8);
  return `${FILES[file]}${RANKS[rank]}`;
}
