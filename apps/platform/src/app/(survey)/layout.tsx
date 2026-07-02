import type { Metadata } from "next";

import { InteractiveDotBackground } from "@/components/interactive-dot-background";
import { LazyAiSearchBar } from "@/components/ai/lazy-ai-search-bar";

export const metadata: Metadata = {
  title: "Ciao! Surveys",
  description: "Surveys to discover your personality and beliefs by Ciao!.",
};

export default function SurveyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="app-shell">
      <InteractiveDotBackground />
      <div className="app-glow app-glow-left" />
      <div className="app-glow app-glow-right" />
      {children}
      <LazyAiSearchBar />
    </div>
  );
}
