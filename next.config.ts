import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg"],
  reactStrictMode: true,
};

export default nextConfig;
