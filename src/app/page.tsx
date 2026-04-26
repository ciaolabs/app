import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";

import { LandingFooter } from "@/components/landing-footer";
import { SurveyPreview } from "@/components/home/survey-preview";
import { SiteTopNav } from "@/components/site-top-nav";
import { getCurrentUserId } from "@/lib/auth";
import { clerkSignInAppearance } from "@/lib/clerk";
import { SURVEYS_ROUTE } from "@/lib/survey/routes";

function primaryActionClassName() {
  return "clay-button-hover inline-flex h-11 items-center justify-center rounded-full border border-black bg-(--accent-blue) px-5 text-sm font-semibold text-(--selected-contrast) shadow-(--shadow-soft)";
}

export default async function HomePage() {
  const isSignedIn = Boolean(await getCurrentUserId());

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-360 flex-col px-6 pt-0 sm:px-10 lg:px-12">
      <SiteTopNav
        helpHref="https://doi.org/10.1016/j.jrp.2010.01.002"
        action={
          isSignedIn ? (
            <Link href={SURVEYS_ROUTE} className={primaryActionClassName()}>
              Start a survey →
            </Link>
          ) : (
            <SignInButton
              mode="modal"
              withSignUp
              fallbackRedirectUrl={SURVEYS_ROUTE}
              forceRedirectUrl={SURVEYS_ROUTE}
              appearance={clerkSignInAppearance}
            >
              <button type="button" className={primaryActionClassName()}>
                Sign in to start
              </button>
            </SignInButton>
          )
        }
      />

      <section
        className="relative mt-6 overflow-hidden rounded-3xl border border-(--line-strong) px-4 py-10 shadow-(--shadow-soft) sm:px-8 sm:py-14 lg:px-10 lg:py-16"
        style={{ background: "var(--hero-gradient)" }}
      >
        {/* Floating colour blobs */}
        <div className="hero-blob hero-blob-1" aria-hidden="true" />
        <div className="hero-blob hero-blob-2" aria-hidden="true" />
        <div className="hero-blob hero-blob-3" aria-hidden="true" />

        <div className="relative">
          <div className="flex flex-col items-center text-center">
            <h1 className="max-w-5xl font-display text-5xl font-black leading-tight text-(--ink) sm:text-6xl lg:text-7xl">
              Surveys to discover your personality and beliefs.
            </h1>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {isSignedIn ? (
                <Link
                  href={SURVEYS_ROUTE}
                  className="clay-button-hover inline-flex h-12 items-center gap-2 rounded-full border border-black bg-(--accent-blue) px-6 text-sm font-semibold text-(--selected-contrast) shadow-(--shadow-soft)"
                >
                  Start a survey →
                </Link>
              ) : (
                <SignInButton
                  mode="modal"
                  withSignUp
                  fallbackRedirectUrl={SURVEYS_ROUTE}
                  forceRedirectUrl={SURVEYS_ROUTE}
                  appearance={clerkSignInAppearance}
                >
                  <button
                    type="button"
                    className="clay-button-hover inline-flex h-12 items-center gap-2 rounded-full border border-black bg-(--accent-blue) px-6 text-sm font-semibold text-(--selected-contrast) shadow-(--shadow-soft)"
                  >
                    Start a survey →
                  </button>
                </SignInButton>
              )}

              <a
                href="https://github.com/ciaobang/surveys"
                target="_blank"
                rel="noreferrer"
                className="clay-button-hover inline-flex h-12 items-center gap-2 rounded-full border border-(--line-strong) bg-(--surface-panel-strong) px-6 text-sm font-semibold text-(--ink) shadow-(--shadow-soft)"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .322.216.694.825.576C20.565 21.795 24 17.298 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                Star on GitHub
              </a>
            </div>
          </div>

          <div className="mt-10">
            <SurveyPreview />
          </div>
        </div>
      </section>

      <section className="grid gap-6 py-10 lg:grid-cols-3">
        {[
          {
            title: "One live prompt at a time",
            body: "The survey surface stays focused: a single statement, a six-point response ladder, and no hidden navigation traps.",
          },
          {
            title: "Violin plot feedback",
            body: "Each answer reveals a seeded comparison plot immediately so respondents see how the broader pattern bends around that item.",
          },
          {
            title: "Persistent editable log",
            body: "Every question remains visible in the sidebar with answered state and current rating, making revisions frictionless.",
          },
        ].map((feature) => (
          <div
            key={feature.title}
            className="rounded-3xl border border-(--line) bg-(--surface-panel) p-6 shadow-(--shadow-soft)"
          >
            <p className="clay-label">
              Feature
            </p>
            <h2 className="mt-4 font-display text-3xl text-(--ink)">{feature.title}</h2>
            <p className="mt-4 text-base leading-8 text-(--ink-soft)">{feature.body}</p>
          </div>
        ))}
      </section>

      <LandingFooter isSignedIn={isSignedIn} />
    </main>
  );
}
