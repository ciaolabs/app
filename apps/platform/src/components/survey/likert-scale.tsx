"use client";

import { memo, type CSSProperties } from "react";

import { LikertValue, QuestionResponseScale } from "@/lib/survey/types";

type LikertScaleProps = {
  responseScale: QuestionResponseScale;
  selectedValue?: LikertValue;
  onSelect: (value: LikertValue) => void;
  variant?: "hero" | "compact";
};

export const LikertScale = memo(function LikertScale({
  responseScale,
  selectedValue,
  onSelect,
  variant = "compact",
}: LikertScaleProps) {
  const isHero = variant === "hero";

  return (
    <div className={["space-y-3", isHero ? "flex h-full flex-col" : ""].join(" ")}>
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
        <span>{responseScale.leftAnchor}</span>
        <span>{responseScale.rightAnchor}</span>
      </div>

      <div
        className={
          isHero
            ? // Mobile: one full-width row per option so labels never overflow.
              // sm+: the original 3x2 hero grid.
              "grid grid-cols-1 gap-2.5 sm:h-full sm:flex-1 sm:grid-cols-3 sm:grid-rows-2 sm:gap-3"
            : // Mobile: 3 columns (2 rows) so a 6-point scale fits the viewport.
              // sm+: one row with a column per option.
              "grid grid-cols-3 gap-2 sm:gap-3 sm:grid-cols-[repeat(var(--likert-cols),minmax(0,1fr))]"
        }
        style={
          isHero
            ? undefined
            : ({ "--likert-cols": responseScale.options.length } as CSSProperties)
        }
      >
        {responseScale.options.map((option) => {
          const value = option.value;
          const selected = value === selectedValue;

          return (
            <button
              key={option.label}
              type="button"
              onClick={() => onSelect(value)}
              className={[
                "group clay-button-hover min-w-0 rounded-[1.25rem] border duration-200",
                isHero
                  ? "flex items-center gap-3 px-4 py-3.5 text-left sm:h-full sm:min-h-[10rem] sm:flex-col sm:justify-center sm:px-3 sm:py-5 sm:text-center"
                  : "px-2 py-3 text-center",
                selected
                  ? "border-[#238E98] bg-[#2CA0AB] text-white shadow-[var(--shadow-strong)]"
                  : "border-[var(--line)] bg-[var(--surface-panel-strong)] text-[var(--ink)] shadow-[var(--shadow-soft)]",
              ].join(" ")}
              aria-pressed={selected}
            >
              <span
                className={[
                  "inline-flex shrink-0 items-center justify-center border font-semibold shadow-[var(--keycap-shadow)]",
                  isHero
                    ? "h-10 min-w-[2.75rem] rounded-[0.7rem] px-2.5 text-base sm:h-12 sm:min-w-[3.2rem] sm:rounded-[0.625rem] sm:px-3 sm:text-lg"
                    : "h-9 min-w-[2.5rem] rounded-[0.75rem] px-2 text-sm",
                  selected
                    ? "border-white/20 bg-white/25 text-white"
                    : "border-[var(--line)] bg-[var(--keycap-bg)] text-[var(--muted)]",
                ].join(" ")}
              >
                {value}
              </span>
              <p
                className={[
                  "min-w-0 font-semibold",
                  isHero
                    ? "text-base leading-6 sm:text-lg"
                    : "mt-2 text-[11px] leading-4 sm:text-xs",
                  selected ? "text-white opacity-90" : "text-[var(--ink-soft)]",
                ].join(" ")}
              >
                {option.label}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
});
