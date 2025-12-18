import React, { useEffect, useMemo, useReducer, useState } from "react";
import Board from "./Board";
import TopBar from "./TopBar";
import StatusPanel from "./StatusPanel";
import MoveList from "./MoveList";
import PromotionModal from "./PromotionModal";
import Clock from "./Clock";
import { getFeatureFlags } from "../config/featureFlags";
import {
  chessReducer,
  createInitialState,
  isAiTurn,
  humanColor,
  CLOCK_PRESETS,
} from "../game/state";
import { generateLegalMoves } from "../game/movegen";
import { pickBestMove } from "../ai/minimax";

function isPromotionMove(move, piece) {
  if (!move || !piece) return false;
  return piece.toLowerCase() === "p" && Boolean(move.promotion);
}

// PUBLIC_INTERFACE
export default function ChessGame() {
  /** This is a public function. Main game container: controls, board, sidebar panels, and promotion modal. */
  const featureFlags = useMemo(() => getFeatureFlags(), []);
  const [state, dispatch] = useReducer(chessReducer, featureFlags, createInitialState);

  const [promotionPending, setPromotionPending] = useState(null);

  // Piece theme scaffold (single theme for now). This makes it easy to add more sets later.
  const [pieceTheme, setPieceTheme] = useState("default");

  // When a move is made that is a promotion and promotionChoice flag is enabled,
  // show modal to allow user to change the promoted piece.
  useEffect(() => {
    if (!featureFlags.promotionChoice) return;
    const mv = state.lastMove;
    if (!mv) return;
    const originalPiece = mv.piece;
    if (!isPromotionMove(mv, originalPiece)) return;

    // Only human should pick promotion, not AI.
    const human = humanColor(state);
    // sideToMove already flipped after move, so the mover was the opposite side
    const movedByHuman = state.sideToMove !== human;
    if (!movedByHuman) return;

    setPromotionPending({
      move: mv,
      color: originalPiece === originalPiece.toUpperCase() ? "w" : "b",
    });
  }, [state.lastMove, state.sideToMove, featureFlags.promotionChoice, state, featureFlags]);

  // Clock ticking loop (rAF-based): dispatch delta times while clock is running.
  useEffect(() => {
    if (!state.clock?.enabled) return;
    if (!state.clock.running) return;
    if (state.status?.result !== "playing") return;

    let raf = 0;
    let last = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();

    const loop = (t) => {
      const now = typeof t === "number" ? t : (typeof performance !== "undefined" && performance.now ? performance.now() : Date.now());
      const delta = now - last;
      last = now;

      // To keep reducer updates stable, clamp large delta spikes (tab switching).
      const clamped = Math.max(0, Math.min(1000, delta));
      if (clamped > 0) dispatch({ type: "CLOCK_TICK", deltaMs: clamped });

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [state.clock?.enabled, state.clock?.running, state.status?.result]);

  // AI turn: schedule computation so UI stays responsive.
  // We pause the clock while AI is thinking so the human doesn't "lose time" waiting on the browser.
  // The AI also doesn't consume time by default for this app.
  useEffect(() => {
    if (!state.ai.enabled || state.mode !== "ai") return;

    const aiTurn = isAiTurn(state);

    if (aiTurn && state.clock?.enabled) {
      dispatch({ type: "CLOCK_PAUSE", reason: "aiThinking" });
    } else if (!aiTurn && state.clock?.enabled && state.status?.result === "playing") {
      dispatch({ type: "CLOCK_RESUME" });
    }

    if (!aiTurn) return;

    const handle = setTimeout(() => {
      const depth = Math.max(1, Math.min(3, state.ai.depth || 2));
      const { move } = pickBestMove(state, depth, {
        randomTieBreak: featureFlags.aiRandomTieBreak,
      });
      if (move) dispatch({ type: "MAKE_MOVE", move });
    }, 10);

    return () => clearTimeout(handle);
  }, [state, featureFlags.aiRandomTieBreak]);

  const onSquareClick = (idx) => {
    // If game over, do nothing.
    if (state.status?.result !== "playing") return;

    // If it's AI turn, prevent human interaction.
    if (state.mode === "ai" && isAiTurn(state)) return;

    dispatch({ type: "SELECT_SQUARE", idx });
  };

  const onNewGame = () => dispatch({ type: "NEW_GAME", featureFlags });
  const onUndo = () => dispatch({ type: "UNDO" });
  const onModeChange = (mode) => dispatch({ type: "SET_MODE", mode });
  const onAiDepthChange = (depth) => dispatch({ type: "SET_AI_DEPTH", depth });

  // For highlighting legal moves, we use reducer's computed legalMoves when selected,
  // but keep fallback for safety.
  const legalMoves = state.selected != null ? state.legalMoves : [];

  // Provide a stable reference for debugging/testing if needed (avoid unused-import lint issues if refactors happen)
  void generateLegalMoves;

  return (
    <div className="page">
      <TopBar
        mode={state.mode}
        onModeChange={onModeChange}
        canUndo={state.history.length > 0}
        onUndo={onUndo}
        onNewGame={onNewGame}
        aiEnabled={state.mode === "ai" && state.ai.enabled}
        aiDepth={state.ai.depth}
        onAiDepthChange={onAiDepthChange}
        featureFlags={featureFlags}
        pieceTheme={pieceTheme}
        onPieceThemeChange={setPieceTheme}
        clockPresetLabel={state.clock?.preset?.label}
        clockPresets={CLOCK_PRESETS}
        incrementMode={state.clock?.settings?.mode || "fischer"}
        onClockPresetChange={(label) => {
          const preset = CLOCK_PRESETS.find((p) => p.label === label) || CLOCK_PRESETS[0];
          dispatch({ type: "SET_CLOCK_PRESET", preset, incrementMode: state.clock?.settings?.mode || "fischer" });
        }}
        onIncrementModeChange={(m) => dispatch({ type: "SET_INCREMENT_MODE", mode: m })}
      />

      <main className="layout">
        <section className="boardSection" aria-label="Chess board section">
          <Board
            board={state.board}
            selected={state.selected}
            legalMoves={featureFlags.showLegalMoves ? legalMoves : []}
            lastMove={state.lastMove}
            onSquareClick={onSquareClick}
            showCoordinates={featureFlags.coordinates}
            pieceTheme={pieceTheme}
          />
        </section>

        <aside className="sideSection" aria-label="Game info">
          <div className="panel">
            <div className="panel__title">Clocks</div>
            <div className="clockRow" aria-label="Chess clocks">
              <Clock
                label="White"
                color="w"
                remainingMs={state.clock?.remainingMs?.w ?? 0}
                running={Boolean(state.clock?.running && state.clock?.activeColor === "w")}
                flagged={Boolean(state.clock?.flags?.w)}
                modeLabel={state.clock?.settings?.mode === "bronstein" ? "Delay" : "Inc"}
                incrementOrDelaySeconds={state.clock?.settings?.incSeconds ?? 0}
              />
              <Clock
                label="Black"
                color="b"
                remainingMs={state.clock?.remainingMs?.b ?? 0}
                running={Boolean(state.clock?.running && state.clock?.activeColor === "b")}
                flagged={Boolean(state.clock?.flags?.b)}
                modeLabel={state.clock?.settings?.mode === "bronstein" ? "Delay" : "Inc"}
                incrementOrDelaySeconds={state.clock?.settings?.incSeconds ?? 0}
              />
            </div>
          </div>

          <StatusPanel
            status={state.status}
            mode={state.mode}
            aiEnabled={state.mode === "ai" && state.ai.enabled}
            clock={state.clock}
          />
          <MoveList history={state.history} />
        </aside>
      </main>

      <PromotionModal
        open={Boolean(promotionPending)}
        color={promotionPending?.color}
        onPick={(promotion) => {
          dispatch({
            type: "PROMOTE_LAST",
            move: promotionPending.move,
            promotion,
          });
          setPromotionPending(null);
        }}
        onClose={() => setPromotionPending(null)}
      />
    </div>
  );
}
