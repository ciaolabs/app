import type { NextConfig } from "next";
import { createMDX } from "fumadocs-mdx/next";

const PLATFORM_URL = "https://platform.ciaobang.com";

// The legacy hosts (survey/app/docs.ciaobang.com) are attached to the same
// deployment and redirect into the consolidated platform host. Switch
// `permanent` to true once the cutover has been verified in production.
const LEGACY_HOST_REDIRECTS = [
  // The survey and docs hosts ran the lightweight widget chat at /api/chat
  // (BYOK x-api-key protocol); that endpoint is now /api/assist. Map it
  // explicitly before the 1:1 catch-alls so stale-cached widget clients don't
  // land on the full-chat /api/chat (which 401s without a session).
  {
    source: "/api/chat",
    has: [{ type: "host" as const, value: "docs.ciaobang.com" }],
    destination: `${PLATFORM_URL}/api/assist`,
    permanent: false,
  },
  {
    source: "/api/chat",
    has: [{ type: "host" as const, value: "survey.ciaobang.com" }],
    destination: `${PLATFORM_URL}/api/assist`,
    permanent: false,
  },
  // docs.ciaobang.com served its pages under /docs already, so paths map 1:1;
  // only its root needs to land on /docs.
  {
    source: "/",
    has: [{ type: "host" as const, value: "docs.ciaobang.com" }],
    destination: `${PLATFORM_URL}/docs`,
    permanent: false,
  },
  {
    source: "/:path*",
    has: [{ type: "host" as const, value: "docs.ciaobang.com" }],
    destination: `${PLATFORM_URL}/:path*`,
    permanent: false,
  },
  // app.ciaobang.com hosted the chat at its root and the account page at /account.
  {
    source: "/",
    has: [{ type: "host" as const, value: "app.ciaobang.com" }],
    destination: `${PLATFORM_URL}/chat`,
    permanent: false,
  },
  {
    source: "/account",
    has: [{ type: "host" as const, value: "app.ciaobang.com" }],
    destination: `${PLATFORM_URL}/chat/account`,
    permanent: false,
  },
  {
    source: "/:path*",
    has: [{ type: "host" as const, value: "app.ciaobang.com" }],
    destination: `${PLATFORM_URL}/:path*`,
    permanent: false,
  },
  // survey.ciaobang.com used to redirect /chat and any /chat/* deep path to the
  // chat app root; preserve that collapse so old deep links don't 404.
  {
    source: "/chat/:path*",
    has: [{ type: "host" as const, value: "survey.ciaobang.com" }],
    destination: `${PLATFORM_URL}/chat`,
    permanent: false,
  },
  // All other survey.ciaobang.com paths map 1:1 onto the platform root.
  {
    source: "/:path*",
    has: [{ type: "host" as const, value: "survey.ciaobang.com" }],
    destination: `${PLATFORM_URL}/:path*`,
    permanent: false,
  },
];

const nextConfig: NextConfig = {
  transpilePackages: ["@ciaobang/auth", "@ciaobang/db"],
  async redirects() {
    return LEGACY_HOST_REDIRECTS;
  },
};

const withMDX = createMDX();

export default withMDX(nextConfig);
