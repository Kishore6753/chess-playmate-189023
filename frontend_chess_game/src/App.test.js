import { render, screen, fireEvent, act } from "@testing-library/react";
import App from "./App";

function getSquareButtons(container) {
  return container.querySelectorAll("button.sq");
}

test("renders a playable chess board with 64 squares", () => {
  const { container } = render(<App />);
  const squares = getSquareButtons(container);
  expect(squares.length).toBe(64);
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
