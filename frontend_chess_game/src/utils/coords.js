/**
 * Board index convention:
 * - squares are indexed 0..63
 * - 0 = a8, 7 = h8, 56 = a1, 63 = h1
 */

export const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
export const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];

// PUBLIC_INTERFACE
export function idxToCoord(idx) {
  /** This is a public function. Converts index (0..63) to algebraic coordinate (e.g., 0 -> "a8"). */
  const file = idx % 8;
  const rank = Math.floor(idx / 8);
  return `${FILES[file]}${RANKS[rank]}`;
}

// PUBLIC_INTERFACE
export function coordToIdx(coord) {
  /** This is a public function. Converts algebraic coordinate (e.g., "e4") to index (0..63). */
  if (!coord || coord.length < 2) return null;
  const fileChar = coord[0].toLowerCase();
  const rankChar = coord[1];
  const file = FILES.indexOf(fileChar);
  const rank = RANKS.indexOf(rankChar);
  if (file === -1 || rank === -1) return null;
  return rank * 8 + file;
}

// PUBLIC_INTERFACE
export function idxToFileRank(idx) {
  /** This is a public function. Converts index to {file, rank} 0-based in our array orientation. */
  return { file: idx % 8, rank: Math.floor(idx / 8) };
}

// PUBLIC_INTERFACE
export function fileRankToIdx(file, rank) {
  /** This is a public function. Converts {file, rank} (0..7) to index. */
  if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
  return rank * 8 + file;
}
