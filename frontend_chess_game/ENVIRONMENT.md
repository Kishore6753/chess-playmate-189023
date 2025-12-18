# Environment

## Overview

This CRA app reads environment variables at build time. Only variables prefixed with REACT_APP_ are embedded into the frontend bundle.

This container recognizes the following variables:

- REACT_APP_API_BASE
- REACT_APP_BACKEND_URL
- REACT_APP_FRONTEND_URL
- REACT_APP_WS_URL
- REACT_APP_NODE_ENV
- REACT_APP_NEXT_TELEMETRY_DISABLED
- REACT_APP_ENABLE_SOURCE_MAPS
- REACT_APP_PORT
- REACT_APP_TRUST_PROXY
- REACT_APP_LOG_LEVEL
- REACT_APP_HEALTHCHECK_PATH
- REACT_APP_FEATURE_FLAGS
- REACT_APP_EXPERIMENTS_ENABLED

Note: The core app does not require external services; most variables are optional. Feature flags are the primary configuration point.

## Variables and purposes

- REACT_APP_API_BASE
  - Purpose: Base URL for an API if integrating external endpoints in the future.
  - Safe default: unset (not used by core app).
- REACT_APP_BACKEND_URL
  - Purpose: Explicit backend origin when needed (e.g., future online play).
  - Safe default: unset.
- REACT_APP_FRONTEND_URL
  - Purpose: Public origin of the frontend (useful for cross-origin configuration).
  - Safe default: unset.
- REACT_APP_WS_URL
  - Purpose: WebSocket URL for real-time features if added later.
  - Safe default: unset.
- REACT_APP_NODE_ENV
  - Purpose: Environment marker; CRA already sets NODE_ENV; this mirror is optional.
  - Safe default: development.
- REACT_APP_NEXT_TELEMETRY_DISABLED
  - Purpose: Included for uniform environments; no effect in CRA app.
  - Safe default: true or unset.
- REACT_APP_ENABLE_SOURCE_MAPS
  - Purpose: Enables source maps in build if your pipeline controls it; CRA has its own settings.
  - Safe default: true or unset.
- REACT_APP_PORT
  - Purpose: Port hint for environments wrapping the frontend; CRA uses PORT (without REACT_APP_) for dev.
  - Safe default: 3000 (note CRA dev reads PORT, not REACT_APP_PORT).
- REACT_APP_TRUST_PROXY
  - Purpose: If deployed behind a proxy, might inform runtime config or healthchecks; not used by core app.
  - Safe default: false or unset.
- REACT_APP_LOG_LEVEL
  - Purpose: Client-side logging verbosity if you add logging; not used by core app.
  - Safe default: info.
- REACT_APP_HEALTHCHECK_PATH
  - Purpose: Path for external healthchecks; not used directly by core app.
  - Safe default: /healthz (tie into infra if needed).
- REACT_APP_FEATURE_FLAGS
  - Purpose: Comma/space-separated list controlling UI/game features. See below.
  - Examples: "ai,undo,coords", "legalMoves,promotion"
  - Safe default: unset (uses defaults in code).
- REACT_APP_EXPERIMENTS_ENABLED
  - Purpose: Gate for experimental features; currently controls darkMode availability.
  - Safe default: false.

## Feature flags

Parsed in src/config/featureFlags.js:
- If REACT_APP_FEATURE_FLAGS is unset, defaults are:
  - ai, showLegalMoves, undo, promotionChoice, coordinates, aiRandomTieBreak enabled
  - darkMode disabled unless REACT_APP_EXPERIMENTS_ENABLED=true
- If REACT_APP_FEATURE_FLAGS is set, only the listed flags are enabled:
  - ai
  - showLegalMoves or legalMoves
  - undo
  - promotionChoice or promotion
  - coordinates or coords
  - aiRandomTieBreak or aiRandom
  - darkMode or dark (requires REACT_APP_EXPERIMENTS_ENABLED=true)

Examples:
```bash
# Minimal two-player config with coordinates and legal move hints
REACT_APP_FEATURE_FLAGS="coords,legalMoves"

# Enable AI and random tie-break variation
REACT_APP_FEATURE_FLAGS="ai,aiRandom"

# Enable dark mode experiments
REACT_APP_EXPERIMENTS_ENABLED=true
REACT_APP_FEATURE_FLAGS="dark"
```

## Notes

- CRA embeds REACT_APP_* variables at build time; changes require rebuilding.
- Avoid placing secrets in REACT_APP_* variables; they become part of the client bundle.
- For dev server port control use PORT (without REACT_APP_) when running npm start locally.
