"use client";

import { memo } from "react";

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
        className={[
          "gap-3",
          isHero ? "grid h-full flex-1 grid-cols-3 grid-rows-2" : "grid",
        ].join(" ")}
        style={
          isHero
            ? undefined
            : {
                gridTemplateColumns: `repeat(${responseScale.options.length}, minmax(0, 1fr))`,
              }
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
                "group clay-button-hover min-w-0 rounded-[1.25rem] border text-center duration-200",
                isHero ? "flex h-full min-h-[10rem] flex-col items-center justify-center px-3 py-5" : "px-2 py-3",
                selected
                  ? "border-[#238E98] bg-[#2CA0AB] text-white shadow-[var(--shadow-strong)]"
                  : "border-[var(--line)] bg-[var(--surface-panel-strong)] text-[var(--ink)] shadow-[var(--shadow-soft)]",
              ].join(" ")}
              aria-pressed={selected}
            >
              <span
                className={[
                  "inline-flex items-center justify-center border font-semibold shadow-[var(--keycap-shadow)]",
                  isHero ? "h-12 min-w-[3.2rem] rounded-[0.625rem] px-3 text-lg" : "h-9 min-w-[2.5rem] rounded-[0.75rem] px-2 text-sm",
                  selected
                    ? "border-white/20 bg-white/25 text-white"
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
