"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

export function MarkdownRenderer({ text }: { text: string }) {
  return (
    <div className="markdown-body space-y-3">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="leading-7">{children}</p>,
          h1: ({ children }) => (
            <h1 className="mt-2 text-2xl font-bold tracking-tight">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-2 text-xl font-bold tracking-tight">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-2 text-lg font-bold tracking-tight">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="mt-2 text-base font-bold tracking-tight">{children}</h4>
          ),
          ul: ({ children }) => (
            <ul className="list-disc space-y-1 pl-6">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-1 pl-6">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-7">{children}</li>,
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
