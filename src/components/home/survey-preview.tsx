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

  return (
    <div className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface-panel)] p-3 shadow-[var(--shadow-strong)] backdrop-blur sm:p-4">
      <div className="grid min-h-[34rem] gap-4 lg:grid-cols-[19rem_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-panel-strong)] p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-start justify-between gap-3">
            <p className="clay-label">
              Survey progress
            </p>
            <div className="flex rounded-full border border-[var(--line-strong)] bg-[var(--surface-panel)] p-1 shadow-[var(--shadow-soft)]">
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
                      ? "bg-[var(--accent-blue)] text-[var(--selected-contrast)]"
                      : "text-[var(--muted)] hover:text-[var(--ink)]",
                  ].join(" ")}
                >
                  {item === "personality" ? "P" : "V"}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-end justify-between gap-4">
            <div>
              <p className="font-display text-6xl leading-none text-[var(--ink)]">{answeredCount}</p>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">
                of {meta.total} prompts answered
              </p>
            </div>
            <p className="rounded-full border border-black bg-[var(--accent-blue)] px-4 py-2 text-sm font-semibold text-[var(--selected-contrast)] shadow-[var(--shadow-soft)]">
              {completion}%
            </p>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--surface-inset)]">
            <div
              className="h-full rounded-full bg-[var(--accent-mint)] transition-all duration-300"
              style={{ width: `${completion}%` }}
            />
          </div>

          <div className="relative mt-6 min-h-0 flex-1 overflow-hidden">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-[linear-gradient(0deg,var(--surface-panel-strong)_0%,rgba(255,255,255,0)_100%)] [html[data-theme='dark']_&]:bg-[linear-gradient(0deg,var(--surface-panel-strong)_0%,rgba(0,0,0,0)_100%)]"
            />
            <ol className="flex max-h-[26rem] flex-col gap-3 overflow-hidden pr-1">
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
                        "w-full rounded-[1rem] border px-4 py-3 text-left shadow-[var(--shadow-soft)] transition",
                        isActive
                          ? "border-black bg-[var(--accent-soft)]"
                          : "border-[var(--line)] bg-[var(--surface-panel)]",
                        index >= questions.length ? "opacity-45" : "hover:border-[var(--line-strong)]",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={[
                            "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                            answer ? "bg-[var(--accent-mint)]" : "bg-[var(--line-strong)]",
                          ].join(" ")}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-3">
                            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                              {formatQuestionNumber(index)}
                            </span>
                            <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                              {answer ? scale.options[answer - 1]?.label : "Not answered"}
                            </span>
                          </span>
                          <span className="mt-2 line-clamp-2 block text-sm leading-6 text-[var(--ink)]">
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

        <section className="flex min-h-0 flex-col overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-panel-strong)] shadow-[var(--shadow-soft)]">
          <div className="border-b border-[var(--line)] px-5 py-5 sm:px-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <p className="clay-label">
                  Question {activeIndex + 1} of {meta.total}
                </p>
                <span className="rounded-full border border-dashed border-[var(--line)] bg-[var(--surface-panel)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink)]">
                  {meta.label}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                <span>Keys</span>
                <span className="inline-flex h-8 min-w-[3.3rem] items-center justify-center rounded-[0.75rem] border border-[var(--line-strong)] bg-[var(--keycap-bg)] px-2.5 font-mono text-[11px] font-semibold text-black shadow-[var(--keycap-shadow)]">
                  1-6
                </span>
                <span>Answer</span>
                <button
                  type="button"
                  onClick={goPrevious}
                  aria-label="Preview previous question"
                  className="inline-flex h-8 min-w-[2.2rem] items-center justify-center rounded-[0.75rem] border border-[var(--line-strong)] bg-[var(--keycap-bg)] px-2.5 text-black shadow-[var(--keycap-shadow)] transition hover:border-black"
                >
                  ‹
                </button>
                <span>Previous</span>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Preview next question"
                  className="inline-flex h-8 min-w-[2.2rem] items-center justify-center rounded-[0.75rem] border border-[var(--line-strong)] bg-[var(--keycap-bg)] px-2.5 text-black shadow-[var(--keycap-shadow)] transition hover:border-black"
                >
                  ›
                </button>
                <span>Next</span>
              </div>
            </div>
            <h2 className="mt-4 font-display text-[2.35rem] leading-tight text-[var(--ink)] sm:text-[3.25rem]">
              {activeQuestion.prompt}
            </h2>
          </div>

          <div className="flex min-h-0 flex-1 flex-col px-5 py-5 sm:px-7">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
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
                      "group flex min-h-[9.5rem] flex-col items-center justify-center rounded-[1.25rem] border px-3 py-5 text-center transition duration-200 sm:min-h-[11rem]",
                      selected
                        ? "-rotate-2 border-black bg-[var(--accent-coral)] text-[var(--selected-contrast)] shadow-[var(--clay-hard-shadow)]"
                        : "border-[var(--line)] bg-[var(--surface-panel)] text-[var(--ink)] shadow-[var(--shadow-soft)] hover:-translate-y-1 hover:border-black hover:bg-[var(--accent-soft)]",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "inline-flex h-12 min-w-[3.1rem] items-center justify-center rounded-[0.75rem] border px-3 text-lg font-semibold shadow-[var(--keycap-shadow)]",
                        selected
                          ? "border-black/10 bg-white/60 text-[var(--selected-contrast)]"
                          : "border-[var(--line)] bg-[var(--keycap-bg)] text-[var(--muted)]",
                      ].join(" ")}
                    >
                      {option.value}
                    </span>
                    <span
                      className={[
                        "mt-4 text-base font-semibold leading-6 sm:text-lg",
                        selected ? "text-[var(--selected-contrast)]" : "text-[var(--ink-soft)]",
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
  );
}
