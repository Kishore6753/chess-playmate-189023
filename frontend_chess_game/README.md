# Chess Playmate (React)

A lightweight React chess app with **legal move validation** and an optional **basic AI**.  
No external chess libraries are used—move generation, rules, and AI are implemented in this repo.

## Quick start

From `chess-playmate-189023/frontend_chess_game`:

```bash
npm install
npm start
```

Open http://localhost:3000

## Running tests

```bash
CI=true npm test
```

## Features

- Playable chess board (64 interactive squares)
- Legal move validation:
  - Castling
  - En passant
  - Promotion (defaults to Queen; optional promotion picker)
- Game status: side to move + check / checkmate / stalemate detection
- Move history list
- Optional “Vs AI” mode (depth-limited minimax with alpha-beta, scheduled with `setTimeout` to keep UI responsive)

## Feature flags

Set environment variable `REACT_APP_FEATURE_FLAGS` to a comma/space-separated list.

Examples:

```bash
# Enable only two-player mode with coordinates and legal move hints
REACT_APP_FEATURE_FLAGS="coords,legalMoves"

# Enable everything (default behavior if unset)
# leave REACT_APP_FEATURE_FLAGS unset
```

Supported flags:

- `ai` – enable Vs AI mode (default: enabled)
- `showLegalMoves` / `legalMoves` – highlight legal destinations (default: enabled)
- `undo` – show Undo button (default: enabled)
- `promotionChoice` / `promotion` – show promotion picker modal (default: enabled)
- `coordinates` / `coords` – show square coordinates overlay (default: enabled)
- `aiRandomTieBreak` / `aiRandom` – allow random tie-break among near-equal AI moves (default: enabled)
- `darkMode` / `dark` – experimental, only enabled when `REACT_APP_EXPERIMENTS_ENABLED=true`

Experiments gate:

- `REACT_APP_EXPERIMENTS_ENABLED=true` – enables opt-in experimental flags (currently only `darkMode`)

## Architecture overview

- `src/components/*` – UI components (Board, Square, panels, etc.)
- `src/game/*`
  - `fen.js` – FEN parsing/serialization (start position)
  - `rules.js` – attack detection and check detection helpers
  - `movegen.js` – pseudo-legal and legal move generation + move application
  - `state.js` – `useReducer` state management and game actions
- `src/ai/*`
  - `eval.js` – material + small piece-square tables evaluation
  - `minimax.js` – depth-limited minimax + alpha-beta pruning
- `src/config/featureFlags.js` – feature flag parsing from environment

## Known limitations

- The AI is intentionally basic (depth 1–3) and not optimized.
- Draw rules (threefold repetition, 50-move rule) are not fully implemented.
- Checkmate/stalemate detection is implemented through legal move availability + check status.

## Environment variables

This container supports the standard `REACT_APP_*` variables provided by the deployment environment.
Only `REACT_APP_FEATURE_FLAGS` and `REACT_APP_EXPERIMENTS_ENABLED` are required for this app’s optional features.
