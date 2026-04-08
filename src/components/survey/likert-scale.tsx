"use client";

import { LikertValue } from "@/lib/survey/types";

type LikertScaleProps = {
  labels: readonly string[];
  selectedValue?: LikertValue;
  onSelect: (value: LikertValue) => void;
  variant?: "hero" | "compact";
};

export function LikertScale({
  labels,
  selectedValue,
  onSelect,
  variant = "compact",
}: LikertScaleProps) {
  const isHero = variant === "hero";

  return (
    <div className={["space-y-3", isHero ? "flex h-full flex-col" : ""].join(" ")}>
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
        <span>Inaccurate</span>
        <span>Accurate</span>
      </div>

      <div
        className={[
          "gap-2",
          isHero ? "grid h-full flex-1 grid-cols-3 grid-rows-2" : "grid grid-cols-6",
        ].join(" ")}
      >
        {labels.map((label, index) => {
          const value = (index + 1) as LikertValue;
          const selected = value === selectedValue;

          return (
            <button
              key={label}
              type="button"
              onClick={() => onSelect(value)}
              className={[
                "group min-w-0 rounded-[1.2rem] border text-center transition duration-200",
                isHero ? "flex h-full min-h-[10rem] flex-col items-center justify-center px-3 py-5" : "px-2 py-3",
                selected
                  ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--selected-contrast)] shadow-[var(--shadow-soft)]"
                  : "border-[var(--line)] bg-[var(--surface-panel-strong)] text-[var(--ink)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-panel)]",
              ].join(" ")}
              aria-pressed={selected}
            >
              <span
                className={[
                  "inline-flex items-center justify-center border font-semibold shadow-[var(--keycap-shadow)]",
                  isHero ? "h-12 min-w-[3.2rem] rounded-[0.95rem] px-3 text-lg" : "h-9 min-w-[2.5rem] rounded-[0.75rem] px-2 text-sm",
                  selected
                    ? "border-black/10 bg-white/35 text-[var(--selected-contrast)]"
                    : "border-[var(--line)] bg-[var(--keycap-bg)] text-[var(--muted)]",
                ].join(" ")}
              >
                {value}
              </span>
              <p
                className={[
                  isHero
                    ? "mt-3 text-base font-semibold leading-6 sm:text-lg"
                    : "mt-2 text-[11px] font-semibold leading-4 sm:text-xs",
                  selected ? "text-[var(--selected-contrast)] opacity-80" : "text-[var(--ink-soft)]",
                ].join(" ")}
              >
                {label}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
