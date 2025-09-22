// apps/Site/next.config.ts
import type { NextConfig } from "next";
import path from "node:path";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Enable outputFileTracingRoot
  outputFileTracingRoot: path.resolve(__dirname, "../.."),

  experimental: {
    turbo: {
      // Enable Turbopack
      resolveAlias: {
        next: path.resolve(__dirname, "node_modules/next"),
      },
    },
  },

  // Transpile packages from workspace
  transpilePackages: [
    "@befroosh/tailwind-config",
    "@befroosh/ui-custom",
    "@befroosh/ui",
    "@befroosh/hooks",
    "@befroosh/lib",
  ],
};

export default withNextIntl(nextConfig);
