import type { ReactNode } from "react";
import { DocsLayout } from "fumadocs-ui/layouts/docs";

import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/lib/source";
import { AiSearchBar } from "@/components/ai/ai-chat";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout tree={source.getPageTree()} githubUrl="https://github.com/ciaobang/app" {...baseOptions()}>
      {children}
      <AiSearchBar />
    </DocsLayout>
  );
}

