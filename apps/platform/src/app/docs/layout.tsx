import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RootProvider } from "fumadocs-ui/provider/next";
import { DocsLayout } from "fumadocs-ui/layouts/docs";

import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/lib/source";
import { AiSearchBar } from "@/components/ai/ai-chat";
import { AssistPageContentProvider } from "@/components/ai/assist-page-content";
import { BodySection } from "@/components/body-section";
import { InteractiveDotBackground } from "@/components/interactive-dot-background";
import { ThemeModeSync } from "@/components/theme-mode-sync";

import "./docs.css";

export const metadata: Metadata = {
  title: {
    default: "Ciao Docs",
    template: "%s | Ciao Docs",
  },
  description: "Documentation for Ciao personality, values, and beliefs measures.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div data-section="docs">
      <BodySection section="docs" />
      <InteractiveDotBackground />
      {/* storageKey matches the platform-wide theme script, and next-themes
          manages both the fumadocs `.dark` class and the platform-wide
          `data-theme` attribute so the two never desync inside docs.
          defaultTheme matches the boot script's empty-storage fallback, and
          ThemeModeSync mirrors the mode into `data-theme-mode`. */}
      <RootProvider
        theme={{
          storageKey: "ambi-theme-mode",
          attribute: ["class", "data-theme"],
          defaultTheme: "light",
        }}
      >
        <ThemeModeSync />
        {/* Provider wraps both the page (which publishes the current doc's
            text) and the widget (which reads it), so docs answers are
            page-aware while the widget's chat survives navigation. */}
        <AssistPageContentProvider>
          <DocsLayout
            tree={source.getPageTree()}
            githubUrl="https://github.com/ciaobang/app"
            {...baseOptions()}
          >
            {children}
            <AiSearchBar />
          </DocsLayout>
        </AssistPageContentProvider>
      </RootProvider>
    </div>
  );
}
