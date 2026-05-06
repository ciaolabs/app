import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ciaobang/auth", "@ciaobang/db"],
};

export default nextConfig;