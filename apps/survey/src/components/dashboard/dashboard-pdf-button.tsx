"use client";

import { useCallback, useState } from "react";

import { exportDashboardPdf } from "@/lib/dashboard-pdf-export";

type DashboardPdfButtonProps = {
  fileName: string;
};

function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
    >
      <path d="M10 3v10m0 0 3.5-3.5M10 13l-3.5-3.5" />
      <path d="M3.5 14.5v1.25A1.75 1.75 0 0 0 5.25 17.5h9.5a1.75 1.75 0 0 0 1.75-1.75V14.5" />
    </svg>
  );
}

export function DashboardPdfButton({ fileName }: DashboardPdfButtonProps) {
  const [status, setStatus] = useState<"idle" | "preparing" | "error">("idle");

  const handleDownload = useCallback(async () => {
    if (typeof window === "undefined" || status === "preparing") {
      return;
    }

    setStatus("preparing");

    try {
      const elements = Array.from(
        document.querySelectorAll<HTMLElement>("[data-pdf-capture]"),
      );

      if (elements.length === 0) {
        setStatus("error");
        return;
      }

      await exportDashboardPdf(elements, { fileName });

      setStatus("idle");
    } catch (error) {
      console.error("Failed to export dashboard PDF", error);
      setStatus("error");
    }
  }, [fileName, status]);

  const label =
    status === "preparing"
      ? "Preparing..."
      : status === "error"
        ? "Try again"
        : "Download PDF";

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={status === "preparing"}
      aria-label="Download dashboard as PDF"
      className="clay-button-hover inline-flex h-10 items-center gap-2 rounded-full border border-black bg-[var(--selected-contrast)] px-4 text-sm font-semibold text-[var(--accent-blue)] shadow-[var(--shadow-soft)] disabled:cursor-not-allowed disabled:opacity-70"
    >
      <DownloadIcon />
      <span>{label}</span>
    </button>
  );
}
