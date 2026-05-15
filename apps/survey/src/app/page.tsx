import { StartSurveyButton } from "@/components/auth/start-survey-button";
import { LandingFooter } from "@/components/landing-footer";
import { LandingHeader } from "@/components/landing-header";
import { SurveyPreview } from "@/components/home/survey-preview";
import { HeroLottieBackground } from "@/components/home/hero-lottie-bg";
import { getCurrentUserId } from "@/lib/auth";

const SIGN_IN_ROUTE = "/sign-in";

export default async function HomePage() {
  const isSignedIn = Boolean(await getCurrentUserId());
  const signInUrl = isSignedIn ? null : SIGN_IN_ROUTE;

  return (
    <>
      <LandingHeader isSignedIn={isSignedIn} signInHref={signInUrl ?? "/"} />
      <main className="mx-auto flex min-h-screen w-full max-w-[min(1800px,calc(100vw-2rem))] flex-col px-4 pt-0 sm:max-w-[min(1800px,calc(100vw-3rem))] sm:px-8 lg:max-w-[min(1800px,calc(100vw-4rem))] lg:px-10 xl:px-12 2xl:max-w-[min(1900px,calc(100vw-5rem))] 2xl:px-14">
        <section
        className="hero-sun relative mt-6 overflow-hidden rounded-3xl border-2 border-black px-4 py-10 shadow-(--shadow-soft) [html[data-theme='dark']_&]:border-[#0a0907] sm:px-8 sm:py-14 lg:px-10 lg:py-16"
      >
        <HeroLottieBackground />

        <div className="relative">
          <div className="flex flex-col items-center text-center">
            <h1 className="max-w-5xl font-display text-5xl font-black leading-tight text-(--ink) [html[data-theme='dark']_&]:text-[#1a1815] sm:text-6xl lg:text-7xl">
              A closer read of <em className="italic">who you are</em>, one question at a time.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-(--ink-soft) sm:text-xl">
              Surveys to discover your personality and beliefs.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {isSignedIn ? (
                <StartSurveyButton
                  className="clay-button-hover inline-flex h-12 items-center gap-2 rounded-full border border-black bg-(--accent-blue) px-6 text-sm font-semibold text-(--selected-contrast) shadow-(--shadow-soft)"
                >
                  Start a survey →
                </StartSurveyButton>
              ) : (
                <a
                  href={signInUrl ?? "#"}
                  className="clay-button-hover inline-flex h-12 items-center gap-2 rounded-full border border-black bg-(--accent-blue) px-6 text-sm font-semibold text-(--selected-contrast) shadow-(--shadow-soft)"
                >
                  Sign in to start →
                </a>
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

        <LandingFooter isSignedIn={isSignedIn} signInHref={signInUrl ?? "/"} />
      </main>
    </>
  );
}
