import type { Metadata } from "next";
import { AuthCard } from "@/components/auth-card";
import { AuthLink } from "@/components/auth-link";
import { FormField } from "@/components/form-field";
import { GoogleButton } from "@/components/google-button";
import { PasswordField } from "@/components/password-field";
import { Button } from "@/components/ui/button";
import { safeNext } from "@/lib/session";

export const metadata: Metadata = { title: "Masuk" };

interface LoginPageProps {
  searchParams: Promise<{ lanjut?: string | string[]; registered?: string; reset?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const raw = params.lanjut;
  const next = safeNext(Array.isArray(raw) ? raw[0] : raw);
  const registered = params.registered === "sukses";
  const reset = params.reset === "sukses";
  const error = params.error === "gagal";
  const errorDinasGoogle = params.error === "google_dinas_terlarang";
  const errorBatalGoogle = params.error === "google_batal";
  const errorGagalGoogle = params.error === "google_gagal";

  return (
    <AuthCard
      title="Selamat Datang"
      description="Masuk untuk melanjutkan ke akun Anda."
      alternate={<GoogleButton lanjut={next} />}
      note={
        <p>
          Belum memiliki akun? <AuthLink href="/daftar">Daftar Sekarang</AuthLink>
        </p>
      }
    >
      {registered && (
        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-300">
          <p className="font-semibold">Pendaftaran Berhasil!</p>
          <p>Akun Anda telah aktif. Silakan masuk menggunakan email dan kata sandi Anda.</p>
        </div>
      )}
      {reset && (
        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-300">
          <p className="font-semibold">Kata Sandi Diperbarui!</p>
          <p>Kata sandi Anda berhasil diubah. Silakan masuk dengan kata sandi baru Anda.</p>
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-800 dark:text-red-300">
          <p className="font-semibold">Gagal Masuk</p>
          <p>Email atau kata sandi tidak valid. Silakan periksa kembali.</p>
        </div>
      )}
      {errorDinasGoogle && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-800 dark:text-red-300">
          <p className="font-semibold">Akses Ditolak</p>
          <p>Akun kedinasan dan administrator tidak diizinkan masuk melalui Google. Silakan masuk menggunakan email kedinasan dan kata sandi Anda.</p>
        </div>
      )}
      {errorBatalGoogle && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300">
          <p className="font-semibold">Autentikasi Dibatalkan</p>
          <p>Proses autentikasi dengan akun Google dibatalkan.</p>
        </div>
      )}
      {errorGagalGoogle && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-800 dark:text-red-300">
          <p className="font-semibold">Gagal Menghubungkan Google</p>
          <p>Terjadi kendala saat menghubungkan akun Google. Silakan coba kembali.</p>
        </div>
      )}
      <form
        className="flex flex-col gap-4"
        action="/api/auth/masuk"
        method="post"
      >
        <input type="hidden" name="lanjut" value={next} />
        <FormField
          id="email"
          name="email"
          type="email"
          label="Alamat Email"
          autoComplete="email"
        />
        <PasswordField
          id="password"
          name="password"
          label="Kata Sandi"
          autoComplete="current-password"
        />
        <div className="text-right text-sm">
          <AuthLink href="/lupa-sandi" className="font-medium text-fg-muted no-underline hover:underline">
            Lupa Kata Sandi?
          </AuthLink>
        </div>
        <Button type="submit" size="lg">
          Masuk
        </Button>
      </form>
    </AuthCard>
  );
}
