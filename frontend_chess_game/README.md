# Chess Playmate (React)

A lightweight React chess app with legal move validation, a basic AI opponent, and optional chess clocks. The app is implemented without external chess libraries; move generation, rules, FEN parsing, and the AI are all implemented in this repository.

## Project overview and goals

This project provides:
- A playable chess board with 64 interactive squares and keyboard-accessible controls.
- Full legal move validation including castling, en passant, and promotion.
- A simple depth-limited minimax AI with alpha–beta pruning suitable for casual play and demos.
- Optional clocks with Fischer increment and Bronstein delay, with timeouts determining game outcomes.
- A clean, modern UI using a light theme with blue (#3b82f6) and teal (#06b6d4) accents.

The goal is an approachable, dependency-light chess front-end that is easy to understand, extend, and test.

## Architecture overview (summary)

- UI components: src/components/*
  - Board.jsx renders an 8×8 grid using SVG piece assets bundled via require.context
  - TopBar.jsx offers controls for mode, time controls, increment type, and AI depth
  - StatusPanel.jsx shows the game status and meta information
  - Clock.jsx displays each side’s time with flags and increment/delay metadata
  - MoveList.jsx renders a simple move history
  - PromotionModal.jsx allows choosing a promotion piece
- Game core: src/game/*
  - fen.js parses/serializes FEN
  - rules.js provides low-level rules like attack detection and check detection
  - movegen.js generates pseudo-legal and legal moves; applyMove transforms state
  - state.js manages game state with a reducer, integrates clocks, and computes status
  - clock.js contains pure helpers for time adjustments and formatting
- AI: src/ai/*
  - eval.js evaluates material and simple piece-square bonuses
  - minimax.js implements a depth-limited search with alpha–beta pruning
- Configuration:
  - src/config/featureFlags.js parses feature flags from REACT_APP_* environment variables

For full details, see DEVELOPER_GUIDE.md.

## Setup and running locally

The preview system handles start/stop in automated environments, but locally you can run:

```bash
npm install
npm start
```

Open http://localhost:3000 in your browser.

Run test suite:

```bash
CI=true npm test
```

Build for production:

```bash
npm run build
```

Note: The build uses DISABLE_ESLINT_PLUGIN=true to avoid build-time lint failures; lint runs during development and tests.

## Available scripts

From package.json:
- start: Starts the CRA development server (react-scripts start)
- start:clean: Clears lint caches before starting dev server
- build: Builds the app for production (with DISABLE_ESLINT_PLUGIN=true)
- test: Runs tests in watch mode by default; when using CI=true it runs once
- lint: Prints guidance regarding CRA’s linting behavior
- lint:clear: Clears CRA/ESLint cache directories
- eject: Ejects CRA configuration

## Environment variables

Supported REACT_APP_* variables (see ENVIRONMENT.md for full details, purposes, and safe defaults):
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

Feature flag parsing is implemented in src/config/featureFlags.js. If REACT_APP_FEATURE_FLAGS is unset, sane defaults are used.

## Style guide and theme

The app uses a light theme with:
- Primary: #3b82f6
- Accent/Success: #06b6d4
- Background: #f9fafb
- Surface: #ffffff
- Text: #111827
- Muted: #64748b

CSS variables are defined in src/App.css and used across components. See STYLE_GUIDE.md for details.

## Folder structure and key components

Abridged structure:
- src/
  - App.js, App.css, index.js
  - components/: Board, ChessGame, TopBar, StatusPanel, Clock, MoveList, Square, PromotionModal
  - game/: fen.js, rules.js, movegen.js, state.js, clock.js
  - ai/: eval.js, minimax.js
  - config/: featureFlags.js
  - utils/: coords.js, safeRandom.js
  - assets/pieces/default/: 12 SVG piece assets

See ARCHITECTURE.md for deep-dive into data flow, reducer actions, and AI turn scheduling.

## Development guidelines

- Linting: CRA runs ESLint in dev/test; use npm run lint:clear to clear caches if needed.
- Formatting: Follow common JS/JSX conventions; keep functions pure where feasible (game core).
- Commits: Prefer conventional, descriptive messages (e.g., feat:, fix:, docs:, refactor:).
- Tests: Use @testing-library/react; see src/App.test.js for practical examples.

See DEVELOPER_GUIDE.md for more.

## Testing

- Unit tests: run CI=true npm test to execute once in CI mode.
- Included tests cover rendering, basic moves, AI move scheduling, and clock helpers.
- Add new tests in src using Testing Library and Jest.

## Deployment and preview notes

- This is a CRA app; build artifacts are emitted to build/.
- The preview system typically manages start/stop; in local development, use npm start.
- Ensure environment variables are set with REACT_APP_* prefix for them to be embedded at build time.

## Maintenance notes and roadmap

See:
- MAINTENANCE_NOTES.md for current maintenance entries and documentation status.
- ROADMAP/TODOs in DEVELOPER_GUIDE.md for code quality and documentation follow-ups.

For extended architecture, environment, and styling guidance, consult:
- ARCHITECTURE.md
- ENVIRONMENT.md
- STYLE_GUIDE.md
