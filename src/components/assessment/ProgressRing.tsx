'use client';

/** Progress through the branch, drawn as a ring in the panel masthead. */
export function ProgressRing({ value }: { value: number }) {
  const C = 2 * Math.PI * 22;
  return (
    <div className="ring">
      <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden="true">
        <defs>
          <linearGradient id="ringgrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6B1040" />
            <stop offset="52%" stopColor="#A0244F" />
            <stop offset="100%" stopColor="#C45A3A" />
          </linearGradient>
        </defs>
        <circle className="bg" cx="26" cy="26" r="22" />
        <circle
          className="fg"
          cx="26"
          cy="26"
          r="22"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - value)}
        />
      </svg>
      <b className="tnum">{Math.round(value * 100)}%</b>
    </div>
  );
}
