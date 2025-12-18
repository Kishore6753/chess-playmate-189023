# Developer Guide

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start development server:
   ```bash
   npm start
   ```
   Open http://localhost:3000

3. Run tests in CI mode (single run):
   ```bash
   CI=true npm test
   ```

4. Build production bundle:
   ```bash
   npm run build
   ```

## Scripts

- start: Launches CRA dev server with ESLint overlay.
- start:clean: Clears ESLint/caches then starts the dev server.
- test: Runs jest with Testing Library; add CI=true for single-run in CI.
- build: Production build using react-scripts; ESLint is disabled during build to reduce false failures.
- lint:clear: Removes ESLint and CRA caches to resolve stale parsing errors.
- eject: Ejects CRA config (irreversible; avoid unless necessary).

## Code structure

- Game logic (src/game) is intentionally pure and framework-agnostic to maximize testability.
- Components pull their data from the reducer state and dispatch actions via callbacks provided by ChessGame.jsx.
- AI logic is side-effect-free; scheduling is done in ChessGame via setTimeout to keep the UI responsive.

## State and actions

The reducer (game/state.js) handles:
- SET_MODE, SET_AI_DEPTH
- SELECT_SQUARE, MAKE_MOVE, PROMOTE_LAST
- UNDO, NEW_GAME
- CLOCK_TICK, CLOCK_PAUSE, CLOCK_RESUME
- SET_CLOCK_PRESET, SET_INCREMENT_MODE

Clocks:
- Fischer increment or Bronstein delay are applied post-move to the mover’s remaining time (applyPostMoveTimeAdjustment).
- The active side’s time is decremented via CLOCK_TICK deltas from a requestAnimationFrame loop in ChessGame.

## Testing

- Primary tests live in src (see App.test.js) and use @testing-library/react.
- Existing tests cover:
  - Rendering 64 squares and piece images.
  - Executing a basic legal move and verifying turn changes.
  - AI move scheduling with fake timers.
  - Clock helper logic for Fischer and Bronstein.
- Add new tests alongside implementation files when possible.
- Tips:
  - Prefer testing from the user’s perspective (buttons, labels, aria attributes).
  - For timing, prefer jest.useFakeTimers() and act() to advance timers deterministically.

## Linting and formatting

- CRA manages ESLint in dev and test modes; there is no separate lint command.
- If you see “Parsing error: Error while parsing JSON” overlays for .js/.jsx:
  - Run npm run lint:clear or npm run start:clean.
  - Ensure external ESLint extensions are not applying mismatched parsers.
- Code style: Prefer small pure functions, early returns, and descriptive names.

## Commit style

- Use descriptive commit messages:
  - feat: add promotion modal
  - fix: ensure castling squares are not attacked
  - refactor: extract clock helpers
  - test: cover AI depth switching
  - docs: add architecture diagram

## Roadmap / TODOs

Short-term:
- Add unit tests for movegen edge cases (castling through check, en passant legality).
- Expand evaluator with basic king safety and passed pawn heuristics.
- Improve the “terminal” detection in minimax to distinguish stalemate vs mate precisely.

Medium-term:
- Add optional draw rule detection (threefold repetition, 50-move rule).
- Enable a second piece theme and wire TopBar to switch sets.
- Add accessibility shortcuts for keyboard piece selection and movement.

Long-term:
- Implement a stronger iterative deepening search with time management.
- Persist and restore games (e.g., localStorage or shareable FEN).
- Add PvP online mode via WebSocket integration (guarded by feature flags).

## Development tips

- Keep chess logic pure; if a function needs time or randomness, pass it in via parameters.
- When adding UI features, prefer prop-driven components with stateless rendering.
- For new environment-controlled features, add flags to featureFlags.js and document them in ENVIRONMENT.md.
