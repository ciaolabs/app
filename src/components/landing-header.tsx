"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { StartSurveyButton } from "@/components/auth/start-survey-button";

type LandingHeaderProps = {
  isSignedIn: boolean;
  signInHref?: string;
};

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .322.216.694.825.576C20.565 21.795 24 17.298 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

export function LandingHeader({ isSignedIn, signInHref = "/sign-in" }: LandingHeaderProps) {
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

  const ctaClassName =
    "clay-button-hover inline-flex h-11 items-center justify-center rounded-full border border-black bg-(--accent-blue) px-5 text-sm font-semibold text-(--selected-contrast) shadow-(--shadow-soft)";

  return (
    <header className="flex w-full items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ciaoHandWaveHeader {
          0%   { transform: rotate(0deg); }
          10%  { transform: rotate(14deg); }
          20%  { transform: rotate(-8deg); }
          30%  { transform: rotate(14deg); }
          40%  { transform: rotate(-4deg); }
          50%  { transform: rotate(10deg); }
          60%  { transform: rotate(0deg); }
          100% { transform: rotate(0deg); }
        }
        .ciao-header-wave {
          animation: ciaoHandWaveHeader 1.8s ease-in-out infinite;
          transform-origin: 70% 70%;
          display: inline-block;
        }
      ` }} />

      <Link href="/" aria-label="Ciao! home" className="flex shrink-0 items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={theme === "dark" ? "/ciao-sparkle-dark.svg" : "/ciao-sparkle.svg"}
          alt=""
          aria-hidden="true"
          className="ciao-header-wave"
          style={{ height: 44, width: 44, objectFit: "contain" }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/ciao-text.png"
          alt="Ciao!"
          style={{
            height: 36,
            width: "auto",
            filter: theme === "dark" ? "invert(1)" : "none",
          }}
        />
      </Link>

      <nav className="flex items-center gap-3">
        <a
          href="https://github.com/ciaobang/surveys"
          target="_blank"
          rel="noreferrer"
          className="clay-button-hover flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line-strong)] bg-[var(--surface-panel-strong)] text-[var(--ink)] shadow-[var(--shadow-soft)]"
          aria-label="GitHub"
        >
          <GitHubIcon />
        </a>
        {isSignedIn ? (
          <StartSurveyButton className={ctaClassName}>
            Start a survey →
          </StartSurveyButton>
        ) : (
          <a href={signInHref} className={ctaClassName}>
            Sign in to start →
          </a>
        )}
      </nav>
    </header>
  );
}
