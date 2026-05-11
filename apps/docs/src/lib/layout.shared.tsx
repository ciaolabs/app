import { BookOpenText } from "lucide-react";
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="flex items-center gap-2 font-semibold">
          <BookOpenText className="size-5" />
          Ciao Docs
        </span>
      ),
      url: "/docs",
    },
    links: [
      {
        text: "Demo",
        url: "/docs/demo",
        active: "nested-url",
      },
    ],
  };
}
