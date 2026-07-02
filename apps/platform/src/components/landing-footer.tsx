"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { StartSurveyButton } from "@/components/auth/start-survey-button";
import { ThemeModeToggle } from "@/components/theme-mode-toggle";
import { routes } from "@/lib/routes";

type NavLink = { label: string; href: string; external?: boolean };
type NavColumn = { heading: string; links: NavLink[] };

const NAV_COLUMNS: NavColumn[] = [
  {
    heading: "Survey",
    links: [
      { label: "Personality", href: routes.surveys },
      { label: "Values & Beliefs", href: routes.surveys },
      { label: "Start survey", href: routes.surveys },
    ],
  },
  {
    heading: "Research",
    links: [
      { label: "AMBI paper", href: "https://doi.org/10.1016/j.jrp.2010.01.002", external: true },
      { label: "Tal Yarkoni", href: "https://talyarkoni.org", external: true },
      { label: "Big Five model", href: "https://en.wikipedia.org/wiki/Big_Five_personality_traits", external: true },
    ],
  },
  {
    heading: "Project",
    links: [
      { label: "GitHub", href: "https://github.com/ciaobang/surveys", external: true },
      { label: "Join Slack", href: "https://join.slack.com/t/ciaobang/shared_invite/zt-3wywab1kx-Bv0ttYA93npMA0qtoUgEmA", external: true },
      { label: "Star the repo", href: "https://github.com/ciaobang/surveys/stargazers", external: true },
    ],
  },
];

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .322.216.694.825.576C20.565 21.795 24 17.298 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

const SIGN_IN_ROUTE = "/sign-in";

export function LandingFooter() {
  // Session resolves client-side on the static landing page; default to the
  // signed-out CTA until it does.
  const { user } = useAuth();
  const isSignedIn = Boolean(user);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const htmlElement = document.documentElement;
    const initialTheme = (htmlElement.dataset.theme || "light") as "light" | "dark";
    setTheme(initialTheme);

    const observer = new MutationObserver(() => {
      const newTheme = (htmlElement.dataset.theme || "light") as "light" | "dark";
      setTheme(newTheme);
    });

    observer.observe(htmlElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => observer.disconnect();
  }, []);

  const footerImage = theme === "dark" ? "/footer-bg-dark.webp" : "/footer-bg-light.webp";

  return (
    <footer className="mt-6">
      {/* Landscape container with the tulip image */}
      <div
        className="relative min-h-[60rem] w-full overflow-hidden rounded-t-3xl border border-(--line) shadow-(--shadow-soft)"
        style={{
          background: `var(--surface-panel) url('${footerImage}') no-repeat center bottom / cover`,
        }}
      >
        {/* White card pinned to the upper (white-sky) zone of the image. On
            mobile it flows in-place and grows to fit all content; on large
            screens it pins to the top corner and the compact horizontal
            layout keeps it short. */}
        <div className="relative mx-4 mt-10 rounded-2xl border border-(--line) bg-[#f5f3ef] px-5 py-6 [html[data-theme='dark']_&]:bg-[#202322] sm:mx-12 sm:mt-12 sm:px-7 sm:py-7">

          {/* Waving-hand animation for the Ciao! logo */}
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes ciaoHandWave {
              0%   { transform: rotate(0deg) scale(1); }
              10%  { transform: rotate(35deg) scale(1.08); }
              20%  { transform: rotate(-25deg) scale(0.95); }
              30%  { transform: rotate(40deg) scale(1.1); }
              40%  { transform: rotate(-15deg) scale(0.98); }
              50%  { transform: rotate(30deg) scale(1.06); }
              60%  { transform: rotate(0deg) scale(1); }
              100% { transform: rotate(0deg) scale(1); }
            }
            .ciao-hand-wave {
              animation: ciaoHandWave 1.5s ease-in-out infinite;
              transform-origin: 70% 70%;
              display: inline-block;
            }
          ` }} />

          {/* Top row: tagline + CTAs | logo. On mobile the tagline spans the
              full width while the buttons share a single row with the logo +
              theme toggle (two rows total); on large screens it splits into the
              classic two columns. */}
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-5 lg:flex-nowrap lg:items-stretch lg:gap-6">
            {/* Left group. `contents` flattens this wrapper on mobile so the
                tagline and buttons wrap independently; on lg it becomes the
                left column with the tagline stacked over the buttons. */}
            <div className="contents lg:flex lg:flex-col lg:text-left">
              <p className="w-full text-center font-display text-2xl font-bold leading-snug text-[#111] [html[data-theme='dark']_&]:text-[#f5f3ef] sm:text-3xl lg:mx-0 lg:w-auto lg:max-w-sm lg:text-left">
                Measure your personality.<br />Understand your beliefs.
              </p>

              <div className="flex flex-nowrap items-center gap-1.5 lg:mt-5 lg:flex-wrap lg:justify-start lg:gap-3">
                {isSignedIn ? (
                  <StartSurveyButton
                    className="inline-flex h-9 items-center gap-1 whitespace-nowrap rounded-full bg-black px-2.5 text-[11px] font-semibold text-white transition hover:bg-neutral-800 lg:h-10 lg:gap-2 lg:px-6 lg:text-sm"
                  >
                    Start a survey →
                  </StartSurveyButton>
                ) : (
                  <a
                    href={SIGN_IN_ROUTE}
                    className="inline-flex h-9 items-center gap-1 whitespace-nowrap rounded-full bg-black px-2.5 text-[11px] font-semibold text-white transition hover:bg-neutral-800 lg:h-10 lg:gap-2 lg:px-6 lg:text-sm"
                  >
                    Sign in to start →
                  </a>
                )}
                <a
                  href="https://github.com/ciaobang/surveys"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Star on GitHub"
                  className="inline-flex h-9 w-9 items-center justify-center whitespace-nowrap rounded-full border border-neutral-300 bg-white text-xs font-semibold text-[#111] transition hover:border-neutral-400 lg:h-10 lg:w-auto lg:gap-2 lg:px-6 lg:text-sm"
                >
                  <GitHubIcon />
                  <span className="hidden lg:inline">Star on GitHub</span>
                </a>
              </div>
            </div>

            {/* Right: Ciao! text with animated waving hand + theme toggle */}
            <div className="flex shrink-0 flex-col items-end justify-start gap-1.5 lg:gap-2 lg:justify-between">
              <div className="flex items-center gap-1.5 lg:gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={theme === "dark" ? "/ciao-sparkle-dark.svg" : "/ciao-sparkle.svg"}
                  alt=""
                  aria-hidden="true"
                  className="ciao-hand-wave h-8 w-8 lg:h-14 lg:w-14"
                  style={{ objectFit: "contain" }}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/ciao-text.png"
                  alt="Ciao!"
                  className="h-8 w-auto lg:h-14"
                  style={{ filter: theme === "dark" ? "invert(1)" : "none" }}
                />
              </div>
              <ThemeModeToggle />
            </div>
          </div>

          {/* Divider */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-4"/>

          {/* Nav columns */}
          <div className="grid grid-cols-3 gap-3 text-center sm:gap-6 sm:text-left">
            {NAV_COLUMNS.map((col) => (
              <div key={col.heading}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500 [html[data-theme='dark']_&]:text-neutral-400">
                  {col.heading}
                </p>
                <ul className="mt-3 space-y-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-neutral-600 transition hover:text-neutral-900 [html[data-theme='dark']_&]:text-neutral-300 [html[data-theme='dark']_&]:hover:text-neutral-100"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-sm text-neutral-600 transition hover:text-neutral-900 [html[data-theme='dark']_&]:text-neutral-300 [html[data-theme='dark']_&]:hover:text-neutral-100"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="mt-5 flex flex-col items-center gap-2 border-t border-neutral-200 pt-4 text-center sm:flex-row sm:flex-wrap sm:justify-between sm:gap-3 sm:text-left">
            <p className="text-xs text-neutral-400 [html[data-theme='dark']_&]:text-neutral-500">
              Ciao! — Personality and Beliefs Survey
            </p>
            <a
              href="https://github.com/ciaobang/surveys"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-neutral-400 transition hover:text-neutral-600"
            >
              <GitHubIcon />
              ciaobang/surveys
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
