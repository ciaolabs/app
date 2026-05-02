"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";

import { QuestionItem, SurveyAnswers } from "@/lib/survey/types";

type QuestionLogProps = {
  questions: readonly QuestionItem[];
  answers: SurveyAnswers;
  activeIndex: number;
  onSelect: (index: number) => void;
};

type QuestionLogItemProps = {
  questionId: string;
  order: number;
  prompt: string;
  index: number;
  isActive: boolean;
  isAnswered: boolean;
  isVisible: boolean;
  observerReady: boolean;
  summaryLabel: string;
  onSelect: (index: number) => void;
  registerRef: (index: number, node: HTMLLIElement | null) => void;
};

function formatAnswerSummary(value: number | undefined, labels: readonly string[]) {
  if (!value) {
    return "Not answered";
  }

  return labels[value - 1] ?? "Answered";
}

const QuestionLogItem = memo(function QuestionLogItem({
  order,
  prompt,
  index,
  isActive,
  isAnswered,
  isVisible,
  observerReady,
  summaryLabel,
  onSelect,
  registerRef,
}: QuestionLogItemProps) {
  return (
    <li
      ref={(node) => registerRef(index, node)}
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
          "w-full rounded-[1rem] border px-4 py-3 text-left shadow-[var(--shadow-soft)] transition duration-200",
          isActive
            ? "border-black bg-[var(--accent-soft)]"
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
                {order.toString().padStart(3, "0")}
              </span>
              <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
                {summaryLabel}
              </span>
            </div>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--ink)]">
              {prompt}
            </p>
          </div>
        </div>
      </button>
    </li>
  );
});

export const QuestionLog = memo(function QuestionLog({
  questions,
  answers,
  activeIndex,
  onSelect,
}: QuestionLogProps) {
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);
  const [observerReady, setObserverReady] = useState(false);
  const [visibleItems, setVisibleItems] = useState<Record<number, boolean>>({});

  const labelsByQuestion = useMemo(() => {
    const map = new Map<string, readonly string[]>();
    for (const question of questions) {
      map.set(
        question.id,
        question.responseScale.options.map((option) => option.label),
      );
    }
    return map;
  }, [questions]);

  const summaryLabels = useMemo(() => {
    const map = new Map<string, string>();
    for (const question of questions) {
      const labels = labelsByQuestion.get(question.id) ?? [];
      map.set(question.id, formatAnswerSummary(answers[question.id], labels));
    }
    return map;
  }, [questions, answers, labelsByQuestion]);

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
        threshold: [0.08, 0.35],
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

  const registerRef = useMemo(
    () => (index: number, node: HTMLLIElement | null) => {
      itemRefs.current[index] = node;
    },
    [],
  );

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
              const isActive = index === activeIndex;
              const isAnswered = Boolean(answers[question.id]);
              const isVisible = visibleItems[index] ?? index < 6;

              return (
                <QuestionLogItem
                  key={question.id}
                  questionId={question.id}
                  order={question.order}
                  prompt={question.prompt}
                  index={index}
                  isActive={isActive}
                  isAnswered={isAnswered}
                  isVisible={isVisible}
                  observerReady={observerReady}
                  summaryLabel={summaryLabels.get(question.id) ?? "Not answered"}
                  onSelect={onSelect}
                  registerRef={registerRef}
                />
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
});
