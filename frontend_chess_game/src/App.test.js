import { render, screen, fireEvent, act } from "@testing-library/react";
import App from "./App";
import { applyPostMoveTimeAdjustment } from "./game/clock";

function getSquareButtons(container) {
  return container.querySelectorAll("button.sq");
}

test("renders a playable chess board with 64 squares", () => {
  const { container } = render(<App />);
  const squares = getSquareButtons(container);
  expect(squares.length).toBe(64);

  // Starting position should render some piece images (SVGs) as <img>.
  const imgs = container.querySelectorAll("img.pieceImg");
  expect(imgs.length).toBeGreaterThan(0);
});

test("a basic legal move executes and turn switches", () => {
  const { container } = render(<App />);

  // From starting position: e2 is index 52, e4 is index 36 with our indexing (a8=0).
  const squares = getSquareButtons(container);

  // Select pawn on e2
  fireEvent.click(squares[52]);
  // Move to e4
  fireEvent.click(squares[36]);

  // Status should now be black to move
  expect(screen.getByText(/Black to move/i)).toBeInTheDocument();
});

test("AI makes a move without freezing (timer-driven)", () => {
  jest.useFakeTimers();
  const { container } = render(<App />);

  // Ensure AI mode exists in default flags; switch to Vs AI if present
  const modeSelect = screen.getByLabelText(/select game mode/i);
  act(() => {
    fireEvent.change(modeSelect, { target: { value: "ai" } });
  });

  const squares = getSquareButtons(container);

  // Human (white) plays e2->e4
  act(() => {
    fireEvent.click(squares[52]);
    fireEvent.click(squares[36]);
  });

  // Let AI think
  act(() => {
    jest.advanceTimersByTime(50);
  });

  // After AI move, it should be white to move again.
  expect(screen.getByText(/White to move/i)).toBeInTheDocument();

  jest.useRealTimers();
});

test("Fischer increment adds increment after a move", () => {
  // Example: player ends move with 57.0s left after spending time, increment is +2s.
  const afterSpendMs = 57_000;
  const spentMs = 3_000;
  const out = applyPostMoveTimeAdjustment(afterSpendMs, spentMs, "fischer", 2);
  expect(out).toBe(59_000);
});

test("Bronstein delay restores up to delay, capped by time spent", () => {
  // Delay 5s; if spent only 2s, restore only 2s.
  const afterSpendMs = 58_000;
  const spentMs = 2_000;
  const out = applyPostMoveTimeAdjustment(afterSpendMs, spentMs, "bronstein", 5);
  expect(out).toBe(60_000);

  // If spent 7s, restore only 5s.
  const afterSpendMs2 = 53_000;
  const spentMs2 = 7_000;
  const out2 = applyPostMoveTimeAdjustment(afterSpendMs2, spentMs2, "bronstein", 5);
  expect(out2).toBe(58_000);
});
