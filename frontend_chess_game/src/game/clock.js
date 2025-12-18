/**
 * Chess clock helpers (pure functions).
 *
 * We keep these functions free of React state/timers so they are easy to unit test.
 */

/**
 * @typedef {"fischer"|"bronstein"} IncrementMode
 */

/**
 * Computes post-move time adjustments for Fischer increment and Bronstein delay.
 *
 * Rules:
 * - We assume the mover's clock has already been decremented by timeSpentMs during the move.
 * - Fischer: add `incrementSeconds` to the mover after the move.
 * - Bronstein: return up to `delaySeconds`, capped by the time actually spent on the move.
 *
 * @param {number} timeAfterSpendMs Remaining time (ms) for the mover AFTER spend has been subtracted.
 * @param {number} timeSpentMs Time spent on the move (ms).
 * @param {IncrementMode} mode Increment mode: "fischer" or "bronstein".
 * @param {number} incrementOrDelaySeconds Increment seconds (Fischer) OR delay seconds (Bronstein).
 * @returns {number} New remaining time (ms) for the mover after post-move adjustment.
 */
// PUBLIC_INTERFACE
export function applyPostMoveTimeAdjustment(
  timeAfterSpendMs,
  timeSpentMs,
  mode,
  incrementOrDelaySeconds
) {
  /** This is a public function. Applies Fischer increment / Bronstein delay to mover's remaining time. */
  const base = Math.max(0, Number(timeAfterSpendMs) || 0);
  const spent = Math.max(0, Number(timeSpentMs) || 0);
  const incOrDelayMs = Math.max(0, Number(incrementOrDelaySeconds) || 0) * 1000;

  if (mode === "fischer") {
    return base + incOrDelayMs;
  }

  if (mode === "bronstein") {
    // Return time, capped by both delay and actual spent time.
    const returned = Math.min(incOrDelayMs, spent);
    return base + returned;
  }

  // Unknown mode: no adjustment (defensive).
  return base;
}

/**
 * Formats milliseconds as a clock string:
 * - >= 1 hour: H:MM:SS
 * - else: M:SS
 *
 * @param {number} ms
 * @returns {string}
 */
// PUBLIC_INTERFACE
export function formatClock(ms) {
  /** This is a public function. Formats remaining milliseconds to a human-friendly clock string. */
  const clamped = Math.max(0, Math.floor(Number(ms) || 0));
  const totalSeconds = Math.floor(clamped / 1000);

  const s = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const m = totalMinutes % 60;
  const h = Math.floor(totalMinutes / 60);

  const two = (n) => String(n).padStart(2, "0");
  if (h > 0) return `${h}:${two(m)}:${two(s)}`;
  return `${m}:${two(s)}`;
}
