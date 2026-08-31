import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@checker/db", "@checker/rules", "@checker/shared"],
  experimental: {
    externalDir: true,
  },
};

export default nextConfig;
