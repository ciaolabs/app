"use client";

import { useEffect, useRef, useState } from "react";

import { QuestionItem, SurveyAnswers } from "@/lib/survey/types";

type QuestionLogProps = {
  questions: QuestionItem[];
  answers: SurveyAnswers;
  activeIndex: number;
  onSelect: (index: number) => void;
};

function formatAnswerSummary(value: number | undefined, labels: readonly string[]) {
  if (!value) {
    return "Not answered";
  }

  return labels[value - 1] ?? "Answered";
}

export function QuestionLog({
  questions,
  answers,
  activeIndex,
  onSelect,
}: QuestionLogProps) {
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);
  const [observerReady, setObserverReady] = useState(false);
  const [visibleItems, setVisibleItems] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const activeItem = itemRefs.current[activeIndex];

    activeItem?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: "smooth",
    });
  }, [activeIndex]);

  useEffect(() => {
    const root = scrollAreaRef.current;

    if (!root) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleItems((currentState) => {
          const nextState = { ...currentState };
          let hasChanges = false;

          for (const entry of entries) {
            const index = Number((entry.target as HTMLElement).dataset.index);

            if (Number.isNaN(index)) {
              continue;
            }

            const previousValue = currentState[index] ?? index < 6;
            let nextValue = previousValue;

            if (entry.intersectionRatio >= 0.35) {
              nextValue = true;
            } else if (entry.intersectionRatio <= 0.08) {
              nextValue = false;
            }

            if (nextValue !== previousValue) {
              nextState[index] = nextValue;
              hasChanges = true;
            }
          }

          return hasChanges ? nextState : currentState;
        });
      },
      {
        root,
        threshold: [0, 0.08, 0.2, 0.35, 0.55, 0.8, 1],
        rootMargin: "-2% 0px -10% 0px",
      },
    );

    itemRefs.current.forEach((item) => {
      if (item) {
        observer.observe(item);
      }
    });

    setObserverReady(true);

    return () => {
      observer.disconnect();
    };
  }, [questions.length]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative min-h-0 flex-1">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-[linear-gradient(180deg,var(--surface-panel)_0%,rgba(250,249,245,0.58)_38%,rgba(250,249,245,0)_100%)] opacity-100 [html[data-theme='dark']_&]:bg-[linear-gradient(180deg,var(--surface-panel)_0%,rgba(38,38,36,0.58)_38%,rgba(38,38,36,0)_100%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-[linear-gradient(0deg,var(--surface-panel)_0%,rgba(250,249,245,0.62)_40%,rgba(250,249,245,0)_100%)] opacity-100 [html[data-theme='dark']_&]:bg-[linear-gradient(0deg,var(--surface-panel)_0%,rgba(38,38,36,0.62)_40%,rgba(38,38,36,0)_100%)]"
        />
        <div ref={scrollAreaRef} className="min-h-0 h-full overflow-y-auto pr-2 pb-6">
          <ol className="flex flex-col gap-2">
            {questions.map((question, index) => {
              const answer = answers[question.id];
              const isActive = index === activeIndex;
              const isAnswered = Boolean(answer);
              const isVisible = visibleItems[index] ?? index < 6;

              return (
                <li
                  key={question.id}
                  ref={(node) => {
                    itemRefs.current[index] = node;
                  }}
                  data-index={index}
                  style={{ contentVisibility: "auto" }}
                  className={[
                    "transition duration-400 ease-out",
                    observerReady
                      ? isVisible || isActive
                        ? "translate-y-0 scale-100 opacity-100 blur-0"
                        : "translate-y-2 scale-[0.985] opacity-65 blur-[0.6px]"
                      : "translate-y-0 scale-100 opacity-100 blur-0",
                  ].join(" ")}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(index)}
                    className={[
                      "w-full rounded-[1.4rem] border px-4 py-3 text-left transition duration-200",
                      isActive
                        ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                        : "border-[var(--line)] bg-[var(--surface-panel-strong)] hover:border-[var(--line-strong)]",
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={[
                          "mt-1 h-2.5 w-2.5 rounded-full",
                          isAnswered ? "bg-[var(--accent-mint)]" : "bg-[var(--line-strong)]",
                        ].join(" ")}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                            {question.order.toString().padStart(3, "0")}
                          </span>
                          <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
                            {formatAnswerSummary(
                              answer,
                              question.responseScale.options.map((option) => option.label),
                            )}
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--ink)]">
                          {question.prompt}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
