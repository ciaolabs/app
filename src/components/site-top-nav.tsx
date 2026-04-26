"use client";

import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { clerkUserButtonAppearance } from "@/lib/clerk";
import { SiteBreadcrumb } from "@/components/ui/site-breadcrumb";
import { SURVEYS_ROUTE } from "@/lib/survey/routes";

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

function HomeIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
      <path
        d="M3.5 9.2 10 4l6.5 5.2v6.3a1 1 0 0 1-1 1h-3.7V12h-3.6v4.5H4.5a1 1 0 0 1-1-1Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
      <path
        d="M4 6h12M4 10h12M4 14h12"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.6"
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
  return "clay-button-hover inline-flex h-10 items-center justify-center rounded-full border border-[var(--line-strong)] bg-[var(--surface-panel-strong)] text-sm font-semibold text-[var(--ink)] shadow-[var(--shadow-soft)]";
}

function iconButtonClassName() {
  return `${actionButtonClassName()} w-10 sm:h-11 sm:w-11`;
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileMenuPanelRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        !mobileMenuButtonRef.current?.contains(target)
        && !mobileMenuPanelRef.current?.contains(target)
      ) {
        setIsMobileMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileMenuOpen]);

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
    <header className="nav-glass sticky top-0 z-40 rounded-b-[1.5rem] border-x border-b border-[var(--nav-glass-border)] bg-[var(--nav-glass-bg)] px-4 py-3 shadow-[var(--shadow-soft)] sm:px-5">
      <div className="flex min-w-0 items-center gap-2 pr-12 sm:gap-3 lg:pr-0">
        <div className="min-w-0 overflow-hidden lg:max-w-[22rem] xl:max-w-[26rem]">
          <SiteBreadcrumb title={breadcrumbTitle} items={breadcrumbItems} />
        </div>

        <div className="hidden flex-1 items-center justify-end gap-2 lg:flex">
          {saveStatus ? (
            <div
              className={[
                "inline-flex min-h-11 min-w-[10rem] items-center justify-end px-1 text-sm font-semibold",
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
              className={iconButtonClassName()}
              aria-label="Help"
              title="Help"
            >
              <HelpIcon />
            </a>
          ) : helpOnClick ? (
            <button
              type="button"
              onClick={helpOnClick}
              aria-expanded={helpExpanded}
              className={iconButtonClassName()}
              aria-label="Help"
              title="Help"
            >
              <HelpIcon />
            </button>
          ) : null}

          <button
            type="button"
            onClick={toggleTheme}
            className={iconButtonClassName()}
            aria-label={themeAriaLabel}
            title={themeLabel}
          >
            {hasHydrated && theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>

          <Show when="signed-in">
            <UserButton appearance={clerkUserButtonAppearance}>
              <UserButton.MenuItems>
                <UserButton.Link
                  href={SURVEYS_ROUTE}
                  label="Dashboard"
                  labelIcon={<DashboardIcon />}
                />
              </UserButton.MenuItems>
            </UserButton>
          </Show>

          {action}
        </div>

        <div className="absolute right-4 top-3 shrink-0 lg:hidden sm:right-5">
          <button
            ref={mobileMenuButtonRef}
            type="button"
            onClick={() => setIsMobileMenuOpen((currentValue) => !currentValue)}
            className={iconButtonClassName()}
            aria-label="Open navigation menu"
            aria-expanded={isMobileMenuOpen}
            aria-haspopup="dialog"
            title="Menu"
          >
            <MenuIcon />
          </button>
        </div>
      </div>

      {isMobileMenuOpen && typeof document !== "undefined"
        ? createPortal(
            <>
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setIsMobileMenuOpen(false)}
                className="mobile-nav-backdrop fixed inset-0 z-[70] bg-black/20 backdrop-blur-[2px] lg:hidden"
              />

              <div className="fixed right-0 top-1/2 z-[80] w-[min(18rem,calc(100vw-1rem))] -translate-y-1/2 pl-3 lg:hidden">
                <div
                  ref={mobileMenuPanelRef}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Navigation menu"
                  className="mobile-nav-sheet max-h-[calc(100vh-2rem)] overflow-y-auto rounded-l-[1.5rem] border-l border-y border-[var(--line-strong)] bg-[var(--surface-panel-strong)] p-2 shadow-[var(--shadow-strong)] backdrop-blur"
                >
                  <div className="space-y-1">
                    {saveStatus ? (
                      <div
                        className={[
                          "rounded-[0.75rem] px-3 py-2 text-sm font-semibold",
                          saveStatusIsError ? "text-[var(--accent-rose)]" : "text-[var(--ink-soft)]",
                        ].join(" ")}
                      >
                        {saveStatus}
                      </div>
                    ) : null}

                    <div onClick={() => setIsMobileMenuOpen(false)}>{action}</div>

                    <Link
                      href="/"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="clay-button-hover flex min-h-11 items-center gap-3 rounded-[1rem] px-3 text-sm font-semibold text-[var(--ink)]"
                    >
                      <HomeIcon />
                      <span>Home</span>
                    </Link>

                    <Link
                      href={SURVEYS_ROUTE}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="clay-button-hover flex min-h-11 items-center gap-3 rounded-[1rem] px-3 text-sm font-semibold text-[var(--ink)]"
                    >
                      <DashboardIcon />
                      <span>Dashboard</span>
                    </Link>

                    {helpHref ? (
                      <a
                        href={helpHref}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="clay-button-hover flex min-h-11 items-center gap-3 rounded-[1rem] px-3 text-sm font-semibold text-[var(--ink)]"
                      >
                        <HelpIcon />
                        <span>Help</span>
                      </a>
                    ) : helpOnClick ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          helpOnClick();
                        }}
                        className="clay-button-hover flex min-h-11 w-full items-center gap-3 rounded-[1rem] px-3 text-left text-sm font-semibold text-[var(--ink)]"
                      >
                        <HelpIcon />
                        <span>Help</span>
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => {
                        toggleTheme();
                        setIsMobileMenuOpen(false);
                      }}
                      className="clay-button-hover flex min-h-11 w-full items-center gap-3 rounded-[1rem] px-3 text-left text-sm font-semibold text-[var(--ink)]"
                    >
                      {hasHydrated && theme === "dark" ? <SunIcon /> : <MoonIcon />}
                      <span>{themeLabel}</span>
                    </button>

                    <Show when="signed-in">
                      <div className="flex items-center justify-between rounded-[1rem] border border-dashed border-[var(--line)] px-3 py-2 text-sm font-semibold text-[var(--ink)]">
                        <span>Account</span>
                        <UserButton appearance={clerkUserButtonAppearance}>
                          <UserButton.MenuItems>
                            <UserButton.Link
                              href={SURVEYS_ROUTE}
                              label="Dashboard"
                              labelIcon={<DashboardIcon />}
                            />
                          </UserButton.MenuItems>
                        </UserButton>
                      </div>
                    </Show>
                  </div>
                </div>
              </div>
            </>,
            document.body,
          )
        : null}
    </header>
  );
}
