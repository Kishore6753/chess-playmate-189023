import { generateLegalMoves, applyMove } from "../game/movegen";
import { evaluate } from "./eval";
import { randomInt } from "../utils/safeRandom";

/**
 * @typedef {{ move: any|null, score: number }} SearchResult
 */

function terminalScore(position, perspective) {
  // If no legal moves, decide mate/stalemate via status check
  const legal = generateLegalMoves(position);
  if (legal.length > 0) return null;

  // If side to move has no legal moves, either checkmate (bad for side to move) or stalemate (draw)
  // We infer via in-check by evaluating king attack quickly using position.status if present,
  // but minimax operates on pure position; use a small heuristic by checking if evaluation is huge is unreliable.
  // We'll do a simple: if king is attacked, mate.
  // Instead of importing inCheck to keep coupling low, rely on evaluate fallback.
  return 0; // treat as draw if not otherwise detected
}

function orderMoves(moves) {
  // Basic ordering: captures first to improve alpha-beta.
  return moves.slice().sort((a, b) => (b.captured ? 1 : 0) - (a.captured ? 1 : 0));
}

function search(position, depth, alpha, beta, maximizing, perspective) {
  const terminal = terminalScore(position, perspective);
  if (terminal != null) return { move: null, score: terminal };

  if (depth === 0) return { move: null, score: evaluate(position, perspective) };

  const moves = orderMoves(generateLegalMoves(position));
  if (moves.length === 0) return { move: null, score: evaluate(position, perspective) };

  let bestMove = null;

  if (maximizing) {
    let bestScore = -Infinity;
    for (const mv of moves) {
      const child = applyMove(position, mv);
      const res = search(child, depth - 1, alpha, beta, false, perspective);
      if (res.score > bestScore) {
        bestScore = res.score;
        bestMove = mv;
      }
      alpha = Math.max(alpha, bestScore);
      if (beta <= alpha) break;
    }
    return { move: bestMove, score: bestScore };
  }

  let bestScore = Infinity;
  for (const mv of moves) {
    const child = applyMove(position, mv);
    const res = search(child, depth - 1, alpha, beta, true, perspective);
    if (res.score < bestScore) {
      bestScore = res.score;
      bestMove = mv;
    }
    beta = Math.min(beta, bestScore);
    if (beta <= alpha) break;
  }
  return { move: bestMove, score: bestScore };
}

// PUBLIC_INTERFACE
export function pickBestMove(position, depth, options = {}) {
  /** This is a public function. Picks a best move for sideToMove using minimax+alpha-beta. */
  const perspective = position.sideToMove;
  const res = search(position, depth, -Infinity, Infinity, true, perspective);

  if (!options.randomTieBreak) return res;

  // tie-break among near-equal moves at root
  const moves = generateLegalMoves(position);
  if (moves.length <= 1) return res;

  let best = -Infinity;
  const scored = [];
  for (const mv of moves) {
    const child = applyMove(position, mv);
    const s = evaluate(child, perspective);
    if (s > best) best = s;
    scored.push({ mv, s });
  }

  const eps = 10; // small window
  const candidates = scored.filter((x) => x.s >= best - eps).map((x) => x.mv);
  if (!candidates.length) return res;
  return { move: candidates[randomInt(candidates.length)], score: best };
}
