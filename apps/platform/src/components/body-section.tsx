"use client";

import { useLayoutEffect } from "react";

/**
 * Mirrors the section theme attribute onto <body> so portal-rendered UI
 * (Radix dialogs/tooltips, sonner toasts) picks up the section's token
 * overrides even though it renders outside the section wrapper div.
 */
export function BodySection({ section }: { section: string }) {
  useLayoutEffect(() => {
    document.body.dataset.section = section;
    return () => {
      delete document.body.dataset.section;
    };
  }, [section]);

  return null;
}
