type SurveyLoadingFallbackProps = {
  title: string;
  description: string;
  variant?: "chooser" | "survey";
};

function LoadingBar({ className = "" }: { className?: string }) {
  return (
    <div
      className={[
        "h-3 overflow-hidden rounded-full bg-(--surface-inset)",
        className,
      ].join(" ")}
    >
      <div className="h-full w-1/3 rounded-full bg-(--accent-mint) motion-safe:animate-pulse" />
    </div>
  );
}

function SurveyCardSkeleton() {
  return (
    <article className="rounded-3xl border border-(--line) bg-(--surface-panel) p-6 shadow-(--shadow-soft)">
      <div className="flex items-start justify-between gap-4">
        <div className="w-full max-w-sm space-y-4">
          <div className="h-3 w-32 rounded-full bg-(--surface-inset)" />
          <div className="h-8 w-4/5 rounded-full bg-(--surface-inset)" />
        </div>
        <div className="h-7 w-28 rounded-full border border-dashed border-(--line) bg-(--surface-panel-strong)" />
      </div>
      <div className="mt-6 space-y-3">
        <div className="h-3 w-full rounded-full bg-(--surface-inset)" />
        <div className="h-3 w-5/6 rounded-full bg-(--surface-inset)" />
      </div>
      <div className="mt-6 rounded-2xl border border-dashed border-(--line) bg-(--surface-panel-strong) p-4">
        <div className="h-3 w-32 rounded-full bg-(--surface-inset)" />
        <div className="mt-3 h-4 w-44 rounded-full bg-(--surface-inset)" />
      </div>
      <div className="mt-6 h-11 w-36 rounded-full border border-black bg-(--accent-blue) opacity-70" />
    </article>
  );
}

function SurveyTakingSkeleton() {
  return (
    <div className="grid gap-6 lg:h-[calc(100svh-3rem)] lg:grid-rows-[auto_minmax(0,1fr)]">
      <div className="nav-glass sticky top-0 z-40 min-h-[4.5rem] rounded-b-3xl border-x border-b border-(--nav-glass-border) bg-(--nav-glass-bg) px-4 py-3 shadow-(--shadow-soft) sm:px-5">
        <div className="flex h-11 items-center justify-between gap-4">
          <div className="h-4 w-48 rounded-full bg-(--surface-inset)" />
          <div className="hidden h-11 w-36 rounded-full border border-black bg-(--accent-sand) opacity-70 sm:block" />
        </div>
      </div>

      <div className="grid min-h-0 gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="min-h-0 lg:h-full">
          <div className="flex h-full min-h-[20rem] flex-col rounded-[1.5rem] border border-(--line) bg-(--surface-panel) p-5 shadow-(--shadow-soft)">
            <div className="h-3 w-32 rounded-full bg-(--surface-inset)" />
            <div className="mt-5 h-12 w-24 rounded-full bg-(--surface-inset)" />
            <LoadingBar className="mt-5" />
            <div className="mt-6 grid flex-1 content-start gap-3">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="h-10 rounded-2xl border border-(--line) bg-(--surface-panel-strong)"
                />
              ))}
            </div>
          </div>
        </aside>

        <main className="min-h-0">
          <section className="flex h-full min-h-[28rem] flex-col rounded-[1.5rem] border border-(--line) bg-(--surface-panel) shadow-(--shadow-strong)">
            <div className="border-b border-(--line) px-6 py-4 sm:px-7">
              <div className="h-3 w-36 rounded-full bg-(--surface-inset)" />
              <div className="mt-5 h-10 w-5/6 rounded-full bg-(--surface-inset)" />
              <div className="mt-3 h-10 w-2/3 rounded-full bg-(--surface-inset)" />
            </div>
            <div className="grid flex-1 gap-3 px-6 py-5 sm:px-7">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="min-h-14 rounded-2xl border border-(--line) bg-(--surface-panel-strong)"
                />
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function LoadingHeaderSection({
  title,
  description,
}: Pick<SurveyLoadingFallbackProps, "title" | "description">) {
  return (
    <section
      className="clay-section mt-6 px-6 py-8 sm:px-8 sm:py-10"
      style={{ background: "var(--hero-gradient)" }}
    >
      <p className="clay-label">Loading</p>
      <h1 className="mt-4 font-display text-4xl text-(--ink) sm:text-5xl">
        {title}
      </h1>
      <p className="mt-5 max-w-3xl text-base leading-8 text-(--ink-soft)">
        {description}
      </p>
      <LoadingBar className="mt-7 max-w-md" />
    </section>
  );
}

export function SurveyChooserLoadingContent({
  title,
  description,
}: Pick<SurveyLoadingFallbackProps, "title" | "description">) {
  return (
    <>
      <LoadingHeaderSection title={title} description={description} />

      <section className="mt-4 grid gap-6 lg:grid-cols-2">
        <SurveyCardSkeleton />
        <SurveyCardSkeleton />
      </section>
    </>
  );
}

export function SurveyLoadingFallback({
  title,
  description,
  variant = "chooser",
}: SurveyLoadingFallbackProps) {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="mx-auto min-h-screen w-full max-w-[1440px] px-6 pt-0 pb-16 sm:px-10 lg:px-12"
    >
      {variant === "survey" ? (
        <>
          <LoadingHeaderSection title={title} description={description} />
          <div className="mt-6">
            <SurveyTakingSkeleton />
          </div>
        </>
      ) : (
        <SurveyChooserLoadingContent title={title} description={description} />
      )}
    </main>
  );
}
