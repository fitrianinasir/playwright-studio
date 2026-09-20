import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "playwright",
    "pngjs",
    "pixelmatch",
    "@prisma/client",
    "@prisma/adapter-pg",
    "pg",
  ],
};

export default nextConfig;
