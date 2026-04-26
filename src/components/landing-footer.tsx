"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { SURVEYS_ROUTE } from "@/lib/survey/routes";

type NavLink = { label: string; href: string; external?: boolean };
type NavColumn = { heading: string; links: NavLink[] };

const NAV_COLUMNS: NavColumn[] = [
  {
    heading: "Survey",
    links: [
      { label: "Personality", href: SURVEYS_ROUTE },
      { label: "Values & Beliefs", href: SURVEYS_ROUTE },
      { label: "Start survey", href: SURVEYS_ROUTE },
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
      { label: "Open an issue", href: "https://github.com/ciaobang/surveys/issues", external: true },
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

export function LandingFooter({ isSignedIn }: { isSignedIn: boolean }) {
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
        className="relative h-[759px] w-full overflow-hidden rounded-t-[1.5rem] border border-[var(--line)] shadow-[var(--shadow-soft)] [html[data-theme='dark']_&]:border-[var(--line)]"
        style={{
          background: `var(--surface-panel) url('${footerImage}') no-repeat center top / cover`,
        }}
      >
        {/* White card pinned to the upper (white-sky) zone of the image */}
        <div className="absolute inset-x-10 top-10 max-h-[400px] overflow-hidden rounded-[1rem] border border-[var(--line)] bg-[#f5f3ef] px-6 py-6 [html[data-theme='dark']_&]:bg-[#4B463F] sm:inset-x-12 sm:top-12 sm:px-7 sm:py-7">

          {/* Top row: tagline + CTAs | logo */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            {/* Left: tagline + buttons */}
            <div>
              <p className="max-w-sm font-display text-2xl font-bold leading-snug text-[#111] [html[data-theme='dark']_&]:text-[#f5f3ef] sm:text-3xl">
                Measure your personality.<br />Understand your beliefs.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                {isSignedIn ? (
                  <Link
                    href={SURVEYS_ROUTE}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-black px-6 text-sm font-semibold text-white transition hover:bg-neutral-800"
                  >
                    Start a survey →
                  </Link>
                ) : (
                  <Link
                    href="/#auth-panel"
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-black px-6 text-sm font-semibold text-white transition hover:bg-neutral-800"
                  >
                    Start a survey →
                  </Link>
                )}
                <a
                  href="https://github.com/ciaobang/surveys"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-neutral-300 bg-white px-6 text-sm font-semibold text-[#111] transition hover:border-neutral-400"
                >
                  <GitHubIcon />
                  Star on GitHub
                </a>
              </div>
            </div>

            {/* Right: Ciao! icon */}
            <div className="flex shrink-0 items-center gap-3">
              <Image
                src="/ciao-icon.png"
                alt="Ciao!"
                width={60}
                height={60}
                className="rounded-[0.75rem]"
              />
              <span className="font-display text-xl font-bold text-[#111] [html[data-theme='dark']_&]:text-[#f5f3ef]">Ciao!</span>
            </div>
          </div>

          {/* Divider */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-4"/>

          {/* Nav columns */}
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
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
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-4">
            <p className="text-xs text-neutral-400 [html[data-theme='dark']_&]:text-neutral-500">
              © AMBI Survey {new Date().getFullYear()} — Built on Tal Yarkoni&apos;s{" "}
              <a
                href="https://doi.org/10.1016/j.jrp.2010.01.002"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 hover:text-neutral-600"
              >
                abbreviated personality inventory
              </a>
              .
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
