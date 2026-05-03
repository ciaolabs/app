import type { NextConfig } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.ciaobang.com";

const nextConfig: NextConfig = {
  transpilePackages: ["@ciaobang/auth", "@ciaobang/db"],
  async redirects() {
    return [
      {
        source: "/chat",
        destination: APP_URL,
        permanent: false,
      },
      {
        source: "/chat/:path*",
        destination: APP_URL,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
