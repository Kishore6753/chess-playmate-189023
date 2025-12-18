import React from "react";

/**
 * @param {{
 *  dark: boolean,
 *  selected: boolean,
 *  highlight: boolean,
 *  lastMove: boolean,
 *  onClick: () => void,
 *  children: React.ReactNode
 * }} props
 */
export default function Square({ dark, selected, highlight, lastMove, onClick, children }) {
  return (
    <button
      type="button"
      className={[
        "sq",
        dark ? "sq--dark" : "sq--light",
        selected ? "sq--selected" : "",
        highlight ? "sq--highlight" : "",
        lastMove ? "sq--lastmove" : "",
      ].join(" ")}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
