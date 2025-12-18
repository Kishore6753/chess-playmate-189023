import { START_FEN, parseFEN } from "./fen";
import { applyMove, generateLegalMoves } from "./movegen";
import { inCheck, opposite } from "./rules";

/**
 * @typedef {"pvp"|"ai"} GameMode
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
 *  status: { result: "playing"|"checkmate"|"stalemate"|"draw", message: string, inCheck: boolean },
 *  mode: GameMode,
 *  ai: { enabled: boolean, color: "w"|"b", depth: number }
 * }} GameState
 */

function computeStatus(position) {
  const legal = generateLegalMoves(position);
  const check = inCheck(position.board, position.sideToMove, position.castling, position.epSquare);

  if (legal.length === 0) {
    if (check) {
      return {
        result: "checkmate",
        inCheck: true,
        message: `${position.sideToMove === "w" ? "White" : "Black"} is checkmated.`,
      };
    }
    return { result: "stalemate", inCheck: false, message: "Stalemate." };
  }

  return {
    result: "playing",
    inCheck: check,
    message: check
      ? `${position.sideToMove === "w" ? "White" : "Black"} to move (in check).`
      : `${position.sideToMove === "w" ? "White" : "Black"} to move.`,
  };
}

// PUBLIC_INTERFACE
export function createInitialState(featureFlags) {
  /** This is a public function. Creates initial chess game state using feature flags. */
  const base = parseFEN(START_FEN);
  const state = {
    ...base,
    selected: null,
    legalMoves: [],
    lastMove: null,
    history: [],
    status: { result: "playing", message: "White to move.", inCheck: false },
    mode: featureFlags?.ai ? "ai" : "pvp",
    ai: { enabled: Boolean(featureFlags?.ai), color: "b", depth: 2 },
  };

  state.status = computeStatus(state);
  return state;
}

function computeLegalFromSelected(state) {
  if (state.selected == null) return [];
  return generateLegalMoves(state, state.selected);
}

function sameMove(a, b) {
  return a && b && a.from === b.from && a.to === b.to && (a.promotion || null) === (b.promotion || null);
}

// PUBLIC_INTERFACE
export function chessReducer(state, action) {
  /** This is a public function. Reducer handling game actions. */
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
    case "SELECT_SQUARE": {
      const idx = action.idx;
      if (idx == null) return { ...state, selected: null, legalMoves: [] };

      // If selecting destination of a legal move from current selection, execute it.
      if (state.selected != null && state.legalMoves?.length) {
        const mv = state.legalMoves.find((m) => m.to === idx);
        if (mv) {
          const nextPos = applyMove(state, mv);
          const next = {
            ...nextPos,
            selected: null,
            legalMoves: [],
            lastMove: mv,
            history: state.history.concat([{ position: state, move: mv }]),
          };
          next.status = computeStatus(next);
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
      // Must be legal in current position.
      const legal = generateLegalMoves(state);
      if (!legal.some((m) => sameMove(m, mv))) return state;

      const nextPos = applyMove(state, mv);
      const next = {
        ...nextPos,
        selected: null,
        legalMoves: [],
        lastMove: mv,
        history: state.history.concat([{ position: state, move: mv }]),
      };
      next.status = computeStatus(next);
      return next;
    }
    case "UNDO": {
      if (!state.history.length) return state;
      const prev = state.history[state.history.length - 1].position;
      return {
        ...prev,
        history: state.history.slice(0, -1),
        selected: null,
        legalMoves: [],
      };
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
