import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  agentRules: false,
  experimental: {
    authInterrupts: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
