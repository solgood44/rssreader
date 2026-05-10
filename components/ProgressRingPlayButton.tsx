"use client";

const RING_R = 20;
const RING_C = 2 * Math.PI * RING_R;

/** Circular progress + play / pause — same control as show episode rows. */
export function ProgressRingPlayButton({
  progress,
  completed,
  playing,
  onClick,
  label,
}: {
  progress: number;
  completed: boolean;
  playing: boolean;
  onClick: () => void;
  label: string;
}) {
  const p = completed ? 1 : Math.min(1, Math.max(0, progress));
  const offset = RING_C * (1 - p);

  return (
    <button type="button" className="ep-ring-btn" onClick={onClick} aria-label={label}>
      <svg className="ep-ring-btn__svg" width="52" height="52" viewBox="0 0 52 52" aria-hidden>
        <circle className="ep-ring-btn__track" cx="26" cy="26" r={RING_R} fill="none" strokeWidth="2.5" />
        <circle
          className={completed ? "ep-ring-btn__fill ep-ring-btn__fill--done" : "ep-ring-btn__fill"}
          cx="26"
          cy="26"
          r={RING_R}
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          transform="rotate(-90 26 26)"
          strokeDasharray={RING_C}
          strokeDashoffset={offset}
        />
        {playing ? (
          <g className="ep-ring-btn__icon" transform="translate(26,26)">
            <path d="M-5 -8h3v16h-3zm7 0h3v16h-3z" fill="currentColor" />
          </g>
        ) : (
          <g className="ep-ring-btn__icon" transform="translate(26,26)">
            <path d="M-4 -7l14 7-14 7z" fill="currentColor" />
          </g>
        )}
      </svg>
    </button>
  );
}
