"use client";

import { Show, UserButton } from "@clerk/nextjs";
import { type ReactNode, useCallback, useEffect, useState } from "react";

import { clerkUserButtonAppearance } from "@/lib/clerk";
import { SiteBreadcrumb } from "@/components/ui/site-breadcrumb";
import { SURVEY_RESULTS_ROUTE } from "@/lib/survey/routes";

type ThemeMode = "light" | "dark";

type SiteTopNavProps = {
  breadcrumbTitle?: string;
  breadcrumbItems?: Array<{
    label: string;
    href?: string;
  }>;
  saveStatus?: string;
  saveStatusIsError?: boolean;
  helpHref?: string;
  helpOnClick?: () => void;
  helpExpanded?: boolean;
  action: ReactNode;
};

function HelpIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
      <circle cx="10" cy="10" r="7.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M7.9 7.6a2.4 2.4 0 1 1 3.8 2c-.9.6-1.4 1-1.4 2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <circle cx="10" cy="14.2" r=".85" fill="currentColor" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
      <circle cx="10" cy="10" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 2.5v2.1M10 15.4v2.1M17.5 10h-2.1M4.6 10H2.5M15.3 4.7l-1.5 1.5M6.2 13.8l-1.5 1.5M15.3 15.3l-1.5-1.5M6.2 6.2 4.7 4.7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
      <path
        d="M12.8 3.3a6.9 6.9 0 1 0 3.9 12.6A7.6 7.6 0 1 1 12.8 3.3Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
      <path
        d="M3.5 5.25A1.75 1.75 0 0 1 5.25 3.5h3.5A1.75 1.75 0 0 1 10.5 5.25v3.5A1.75 1.75 0 0 1 8.75 10.5h-3.5A1.75 1.75 0 0 1 3.5 8.75v-3.5Zm6 6A1.75 1.75 0 0 1 11.25 9.5h3.5a1.75 1.75 0 0 1 1.75 1.75v3.5a1.75 1.75 0 0 1-1.75 1.75h-3.5a1.75 1.75 0 0 1-1.75-1.75v-3.5Zm-6 0A1.75 1.75 0 0 1 5.25 9.5h1.5A1.75 1.75 0 0 1 8.5 11.25v3.5A1.75 1.75 0 0 1 6.75 16.5h-1.5A1.75 1.75 0 0 1 3.5 14.75v-3.5Zm8-6A1.75 1.75 0 0 1 13.25 3.5h1.5a1.75 1.75 0 0 1 1.75 1.75v1.5a1.75 1.75 0 0 1-1.75 1.75h-1.5A1.75 1.75 0 0 1 11.5 6.75v-1.5Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.3"
      />
    </svg>
  );
}

function readTheme(): ThemeMode {
  if (typeof document !== "undefined") {
    const theme = document.documentElement.dataset.theme;
    if (theme === "dark" || theme === "light") {
      return theme;
    }
  }

  if (typeof window !== "undefined") {
    const storedTheme = window.localStorage.getItem("ambi-theme");
    if (storedTheme === "dark" || storedTheme === "light") {
      return storedTheme;
    }
  }

  return "light";
}

function actionButtonClassName() {
  return "inline-flex h-11 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface-panel-strong)] px-4 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--line-strong)]";
}

export function SiteTopNav({
  breadcrumbTitle,
  breadcrumbItems,
  saveStatus,
  saveStatusIsError = false,
  helpHref,
  helpOnClick,
  helpExpanded,
  action,
}: SiteTopNavProps) {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const nextTheme = readTheme();
    setTheme(nextTheme);
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("ambi-theme", theme);
  }, [hasHydrated, theme]);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== "ambi-theme") {
        return;
      }

      const nextTheme = event.newValue;
      if (nextTheme === "dark" || nextTheme === "light") {
        setTheme(nextTheme);
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  }, []);

  const themeLabel = hasHydrated ? (theme === "light" ? "Dark mode" : "Light mode") : "Theme";
  const themeAriaLabel = hasHydrated
    ? theme === "light"
      ? "Switch to dark mode"
      : "Switch to light mode"
    : "Toggle color theme";

  return (
    <header className="rounded-[1.8rem] border border-[var(--line)] bg-[var(--surface-panel)] px-4 py-3 shadow-[var(--shadow-soft)] backdrop-blur sm:px-5">
      <div className="flex flex-col gap-3 xl:grid xl:grid-cols-[22rem_minmax(0,1fr)] xl:items-center">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <SiteBreadcrumb title={breadcrumbTitle} items={breadcrumbItems} />
        </div>

        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          {saveStatus ? (
            <div
              className={[
                "inline-flex min-h-11 min-w-[10rem] items-center px-1 text-sm font-semibold xl:justify-end",
                saveStatusIsError ? "text-[var(--accent-rose)]" : "text-[var(--ink-soft)]",
              ].join(" ")}
            >
              {saveStatus}
            </div>
          ) : null}

          {helpHref ? (
            <a
              href={helpHref}
              target="_blank"
              rel="noreferrer"
              className={actionButtonClassName()}
            >
              <HelpIcon />
              <span>Help</span>
            </a>
          ) : helpOnClick ? (
            <button
              type="button"
              onClick={helpOnClick}
              aria-expanded={helpExpanded}
              className={actionButtonClassName()}
            >
              <HelpIcon />
              <span>Help</span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={toggleTheme}
            className={actionButtonClassName()}
            aria-label={themeAriaLabel}
          >
            {hasHydrated && theme === "dark" ? <SunIcon /> : <MoonIcon />}
            <span>{themeLabel}</span>
          </button>

          <Show when="signed-in">
            <UserButton appearance={clerkUserButtonAppearance}>
              <UserButton.MenuItems>
                <UserButton.Link
                  href={SURVEY_RESULTS_ROUTE}
                  label="Dashboard"
                  labelIcon={<DashboardIcon />}
                />
              </UserButton.MenuItems>
            </UserButton>
          </Show>

          {action}
        </div>
      </div>
    </header>
  );
}
