import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  agentRules: false,
  experimental: {
    authInterrupts: true,
  },
  async redirects() {
    return [
      { source: "/laporan-saya", destination: "/pelapor", permanent: false },
      { source: "/laporan-saya/:kode", destination: "/pelapor/laporan/:kode", permanent: false },
      { source: "/lapor", destination: "/pelapor/lapor", permanent: false },
      { source: "/profil", destination: "/pelapor/profil", permanent: false },
    ];
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
