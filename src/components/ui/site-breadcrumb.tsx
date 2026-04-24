"use client";

import Link from "next/link";

type SiteBreadcrumbProps = {
  title?: string;
  items?: Array<{
    label: string;
    href?: string;
  }>;
};

function HomeIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
      <path
        d="M3.5 9.2 10 4l6.5 5.2v6.3a1 1 0 0 1-1 1h-3.7V12h-3.6v4.5H4.5a1 1 0 0 1-1-1Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
      <path
        d="m6.25 3.5 4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

export function SiteBreadcrumb({ title, items }: SiteBreadcrumbProps) {
  const breadcrumbItems = items ?? (title ? [{ label: title }] : []);

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex min-h-11 min-w-0 w-full max-w-full items-center gap-2 overflow-hidden rounded-full border border-[var(--line)] bg-[var(--surface-panel-strong)] px-3 py-1.5 text-sm font-semibold text-[var(--ink)] lg:inline-flex lg:w-auto"
    >
      <Link
        href="/"
        aria-label="Home"
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--home-crumb-button-bg)] text-[var(--ink)] transition hover:border-[var(--line-strong)] hover:bg-[var(--home-crumb-button-bg)]"
      >
        <HomeIcon />
      </Link>
      {breadcrumbItems.map((item, index) => (
        <span key={`${item.label}-${index}`} className="inline-flex min-w-0 flex-shrink items-center gap-2 overflow-hidden">
          <span className="shrink-0 text-[var(--muted)]">
            <ChevronRightIcon />
          </span>
          <span className="min-w-0 flex-1 overflow-hidden">
            <span className="group relative block max-w-full overflow-hidden">
              {item.href ? (
                <Link
                  href={item.href}
                  className="block max-w-full truncate text-[var(--ink)] transition hover:text-[var(--accent-coral)]"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="block max-w-full truncate pr-1 text-[var(--ink)]">
                  {item.label}
                </span>
              )}
              <span className="pointer-events-none absolute left-1/2 top-full mt-2 hidden max-w-[18rem] -translate-x-1/2 overflow-hidden truncate whitespace-nowrap rounded-full border border-[var(--line)] bg-[var(--surface-panel-strong)] px-4 py-2 text-xs text-[var(--ink)] shadow-[0_12px_30px_rgba(38,38,36,0.08)] opacity-0 transition duration-150 ease-out group-hover:block group-hover:opacity-100">
                {item.label}
              </span>
            </span>
          </span>
        </span>
      ))}
    </nav>
  );
}
