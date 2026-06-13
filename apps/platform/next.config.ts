import type { NextConfig } from "next";
import { createMDX } from "fumadocs-mdx/next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ciaobang/auth", "@ciaobang/db"],
};

const withMDX = createMDX();

export default withMDX(nextConfig);
