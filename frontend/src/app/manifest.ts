import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Govra",
    short_name: "Govra",
    description:
      "Platform transparansi program kerja pemerintah daerah dan pelaporan warga berbasis AI.",
    lang: "id",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#136cfc",
    categories: ["government", "news", "utilities"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Buat Laporan",
        short_name: "Lapor",
        url: "/lapor",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Laporan Saya",
        short_name: "Laporan",
        url: "/laporan-saya",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
    screenshots: [
      {
        src: "/screenshots/proker-pemerintah.png",
        sizes: "1891x896",
        type: "image/png",
        form_factor: "wide",
        label: "Program kerja pemerintah daerah",
      },
      {
        src: "/screenshots/landing-page.png",
        sizes: "1087x889",
        type: "image/png",
        label: "Beranda Govra",
      },
    ],
  };
}
