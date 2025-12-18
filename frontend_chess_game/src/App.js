import React from "react";
import "./App.css";
import ChessGame from "./components/ChessGame";

// PUBLIC_INTERFACE
function App() {
  /** This is a public function. App entrypoint rendering the ChessGame experience. */
  return (
    <div className="App">
      <ChessGame />
    </div>
  );
}

export default App;
