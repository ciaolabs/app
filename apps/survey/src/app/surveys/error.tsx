"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function SurveysError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-[1440px] px-6 pt-0 pb-16 sm:px-10 lg:px-12">
      <section
        className="clay-section mt-6 px-6 py-8 sm:px-8 sm:py-10"
        style={{ background: "var(--hero-gradient)" }}
      >
        <p className="clay-label">Survey unavailable</p>
        <h1 className="mt-4 font-display text-4xl text-(--ink) sm:text-5xl">
          We could not load your survey workspace.
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-(--ink-soft)">
          The survey database is not accepting connections right now. Your previous answers are
          safest left untouched until the connection is restored.
        </p>
        {error.digest ? (
          <p className="mt-4 text-sm font-semibold text-(--muted)">Digest: {error.digest}</p>
        ) : null}
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={reset}
            className="clay-button-hover h-11 rounded-full border border-black bg-(--accent-blue) px-5 text-(--selected-contrast) shadow-(--shadow-soft)"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
          <Button
            asChild
            variant="outline"
            className="clay-button-hover h-11 rounded-full px-5 shadow-(--shadow-soft)"
          >
            <Link href="/">Back home</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
