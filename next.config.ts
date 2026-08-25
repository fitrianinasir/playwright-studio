import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["playwright", "pngjs", "pixelmatch"],
};

export default nextConfig;
