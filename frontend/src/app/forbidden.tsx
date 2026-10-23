import { ErrorPage } from "@/components/error-page";

export default function Forbidden() {
  return (
    <ErrorPage
      code="403"
      title="Anda tidak punya akses"
      description="Akun Anda tidak diizinkan membuka halaman ini. Masuk dengan akun yang sesuai atau kembali ke beranda."
    />
  );
}
