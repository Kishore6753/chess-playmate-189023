import React from "react";
import { formatClock } from "../game/clock";

/**
 * @param {{
 *  label: string,
 *  color: "w"|"b",
 *  remainingMs: number,
 *  running: boolean,
 *  flagged: boolean,
 *  modeLabel?: string,
 *  incrementOrDelaySeconds?: number
 * }} props
 */
// PUBLIC_INTERFACE
export default function Clock({
  label,
  color,
  remainingMs,
  running,
  flagged,
  modeLabel,
  incrementOrDelaySeconds,
}) {
  /** This is a public function. Displays a single side's chess clock with running/flag UI. */
  const timeText = formatClock(remainingMs);

  const cls = [
    "clock",
    running ? "clock--running" : "",
    flagged ? "clock--flagged" : "",
    color === "w" ? "clock--white" : "clock--black",
  ]
    .filter(Boolean)
    .join(" ");

  const sub =
    modeLabel && typeof incrementOrDelaySeconds === "number"
      ? `${modeLabel} ${incrementOrDelaySeconds}s`
      : null;

  return (
    <div className={cls} role="group" aria-label={`${label} clock`}>
      <div className="clock__top">
        <div className="clock__label">{label}</div>
        {flagged ? (
          <div className="clock__flag" aria-label="Flag fell">
            Flag
          </div>
        ) : null}
      </div>
      <div className="clock__time" aria-label={`${label} remaining time`}>
        {timeText}
      </div>
      {sub ? <div className="clock__sub">{sub}</div> : null}
    </div>
  );
}
