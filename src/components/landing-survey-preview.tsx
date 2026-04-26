const QUESTIONS = [
  { id: "001", status: "NOT ANSWERED", text: "The world is generally a safe place." },
  { id: "002", status: "NOT ANSWERED", text: "It is important to listen to people who are different from me." },
  { id: "003", status: "NOT ANSWERED", text: "I value tradition and the customs I learned." },
  { id: "004", status: "STRONGLY DISAGREE", text: "I enjoy discovering new ideas...", answered: true },
];

const LIKERT_OPTIONS = [
  { value: 1, label: "Strongly disagree" },
  { value: 2, label: "Disagree", selected: true },
  { value: 3, label: "Slightly disagree" },
  { value: 4, label: "Slightly agree" },
  { value: 5, label: "Agree" },
  { value: 6, label: "Strongly agree" },
];

function TrafficLight({ color }: { color: string }) {
  return <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />;
}

function LikertButton({ value, label, selected }: { value: number; label: string; selected?: boolean }) {
  return (
    <div
      className={[
        "flex min-h-[9rem] flex-col items-center justify-center rounded-[1.25rem] border px-3 py-5 text-center",
        selected
          ? "border-black bg-[var(--accent)] shadow-[var(--shadow-strong)]"
          : "border-[var(--line)] bg-[var(--surface-panel-strong)] shadow-[var(--shadow-soft)]",
      ].join(" ")}
    >
      <span
        className={[
          "inline-flex h-10 min-w-[3rem] items-center justify-center rounded-[0.625rem] border text-base font-semibold shadow-[var(--keycap-shadow)]",
          selected
            ? "border-black/10 bg-white/35 text-[var(--selected-contrast)]"
            : "border-[var(--line)] bg-[var(--keycap-bg)] text-[var(--muted)]",
        ].join(" ")}
      >
        {value}
      </span>
      <p
        className={[
          "mt-3 text-base font-semibold leading-6",
          selected ? "text-[var(--selected-contrast)] opacity-80" : "text-[var(--ink-soft)]",
        ].join(" ")}
      >
        {label}
      </p>
    </div>
  );
}

function QuestionLogItem({
  id,
  status,
  text,
  active,
  answered,
}: {
  id: string;
  status: string;
  text: string;
  active?: boolean;
  answered?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-[1rem] border px-4 py-3",
        active
          ? "border-[var(--line-strong)] bg-[var(--surface-panel-strong)] shadow-[var(--shadow-soft)]"
          : "border-transparent",
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        <span
          className={[
            "h-2 w-2 shrink-0 rounded-full",
            answered ? "bg-[var(--accent-mint)]" : "bg-[var(--line-strong)]",
          ].join(" ")}
        />
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
          {id} &nbsp; {status}
        </p>
      </div>
      <p className="mt-1.5 text-sm leading-5 text-[var(--ink)]">{text}</p>
    </div>
  );
}

export function LandingSurveyPreview() {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-[var(--line)] shadow-[var(--shadow-strong)]">
      {/* Mac window chrome */}
      <div className="flex items-center gap-3 border-b border-[var(--line)] bg-[var(--surface-panel-strong)] px-4 py-3">
        <div className="flex items-center gap-1.5">
          <TrafficLight color="#FF5F57" />
          <TrafficLight color="#FEBC2E" />
          <TrafficLight color="#28C840" />
        </div>
        <div className="flex flex-1 justify-center">
          <div className="flex h-6 min-w-[14rem] items-center justify-center rounded-md border border-[var(--line)] bg-[var(--surface-inset)] px-3 text-[11px] text-[var(--muted)]">
            surveys.luiss.it/surveys/values-beliefs
          </div>
        </div>
      </div>

      {/* Survey content */}
      <div className="grid lg:grid-cols-[20rem_minmax(0,1fr)]">
        {/* Left sidebar */}
        <aside className="border-b border-[var(--line)] bg-[var(--surface-panel)] p-5 lg:border-b-0 lg:border-r">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                Survey progress
              </p>
              <div className="flex gap-1">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[var(--line-strong)] bg-[var(--surface-panel-strong)] text-[10px] font-bold text-[var(--ink)] shadow-[var(--shadow-soft)]">
                  P
                </span>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-black bg-[var(--accent-blue)] text-[10px] font-bold text-[var(--selected-contrast)] shadow-[var(--shadow-soft)]">
                  V
                </span>
              </div>
            </div>

            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-display text-5xl text-[var(--ink)]">1</p>
                <p className="text-sm text-[var(--ink-soft)]">of 156 prompts answered</p>
              </div>
              <p className="rounded-full border border-black bg-[var(--accent-blue)] px-4 py-2 text-sm font-semibold text-[var(--selected-contrast)] shadow-[var(--shadow-soft)]">
                1%
              </p>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-inset)]">
              <div className="h-full w-[1%] rounded-full bg-[var(--accent-mint)]" />
            </div>
          </div>

          <div className="mt-5 space-y-1">
            {QUESTIONS.map((q, i) => (
              <QuestionLogItem
                key={q.id}
                id={q.id}
                status={q.status}
                text={q.text}
                active={i === 0}
                answered={q.answered}
              />
            ))}
          </div>
        </aside>

        {/* Right question panel */}
        <main className="bg-[var(--surface-panel)]">
          {/* Question header */}
          <div className="border-b border-[var(--line)] px-6 py-4 sm:px-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Question 1 of 156
                </p>
                <span className="rounded-full border border-dashed border-[var(--line)] bg-[var(--surface-panel-strong)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink)]">
                  Values and beliefs
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                <span>Keys</span>
                <span className="inline-flex h-7 min-w-[3rem] items-center justify-center rounded-[0.625rem] border border-[var(--line-strong)] bg-[var(--keycap-bg)] px-2 font-mono text-[10px] font-semibold text-black shadow-[var(--keycap-shadow)]">
                  1–6
                </span>
                <span>Answer</span>
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-[0.625rem] border border-[var(--line-strong)] bg-[var(--keycap-bg)] font-mono text-[10px] font-semibold text-black shadow-[var(--keycap-shadow)]">
                  ‹
                </span>
                <span>Previous</span>
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-[0.625rem] border border-[var(--line-strong)] bg-[var(--keycap-bg)] font-mono text-[10px] font-semibold text-black shadow-[var(--keycap-shadow)]">
                  ›
                </span>
                <span>Next</span>
              </div>
            </div>
            <h2 className="mt-2 font-display text-[2rem] leading-tight text-[var(--ink)] sm:text-[2.4rem]">
              The world is generally a safe place.
            </h2>
          </div>

          {/* Likert scale */}
          <div className="px-6 py-5 sm:px-7">
            <div className="mb-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              <span>Disagree</span>
              <span>Agree</span>
            </div>
            <div className="grid grid-cols-3 grid-rows-2 gap-3">
              {LIKERT_OPTIONS.map((opt) => (
                <LikertButton key={opt.value} {...opt} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
