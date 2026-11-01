import type { Metadata } from "next";
import { AuthCard } from "@/components/auth-card";
import { AuthLink } from "@/components/auth-link";
import { RegisterForm } from "@/components/auth/register-form";
import { GoogleButton } from "@/components/google-button";
import { safeNext } from "@/lib/session";

export const metadata: Metadata = { title: "Daftar" };

interface RegisterPageProps {
  searchParams?: Promise<{ lanjut?: string | string[]; error?: string }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = searchParams ? await searchParams : {};
  const raw = params.lanjut;
  const next = safeNext(Array.isArray(raw) ? raw[0] : raw);

  const errorAkunBelumTerdaftar = params.error === "akun_belum_terdaftar";
  const errorBatalGoogle = params.error === "google_batal";
  const errorSupabaseUnconfigured = params.error === "supabase_google_unconfigured";
  const errorGagalGoogle = params.error === "google_gagal";

  return (
    <AuthCard
      title="Buat Akun"
      description="Daftar untuk melapor dan melacak laporan Anda."
      alternate={<GoogleButton mode="daftar" lanjut={next} />}
      note={
        <p>
          Sudah memiliki akun? <AuthLink href="/masuk">Masuk</AuthLink>
        </p>
      }
    >
      {errorAkunBelumTerdaftar && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300">
          <p className="font-semibold">Akun Belum Terdaftar</p>
          <p>Akun dengan email Google ini belum terdaftar. Silakan klik tombol Google di atas untuk mendaftar akun baru secara otomatis, atau isi formulir di bawah.</p>
        </div>
      )}
      {errorSupabaseUnconfigured && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300">
          <p className="font-semibold">Konfigurasi Supabase Belum Aktif</p>
          <p>Penyedia autentikasi Google belum diaktifkan di dashboard Supabase. Silakan ikuti panduan pengaturan Supabase Google Provider.</p>
        </div>
      )}
      {errorBatalGoogle && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300">
          <p className="font-semibold">Pendaftaran Dibatalkan</p>
          <p>Proses autentikasi akun Google dibatalkan.</p>
        </div>
      )}
      {errorGagalGoogle && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-800 dark:text-red-300">
          <p className="font-semibold">Gagal Menghubungkan Google</p>
          <p>Terjadi kendala saat menghubungkan akun Google. Silakan coba kembali.</p>
        </div>
      )}
      <RegisterForm />
    </AuthCard>
  );
}
