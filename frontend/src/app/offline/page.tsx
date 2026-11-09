import type { Metadata } from "next";
import { ErrorPage } from "@/components/error-page";

export const metadata: Metadata = { title: "Tidak Ada Koneksi", robots: { index: false } };

export default function OfflinePage() {
  return (
    <ErrorPage
      code="Offline"
      title="Tidak ada koneksi internet"
      description="Govra membutuhkan internet untuk menampilkan data terbaru. Periksa koneksi Anda lalu muat ulang halaman."
    />
  );
}
