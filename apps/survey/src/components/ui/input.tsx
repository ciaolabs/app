import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full rounded-md border border-(--line) bg-(--surface-panel-strong) px-3 py-2 text-base text-(--ink) outline-none transition placeholder:text-(--muted) focus-visible:border-(--line-strong) disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
