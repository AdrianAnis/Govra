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
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/laporan-saya", destination: "/pelapor", permanent: false },
      { source: "/laporan-saya/:kode", destination: "/pelapor/laporan/:kode", permanent: false },
      { source: "/lapor", destination: "/pelapor/lapor", permanent: false },
      { source: "/profil", destination: "/pelapor/profil", permanent: false },
      { source: "/privacy", destination: "/privasi", permanent: true },
      { source: "/terms", destination: "/syarat-ketentuan", permanent: true },
      { source: "/syarat", destination: "/syarat-ketentuan", permanent: true },
      { source: "/terms-of-service", destination: "/syarat-ketentuan", permanent: true },
      { source: "/ai", destination: "/asisten", permanent: false },
      { source: "/chat", destination: "/asisten", permanent: false },
      { source: "/chatbot", destination: "/asisten", permanent: false },
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
