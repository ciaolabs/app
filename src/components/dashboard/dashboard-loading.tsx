export function DashboardLoading() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-[1440px] px-6 pt-0 pb-16 sm:px-10 lg:px-12">
      <div className="mt-6 space-y-6">
        <div className="loading-skeleton h-12 w-72 rounded-2xl" />

        <section
          className="overflow-hidden rounded-[2.5rem] border border-[var(--line)] bg-[var(--surface-panel)] px-5 py-6 shadow-[var(--shadow-soft)] sm:px-8 sm:py-8"
        >
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_22rem] xl:items-start">
            <div className="space-y-4">
              <div className="loading-skeleton h-3 w-32 rounded-full" />
              <div className="loading-skeleton h-12 w-3/4 rounded-2xl" />
              <div className="loading-skeleton h-3 w-full rounded-full" />
              <div className="loading-skeleton h-3 w-5/6 rounded-full" />
              <div className="loading-skeleton h-3 w-4/6 rounded-full" />
            </div>
            <div className="space-y-4 rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-panel-strong)] p-5">
              <div className="loading-skeleton h-3 w-24 rounded-full" />
              <div className="loading-skeleton h-7 w-48 rounded-xl" />
              <div className="loading-skeleton h-3 w-full rounded-full" />
              <div className="flex gap-2">
                <div className="loading-skeleton h-9 w-32 rounded-full" />
                <div className="loading-skeleton h-9 w-32 rounded-full" />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-panel)] px-5 py-6 shadow-[var(--shadow-soft)] sm:px-6">
          <div className="loading-skeleton h-8 w-40 rounded-xl" />
          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <div className="loading-skeleton h-5 w-3/5 rounded-lg" />
                <div className="loading-skeleton h-12 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-panel)] px-5 py-6 shadow-[var(--shadow-soft)] sm:px-6 sm:py-7">
          <div className="loading-skeleton h-7 w-64 rounded-xl" />
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <div className="loading-skeleton h-32 w-full rounded-2xl" />
                <div className="loading-skeleton h-3 w-3/4 rounded-full" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
