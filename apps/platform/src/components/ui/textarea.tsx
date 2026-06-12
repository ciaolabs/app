import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "field-sizing-content min-h-16 w-full resize-none rounded-md border border-(--line) bg-(--surface-panel-strong) px-3 py-2 text-base text-(--ink) outline-none transition placeholder:text-(--muted) focus-visible:border-(--line-strong) disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
