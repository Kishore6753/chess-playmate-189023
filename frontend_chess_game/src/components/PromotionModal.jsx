import React from "react";

const OPTIONS = [
  { key: "q", label: "Queen" },
  { key: "r", label: "Rook" },
  { key: "b", label: "Bishop" },
  { key: "n", label: "Knight" },
];

function promoteChar(color, key) {
  return color === "w" ? key.toUpperCase() : key;
}

export default function PromotionModal({ open, color, onPick, onClose }) {
  if (!open) return null;

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true" aria-label="Choose promotion">
      <div className="modal">
        <div className="modal__title">Choose promotion</div>
        <div className="modal__actions">
          {OPTIONS.map((o) => (
            <button
              type="button"
              key={o.key}
              className="btn"
              onClick={() => onPick(promoteChar(color, o.key))}
            >
              {o.label}
            </button>
          ))}
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
