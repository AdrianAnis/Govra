import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  agentRules: false,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gtsskmxircedhfggqena.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.unsplash.com",
      },
    ],
  },
  experimental: {
    authInterrupts: true,
    cpus: 2,
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
