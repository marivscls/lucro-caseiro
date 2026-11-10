import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../.."),
  reactStrictMode: true,
  poweredByHeader: false,
  devIndicators: false,
  allowedDevOrigins: ["127.0.0.1"],
  env: {
    // Whitelabel (ADR-0009): expoe a marca do build para o client bundle.
    NEXT_PUBLIC_BRAND: process.env.BRAND ?? process.env.NEXT_PUBLIC_BRAND ?? "",
  },
};

export default nextConfig;
