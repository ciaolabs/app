import type { NextConfig } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.ciaobang.com";

const nextConfig: NextConfig = {
  transpilePackages: ["@ciaobang/auth", "@ciaobang/db"],
  async redirects() {
    return [
      {
        source: "/surveys/personality/dashboard",
        destination: "/surveys",
        permanent: false,
      },
      {
        source: "/surveys/values-beliefs/dashboard",
        destination: "/surveys",
        permanent: false,
      },
      {
        source: "/chat",
        destination: `${APP_URL}/chat`,
        permanent: false,
      },
      {
        source: "/chat/:path*",
        destination: `${APP_URL}/chat/:path*`,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
