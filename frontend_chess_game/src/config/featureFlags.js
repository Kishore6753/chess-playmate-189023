/**
 * Feature flags are configured via environment variables:
 * - REACT_APP_FEATURE_FLAGS: comma/space separated list (e.g. "ai,undo,coords")
 * - REACT_APP_EXPERIMENTS_ENABLED: "true" enables opt-in experiments
 */

const DEFAULT_FLAGS = {
  ai: true,
  showLegalMoves: true,
  undo: true,
  promotionChoice: true,
  coordinates: true,
  darkMode: false,
  aiRandomTieBreak: true,
};

/** @param {string | undefined} value */
function parseBool(value) {
  if (!value) return false;
  return String(value).toLowerCase() === "true";
}

/** @param {string | undefined} value */
function parseList(value) {
  if (!value) return [];

  // Some environments set a placeholder like "{}" or "[]".
  // Treat these as empty so the app uses DEFAULT_FLAGS.
  const normalized = String(value).trim();
  if (normalized === "{}" || normalized === "[]" || normalized === "null") return [];

  return normalized
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// PUBLIC_INTERFACE
export function getFeatureFlags() {
  /** This is a public function. Returns the resolved feature flags object. */
  const enabled = new Set(parseList(process.env.REACT_APP_FEATURE_FLAGS));
  const experimentsEnabled = parseBool(process.env.REACT_APP_EXPERIMENTS_ENABLED);

  // If user explicitly provides flags, treat them as "enable-only" overrides;
  // otherwise use defaults.
  const hasExplicit = enabled.size > 0;

  const resolved = { ...DEFAULT_FLAGS };
  if (hasExplicit) {
    resolved.ai = enabled.has("ai");
    resolved.showLegalMoves = enabled.has("showLegalMoves") || enabled.has("legalMoves");
    resolved.undo = enabled.has("undo");
    resolved.promotionChoice = enabled.has("promotionChoice") || enabled.has("promotion");
    resolved.coordinates = enabled.has("coordinates") || enabled.has("coords");
    resolved.darkMode = enabled.has("darkMode") || enabled.has("dark");
    resolved.aiRandomTieBreak = enabled.has("aiRandomTieBreak") || enabled.has("aiRandom");
  }

  // Experiments: allow enabling extra behavior only when experiments enabled.
  if (!experimentsEnabled) {
    resolved.darkMode = false;
  }

  return resolved;
}
