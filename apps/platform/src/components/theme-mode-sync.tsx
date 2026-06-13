"use client";

import { useEffect } from "react";
import { useTheme } from "fumadocs-ui/provider/base";

/**
 * next-themes (driving the fumadocs theme toggle) writes the `.dark` class
 * and `data-theme`, but knows nothing about `data-theme-mode` — mirror its
 * mode there so the platform boot script and toggles read the right value.
 */
export function ThemeModeSync() {
  const { theme } = useTheme();

  useEffect(() => {
    if (theme === "light" || theme === "dark" || theme === "system") {
      document.documentElement.dataset.themeMode = theme;
    }
  }, [theme]);

  return null;
}
