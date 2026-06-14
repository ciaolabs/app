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
};

const withMDX = createMDX();

export default withMDX(nextConfig);
