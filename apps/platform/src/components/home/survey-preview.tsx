"use client";

import { useMemo, useState } from "react";

import {
  PERSONALITY_QUESTION_COUNT,
  VALUES_BELIEFS_QUESTION_COUNT,
} from "@/lib/survey/constants";

type PreviewSurvey = "personality" | "values";

type PreviewQuestion = {
  id: string;
  prompt: string;
};

type ScaleOption = {
  value: number;
  label: string;
};

const previewQuestions: Record<PreviewSurvey, PreviewQuestion[]> = {
  personality: [
    { id: "p1", prompt: "I rarely worry." },
    { id: "p2", prompt: "I often eat too much." },
    { id: "p3", prompt: "I usually like to spend my free time with people." },
    { id: "p4", prompt: "I take charge." },
    { id: "p5", prompt: "I am always busy." },
    { id: "p6", prompt: "I radiate joy." },
  ],
  values: [
    { id: "v1", prompt: "The world is generally a safe place." },
    { id: "v2", prompt: "It is important to listen to people who are different from me." },
    { id: "v3", prompt: "I value tradition and the customs I learned." },
    { id: "v4", prompt: "I enjoy discovering new ideas and ways of living." },
    { id: "v5", prompt: "Having a good time is important to me." },
    { id: "v6", prompt: "I want people to be treated fairly." },
  ],
};

const scales: Record<
  PreviewSurvey,
  { leftAnchor: string; rightAnchor: string; options: ScaleOption[] }
> = {
  personality: {
    leftAnchor: "Inaccurate",
    rightAnchor: "Accurate",
    options: [
      { value: 1, label: "Very inaccurate" },
      { value: 2, label: "Moderately inaccurate" },
      { value: 3, label: "Slightly inaccurate" },
      { value: 4, label: "Slightly accurate" },
      { value: 5, label: "Moderately accurate" },
      { value: 6, label: "Very accurate" },
    ],
  },
  values: {
    leftAnchor: "Disagree",
    rightAnchor: "Agree",
    options: [
      { value: 1, label: "Strongly disagree" },
      { value: 2, label: "Disagree" },
      { value: 3, label: "Slightly disagree" },
      { value: 4, label: "Slightly agree" },
      { value: 5, label: "Agree" },
      { value: 6, label: "Strongly agree" },
    ],
  },
};

const surveyMeta: Record<PreviewSurvey, { label: string; total: number }> = {
  personality: {
    label: "Personality",
    total: PERSONALITY_QUESTION_COUNT,
  },
  values: {
    label: "Values and beliefs",
    total: VALUES_BELIEFS_QUESTION_COUNT,
  },
};

function formatQuestionNumber(index: number) {
  return String(index + 1).padStart(3, "0");
}

export function SurveyPreview() {
  const [survey, setSurvey] = useState<PreviewSurvey>("personality");
  const [activeIndex, setActiveIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<PreviewSurvey, Record<string, number>>>({
    personality: {},
    values: {},
  });

  const questions = previewQuestions[survey];
  const scale = scales[survey];
  const meta = surveyMeta[survey];
  const activeQuestion = questions[activeIndex];
  const activeAnswer = answers[survey][activeQuestion.id];
  const answeredCount = Object.keys(answers[survey]).length;
  const completion = Math.round((answeredCount / meta.total) * 100);

  const visibleProgressItems = useMemo(() => {
    const extraItems = Array.from({ length: 3 }, (_, index) => ({
      id: `${survey}-future-${index}`,
      prompt:
        survey === "personality"
          ? ["I prefer variety.", "I keep my promises.", "I enjoy quiet evenings."][index]
          : ["People can be trusted.", "Security matters to me.", "Nature should be protected."][index],
    }));

    return [...questions, ...extraItems];
  }, [questions, survey]);

  function selectAnswer(value: number) {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [survey]: {
        ...currentAnswers[survey],
        [activeQuestion.id]: value,
      },
    }));
  }

  function goNext() {
    setActiveIndex((currentIndex) => (currentIndex + 1) % questions.length);
  }

  function goPrevious() {
    setActiveIndex((currentIndex) =>
      currentIndex === 0 ? questions.length - 1 : currentIndex - 1,
    );
  }

  function changeSurvey(nextSurvey: PreviewSurvey) {
    setSurvey(nextSurvey);
    setActiveIndex(0);
  }

  const previewUrl =
    survey === "personality"
      ? "platform.ciaobang.com/surveys/personality"
      : "platform.ciaobang.com/surveys/values-beliefs";

  return (
    <div className="overflow-hidden rounded-4xl border border-(--line) bg-(--surface-panel-strong) shadow-(--shadow-strong) backdrop-blur">
      {/* Safari-style mac toolbar */}
      <div className="flex items-center gap-3 border-b border-(--line) bg-(--surface-panel-strong) px-4 py-3 sm:px-5">
        {/* Traffic light dots */}
        <div className="flex items-center gap-1.5">
          <span className="block h-3 w-3 rounded-full" style={{ background: "#FF5F57" }} />
          <span className="block h-3 w-3 rounded-full" style={{ background: "#FEBC2E" }} />
          <span className="block h-3 w-3 rounded-full" style={{ background: "#28C840" }} />
        </div>

        {/* Sidebar icon + dropdown */}
        <div className="hidden items-center gap-1 sm:flex">
          <button
            type="button"
            aria-label="Toggle sidebar"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-(--muted) transition hover:bg-(--surface-inset) hover:text-(--ink)"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.6">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <line x1="9" y1="5" x2="9" y2="19" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Sidebar options"
            className="inline-flex h-7 w-5 items-center justify-center rounded-md text-(--muted) transition hover:bg-(--surface-inset) hover:text-(--ink)"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3 w-3 fill-current">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>
        </div>

        {/* Back / forward arrows */}
        <div className="flex items-center rounded-full bg-(--surface-inset) p-0.5">
          <button
            type="button"
            aria-label="Back"
            className="inline-flex h-7 w-8 items-center justify-center rounded-full text-(--muted) transition hover:text-(--ink)"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Forward"
            className="inline-flex h-7 w-8 items-center justify-center rounded-full text-(--muted) transition hover:text-(--ink)"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>

        {/* URL bar */}
        <div className="flex flex-1 items-center justify-center rounded-full bg-(--surface-inset) px-4 py-1.5 text-xs text-(--ink-soft)">
          <span className="truncate">{previewUrl}</span>
        </div>

        {/* Right-side tab actions */}
        <div className="hidden items-center gap-1 sm:flex">
<button
              type="button"
              aria-label="New tab"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-(--muted) transition hover:bg-(--surface-inset) hover:text-(--ink)"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M6.84814 13.9785C7.25488 13.9785 7.59521 13.6548 7.59521 13.2563V7.73633H12.9575C13.356 7.73633 13.6963 7.396 13.6963 6.98926C13.6963 6.58252 13.356 6.25049 12.9575 6.25049H7.59521V0.722168C7.59521 0.32373 7.25488 0 6.84814 0C6.44141 0 6.10938 0.32373 6.10938 0.722168V6.25049H0.73877C0.340332 6.25049 0 6.58252 0 6.98926C0 7.396 0.340332 7.73633 0.73877 7.73633H6.10938V13.2563C6.10938 13.6548 6.44141 13.9785 6.84814 13.9785Z" fill="currentColor"/>
              </svg>
            </button>
          <button
            type="button"
            aria-label="Show all tabs"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-(--muted) transition hover:bg-(--surface-inset) hover:text-(--ink)"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M2.60645 13.5469H4.02588V14.8169C4.02588 16.5269 4.88916 17.3901 6.63232 17.3901H14.9663C16.6929 17.3901 17.5645 16.5269 17.5645 14.8169V6.4165C17.5645 4.70654 16.6929 3.84326 14.9663 3.84326H13.5386V2.57324C13.5386 0.863281 12.667 0 10.9404 0H2.60645C0.863281 0 0 0.863281 0 2.57324V10.9736C0 12.6836 0.863281 13.5469 2.60645 13.5469ZM2.62305 12.2104C1.79297 12.2104 1.33643 11.7622 1.33643 10.8989V2.64795C1.33643 1.78467 1.79297 1.33643 2.62305 1.33643H10.9155C11.7373 1.33643 12.2021 1.78467 12.2021 2.64795V3.84326H6.63232C4.88916 3.84326 4.02588 4.69824 4.02588 6.4165V12.2104H2.62305ZM6.64893 16.0537C5.82715 16.0537 5.3623 15.6055 5.3623 14.7422V6.49121C5.3623 5.62793 5.82715 5.17969 6.64893 5.17969H14.9414C15.7632 5.17969 16.228 5.62793 16.228 6.49121V14.7422C16.228 15.6055 15.7632 16.0537 14.9414 16.0537H6.64893Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Survey body */}
      <div className="bg-(--surface-panel) p-3 sm:p-4">
      <div className="grid min-h-136 gap-4 lg:grid-cols-[19rem_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-(--line) bg-(--surface-panel-strong) p-5 shadow-(--shadow-soft)">
          <div className="flex items-start justify-between gap-3">
            <p className="clay-label">
              Survey progress
            </p>
            <div className="flex rounded-full border border-(--line-strong) bg-(--surface-panel) p-1 shadow-(--shadow-soft)">
              {(["personality", "values"] as PreviewSurvey[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => changeSurvey(item)}
                  aria-pressed={survey === item}
                  aria-label={
                    item === "personality"
                      ? "Show personality preview"
                      : "Show values and beliefs preview"
                  }
                  className={[
                    "rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition",
                    survey === item
                      ? "bg-(--accent-blue) text-(--selected-contrast)"
                      : "text-(--muted) hover:text-(--ink)",
                  ].join(" ")}
                >
                  {item === "personality" ? "P" : "V"}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex items-end justify-between gap-4">
            <div>
              <p className="font-display text-5xl leading-none text-(--ink)">{answeredCount}</p>
              <p className="mt-1.5 text-sm text-(--ink-soft)">
                of {meta.total} prompts answered
              </p>
            </div>
            <p className="rounded-full border border-black bg-(--accent-blue) px-4 py-2 text-sm font-semibold text-(--selected-contrast) shadow-(--shadow-soft)">
              {completion}%
            </p>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-(--surface-inset)">
            <div
              className="h-full rounded-full bg-(--accent-mint) transition-all duration-300"
              style={{ width: `${completion}%` }}
            />
          </div>

          <div className="relative mt-4 min-h-0 flex-1 overflow-hidden">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-[linear-gradient(0deg,var(--surface-panel-strong)_0%,rgba(255,255,255,0)_100%)] [html[data-theme='dark']_&]:bg-[linear-gradient(0deg,var(--surface-panel-strong)_0%,rgba(0,0,0,0)_100%)]"
            />
            <ol className="flex max-h-72 flex-col gap-2 overflow-hidden pr-1 lg:max-h-[34rem]">
              {visibleProgressItems.map((question, index) => {
                const answer = answers[survey][question.id];
                const isActive = index === activeIndex;

                return (
                  <li key={question.id}>
                    <button
                      type="button"
                      onClick={() => index < questions.length && setActiveIndex(index)}
                      disabled={index >= questions.length}
                      className={[
                        "w-full rounded-2xl border px-4 py-2.5 text-left shadow-(--shadow-soft) transition",
                        isActive
                          ? "border-black bg-(--accent-soft)"
                          : "border-(--line) bg-(--surface-panel)",
                        index >= questions.length ? "opacity-45" : "hover:border-(--line-strong)",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={[
                            "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                            answer ? "bg-(--accent-mint)" : "bg-(--line-strong)",
                          ].join(" ")}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-3">
                            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-(--muted)">
                              {formatQuestionNumber(index)}
                            </span>
                            <span className="text-[10px] uppercase tracking-[0.18em] text-(--muted)">
                              {answer ? scale.options[answer - 1]?.label : "Not answered"}
                            </span>
                          </span>
                          <span className="mt-1 line-clamp-1 text-sm leading-5 text-(--ink)">
                            {question.prompt}
                          </span>
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </aside>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-(--line) bg-(--surface-panel-strong) shadow-(--shadow-soft)">
          <div className="border-b border-(--line) px-5 py-5 sm:px-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <p className="clay-label">
                  Question {activeIndex + 1} of {meta.total}
                </p>
                <span className="rounded-full border border-dashed border-(--line) bg-(--surface-panel) px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-(--ink)">
                  {meta.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={goPrevious}
                  aria-label="Preview previous question"
                  className="inline-flex h-8 min-w-[2.2rem] items-center justify-center rounded-xl border border-(--line-strong) bg-(--surface-panel-strong) px-2.5 text-(--ink) shadow-(--keycap-shadow) transition hover:border-(--ink)"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Preview next question"
                  className="inline-flex h-8 min-w-[2.2rem] items-center justify-center rounded-xl border border-(--line-strong) bg-(--surface-panel-strong) px-2.5 text-(--ink) shadow-(--keycap-shadow) transition hover:border-(--ink)"
                >
                  ›
                </button>
              </div>
            </div>
            <h2 className="mt-4 font-display text-[2.35rem] leading-tight text-(--ink) sm:text-[3.25rem]">
              {activeQuestion.prompt}
            </h2>
          </div>

          <div className="flex min-h-0 flex-1 flex-col px-5 py-5 sm:px-7">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-(--muted)">
              <span>{scale.leftAnchor}</span>
              <span>{scale.rightAnchor}</span>
            </div>
            <div className="mt-4 grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {scale.options.map((option) => {
                const selected = option.value === activeAnswer;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => selectAnswer(option.value)}
                    aria-pressed={selected}
                    className={[
                      "group flex items-center gap-3 rounded-[1.25rem] border px-4 py-3 text-left transition duration-200 sm:min-h-44 sm:flex-col sm:justify-center sm:gap-0 sm:px-3 sm:py-5 sm:text-center",
                      selected
                        ? "-rotate-2 border-black bg-[#2CA0AB] text-white shadow-(--clay-hard-shadow)"
                        : "border-(--line) bg-(--surface-panel) text-(--ink) shadow-(--shadow-soft) hover:-translate-y-1 hover:border-(--ink) hover:bg-(--accent-soft)",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "inline-flex h-9 min-w-[2.6rem] shrink-0 items-center justify-center rounded-xl border px-2.5 text-base font-semibold shadow-(--keycap-shadow) sm:h-12 sm:min-w-[3.1rem] sm:px-3 sm:text-lg",
                        selected
                          ? "border-black/10 bg-white/60 text-(--selected-contrast)"
                          : "border-(--line-strong) bg-(--surface-panel-strong) text-(--ink)",
                      ].join(" ")}
                    >
                      {option.value}
                    </span>
                    <span
                      className={[
                        "text-sm font-semibold leading-5 sm:mt-4 sm:text-lg sm:leading-6",
                        selected ? "text-(--selected-contrast)" : "text-(--ink-soft)",
                      ].join(" ")}
                    >
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>
      </div>
    </div>
  );
}
