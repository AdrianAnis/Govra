import { ErrorPage } from "@/components/error-page";

export default function NotFound() {
  return (
    <ErrorPage
      code="404"
      title="Halaman tidak ditemukan"
      description="Alamat yang Anda buka tidak ada atau sudah dipindahkan. Periksa kembali alamatnya."
    />
  );
}
