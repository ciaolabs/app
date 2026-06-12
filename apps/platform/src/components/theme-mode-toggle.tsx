"use client";

import { useCallback, useEffect, useState } from "react";

import {
  THEME_STORAGE_KEY,
  type ThemeMode,
  applyResolvedTheme,
  readStoredThemeMode,
  resolveTheme,
} from "@/lib/theme";

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.6"
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
        strokeWidth="1.6"
      />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <rect
        x="3"
        y="4.5"
        width="18"
        height="12"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M9 20h6M12 16.5V20"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

const OPTIONS: { mode: ThemeMode; icon: React.ReactNode; label: string }[] = [
  { mode: "light", icon: <SunIcon />, label: "Light theme" },
  { mode: "dark", icon: <MoonIcon />, label: "Dark theme" },
  { mode: "system", icon: <SystemIcon />, label: "System theme" },
];

export function ThemeModeToggle() {
  const [mode, setMode] = useState<ThemeMode>("light");
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setMode(readStoredThemeMode());
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;

    applyResolvedTheme(resolveTheme(mode), mode);
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  }, [mode, hasHydrated]);

  useEffect(() => {
    if (!hasHydrated || mode !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      applyResolvedTheme(media.matches ? "dark" : "light", "system");
    };
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [mode, hasHydrated]);

  const selectMode = useCallback((next: ThemeMode) => {
    setMode(next);
  }, []);

  return (
    <div
      role="radiogroup"
      aria-label="Theme mode"
      className="inline-flex h-10 items-center gap-1 rounded-full border border-neutral-300 bg-white px-1 [html[data-theme='dark']_&]:border-neutral-600 [html[data-theme='dark']_&]:bg-neutral-800"
    >
      {OPTIONS.map((option) => {
        const isActive = hasHydrated && mode === option.mode;
        return (
          <button
            key={option.mode}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={option.label}
            title={option.label}
            onClick={() => selectMode(option.mode)}
            className={[
              "inline-flex h-8 w-8 items-center justify-center rounded-full transition",
              isActive
                ? "bg-black text-white [html[data-theme='dark']_&]:bg-white [html[data-theme='dark']_&]:text-black"
                : "text-neutral-500 hover:text-neutral-900 [html[data-theme='dark']_&]:text-neutral-400 [html[data-theme='dark']_&]:hover:text-neutral-100",
            ].join(" ")}
          >
            {option.icon}
          </button>
        );
      })}
    </div>
  );
}
