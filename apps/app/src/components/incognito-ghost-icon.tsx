export function IncognitoGhostIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 1a8 8 0 0 0-8 8v9.5l2.5-2.5 2 2L12 15l3.5 3 2-2L20 18.5V9a8 8 0 0 0-8-8Z" />
      <g className="ghost-eye-group">
        <circle cx="9" cy="9" r="0.5" fill="currentColor" stroke="none" className="ghost-eye ghost-eye-l" />
        <circle cx="15" cy="9" r="0.5" fill="currentColor" stroke="none" className="ghost-eye ghost-eye-r" />
      </g>
    </svg>
  );
}
