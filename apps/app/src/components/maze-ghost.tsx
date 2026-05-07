export function MazeGhost({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 28"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16 0C8.268 0 2 5.82 2 13v13l3.5-3.5L9 26l3.5-3.5L16 26l3.5-3.5L23 26l3.5-3.5L30 26V13C30 5.82 23.732 0 16 0Z"
        fill="currentColor"
      />
      <g className="ghost-eyes">
        <ellipse cx="11" cy="12" rx="3" ry="3.5" fill="white" />
        <ellipse cx="21" cy="12" rx="3" ry="3.5" fill="white" />
        <circle className="ghost-pupil-l" cx="11.8" cy="12.5" r="1.8" fill="#1a1a2e" />
        <circle className="ghost-pupil-r" cx="21.8" cy="12.5" r="1.8" fill="#1a1a2e" />
      </g>
    </svg>
  );
}
