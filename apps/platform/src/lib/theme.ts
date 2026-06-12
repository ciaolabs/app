export type ThemeMode = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "ambi-theme-mode";

export function readStoredThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  const datasetMode = document.documentElement.dataset.themeMode;
  if (datasetMode === "light" || datasetMode === "dark" || datasetMode === "system") {
    return datasetMode;
  }
  return "light";
}

export function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
}

/**
 * Single writer for every theme signal on <html>. Inside /docs, next-themes
 * (via fumadocs RootProvider) manages the `.dark` class, `data-theme`, and
 * inline color-scheme; platform toggles must keep writing the same three
 * signals (plus `data-theme-mode`, which next-themes never writes) or the two
 * systems desync across client-side navigation.
 */
export function applyResolvedTheme(resolved: "light" | "dark", mode: ThemeMode) {
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.dataset.themeMode = mode;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}
