import type { NextConfig } from "next";
import { createMDX } from "fumadocs-mdx/next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ciaobang/auth", "@ciaobang/db"],
  // Tree-shake big barrel-file packages so a single `import { Icon }` does not
  // pull the whole library into the client bundle. (Next ships lucide-react in
  // its default list; fumadocs is ours to add.)
  experimental: {
    optimizePackageImports: ["lucide-react", "fumadocs-ui", "fumadocs-core"],
  },
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
    // Static brand assets in /public (images, fonts, lottie) are content-stable
    // and rarely change. Let the CDN + browser cache them for a year. Vercel
    // purges the edge cache on every deploy, so `immutable` is safe here; the
    // only rule is: if you change an asset's *content*, give it a new filename.
    const immutable = {
      key: "Cache-Control",
      value: "public, max-age=31536000, immutable",
    };
    return [
      { source: "/api/chat/:path*", headers: [noStore] },
      { source: "/api/account/:path*", headers: [noStore] },
      { source: "/api/survey-context", headers: [noStore] },
      {
        source:
          "/(.*).(svg|png|jpg|jpeg|gif|webp|avif|ico|woff|woff2|ttf|otf|lottie|wasm)",
        headers: [immutable],
      },
    ];
  },
};

const withMDX = createMDX();

export default withMDX(nextConfig);
