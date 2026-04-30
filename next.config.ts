import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ];
  },
};

export default nextConfig;
