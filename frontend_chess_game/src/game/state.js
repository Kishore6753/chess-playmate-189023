import { START_FEN, parseFEN } from "./fen";
import { applyMove, generateLegalMoves } from "./movegen";
import { inCheck, opposite } from "./rules";
import { applyPostMoveTimeAdjustment } from "./clock";

/**
 * @typedef {"pvp"|"ai"} GameMode
 */

/**
 * @typedef {"fischer"|"bronstein"} IncrementMode
 */

/**
 * @typedef {{ baseMinutes: number, incSeconds: number, mode: IncrementMode }} ClockSettings
 */

/**
 * @typedef {{ w: number, b: number }} RemainingMs
 */

/**
 * @typedef {{ w: boolean, b: boolean }} FlagState
 */

/**
 * @typedef {{ w: number|null, b: number|null }} MoveStartTs
 */

/**
 * @typedef {{ w: number, b: number }} LastSpendMs
 */

/**
 * @typedef {{ label: string, baseMinutes: number, incSeconds: number }} TimePreset
 */

/**
 * @typedef {{
 *  board: (string|null)[],
 *  sideToMove: "w"|"b",
 *  castling: {K:boolean,Q:boolean,k:boolean,q:boolean},
 *  epSquare: number|null,
 *  halfmoveClock: number,
 *  fullmoveNumber: number,
 *  selected: number|null,
 *  legalMoves: any[],
 *  lastMove: any|null,
 *  history: any[],
 *  status: { result: "playing"|"checkmate"|"stalemate"|"draw"|"timeout", message: string, inCheck: boolean, winner?: "w"|"b"|null },
 *  mode: GameMode,
 *  ai: { enabled: boolean, color: "w"|"b", depth: number },
 *  clock: {
 *    enabled: boolean,
 *    settings: ClockSettings,
 *    preset: TimePreset,
 *    remainingMs: RemainingMs,
 *    running: boolean,
 *    activeColor: "w"|"b",
 *    flags: FlagState,
 *    moveStartTs: MoveStartTs,
 *    lastSpendMs: LastSpendMs,
 *    pauseReason: null|"aiThinking"|"manual"|"gameOver"
 *  }
 * }} GameState
 */

export const CLOCK_PRESETS = [
  { label: "3+2", baseMinutes: 3, incSeconds: 2 },
  { label: "5+0", baseMinutes: 5, incSeconds: 0 },
  { label: "10+5", baseMinutes: 10, incSeconds: 5 },
  { label: "15+10", baseMinutes: 15, incSeconds: 10 },
];

function initialClockFromPreset(preset, mode = "fischer") {
  const baseMinutes = preset?.baseMinutes ?? 5;
  const incSeconds = preset?.incSeconds ?? 0;
  const baseMs = Math.max(0, baseMinutes) * 60 * 1000;

  return {
    enabled: true,
    settings: { baseMinutes, incSeconds, mode },
    preset: preset ?? { label: `${baseMinutes}+${incSeconds}`, baseMinutes, incSeconds },
    remainingMs: { w: baseMs, b: baseMs },
    running: false,
    activeColor: "w",
    flags: { w: false, b: false },
    moveStartTs: { w: null, b: null },
    lastSpendMs: { w: 0, b: 0 },
    pauseReason: null,
  };
}

function computeStatus(position) {
  const legal = generateLegalMoves(position);
  const check = inCheck(position.board, position.sideToMove, position.castling, position.epSquare);

  if (legal.length === 0) {
    if (check) {
      return {
        result: "checkmate",
        inCheck: true,
        message: `${position.sideToMove === "w" ? "White" : "Black"} is checkmated.`,
        winner: position.sideToMove === "w" ? "b" : "w",
      };
    }
    return { result: "stalemate", inCheck: false, message: "Stalemate.", winner: null };
  }

  return {
    result: "playing",
    inCheck: check,
    winner: null,
    message: check
      ? `${position.sideToMove === "w" ? "White" : "Black"} to move (in check).`
      : `${position.sideToMove === "w" ? "White" : "Black"} to move.`,
  };
}

function computeLegalFromSelected(state) {
  if (state.selected == null) return [];
  return generateLegalMoves(state, state.selected);
}

function sameMove(a, b) {
  return a && b && a.from === b.from && a.to === b.to && (a.promotion || null) === (b.promotion || null);
}

function msNow() {
  return typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
}

function resetClockForCurrentPosition(state, preset, mode) {
  const nextClock = initialClockFromPreset(preset, mode ?? state.clock?.settings?.mode ?? "fischer");
  // activeColor follows sideToMove
  nextClock.activeColor = state.sideToMove;
  nextClock.running = state.status?.result === "playing";
  nextClock.pauseReason = null;
  return nextClock;
}

function stopClockGameOver(clock) {
  return { ...clock, running: false, pauseReason: "gameOver", moveStartTs: { w: null, b: null } };
}

function declareTimeout(state, flaggedColor) {
  const winner = opposite(flaggedColor);
  return {
    ...state,
    status: {
      result: "timeout",
      inCheck: Boolean(state.status?.inCheck),
      winner,
      message: `${flaggedColor === "w" ? "White" : "Black"} ran out of time. ${winner === "w" ? "White" : "Black"} wins on time.`,
    },
    clock: stopClockGameOver({
      ...state.clock,
      flags: { ...state.clock.flags, [flaggedColor]: true },
      remainingMs: { ...state.clock.remainingMs, [flaggedColor]: 0 },
    }),
  };
}

function applyTimeDeltaToActive(state, deltaMs) {
  if (!state.clock?.enabled || !state.clock.running) return state;
  if (state.status?.result !== "playing") return state;

  const c = state.clock.activeColor;
  if (state.clock.flags?.[c]) return state;

  const cur = state.clock.remainingMs[c];
  const next = Math.max(0, cur - Math.max(0, deltaMs));

  if (next <= 0) {
    return declareTimeout(state, c);
  }

  return {
    ...state,
    clock: {
      ...state.clock,
      remainingMs: { ...state.clock.remainingMs, [c]: next },
    },
  };
}

function finalizeMoverPostMove(state, moverColor, timeSpentMs) {
  const mode = state.clock.settings.mode;
  const incSeconds = state.clock.settings.incSeconds;

  const before = state.clock.remainingMs[moverColor];
  // In normal flow, time spent has already been subtracted via ticks; however, in tests or edge cases it might not.
  // Ensure we don't "double subtract" by using lastSpendMs tracking: we only do post-move adjustments here.
  const afterAdjust = applyPostMoveTimeAdjustment(before, timeSpentMs, mode, incSeconds);

  return {
    ...state,
    clock: {
      ...state.clock,
      remainingMs: { ...state.clock.remainingMs, [moverColor]: afterAdjust },
      lastSpendMs: { ...state.clock.lastSpendMs, [moverColor]: timeSpentMs },
    },
  };
}

// PUBLIC_INTERFACE
export function createInitialState(featureFlags) {
  /** This is a public function. Creates initial chess game state using feature flags. */
  const base = parseFEN(START_FEN);
  const seed = {
    ...base,
    selected: null,
    legalMoves: [],
    lastMove: null,
    history: [],
    status: { result: "playing", message: "White to move.", inCheck: false, winner: null },
    mode: featureFlags?.ai ? "ai" : "pvp",
    ai: { enabled: Boolean(featureFlags?.ai), color: "b", depth: 2 },
  };

  seed.status = computeStatus(seed);
  seed.clock = initialClockFromPreset(CLOCK_PRESETS[1], "fischer"); // default 5+0 Fischer
  seed.clock.activeColor = seed.sideToMove;
  seed.clock.running = seed.status.result === "playing";
  seed.clock.pauseReason = null;

  return seed;
}

// PUBLIC_INTERFACE
export function chessReducer(state, action) {
  /** This is a public function. Reducer handling game actions (including chess clocks). */
  switch (action.type) {
    case "SET_MODE": {
      const mode = action.mode;
      const aiEnabled = mode === "ai";
      return {
        ...state,
        mode,
        ai: { ...state.ai, enabled: aiEnabled, color: "b" },
      };
    }
    case "SET_AI_DEPTH": {
      return { ...state, ai: { ...state.ai, depth: action.depth } };
    }
    case "NEW_GAME": {
      return createInitialState(action.featureFlags);
    }

    case "SET_CLOCK_PRESET": {
      const preset = action.preset;
      const mode = action.incrementMode ?? state.clock?.settings?.mode ?? "fischer";
      const basePos = {
        ...state,
        selected: null,
        legalMoves: [],
      };
      return {
        ...basePos,
        clock: resetClockForCurrentPosition(basePos, preset, mode),
      };
    }

    case "SET_INCREMENT_MODE": {
      const incMode = action.mode;
      const next = {
        ...state,
        clock: resetClockForCurrentPosition(state, state.clock?.preset, incMode),
      };
      return next;
    }

    case "CLOCK_TICK": {
      // deltaMs supplied by the UI timing loop
      return applyTimeDeltaToActive(state, action.deltaMs);
    }

    case "CLOCK_PAUSE": {
      return {
        ...state,
        clock: { ...state.clock, running: false, pauseReason: action.reason ?? "manual", moveStartTs: { w: null, b: null } },
      };
    }

    case "CLOCK_RESUME": {
      if (!state.clock?.enabled) return state;
      if (state.status?.result !== "playing") return state;

      return {
        ...state,
        clock: {
          ...state.clock,
          running: true,
          pauseReason: null,
          activeColor: state.sideToMove,
          moveStartTs: { ...state.clock.moveStartTs, [state.sideToMove]: msNow() },
        },
      };
    }

    case "SELECT_SQUARE": {
      const idx = action.idx;
      if (idx == null) return { ...state, selected: null, legalMoves: [] };

      // If selecting destination of a legal move from current selection, execute it.
      if (state.selected != null && state.legalMoves?.length) {
        const mv = state.legalMoves.find((m) => m.to === idx);
        if (mv) {
          const moverColor = state.sideToMove;
          const startedAt = state.clock?.moveStartTs?.[moverColor];
          const spentMs =
            startedAt == null ? 0 : Math.max(0, msNow() - startedAt);

          const nextPos = applyMove(state, mv);
          let next = {
            ...nextPos,
            selected: null,
            legalMoves: [],
            lastMove: mv,
            history: state.history.concat([{ position: state, move: mv }]),
          };

          next.status = computeStatus(next);

          // Apply post-move timing adjustment to mover (Fischer/Bronstein) before switching active clock.
          if (next.clock?.enabled && state.clock?.enabled) {
            next = finalizeMoverPostMove(
              { ...next, clock: { ...state.clock, activeColor: nextPos.sideToMove } },
              moverColor,
              spentMs
            );

            // On game end, stop clocks.
            if (next.status.result !== "playing") {
              next = { ...next, clock: stopClockGameOver(next.clock) };
            } else {
              // Start next side move timer
              next = {
                ...next,
                clock: {
                  ...next.clock,
                  running: true,
                  pauseReason: null,
                  activeColor: next.sideToMove,
                  moveStartTs: { ...next.clock.moveStartTs, [next.sideToMove]: msNow() },
                },
              };
            }
          }

          return next;
        }
      }

      // Otherwise, select if it's our piece.
      const piece = state.board[idx];
      if (!piece) return { ...state, selected: null, legalMoves: [] };
      const isOurPiece = (piece === piece.toUpperCase() ? "w" : "b") === state.sideToMove;
      if (!isOurPiece) return { ...state, selected: null, legalMoves: [] };

      const next = { ...state, selected: idx };
      next.legalMoves = computeLegalFromSelected(next);
      return next;
    }

    case "MAKE_MOVE": {
      const mv = action.move;
      if (!mv) return state;

      if (state.status?.result !== "playing") return state;

      // Must be legal in current position.
      const legal = generateLegalMoves(state);
      if (!legal.some((m) => sameMove(m, mv))) return state;

      const moverColor = state.sideToMove;
      const startedAt = state.clock?.moveStartTs?.[moverColor];
      const spentMs = startedAt == null ? 0 : Math.max(0, msNow() - startedAt);

      const nextPos = applyMove(state, mv);
      let next = {
        ...nextPos,
        selected: null,
        legalMoves: [],
        lastMove: mv,
        history: state.history.concat([{ position: state, move: mv }]),
      };
      next.status = computeStatus(next);

      if (state.clock?.enabled) {
        next = finalizeMoverPostMove(
          { ...next, clock: { ...state.clock, activeColor: nextPos.sideToMove } },
          moverColor,
          spentMs
        );

        if (next.status.result !== "playing") {
          next = { ...next, clock: stopClockGameOver(next.clock) };
        } else {
          next = {
            ...next,
            clock: {
              ...next.clock,
              running: true,
              pauseReason: null,
              activeColor: next.sideToMove,
              moveStartTs: { ...next.clock.moveStartTs, [next.sideToMove]: msNow() },
            },
          };
        }
      }

      return next;
    }

    case "UNDO": {
      if (!state.history.length) return state;
      const prev = state.history[state.history.length - 1].position;

      // Reset clock to previous state's clock snapshot for correctness.
      // (History stores the entire prior position object.)
      const next = {
        ...prev,
        history: state.history.slice(0, -1),
        selected: null,
        legalMoves: [],
      };

      // Ensure clocks are stopped if game not playing.
      if (next.status?.result !== "playing") {
        next.clock = stopClockGameOver(next.clock);
      } else if (next.clock?.enabled) {
        next.clock = {
          ...next.clock,
          running: true,
          pauseReason: null,
          activeColor: next.sideToMove,
          moveStartTs: { ...next.clock.moveStartTs, [next.sideToMove]: msNow() },
        };
      }

      return next;
    }

    case "PROMOTE_LAST": {
      // If a pawn move reached back rank with default queen promotion, allow replacing it.
      const { move, promotion } = action;
      if (!move || !promotion) return state;
      if (!state.lastMove) return state;
      // We only support changing promotion immediately after move.
      if (state.lastMove.from !== move.from || state.lastMove.to !== move.to) return state;

      const newBoard = state.board.slice();
      newBoard[move.to] = promotion;
      const next = { ...state, board: newBoard };
      next.status = computeStatus(next);

      if (next.status.result !== "playing" && next.clock?.enabled) {
        next.clock = stopClockGameOver(next.clock);
      }

      return next;
    }

    case "SET_TURN": {
      // internal/testing hook only
      return { ...state, sideToMove: action.color ?? state.sideToMove, selected: null, legalMoves: [] };
    }

    default:
      return state;
  }
}

// PUBLIC_INTERFACE
export function isAiTurn(state) {
  /** This is a public function. Returns true if it's AI's turn under current settings. */
  if (!state.ai.enabled) return false;
  return state.sideToMove === state.ai.color && state.status.result === "playing";
}

// PUBLIC_INTERFACE
export function humanColor(state) {
  /** This is a public function. Returns the human player's color when in AI mode. */
  if (!state.ai.enabled) return "w";
  return opposite(state.ai.color);
}
