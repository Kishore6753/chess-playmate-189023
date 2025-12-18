/**
 * Simple pseudo-random helper.
 * - Uses crypto.getRandomValues when available (browser)
 * - Falls back to Math.random otherwise
 */

// PUBLIC_INTERFACE
export function randomInt(maxExclusive) {
  /** This is a public function. Returns an integer in [0, maxExclusive). */
  if (maxExclusive <= 0) return 0;

  // Prefer crypto randomness if available.
  const cryptoObj = typeof window !== "undefined" ? window.crypto : undefined;
  if (cryptoObj?.getRandomValues) {
    const arr = new Uint32Array(1);
    cryptoObj.getRandomValues(arr);
    return arr[0] % maxExclusive;
  }

  return Math.floor(Math.random() * maxExclusive);
}
