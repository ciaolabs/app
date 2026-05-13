import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

function GithubIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-1.96c-3.2.7-3.87-1.54-3.87-1.54-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.24 3.34.95.1-.74.4-1.24.72-1.53-2.55-.29-5.24-1.27-5.24-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a10.9 10.9 0 015.74 0c2.18-1.48 3.14-1.17 3.14-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.69 5.37-5.25 5.65.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

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
            className="ciao-wave dark:hidden"
            style={{ height: 28, width: 28, objectFit: "contain" }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/ciao-sparkle-dark.svg"
            alt=""
            aria-hidden="true"
            className="ciao-wave hidden dark:block"
            style={{ height: 28, width: 28, objectFit: "contain" }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/ciao-text.png"
            alt="Ciao!"
            style={{ height: 22, width: "auto" }}
            className="dark:[filter:invert(1)]"
          />
          <span className="font-semibold leading-none">Docs</span>
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
      {
        text: "GitHub",
        url: "https://github.com/ciaobang/app",
        icon: <GithubIcon />,
        external: true,
      },
    ],
  };
}
