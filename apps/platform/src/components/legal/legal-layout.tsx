import Link from "next/link";
import type { ReactNode } from "react";

import { LEGAL_ROUTES, routes, type LegalRoute } from "@/lib/routes";

export function LegalLayout({
  title,
  lastUpdated,
  effectiveDate,
  currentPath,
  children,
}: {
  title: string;
  lastUpdated: string;
  effectiveDate?: string;
  currentPath: LegalRoute;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-(--surface) text-(--ink)">
      <header className="sticky top-0 z-30 border-b border-(--line) bg-(--surface-panel) backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-8">
          <Link
            href={routes.home}
            className="font-semibold tracking-tight text-(--ink) hover:opacity-80"
          >
            Ciao!
          </Link>
          <nav className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 sm:mx-0 sm:gap-2 sm:px-0">
            {LEGAL_ROUTES.map((link) => {
              const active = link.href === currentPath;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={
                    "shrink-0 rounded-full px-3 py-1.5 text-xs whitespace-nowrap transition-colors sm:text-sm " +
                    (active
                      ? "bg-(--surface-inset) font-semibold text-(--ink)"
                      : "text-(--ink-soft) hover:text-(--ink)")
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-8 sm:py-14">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 text-sm text-(--muted)">
          Last Updated: {lastUpdated}
          {effectiveDate ? ` · Effective Date: ${effectiveDate}` : ""}
        </p>
        <div className="legal-prose mt-8 space-y-6 text-(--ink-soft)">{children}</div>
        <footer className="mt-14 flex flex-wrap gap-x-6 gap-y-2 border-t border-(--line) pt-6 text-sm text-(--muted)">
          <Link href={routes.home} className="hover:text-(--ink)">
            ← Back to Ciao!
          </Link>
          <Link href={routes.chat} className="hover:text-(--ink)">
            Back to chat
          </Link>
        </footer>
      </main>
    </div>
  );
}
