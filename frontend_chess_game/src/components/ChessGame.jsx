import React, { useEffect, useMemo, useReducer, useState } from "react";
import Board from "./Board";
import TopBar from "./TopBar";
import StatusPanel from "./StatusPanel";
import MoveList from "./MoveList";
import PromotionModal from "./PromotionModal";
import { getFeatureFlags } from "../config/featureFlags";
import { chessReducer, createInitialState, isAiTurn, humanColor } from "../game/state";
import { generateLegalMoves } from "../game/movegen";
import { pickBestMove } from "../ai/minimax";

function isPromotionMove(move, piece) {
  if (!move || !piece) return false;
  return piece.toLowerCase() === "p" && Boolean(move.promotion);
}

export default function ChessGame() {
  const featureFlags = useMemo(() => getFeatureFlags(), []);
  const [state, dispatch] = useReducer(chessReducer, featureFlags, createInitialState);

  const [promotionPending, setPromotionPending] = useState(null);

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
    const movedByHuman = (state.sideToMove === human) ? false : true; // sideToMove already flipped after move
    if (!movedByHuman) return;

    setPromotionPending({ move: mv, color: originalPiece === originalPiece.toUpperCase() ? "w" : "b" });
  }, [state.lastMove, state.sideToMove, featureFlags.promotionChoice, state, featureFlags]);

  // AI turn: schedule computation so UI stays responsive.
  useEffect(() => {
    if (!state.ai.enabled || state.mode !== "ai") return;
    if (!isAiTurn(state)) return;

    const handle = setTimeout(() => {
      const depth = Math.max(1, Math.min(3, state.ai.depth || 2));
      const { move } = pickBestMove(state, depth, { randomTieBreak: featureFlags.aiRandomTieBreak });
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

  // Provide a stable list for debugging/testing if needed
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
          />
        </section>

        <aside className="sideSection" aria-label="Game info">
          <StatusPanel status={state.status} mode={state.mode} aiEnabled={state.mode === "ai" && state.ai.enabled} />
          <MoveList history={state.history} />
        </aside>
      </main>

      <PromotionModal
        open={Boolean(promotionPending)}
        color={promotionPending?.color}
        onPick={(promotion) => {
          dispatch({ type: "PROMOTE_LAST", move: promotionPending.move, promotion });
          setPromotionPending(null);
        }}
        onClose={() => setPromotionPending(null)}
      />
    </div>
  );
}
