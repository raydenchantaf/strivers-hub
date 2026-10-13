/**
 * One sprite for the mobile menu. Line icons drawn to the same grid and
 * weight as the rest of the interface - no icon font, no emoji.
 */
export function IconSprite() {
  const stroke = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  return (
    <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
      <defs>
        <g id="i-assess" {...stroke}>
          <path d="M7 3h6v3H7zM6 5H4v14h12V5h-2M7.5 11l2 2 4-4" />
        </g>
        <g id="i-res" {...stroke}>
          <path d="M4 4.5h5a2 2 0 0 1 2 2V19a2 2 0 0 0-2-1.6H4zM16 4.5h-5a2 2 0 0 0-2 2V19a2 2 0 0 1 2-1.6h5z" />
        </g>
        <g id="i-fin" {...stroke}>
          <circle cx="10" cy="10" r="7" />
          <path d="M10 6v8M12.2 8.1c-.5-.7-1.3-1-2.2-1-1.2 0-2 .6-2 1.5s.7 1.3 2 1.6 2.2.7 2.2 1.7-1 1.6-2.2 1.6c-1 0-1.8-.4-2.2-1" />
        </g>
        <g id="i-events" {...stroke}>
          <rect x="3" y="4.5" width="14" height="12.5" rx="2.2" />
          <path d="M3 8.5h14M7 3v3M13 3v3M7 12h2" />
        </g>
        <g id="i-mentor" {...stroke}>
          <circle cx="7.5" cy="7" r="2.7" />
          <path d="M2.6 16.5c0-2.6 2.2-4.3 4.9-4.3s4.9 1.7 4.9 4.3" />
          <path d="M13.4 4.7a2.7 2.7 0 0 1 0 5.1M14.6 12.6c1.7.5 2.8 1.8 2.8 3.9" />
        </g>
        <g id="i-about" {...stroke}>
          <circle cx="10" cy="10" r="7.2" />
          <path d="M10 9.2V14M10 6.4v.1" />
        </g>
      </defs>
    </svg>
  );
}
