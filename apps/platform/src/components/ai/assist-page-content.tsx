"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type AssistPageContentValue = {
  pageContent: string | undefined;
  setPageContent: (content: string | undefined) => void;
};

const AssistPageContentContext = createContext<AssistPageContentValue>({
  pageContent: undefined,
  setPageContent: () => {},
});

/**
 * Carries the current page's text from a server-rendered page up to the
 * layout-mounted {@link AiSearchBar}, so the assist widget can send it to
 * `/api/assist` as `pageContent`. The widget lives in the section layout (its
 * chat must survive page-to-page navigation), so a plain prop can't reach it
 * from the page — the page publishes through this context instead.
 *
 * Sections without a provider (e.g. the survey section) get the default
 * `undefined`, so no page content is sent there.
 */
export function AssistPageContentProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [pageContent, setPageContent] = useState<string | undefined>(undefined);
  return (
    <AssistPageContentContext.Provider value={{ pageContent, setPageContent }}>
      {children}
    </AssistPageContentContext.Provider>
  );
}

/** Current page content for the assist widget, or `undefined` when none is set. */
export function useAssistPageContent(): string | undefined {
  return useContext(AssistPageContentContext).pageContent;
}

/**
 * Publishes `content` as the active assist page content while mounted, and
 * clears it on unmount. Rendered by docs pages so the assist widget answers
 * with the page the reader is currently on.
 */
export function SetAssistPageContent({ content }: { content: string }) {
  const { setPageContent } = useContext(AssistPageContentContext);
  useEffect(() => {
    setPageContent(content);
    return () => setPageContent(undefined);
  }, [content, setPageContent]);
  return null;
}
