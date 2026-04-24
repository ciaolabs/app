import Link from "next/link";
import { SignIn, SignInButton } from "@clerk/nextjs";

import { SiteTopNav } from "@/components/site-top-nav";
import { getCurrentUserId } from "@/lib/auth";
import { clerkSignInAppearance } from "@/lib/clerk";
import { isClerkConfigured } from "@/lib/clerk.server";
import { QUESTION_COUNT } from "@/lib/survey/constants";
import { SURVEYS_ROUTE } from "@/lib/survey/routes";

function primaryActionClassName() {
  return "inline-flex h-11 items-center justify-center rounded-full bg-[var(--accent-blue)] px-5 text-sm font-semibold text-[var(--selected-contrast)] transition hover:brightness-105";
}

export default async function HomePage() {
  const clerkConfigured = isClerkConfigured();
  const isSignedIn = Boolean(await getCurrentUserId());

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-6 pb-16 pt-4 sm:px-10 lg:px-12">
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
        className="relative mt-4 overflow-hidden rounded-[2.8rem] border border-[var(--line)] px-6 py-10 shadow-[var(--shadow-strong)] sm:px-10 sm:py-14 lg:px-14 lg:py-16"
        style={{ background: "var(--hero-gradient)" }}
      >
        <div
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] lg:block"
          style={{ backgroundImage: "var(--hero-spotlight)" }}
        />

        <div
          className="relative grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.92fr)] lg:items-stretch"
        >
          <div className="flex flex-col justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
                Multiple Measures of Personality
              </p>
              <h1 className="mt-5 font-display text-5xl leading-[0.94] text-[var(--ink)] sm:text-6xl lg:text-7xl">
                A research-forward survey interface for the 181-item AMBI inventory.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--ink-soft)]">
                This MVP recreates the intake phase of Tal Yarkoni&apos;s abbreviated personality survey:
                one statement at a time, a visible response pattern after each choice, and a persistent
                editable log so respondents never lose their place.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <a
                  href="https://doi.org/10.1016/j.jrp.2010.01.002"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[var(--line)] bg-[var(--surface-panel)] px-6 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--ink)] transition hover:border-[var(--line-strong)]"
                >
                  Read the paper
                </a>
                {isSignedIn ? (
                  <Link
                    href={SURVEYS_ROUTE}
                    className="rounded-full border border-[var(--line)] bg-[var(--surface-panel)] px-6 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--ink)] transition hover:border-[var(--line-strong)] hover:text-[var(--accent-coral)]"
                  >
                    Open your surveys
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                {
                  title: "One account",
                  body: "Your draft and the latest submitted response set stay attached to you.",
                },
                {
                  title: "Fast return",
                  body: "Pick up where you left off instead of relying on a single browser cookie.",
                },
                {
                  title: "Flexible sign-in",
                  body: "Choose GitHub, Google, LinkedIn, or email and password inside the same branded surface.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.8rem] border border-[var(--line)] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-soft)] backdrop-blur"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                    {item.title}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {isSignedIn ? (
            <div className="grid gap-4 rounded-[2.2rem] border border-[var(--line)] bg-[var(--surface-panel)] p-6 backdrop-blur">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Survey scope
                </p>
                <p className="mt-3 font-display text-4xl text-[var(--ink)]">{QUESTION_COUNT}</p>
                <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
                  public-domain prompts across multiple personality frameworks
                </p>
              </div>
              <div className="h-px bg-[var(--line)]" />
              <div className="text-sm leading-7 text-[var(--ink-soft)]">
                Expect 15 to 30 minutes for a full pass. Answers autosave to the signed-in account and
                the submit action opens a scored dashboard with AMBI-based rankings and framework
                breakdowns.
              </div>
            </div>
          ) : null}

          {!isSignedIn ? (
            <div
              id="auth-panel"
              className="border-t border-[var(--line)] bg-[var(--surface-panel)] px-5 py-8 backdrop-blur sm:px-7 lg:-my-16 lg:-mr-14 lg:-ml-2 lg:border-t-0 lg:border-l lg:px-8 lg:py-10"
            >
              <div className="mx-auto w-full max-w-[34rem] rounded-[2.2rem] border border-[var(--line)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-strong)]">
                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
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
                  <div className="rounded-[2rem] border border-dashed border-[var(--line-strong)] bg-[var(--surface-panel-strong)] p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
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
            className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-soft)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
              Feature
            </p>
            <h2 className="mt-4 font-display text-3xl text-[var(--ink)]">{feature.title}</h2>
            <p className="mt-4 text-base leading-8 text-[var(--ink-soft)]">{feature.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-auto rounded-[2.2rem] border border-[var(--line)] bg-[var(--surface-panel-strong)] px-6 py-8 shadow-[var(--shadow-soft)] sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
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
                className="rounded-full border border-[var(--line)] bg-[var(--surface-panel)] px-6 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--ink)] transition hover:border-[var(--line-strong)] hover:text-[var(--accent-coral)]"
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
