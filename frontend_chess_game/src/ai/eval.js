import { pieceColor } from "../game/rules";
import { idxToFileRank } from "../utils/coords";

const VALUES = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// A tiny piece-square table for pawns/knights to make AI less random.
// Values are from White perspective; mirrored for Black.
const PST = {
  p: [
    0, 0, 0, 0, 0, 0, 0, 0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
    5, 5, 10, 25, 25, 10, 5, 5,
    0, 0, 0, 20, 20, 0, 0, 0,
    5, -5, -10, 0, 0, -10, -5, 5,
    5, 10, 10, -20, -20, 10, 10, 5,
    0, 0, 0, 0, 0, 0, 0, 0,
  ],
  n: [
    -50, -40, -30, -30, -30, -30, -40, -50,
    -40, -20, 0, 5, 5, 0, -20, -40,
    -30, 5, 10, 15, 15, 10, 5, -30,
    -30, 0, 15, 20, 20, 15, 0, -30,
    -30, 5, 15, 20, 20, 15, 5, -30,
    -30, 0, 10, 15, 15, 10, 0, -30,
    -40, -20, 0, 0, 0, 0, -20, -40,
    -50, -40, -30, -30, -30, -30, -40, -50,
  ],
};

function pstValue(pieceLower, idx, color) {
  const table = PST[pieceLower];
  if (!table) return 0;
  if (color === "w") return table[idx];
  // mirror vertically for black
  const { file, rank } = idxToFileRank(idx);
  const mirrored = (7 - rank) * 8 + file;
  return -table[mirrored];
}

// PUBLIC_INTERFACE
export function evaluate(position, perspectiveColor) {
  /** This is a public function. Returns evaluation score from perspectiveColor (positive is good). */
  const { board } = position;
  let score = 0;

  for (let i = 0; i < 64; i += 1) {
    const p = board[i];
    if (!p) continue;
    const color = pieceColor(p);
    const lower = p.toLowerCase();
    const base = VALUES[lower] ?? 0;
    const pos = pstValue(lower, i, color);

    const pieceScore = base + pos;
    score += color === perspectiveColor ? pieceScore : -pieceScore;
  }

  return score;
}
