import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@locker/common",
    "@locker/database",
    "@locker/email",
    "@locker/storage",
  ],
  serverExternalPackages: ["re2"],
};

export default nextConfig;
