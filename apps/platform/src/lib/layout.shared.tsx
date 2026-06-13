import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="flex shrink-0 items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/ciao-sparkle.svg"
            alt=""
            aria-hidden="true"
            className="ciao-wave ciao-nav-sparkle-light"
            style={{ height: 28, width: 28, objectFit: "contain" }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/ciao-sparkle-dark.svg"
            alt=""
            aria-hidden="true"
            className="ciao-wave ciao-nav-sparkle-dark"
            style={{ height: 28, width: 28, objectFit: "contain" }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/ciao-text.png"
            alt="Ciao!"
            style={{ height: 22, width: "auto" }}
            className="ciao-nav-text"
          />
          <span className="font-semibold leading-none">Docs</span>
        </span>
      ),
      url: "/docs",
    },
  };
}
