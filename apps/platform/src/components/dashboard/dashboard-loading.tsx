function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`loading-skeleton ${className}`} />;
}

function NavSkeleton() {
  return (
    <header className="nav-glass sticky top-0 z-40 rounded-b-3xl border-x border-b border-[var(--nav-glass-border)] bg-[var(--nav-glass-bg)] px-4 py-3 shadow-[var(--shadow-soft)] sm:px-5">
      <div className="flex min-w-0 items-center gap-2 pr-12 sm:gap-3 lg:pr-0">
        <Skeleton className="h-4 w-48 rounded-full sm:w-64" />

        <div className="hidden flex-1 items-center justify-end gap-2 lg:flex">
          <Skeleton className="h-11 w-11 rounded-full" />
          <Skeleton className="h-11 w-11 rounded-full" />
          <Skeleton className="h-11 w-11 rounded-full" />
          <Skeleton className="h-11 w-40 rounded-full" />
        </div>

        <div className="absolute right-4 top-3 shrink-0 sm:right-5 lg:hidden">
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
    </header>
  );
}

function HeroSkeleton() {
  return (
    <section className="hero-sun-surveys clay-section overflow-hidden px-5 pb-6 pt-16 sm:px-8 sm:pb-8 sm:pt-20 lg:pb-6 lg:pt-8">
      <div className="flex justify-center">
        <Skeleton className="h-6 w-32 rounded-full" />
      </div>

      <div className="mt-4 flex justify-center">
        <div
          className="w-full max-w-2xl rounded-2xl bg-[var(--surface-panel-strong)] px-6 py-3 sm:px-8 sm:py-4 lg:rounded-3xl lg:px-14 lg:py-6 xl:px-16 xl:py-8"
          style={{
            boxShadow:
              "0 12px 24px -10px rgba(20, 15, 10, 0.22), 0 3px 6px -2px rgba(20, 15, 10, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.95), inset 0 -2px 4px rgba(20, 15, 10, 0.04)",
          }}
        >
          <Skeleton className="mx-auto h-9 w-4/5 rounded-2xl lg:h-14" />
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-3">
        <Skeleton className="h-3 w-full max-w-3xl rounded-full" />
        <Skeleton className="h-3 w-11/12 max-w-2xl rounded-full" />
        <Skeleton className="h-3 w-3/4 max-w-xl rounded-full" />
      </div>

      <div className="mt-6 flex justify-center">
        <Skeleton className="h-10 w-36 rounded-full" />
      </div>

      <div className="mt-8 flex justify-center">
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
    </section>
  );
}

function RankingColumnSkeleton({ valueWidth }: { valueWidth: string }) {
  return (
    <div>
      <div className="flex justify-between gap-4 border-b border-[var(--line)] px-2 pb-2">
        <Skeleton className="h-3 w-24 rounded-full" />
        <Skeleton className={`h-3 ${valueWidth} rounded-full`} />
      </div>
      <div className="mt-2 space-y-1">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-[minmax(0,1fr)_3rem] items-center gap-2 px-2 py-1"
          >
            <div className="min-w-0 space-y-2">
              <Skeleton className="h-3 w-2/3 rounded-full" />
              <Skeleton className="h-7 w-full rounded-lg" />
            </div>
            <Skeleton className="ml-auto h-4 w-8 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoresSkeleton() {
  return (
    <section className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-panel)] px-5 py-6 shadow-[var(--shadow-soft)] sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-11 w-40 rounded-full" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)]">
        <RankingColumnSkeleton valueWidth="w-16" />
        <RankingColumnSkeleton valueWidth="w-32" />
      </div>
    </section>
  );
}

function TabStripSkeleton() {
  return (
    <section className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-panel)] px-4 py-3 shadow-[var(--shadow-soft)] sm:px-5">
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-11 w-28 rounded-full" />
        ))}
      </div>
    </section>
  );
}

function GaugeSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2">
      <Skeleton className="h-20 w-40 rounded-t-full" />
      <Skeleton className="-mt-6 h-9 w-14 rounded-lg" />
      <Skeleton className="h-4 w-16 rounded-full" />
      <Skeleton className="mt-1 h-5 w-32 rounded-full" />
    </div>
  );
}

function DetailBarsSkeleton() {
  return (
    <div className="divide-y divide-[var(--line)] rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-panel)] shadow-[var(--shadow-soft)]">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="grid gap-3 px-4 py-3 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-center"
        >
          <div className="space-y-2">
            <Skeleton className="h-4 w-2/5 rounded-full" />
            <Skeleton className="h-3 w-5/6 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="ml-auto h-4 w-12 rounded-full" />
            <Skeleton className="h-7 w-full rounded-lg" />
            <Skeleton className="ml-auto h-3 w-40 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function FrameworkPanelSkeleton() {
  return (
    <section className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-panel)] px-5 py-6 shadow-[var(--shadow-soft)] sm:px-6 sm:py-7">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-center">
        <Skeleton className="h-3 w-56 rounded-full" />
        <Skeleton className="h-9 w-80 max-w-full rounded-xl" />
        <Skeleton className="h-3 w-full max-w-2xl rounded-full" />
      </div>

      <div className="mx-auto mt-8 grid max-w-6xl gap-8 sm:grid-cols-2 xl:grid-cols-3">
        <GaugeSkeleton />
        <GaugeSkeleton />
        <GaugeSkeleton />
      </div>

      <div className="mx-auto mt-10 max-w-6xl space-y-3">
        <Skeleton className="h-3 w-full rounded-full" />
        <Skeleton className="h-3 w-11/12 rounded-full" />
        <Skeleton className="h-3 w-3/4 rounded-full" />
      </div>

      <div className="mx-auto mt-7 max-w-6xl">
        <DetailBarsSkeleton />
      </div>
    </section>
  );
}

function ReferencesSkeleton() {
  return (
    <section className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-panel)] px-5 py-6 shadow-[var(--shadow-soft)] sm:px-6 sm:py-7">
      <Skeleton className="h-3 w-full max-w-xl rounded-full" />
      <div className="mt-5 space-y-3">
        <Skeleton className="h-3 w-full rounded-full" />
        <Skeleton className="h-3 w-4/5 rounded-full" />
      </div>
    </section>
  );
}

export function DashboardLoading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="mx-auto min-h-screen w-full max-w-[1440px] px-6 pt-0 pb-16 sm:px-10 lg:px-12"
    >
      <NavSkeleton />
      <div className="mt-6 space-y-6">
        <HeroSkeleton />
        <ScoresSkeleton />
        <TabStripSkeleton />
        <FrameworkPanelSkeleton />
        <ReferencesSkeleton />
      </div>
    </main>
  );
}
