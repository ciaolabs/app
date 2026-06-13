"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast border-(--line-strong) bg-(--surface-panel-strong) text-(--ink) shadow-(--shadow-soft)",
          description: "text-(--ink-soft)",
          actionButton: "bg-(--ink) text-(--surface)",
          cancelButton: "bg-(--surface-inset) text-(--ink)",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
