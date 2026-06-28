import type { NextConfig } from "next";
import { createMDX } from "fumadocs-mdx/next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ciaobang/auth", "@ciaobang/db"],
  // The chat surface moved from /chat to /app; keep old links working.
  async redirects() {
    return [
      { source: "/chat", destination: "/app", permanent: true },
      { source: "/chat/:path*", destination: "/app/:path*", permanent: true },
    ];
  },
  // These routes return per-user data (threads, account, survey context).
  // Next emits `cache-control: public` for them by default, which let a shared
  // cache store one user's authenticated response and serve it to another. Pin
  // them to `private, no-store` so no CDN/proxy ever caches user data. (The
  // /app page is covered by its own `export const dynamic = "force-dynamic"`.)
  async headers() {
    const noStore = {
      key: "Cache-Control",
      value: "private, no-store, max-age=0, must-revalidate",
    };
    return [
      { source: "/api/chat/:path*", headers: [noStore] },
      { source: "/api/account/:path*", headers: [noStore] },
      { source: "/api/survey-context", headers: [noStore] },
    ];
  },
};

const withMDX = createMDX();

export default withMDX(nextConfig);
