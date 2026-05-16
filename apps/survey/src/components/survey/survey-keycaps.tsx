import type { ReactNode } from "react";

type ShortcutKeyProps = {
  children: ReactNode;
  wide?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
};

export function ShortcutKey({
  children,
  wide = false,
  onClick,
  disabled = false,
  ariaLabel,
}: ShortcutKeyProps) {
  const classes = [
    "inline-flex h-8 items-center justify-center rounded-[0.75rem] border border-[var(--line-strong)] bg-[var(--keycap-bg)] px-2.5 font-mono text-[11px] font-semibold text-[var(--ink)] shadow-[var(--keycap-shadow)]",
    wide ? "min-w-[3.3rem]" : "min-w-[2.2rem]",
    onClick ? "transition hover:border-[var(--line-strong)] disabled:cursor-not-allowed disabled:opacity-40" : "",
  ].join(" ");

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        className={classes}
      >
        {children}
      </button>
    );
  }

  return (
    <span
      className={[
        "inline-flex h-8 items-center justify-center rounded-[0.75rem] border border-[var(--line-strong)] bg-[var(--keycap-bg)] px-2.5 font-mono text-[11px] font-semibold text-[var(--ink)] shadow-[var(--keycap-shadow)]",
        wide ? "min-w-[3.3rem]" : "min-w-[2.2rem]",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

export function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
      <path
        d="M9.5 3.5 5 8l4.5 4.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

export function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
      <path
        d="m6.5 3.5 4.5 4.5-4.5 4.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}
