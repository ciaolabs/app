import Link from "next/link";
import { SignIn, SignInButton } from "@clerk/nextjs";

import { SurveyPreview } from "@/components/home/survey-preview";
import { SiteTopNav } from "@/components/site-top-nav";
import { getCurrentUserId } from "@/lib/auth";
import { clerkSignInAppearance } from "@/lib/clerk";
import { isClerkConfigured } from "@/lib/clerk.server";
import { SURVEYS_ROUTE } from "@/lib/survey/routes";

function primaryActionClassName() {
  return "clay-button-hover inline-flex h-11 items-center justify-center rounded-full border border-black bg-[var(--accent-blue)] px-5 text-sm font-semibold text-[var(--selected-contrast)] shadow-[var(--shadow-soft)]";
}

export default async function HomePage() {
  const clerkConfigured = isClerkConfigured();
  const isSignedIn = Boolean(await getCurrentUserId());

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-6 pb-16 pt-0 sm:px-10 lg:px-12">
      <SiteTopNav
        helpHref="https://doi.org/10.1016/j.jrp.2010.01.002"
        action={
          isSignedIn ? (
            <Link href={SURVEYS_ROUTE} className={primaryActionClassName()}>
              New Surveys
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
        className="clay-section relative mt-6 overflow-hidden px-4 py-8 sm:px-8 sm:py-12 lg:px-10 lg:py-12"
        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(238,233,223,0.72) 46%, rgba(132,231,165,0.2))" }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[18rem] opacity-80"
          style={{ backgroundImage: "var(--hero-spotlight)" }}
        />

        <div className="relative">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(24rem,0.52fr)] lg:items-end">
            <div className="max-w-4xl">
              <p className="clay-label">
                Multiple Measures of Personality
              </p>
              <h1 className="mt-5 font-display text-4xl leading-[0.94] text-[var(--ink)] sm:text-6xl lg:text-7xl xl:text-8xl">
                A survey surface that feels like the product, before the first answer.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--ink-soft)] sm:text-lg">
                Try the fake canvas below: switch between the personality and values surveys, answer
                sample prompts, and watch the progress rail behave like the real intake flow.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <a
                  href="https://doi.org/10.1016/j.jrp.2010.01.002"
                  target="_blank"
                  rel="noreferrer"
                  className="clay-button-hover rounded-full border border-[var(--line-strong)] bg-[var(--surface-panel-strong)] px-6 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--ink)] shadow-[var(--shadow-soft)]"
                >
                  Read the paper
                </a>
                {isSignedIn ? (
                  <Link
                    href={SURVEYS_ROUTE}
                    className="clay-button-hover rounded-full border border-[var(--line-strong)] bg-[var(--surface-panel-strong)] px-6 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--ink)] shadow-[var(--shadow-soft)]"
                  >
                    Open your surveys
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="hidden gap-4 sm:grid-cols-3 lg:grid lg:grid-cols-1">
              {[
                ["181", "personality prompts"],
                ["156", "values and beliefs prompts"],
                ["1-6", "keyboard-ready answer scale"],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-soft)] backdrop-blur"
                >
                  <p className="font-display text-4xl leading-none text-[var(--ink)]">{value}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10">
            <SurveyPreview />
          </div>

          {!isSignedIn ? (
            <div
              id="auth-panel"
              className="mt-8 rounded-[2rem] border border-[var(--line)] bg-[var(--surface-panel)] px-5 py-8 shadow-[var(--shadow-soft)] backdrop-blur sm:px-7 lg:px-8 lg:py-10"
            >
              <div className="mx-auto w-full max-w-[34rem] rounded-[1.5rem] border border-[var(--line-strong)] bg-[var(--surface-panel-strong)] p-6 shadow-[var(--shadow-strong)]">
                <div className="mb-5">
                  <p className="clay-label">
                    Sign in to start
                  </p>
                  <h2 className="mt-3 font-display text-4xl text-[var(--ink)]">
                    Your account sits inside the same survey canvas.
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                    Use GitHub, Google, LinkedIn, or email and password to save progress and continue
                    directly into the AMBI survey.
                  </p>
                </div>

                {clerkConfigured ? (
                  <SignIn
                    routing="hash"
                    fallbackRedirectUrl="/surveys"
                    forceRedirectUrl="/surveys"
                    withSignUp
                    appearance={clerkSignInAppearance}
                  />
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-[var(--line-strong)] bg-[var(--surface-panel)] p-6">
                    <p className="clay-label">
                      Clerk setup needed
                    </p>
                    <h2 className="mt-3 font-display text-3xl text-[var(--ink)]">
                      Add your Clerk keys to enable sign-in.
                    </h2>
                    <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
                      Set <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and{" "}
                      <code>CLERK_SECRET_KEY</code>, then enable GitHub, Google, LinkedIn, and
                      email/password in the Clerk dashboard.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
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
            className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-soft)]"
          >
            <p className="clay-label">
              Feature
            </p>
            <h2 className="mt-4 font-display text-3xl text-[var(--ink)]">{feature.title}</h2>
            <p className="mt-4 text-base leading-8 text-[var(--ink-soft)]">{feature.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-auto rounded-[2.5rem] border border-[var(--line)] bg-[var(--surface-panel-strong)] px-6 py-8 shadow-[var(--shadow-soft)] sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-center">
          <div>
            <p className="clay-label">
              Important note
            </p>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--ink-soft)]">
              Results in later phases are for informational purposes only and are not psychological or
              medical advice. This product focuses on survey completion, draft persistence, and a
              source-backed AMBI dashboard that helps respondents inspect their score profile.
            </p>
          </div>
          {isSignedIn ? (
            <div className="flex justify-start lg:justify-end">
              <Link
                href={SURVEYS_ROUTE}
                className="clay-button-hover rounded-full border border-[var(--line-strong)] bg-[var(--surface-panel)] px-6 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--ink)] shadow-[var(--shadow-soft)]"
              >
                Continue to surveys
              </Link>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
