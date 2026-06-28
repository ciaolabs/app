"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

export function MarkdownRenderer({
  text,
  compact = false,
}: {
  text: string;
  /**
   * Tighter type scale + spacing for cramped surfaces (e.g. the Ask Ciao!
   * pill). Element semantics and theming are identical to the default; only
   * sizes shrink so the same Markdown reads well in a 13px container.
   */
  compact?: boolean;
}) {
  const lead = compact ? "leading-relaxed" : "leading-7";
  return (
    <div className={cn("markdown-body", compact ? "space-y-2" : "space-y-3")}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className={lead}>{children}</p>,
          h1: ({ children }) => (
            <h1
              className={cn(
                "mt-2 font-bold tracking-tight",
                compact ? "text-base" : "text-2xl",
              )}
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              className={cn(
                "mt-2 font-bold tracking-tight",
                compact ? "text-sm" : "text-xl",
              )}
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              className={cn(
                "mt-2 font-bold tracking-tight",
                compact ? "text-sm" : "text-lg",
              )}
            >
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4
              className={cn(
                "mt-2 font-bold tracking-tight",
                compact ? "text-[13px]" : "text-base",
              )}
            >
              {children}
            </h4>
          ),
          ul: ({ children }) => (
            <ul className={cn("list-disc space-y-1", compact ? "pl-5" : "pl-6")}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className={cn("list-decimal space-y-1", compact ? "pl-5" : "pl-6")}>
              {children}
            </ol>
          ),
          li: ({ children }) => <li className={lead}>{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-(--ink)">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-(--accent-blue) bg-(--surface-inset) py-2 pl-4 italic text-(--ink-soft)">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              className="font-medium text-(--accent-blue) underline underline-offset-2 hover:opacity-80"
            >
              {children}
            </a>
          ),
          hr: () => <hr className="my-4 border-(--line)" />,
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code
                  className="rounded-md border border-(--line) bg-(--surface-inset) px-1.5 py-0.5 font-mono text-[0.9em]"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className={cn("font-mono text-sm", className)} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-xl border border-(--line) bg-(--surface-inset) p-4 text-sm leading-6">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-(--line-strong) text-left">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 font-semibold">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border-b border-(--line) px-3 py-2 align-top">{children}</td>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
