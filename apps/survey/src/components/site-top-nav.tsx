"use client";

import Link from "next/link";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { UserMenu } from "@/components/auth/user-menu";
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
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <text x="12" y="18.2" textAnchor="middle" fontSize="20" fontWeight="800" fill="currentColor">?</text>
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
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
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"
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

function DocsIcon() {
  return (
    <svg width="54" height="90" viewBox="0 0 54 90" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="h-5 w-auto">
      <path d="M52.4505 12.4946C52.3505 10.6846 52.7905 8.57455 52.0005 7.13455C48.9305 1.51455 43.9705 -0.765449 37.7805 0.224551C32.2105 1.11455 26.5305 1.93455 21.6305 4.89455C16.0805 8.24455 10.8605 12.1546 5.38045 15.6246C3.36045 16.8946 2.38045 18.4046 2.09045 20.7446C1.55045 24.9946 0.350454 29.2046 0.170454 33.4546C-0.109546 40.0846 0.0304538 46.7446 0.0704538 53.3946C0.0804538 55.2946 0.160453 57.1846 0.290453 59.0746L1.98045 83.0845C2.25045 87.3046 2.21045 87.6245 6.32045 88.8446C9.20045 89.6945 12.2305 90.5845 14.9905 88.7746C20.1205 85.4045 25.1205 81.8245 30.1805 78.3545C37.2905 73.4745 44.4205 68.6245 51.4805 63.6745C52.2005 63.1646 52.8605 62.0246 52.8805 61.1546C53.1405 50.8946 53.4105 40.6346 53.3805 30.3746C53.3605 24.4246 52.7805 18.4646 52.4505 12.5146V12.4946ZM39.0505 3.86455C27.8005 5.89455 17.8205 10.6946 8.66045 17.3446C17.4805 9.85455 27.3205 4.67455 39.0505 3.86455ZM13.4905 44.5546C13.5205 44.7246 13.4005 44.8846 13.2305 44.8846C10.2005 45.0246 7.46045 45.1546 4.60045 45.2946C4.36045 45.3046 4.16045 45.1146 4.16045 44.8746V40.6746C4.16045 40.4446 4.35045 40.2546 4.58045 40.2546C6.95045 40.2346 9.33045 40.0946 11.6805 40.3046C14.3405 40.5346 13.2105 42.6046 13.5005 44.5546H13.4905ZM5.50045 22.1046C5.77045 20.2746 7.43046 20.5546 8.71045 20.4746C9.96045 20.3946 11.4905 20.0546 11.8505 21.8446C12.3005 24.0546 12.6005 26.3046 12.9005 28.5546C13.1105 30.1646 13.2205 31.7746 13.3805 33.3946C13.5505 35.1046 13.5205 36.5145 11.0905 36.3446C8.84045 36.1846 6.58045 36.3146 3.66045 36.3146C4.24045 31.7246 4.80045 26.9146 5.49045 22.1245L5.50045 22.1046ZM14.1005 52.8746C13.9805 54.1346 13.9005 55.3745 13.8705 56.6646C13.7105 62.9746 13.4205 69.2746 13.2505 75.5845C13.1905 77.7746 13.3305 79.9745 13.4105 82.1646C13.4705 83.7046 12.9005 84.9045 11.2405 84.7245C9.53045 84.5445 7.01045 85.9846 6.39045 83.0045C5.78045 80.0745 5.31045 77.0946 5.05045 74.1145C4.44045 67.2145 3.91045 60.3146 3.53045 53.4046C3.33045 49.6946 3.49045 49.6846 7.21045 49.6746C7.70045 49.6746 8.20045 49.6746 8.69045 49.6746V49.6546C9.35045 49.6546 10.0105 49.6546 10.6605 49.6546C13.8705 49.6546 14.3805 49.7246 14.0905 52.8846L14.1005 52.8746ZM14.8605 16.6346C21.0105 12.0045 39.8305 5.65455 44.8805 6.32455C35.0905 9.68455 24.8805 13.1945 14.8605 16.6346ZM48.8105 58.8646C48.2005 62.2346 45.6705 64.1245 42.9605 65.8046C39.4105 68.0145 35.8605 70.2245 32.3505 72.4945C27.4505 75.6645 22.5805 78.8845 17.8405 81.9945C17.8405 71.5245 17.9905 61.1946 17.8005 50.8746C17.6105 40.6946 17.0605 30.5246 16.6605 20.1346C26.7505 16.2645 36.8605 11.5446 48.3505 10.4346C48.5705 13.3946 48.8905 16.1745 48.9605 18.9646C49.0605 23.0145 49.1605 27.0746 49.2505 31.1246C49.4405 40.3646 49.3005 49.6146 48.8105 58.8546V58.8646Z" fill="currentColor"/>
      <path d="M39.8304 20.0446C36.2304 20.8446 32.6004 21.6646 29.1104 22.8346C22.7604 24.9746 22.8004 25.0846 22.6304 31.5046C22.8504 33.9346 23.0104 36.3746 23.3204 38.7946C23.5204 40.3546 24.4804 41.1246 26.0804 40.5846C31.3204 38.8146 36.5504 37.0246 41.7804 35.2146C43.4404 34.6346 45.0304 33.6846 44.9604 31.7546C44.8504 28.7146 44.5904 25.6346 43.9504 22.6746C43.5504 20.8346 41.9204 19.5846 39.8404 20.0446H39.8304ZM40.5704 29.9046C40.5604 30.3346 40.3104 30.9946 39.9904 31.1446C35.7704 33.0446 31.5204 34.8746 26.9004 36.8846C26.6404 33.9546 26.2104 31.6846 26.3504 29.4546C26.4204 28.4146 27.4104 26.8046 28.3004 26.5446C32.2304 25.4146 36.2804 24.6746 40.6004 23.7346C40.6004 25.9946 40.6304 27.9546 40.5704 29.9046Z" fill="currentColor"/>
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

function getSaveStatusIndicatorColor(saveStatus: string, isError: boolean): string {
  if (isError) {
    return "bg-(--accent-rose)";
  }

  if (saveStatus.startsWith("Saving")) {
    return "bg-(--accent-blue)";
  }

  if (saveStatus.startsWith("Saved")) {
    return "bg-(--accent-mint)";
  }

  return "bg-(--ink-soft)";
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
  return "clay-button-hover inline-flex h-10 items-center justify-center rounded-full border border-(--line-strong) bg-(--surface-panel-strong) text-sm font-semibold text-(--ink) shadow-(--shadow-soft)";
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
    <header className="nav-glass sticky top-0 z-40 rounded-b-3xl border-x border-b border-(--nav-glass-border) bg-(--nav-glass-bg) px-4 py-3 shadow-(--shadow-soft) sm:px-5">
      <div className="flex min-w-0 items-center gap-2 pr-12 sm:gap-3 lg:pr-0">
        <div className="min-w-0 overflow-hidden lg:max-w-88 xl:max-w-104">
          <SiteBreadcrumb title={breadcrumbTitle} items={breadcrumbItems} />
        </div>

        <div className="hidden flex-1 items-center justify-end gap-2 lg:flex">
          {saveStatus ? (
            <div
              className={[
                "inline-flex min-h-11 min-w-40 items-center justify-end gap-2 px-1 text-sm font-semibold",
                saveStatusIsError ? "text-(--accent-rose)" : "text-(--ink-soft)",
              ].join(" ")}
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${getSaveStatusIndicatorColor(saveStatus, saveStatusIsError)}`} />
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

          <a
            href="https://docs.ciaobang.com"
            target="_blank"
            rel="noreferrer"
            className={iconButtonClassName()}
            aria-label="Docs"
            title="Docs"
          >
            <DocsIcon />
          </a>

          <button
            type="button"
            onClick={toggleTheme}
            className={iconButtonClassName()}
            aria-label={themeAriaLabel}
            title={themeLabel}
          >
            {hasHydrated && theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>

          <UserMenu />

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
                className="mobile-nav-backdrop fixed inset-0 z-70 bg-black/20 backdrop-blur-[2px] lg:hidden"
              />

              <div className="fixed right-0 top-1/2 z-80 w-[min(18rem,calc(100vw-1rem))] -translate-y-1/2 pl-3 lg:hidden">
                <div
                  ref={mobileMenuPanelRef}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Navigation menu"
                  className="mobile-nav-sheet max-h-[calc(100vh-2rem)] overflow-y-auto rounded-l-3xl border-l border-y border-(--line-strong) bg-(--surface-panel-strong) p-2 shadow-(--shadow-strong) backdrop-blur"
                >
                  <div className="space-y-1">
                    {saveStatus ? (
                      <div
                        className={[
                          "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold",
                          saveStatusIsError ? "text-(--accent-rose)" : "text-(--ink-soft)",
                        ].join(" ")}
                      >
                        <span className={`h-2 w-2 shrink-0 rounded-full ${getSaveStatusIndicatorColor(saveStatus, saveStatusIsError)}`} />
                        {saveStatus}
                      </div>
                    ) : null}

                    <div onClick={() => setIsMobileMenuOpen(false)}>{action}</div>

                    <Link
                      href="/"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="clay-button-hover flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-semibold text-(--ink)"
                    >
                      <HomeIcon />
                      <span>Home</span>
                    </Link>

                    <Link
                      href={SURVEYS_ROUTE}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="clay-button-hover flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-semibold text-(--ink)"
                    >
                      <DashboardIcon />
                      <span>Dashboard</span>
                    </Link>

                    <a
                      href="https://docs.ciaobang.com"
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="clay-button-hover flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-semibold text-(--ink)"
                    >
                      <DocsIcon />
                      <span>Docs</span>
                    </a>

                    {helpHref ? (
                      <a
                        href={helpHref}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="clay-button-hover flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-semibold text-(--ink)"
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
                        className="clay-button-hover flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-semibold text-(--ink)"
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
                      className="clay-button-hover flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-semibold text-(--ink)"
                    >
                      {hasHydrated && theme === "dark" ? <SunIcon /> : <MoonIcon />}
                      <span>{themeLabel}</span>
                    </button>

                    <UserMenu trigger="row" />
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
